import { describe, expect, it } from 'vitest';
import {
  FrameGovernor,
  QUALITY_STORAGE_KEY,
  QualityManager,
  TIER_FEATURES,
  TIER_ORDER,
  initialTier,
  loadOverride,
  saveOverride,
  stepDownTier,
  type QualityTier,
  type StorageLike,
} from './qualityManager';

/* ------------------------------------------------------------------ */
/* Helpers.                                                            */
/* ------------------------------------------------------------------ */

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('storage disabled');
  }
  setItem(): void {
    throw new Error('storage disabled');
  }
}

/**
 * Feed the governor synthetic frames at a steady fps from `from` to `to` ms.
 * Returns the timestamps at which a step-down was recommended.
 */
function drive(gov: FrameGovernor, from: number, to: number, fps: number): number[] {
  const events: number[] = [];
  const dt = 1000 / fps;
  for (let t = from; t <= to; t += dt) {
    if (gov.record(t)) events.push(t);
  }
  return events;
}

/** Drive a manager's recordFrame the same way. */
function driveManager(manager: QualityManager, from: number, to: number, fps: number): void {
  const dt = 1000 / fps;
  for (let t = from; t <= to; t += dt) manager.recordFrame(t);
}

/* ------------------------------------------------------------------ */
/* Tier ladder.                                                        */
/* ------------------------------------------------------------------ */

describe('tier ladder', () => {
  it('orders tiers best-first: high, medium, low', () => {
    expect(TIER_ORDER).toEqual(['high', 'medium', 'low']);
  });

  it('steps down one rung at a time and clamps at low', () => {
    expect(stepDownTier('high')).toBe('medium');
    expect(stepDownTier('medium')).toBe('low');
    expect(stepDownTier('low')).toBe('low');
  });

  it('maps features per spec: high=all, medium=post+reflections, low=flat', () => {
    expect(TIER_FEATURES.high).toEqual({ shadows: true, postprocessing: true, reflections: true });
    expect(TIER_FEATURES.medium).toEqual({
      shadows: false,
      postprocessing: true,
      reflections: true,
    });
    expect(TIER_FEATURES.low).toEqual({
      shadows: false,
      postprocessing: false,
      reflections: false,
    });
  });

  it('drops features in the locked order shadows -> post -> reflections', () => {
    // Walking down the ladder must never re-enable a feature.
    let tier: QualityTier = 'high';
    let prev = TIER_FEATURES[tier];
    while (tier !== 'low') {
      tier = stepDownTier(tier);
      const next = TIER_FEATURES[tier];
      expect(next.shadows).toBe(false); // shadows are always the first casualty
      if (prev.postprocessing === false) expect(next.postprocessing).toBe(false);
      if (prev.reflections === false) expect(next.reflections).toBe(false);
      prev = next;
    }
  });
});

/* ------------------------------------------------------------------ */
/* initialTier heuristics.                                             */
/* ------------------------------------------------------------------ */

describe('initialTier', () => {
  it('gives Apple GPUs the full look (A12+ iPads report "Apple GPU")', () => {
    expect(initialTier({ rendererString: 'Apple GPU' })).toBe('high');
    expect(
      initialTier({ rendererString: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)' }),
    ).toBe('high');
  });

  it('sends software rasterizers to the floor regardless of other hints', () => {
    expect(
      initialTier({
        rendererString: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))',
        hasWebGPU: true,
        hardwareConcurrency: 16,
        devicePixelRatio: 2,
      }),
    ).toBe('low');
    expect(initialTier({ rendererString: 'llvmpipe (LLVM 15.0.7, 256 bits)' })).toBe('low');
    expect(initialTier({ rendererString: 'Microsoft Basic Render Driver' })).toBe('low');
  });

  it('treats desktop-class GPUs as high', () => {
    expect(initialTier({ rendererString: 'NVIDIA GeForce RTX 3060/PCIe/SSE2' })).toBe('high');
    expect(initialTier({ rendererString: 'AMD Radeon Pro 5500M OpenGL Engine' })).toBe('high');
  });

  it('treats mobile and integrated GPUs as medium', () => {
    expect(initialTier({ rendererString: 'Mali-G72 MP3' })).toBe('medium');
    expect(initialTier({ rendererString: 'Adreno (TM) 618' })).toBe('medium');
    expect(
      initialTier({ rendererString: 'ANGLE (Intel, Intel(R) UHD Graphics 600, D3D11)' }),
    ).toBe('medium');
  });

  it('falls back to device signals when the renderer string is unknown', () => {
    expect(initialTier({})).toBe('low');
    expect(initialTier({ hardwareConcurrency: 2, devicePixelRatio: 1 })).toBe('low');
    expect(initialTier({ hardwareConcurrency: 4, devicePixelRatio: 1 })).toBe('medium');
    expect(initialTier({ hardwareConcurrency: 8, devicePixelRatio: 2 })).toBe('high');
    expect(initialTier({ hasWebGPU: true })).toBe('high');
  });
});

