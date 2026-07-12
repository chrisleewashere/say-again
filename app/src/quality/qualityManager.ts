/**
 * Render-quality manager for the 3D Field Case scene.
 *
 * Design posture (see docs/DESIGN_DIRECTION.md, "Performance posture"):
 * design at FULL quality, degrade automatically, never design down. The scene
 * always authors for 'high'; this module decides what a given device actually
 * runs, and steps down under sustained frame drops in the locked order
 * shadows -> post-processing -> reflections.
 *
 * This file is deliberately DOM-free (no navigator/document/window access) so
 * every piece is unit-testable in a node environment. The React bridge in
 * useQuality.ts gathers the real GpuHints and injects real localStorage.
 */

/* ------------------------------------------------------------------ */
/* Tiers.                                                              */
/* ------------------------------------------------------------------ */

export type QualityTier = 'high' | 'medium' | 'low';
export type QualityOverride = 'auto' | QualityTier;

/** Best-first ladder. stepDownTier walks toward the end and clamps there. */
export const TIER_ORDER: readonly QualityTier[] = ['high', 'medium', 'low'];

/** What each tier turns on. The scene should read these flags, not switch on tier names. */
export interface TierFeatures {
  /** Real-time shadow maps. First thing dropped. */
  shadows: boolean;
  /** Bloom / vignette / grain post chain. Dropped second. */
  postprocessing: boolean;
  /** Environment-map reflections on the aluminum shell. Dropped last; low = flat lighting only. */
  reflections: boolean;
}

export const TIER_FEATURES: Record<QualityTier, TierFeatures> = {
  high: { shadows: true, postprocessing: true, reflections: true },
  medium: { shadows: false, postprocessing: true, reflections: true },
  low: { shadows: false, postprocessing: false, reflections: false },
};

/** One rung down the ladder; 'low' is the floor and returns itself. */
export function stepDownTier(tier: QualityTier): QualityTier {
  const i = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.min(i + 1, TIER_ORDER.length - 1)];
}

/* ------------------------------------------------------------------ */
/* Initial tier heuristics.                                            */
/* ------------------------------------------------------------------ */

/**
 * Everything here is passed in by the call site (useQuality.ts) so this
 * module never touches the DOM. All fields optional — unknown is fine.
 */
export interface GpuHints {
  /**
   * WebGL renderer string, ideally UNMASKED_RENDERER_WEBGL from the
   * WEBGL_debug_renderer_info extension (falls back to gl.RENDERER).
   */
  rendererString?: string | null;
  /** navigator.gpu presence (WebGPU implies a recent, capable browser+GPU). */
  hasWebGPU?: boolean;
  /** window.devicePixelRatio. */
  devicePixelRatio?: number;
  /** navigator.hardwareConcurrency. */
  hardwareConcurrency?: number;
}

/** Software rasterizers — always the floor, whatever else the device claims. */
const SOFTWARE_RENDERER_RE =
  /swiftshader|llvmpipe|softpipe|software\s*(rasterizer|renderer)|microsoft basic render|mesa offscreen/i;

/** Desktop-class / Apple silicon GPUs — comfortably run the full look. */
const HIGH_END_RE = /\bapple\b|nvidia|geforce|\brtx\b|\bgtx\b|radeon|\bamd\b/i;

/** Mobile-class GPUs (many Chromebooks and Android tablets). */
const MOBILE_RE = /\bmali\b|adreno|powervr|videocore/i;

/** Integrated laptop graphics — fine without shadows. */
const INTEGRATED_RE = /\bintel\b|\biris\b|\buhd graphics\b/i;

/**
 * Pick the starting tier from device hints. Optimistic by design: A12+ iPads
 * (renderer "Apple GPU") get 'high'; only known-software renderers start at
 * the floor. The FrameGovernor corrects any optimism at runtime.
 */
