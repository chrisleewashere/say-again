/**
 * React bridge for the render-quality manager.
 *
 * This is the ONLY quality file that touches the DOM: it reads the real WebGL
 * renderer string from a throwaway canvas, gathers device hints, and wires
 * real localStorage into the (DOM-free, unit-tested) QualityManager.
 *
 * Usage — the 3D scene:
 *   const quality = useQuality();
 *   // configure renderer from quality.features.{shadows,postprocessing,reflections}
 *   // in the rAF loop: quality.recordFrame(timestampMs)
 *
 * Usage — Settings UI: see QualitySetting.tsx (Auto/High/Medium/Low chips).
 *
 * An optional <QualityProvider manager={...}> lets tests inject a mock
 * manager; without a provider, useQuality falls back to a lazily-created
 * app-wide singleton, so no mounting order is required.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  QualityManager,
  type GpuHints,
  type QualityOverride,
  type QualitySnapshot,
  type QualityTier,
  type StorageLike,
  type TierFeatures,
} from './qualityManager';

/* ------------------------------------------------------------------ */
/* DOM probes.                                                         */
/* ------------------------------------------------------------------ */

/**
 * Read the WebGL renderer string from a throwaway canvas, then release the
 * context. Returns null when WebGL is unavailable (the heuristics treat that
 * as "unknown", not as a failure).
 */
export function detectWebGLRenderer(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return null;
    // Unmasked string when the browser allows it, masked RENDERER otherwise.
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer: unknown = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return typeof renderer === 'string' ? renderer : null;
  } catch {
    return null;
  }
}

/** Gather every hint initialTier() understands from the real environment. */
export function detectGpuHints(): GpuHints {
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  return {
    rendererString: detectWebGLRenderer(),
    hasWebGPU: !!nav && 'gpu' in nav,
    devicePixelRatio: typeof window === 'undefined' ? undefined : window.devicePixelRatio,
    hardwareConcurrency: nav?.hardwareConcurrency,
  };
}

function safeLocalStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage disabled (some private modes throw on access)
  }
}

/* ------------------------------------------------------------------ */
/* Singleton + context.                                                */
/* ------------------------------------------------------------------ */

let defaultManager: QualityManager | null = null;

/**
 * The app-wide manager, created lazily on first use so the WebGL probe only
 * runs when something actually asks about quality.
 */
export function getQualityManager(): QualityManager {
  if (!defaultManager) {
    defaultManager = new QualityManager({
      storage: safeLocalStorage(),
      hints: detectGpuHints(),
    });
  }
  return defaultManager;
}

const QualityContext = createContext<QualityManager | null>(null);

export interface QualityProviderProps {
  /** Inject a manager (tests / storybook); omitted = app singleton. */
  manager?: QualityManager;
  children?: ReactNode;
}

/** Optional provider — useQuality works without it via the singleton. */
export function QualityProvider({ manager, children }: QualityProviderProps) {
  const value = useMemo(() => manager ?? getQualityManager(), [manager]);
  return createElement(QualityContext.Provider, { value }, children);
}

/* ------------------------------------------------------------------ */
/* Hook.                                                               */
/* ------------------------------------------------------------------ */

export interface QualityApi {
  /** Effective tier to render at right now. */
  tier: QualityTier;
  /** The user's Settings choice; 'auto' = manager decides. */
  override: QualityOverride;
  /** Feature flags for `tier` (shadows / postprocessing / reflections). */
  features: TierFeatures;
  /** What 'auto' currently resolves to, for display in Settings. */
  autoResolvedTier: QualityTier;
  /** Set + persist the override ('auto' | 'high' | 'medium' | 'low'). */
  setOverride: (override: QualityOverride) => void;
  /**
   * Feed one frame timestamp (rAF argument) from the scene's render loop.
   * Drives automatic step-down; no-op unless override is 'auto'.
   */
  recordFrame: (tMs: number) => void;
}

/** Subscribe a component to the shared quality state. */
export function useQuality(): QualityApi {
  const manager = useContext(QualityContext) ?? getQualityManager();
  const getSnapshot = useCallback((): QualitySnapshot => manager.getSnapshot(), [manager]);
  const subscribe = useCallback(
    (listener: () => void) => manager.subscribe(listener),
    [manager],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      tier: snapshot.tier,
      override: snapshot.override,
      features: snapshot.features,
      autoResolvedTier: manager.autoResolvedTier,
      setOverride: (override: QualityOverride) => manager.setOverride(override),
      recordFrame: (tMs: number) => manager.recordFrame(tMs),
    }),
    [manager, snapshot],
  );
}