/* ------------------------------------------------------------------ */
/* FrameGovernor.                                                      */
/* ------------------------------------------------------------------ */

describe('FrameGovernor', () => {
  it('never recommends anything at a healthy 60fps', () => {
    const gov = new FrameGovernor();
    expect(drive(gov, 0, 30_000, 60)).toEqual([]);
  });

  it('recommends exactly one step-down after 3 consecutive low windows (~6s at 30fps)', () => {
    const gov = new FrameGovernor();
    const events = drive(gov, 0, 9_000, 30);
    expect(events).toHaveLength(1);
    // three ~2s windows must complete first
    expect(events[0]).toBeGreaterThanOrEqual(6_000);
    expect(events[0]).toBeLessThan(6_500);
  });

  it('does not trigger on only 2 low windows followed by recovery', () => {
    const gov = new FrameGovernor();
    // ~4.4s at 30fps = two completed low windows...
    expect(drive(gov, 0, 4_400, 30)).toEqual([]);
    // ...then a fast stretch resets the streak; nothing ever fires.
    expect(drive(gov, 4_416, 20_000, 60)).toEqual([]);
    // and dipping low again needs 3 fresh windows before firing
    const later = drive(gov, 20_016, 27_000, 30);
    expect(later).toHaveLength(1);
    expect(later[0]).toBeGreaterThanOrEqual(26_000);
  });

  it('honors hysteresis: never two step-downs within 10s, even at sustained 30fps', () => {
    const gov = new FrameGovernor();
    const events = drive(gov, 0, 40_000, 30);
    expect(events.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < events.length; i++) {
      expect(events[i] - events[i - 1]).toBeGreaterThanOrEqual(10_000);
    }
    // within the first 16s there is exactly one recommendation
    expect(events.filter((t) => t < 16_000)).toHaveLength(1);
  });

  it('has no step-up path: recovering fps produces no recommendations of any kind', () => {
    const gov = new FrameGovernor();
    const down = drive(gov, 0, 7_000, 30);
    expect(down).toHaveLength(1);
    // Fast frames forever after: record() never returns true again.
    expect(drive(gov, 7_016, 60_000, 120)).toEqual([]);
  });

  it('treats a long pause (hidden tab) as a reset, not a frame drop', () => {
    const gov = new FrameGovernor();
    // two low windows...
    expect(drive(gov, 0, 4_400, 30)).toEqual([]);
    // ...5s gap (tab hidden), then two more low windows: streak was reset, no event
    expect(drive(gov, 9_400, 13_800, 30)).toEqual([]);
    // the third consecutive low window after the gap does fire
    const events = drive(gov, 13_833, 16_500, 30);
    expect(events).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Override persistence.                                               */
/* ------------------------------------------------------------------ */

describe('override persistence', () => {
  it('round-trips through injected storage', () => {
    const storage = new MemoryStorage();
    expect(loadOverride(storage)).toBe('auto');
    saveOverride('medium', storage);
    expect(storage.getItem(QUALITY_STORAGE_KEY)).toBe('medium');
    expect(loadOverride(storage)).toBe('medium');
    saveOverride('auto', storage);
    expect(loadOverride(storage)).toBe('auto');
  });

  it('falls back to auto on garbage, missing storage, or throwing storage', () => {
    const storage = new MemoryStorage();
    storage.setItem(QUALITY_STORAGE_KEY, 'ultra');
    expect(loadOverride(storage)).toBe('auto');
    expect(loadOverride(null)).toBe('auto');
    expect(loadOverride(new ThrowingStorage())).toBe('auto');
    expect(() => saveOverride('low', new ThrowingStorage())).not.toThrow();
    expect(() => saveOverride('low', null)).not.toThrow();
  });
});

/* ------------------------------------------------------------------ */
/* QualityManager.                                                     */
/* ------------------------------------------------------------------ */

describe('QualityManager', () => {
  const appleHints = { rendererString: 'Apple GPU' };

  it('starts at the heuristic tier in auto mode', () => {
    const m = new QualityManager({ storage: new MemoryStorage(), hints: appleHints });
    expect(m.override).toBe('auto');
    expect(m.tier).toBe('high');
    expect(m.getSnapshot().features).toEqual(TIER_FEATURES.high);
  });

  it('loads a persisted override at construction and applies it', () => {
    const storage = new MemoryStorage();
    saveOverride('low', storage);
    const m = new QualityManager({ storage, hints: appleHints });
    expect(m.override).toBe('low');
    expect(m.tier).toBe('low');
  });

  it('setOverride persists, applies, and notifies subscribers', () => {
    const storage = new MemoryStorage();
    const m = new QualityManager({ storage, hints: appleHints });
    let notified = 0;
    const unsubscribe = m.subscribe(() => notified++);
    m.setOverride('medium');
    expect(m.tier).toBe('medium');
    expect(notified).toBe(1);
    expect(loadOverride(storage)).toBe('medium');
    // a second manager on the same storage sees the choice
    const m2 = new QualityManager({ storage, hints: appleHints });
    expect(m2.tier).toBe('medium');
    unsubscribe();
    m.setOverride('auto');
    expect(notified).toBe(1); // unsubscribed
  });

  it('steps the auto tier down under sustained low fps, one rung per event', () => {
    const m = new QualityManager({ storage: new MemoryStorage(), hints: appleHints });
    const before = m.getSnapshot();
    driveManager(m, 0, 7_000, 30); // 3 low windows -> one step
    expect(m.tier).toBe('medium');
    expect(m.getSnapshot()).not.toBe(before); // new snapshot reference
    driveManager(m, 7_016, 30_000, 30); // keep dropping; hysteresis paces it
    expect(m.tier).toBe('low');
    driveManager(m, 30_016, 90_000, 30); // already at the floor; stays there
    expect(m.tier).toBe('low');
  });

  it('never steps back up automatically after recovery', () => {
    const m = new QualityManager({ storage: new MemoryStorage(), hints: appleHints });
    driveManager(m, 0, 7_000, 30);
    expect(m.tier).toBe('medium');
    driveManager(m, 7_016, 60_000, 120); // buttery-smooth forever after
    expect(m.tier).toBe('medium'); // still down; only the user raises it
    expect(m.autoResolvedTier).toBe('medium');
  });

  it('ignores frame feed when the user pinned a tier', () => {
    const m = new QualityManager({ storage: new MemoryStorage(), hints: appleHints });
    m.setOverride('high');
    driveManager(m, 0, 30_000, 20); // painfully slow, but the user chose high
    expect(m.tier).toBe('high');
    m.setOverride('auto');
    expect(m.tier).toBe('high'); // auto tier was never degraded while pinned
  });

  it('keeps a degraded auto tier underneath a temporary manual override', () => {
    const m = new QualityManager({ storage: new MemoryStorage(), hints: appleHints });
    driveManager(m, 0, 7_000, 30);
    expect(m.tier).toBe('medium');
    m.setOverride('high');
    expect(m.tier).toBe('high');
    m.setOverride('auto');
    expect(m.tier).toBe('medium'); // remembered: this device couldn't hold high
  });
});