export function initialTier(hints: GpuHints): QualityTier {
  const renderer = hints.rendererString ?? '';

  // A software rasterizer can't be saved by core count or WebGPU flags.
  if (SOFTWARE_RENDERER_RE.test(renderer)) return 'low';

  if (HIGH_END_RE.test(renderer)) return 'high';
  if (MOBILE_RE.test(renderer)) return 'medium';
  if (INTEGRATED_RE.test(renderer)) return 'medium';

  // No recognizable renderer string — fall back to coarse device signals.
  if (hints.hasWebGPU) return 'high';
  const cores = hints.hardwareConcurrency ?? 0;
  const dpr = hints.devicePixelRatio ?? 1;
  if (cores >= 8 && dpr >= 2) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

/* ------------------------------------------------------------------ */
/* FrameGovernor — sustained-drop detector.                             */
/* ------------------------------------------------------------------ */

export interface FrameGovernorOptions {
  /** Rolling window length over which fps is measured. Default 2000ms. */
  windowMs?: number;
  /** A window below this fps counts as "low". Default 45. */
  lowFpsThreshold?: number;
  /** Consecutive low windows required before recommending a step-down. Default 3. */
  windowsToTrigger?: number;
  /** Hysteresis: never recommend two step-downs closer together than this. Default 10000ms. */
  cooldownMs?: number;
  /**
   * A gap between frames longer than this (tab hidden, app backgrounded,
   * debugger pause) discards the current window and the low streak instead of
   * being misread as a frame drop. Default 1000ms.
   */
  gapMs?: number;
}

/**
 * Feed it every rendered frame's timestamp via record(tMs). It buckets frames
 * into consecutive ~2s windows, computes each window's fps, and when fps has
 * stayed under the threshold for 3 windows in a row it recommends a single
 * step-down (record() returns true exactly on that frame).
 *
 * Hysteresis rules:
 *  - never recommends two step-downs within cooldownMs (default 10s);
 *  - NEVER recommends stepping back up — there is deliberately no API for it.
 *    A tier drop is one-way for the session; only the user's manual override
 *    (or a fresh launch on a faster device) raises quality.
 */
export class FrameGovernor {
  private readonly windowMs: number;
  private readonly lowFpsThreshold: number;
  private readonly windowsToTrigger: number;
  private readonly cooldownMs: number;
  private readonly gapMs: number;

  private windowStart: number | null = null;
  private lastFrame: number | null = null;
  private framesInWindow = 0;
  private lowStreak = 0;
  private lastStepDownAt: number | null = null;

  constructor(options: FrameGovernorOptions = {}) {
    this.windowMs = options.windowMs ?? 2000;
    this.lowFpsThreshold = options.lowFpsThreshold ?? 45;
    this.windowsToTrigger = options.windowsToTrigger ?? 3;
    this.cooldownMs = options.cooldownMs ?? 10_000;
    this.gapMs = options.gapMs ?? 1000;
  }

  /**
   * Record one frame timestamp (ms, monotonic — e.g. the rAF argument or
   * performance.now()). Returns true when a step-down is recommended at this
   * exact frame; the caller applies it (QualityManager.recordFrame does).
   */
  record(tMs: number): boolean {
    if (this.windowStart === null || this.lastFrame === null) {
      this.startWindow(tMs);
      return false;
    }

    // A long pause is not a frame drop: restart measurement from here.
    if (tMs - this.lastFrame > this.gapMs || tMs < this.lastFrame) {
      this.lowStreak = 0;
      this.startWindow(tMs);
      return false;
    }

    this.framesInWindow += 1;
    this.lastFrame = tMs;

    const elapsed = tMs - this.windowStart;
    if (elapsed < this.windowMs) return false;

    // Window complete — evaluate it and start the next one.
    const fps = (this.framesInWindow * 1000) / elapsed;
    this.windowStart = tMs;
    this.framesInWindow = 0;

    if (fps >= this.lowFpsThreshold) {
      this.lowStreak = 0;
      return false;
    }

    this.lowStreak += 1;
    if (this.lowStreak < this.windowsToTrigger) return false;
    if (this.lastStepDownAt !== null && tMs - this.lastStepDownAt < this.cooldownMs) {
      return false; // still in the hysteresis window; keep the streak and wait
    }

    this.lastStepDownAt = tMs;
    this.lowStreak = 0;
    return true;
  }

  /** Forget in-progress measurement (e.g. after a scene change). Keeps the cooldown clock. */
  reset(): void {
    this.windowStart = null;
    this.lastFrame = null;
    this.framesInWindow = 0;
    this.lowStreak = 0;
  }

  private startWindow(tMs: number): void {
    this.windowStart = tMs;
    this.lastFrame = tMs;
    this.framesInWindow = 0;
  }
}

/* ------------------------------------------------------------------ */
/* Persisted override.                                                 */
/* ------------------------------------------------------------------ */

export const QUALITY_STORAGE_KEY = 'ky-quality';

/** Minimal storage surface so tests can inject a mock. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isOverride(value: unknown): value is QualityOverride {
  return value === 'auto' || value === 'high' || value === 'medium' || value === 'low';
}

/** Load the persisted override; anything missing/invalid/broken means 'auto'. */
export function loadOverride(storage: StorageLike | null): QualityOverride {
  if (!storage) return 'auto';
  try {
    const raw = storage.getItem(QUALITY_STORAGE_KEY);
    return isOverride(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

/** Persist the override; silently no-ops if storage is unavailable. */
export function saveOverride(override: QualityOverride, storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(QUALITY_STORAGE_KEY, override);
  } catch {
    // private mode / quota — the override still applies for this session
  }
}

/* ------------------------------------------------------------------ */
/* QualityManager — ties it together for the app.                       */
/* ------------------------------------------------------------------ */

export interface QualitySnapshot {
  /** Effective tier the scene should render at right now. */
  tier: QualityTier;
  /** What the user picked in Settings ('auto' = let the manager decide). */
  override: QualityOverride;
  /** Feature flags for `tier` — read these, don't switch on tier names. */
  features: TierFeatures;
}

export interface QualityManagerOptions {
  /** Injected storage (real localStorage in the app, a mock in tests). */
  storage?: StorageLike | null;
  /** Device hints gathered by the call site; used once to pick the auto tier. */
  hints?: GpuHints;
  /** Injectable for tests; defaults to spec settings (2s / 45fps / 3 windows / 10s). */
  governor?: FrameGovernor;
}

/**
 * Owns the auto tier, the user override, persistence, and the FrameGovernor.
 * Subscribable snapshot store, shaped for React's useSyncExternalStore.
 */
export class QualityManager {
  private readonly storage: StorageLike | null;
  private readonly governor: FrameGovernor;
  private readonly listeners = new Set<() => void>();
  private autoTier: QualityTier;
  private snapshot: QualitySnapshot;

  constructor(options: QualityManagerOptions = {}) {
    this.storage = options.storage ?? null;
    this.governor = options.governor ?? new FrameGovernor();
    this.autoTier = initialTier(options.hints ?? {});
    const override = loadOverride(this.storage);
    this.snapshot = this.buildSnapshot(override);
  }

  /** Immutable snapshot — replaced (new reference) on every change. */
  getSnapshot(): QualitySnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get tier(): QualityTier {
    return this.snapshot.tier;
  }

  get override(): QualityOverride {
    return this.snapshot.override;
  }

  /** What 'auto' currently resolves to (Settings shows this next to the Auto chip). */
  get autoResolvedTier(): QualityTier {
    return this.autoTier;
  }

  /** Set + persist the user override. 'auto' returns control to the manager. */
  setOverride(override: QualityOverride): void {
    saveOverride(override, this.storage);
    if (override === this.snapshot.override) return;
    this.snapshot = this.buildSnapshot(override);
    this.emit();
  }

  /**
   * Feed one rendered frame's timestamp from the scene's rAF loop. Only
   * listened to in 'auto' mode — a manual tier is the user's explicit choice
   * and is never overruled.
   */
  recordFrame(tMs: number): void {
    if (this.snapshot.override !== 'auto') return;
    if (this.governor.record(tMs)) this.stepDown();
  }

  /** Drop the auto tier one rung. Returns true if it changed. Never steps up. */
  stepDown(): boolean {
    const next = stepDownTier(this.autoTier);
    if (next === this.autoTier) return false;
    this.autoTier = next;
    this.governor.reset(); // the cheaper tier deserves fresh measurements
    if (this.snapshot.override === 'auto') {
      this.snapshot = this.buildSnapshot('auto');
      this.emit();
    }
    return true;
  }

  private buildSnapshot(override: QualityOverride): QualitySnapshot {
    const tier = override === 'auto' ? this.autoTier : override;
    return { tier, override, features: TIER_FEATURES[tier] };
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}
