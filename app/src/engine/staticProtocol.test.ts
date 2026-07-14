import { describe, expect, it } from 'vitest';
import { clampRepairDrills, MAX_REPAIR_DEPTH, REPAIR_REQUESTS, staticModuleFlags } from './staticProtocol';

describe('clampRepairDrills', () => {
  it('clamps to 0..MAX and rounds', () => {
    expect(clampRepairDrills(undefined)).toBe(0);
    expect(clampRepairDrills(-2)).toBe(0);
    expect(clampRepairDrills(0)).toBe(0);
    expect(clampRepairDrills(1.4)).toBe(1);
    expect(clampRepairDrills(3)).toBe(3);
    expect(clampRepairDrills(9)).toBe(MAX_REPAIR_DEPTH);
    expect(clampRepairDrills(Number.NaN)).toBe(0);
  });
});

describe('staticModuleFlags', () => {
  it('marks nothing when drills are off', () => {
    expect(staticModuleFlags('FOX-492', 4, 0)).toEqual([false, false, false, false]);
  });

  it('is deterministic for a mission code (replays mark the same modules)', () => {
    const a = staticModuleFlags('FOX-492', 6, 2);
    const b = staticModuleFlags('FOX-492', 6, 2);
    expect(a).toEqual(b);
  });

  it('always marks at least one module when drills are on', () => {
    for (let i = 0; i < 500; i++) {
      const code = `T${i}-${(i * 7) % 100}`;
      for (const count of [1, 2, 3, 4, 5, 6]) {
        expect(staticModuleFlags(code, count, 1).some(Boolean)).toBe(true);
      }
    }
  });

  it('does not mark every module in larger missions (roughly half)', () => {
    let marked = 0;
    let total = 0;
    for (let i = 0; i < 200; i++) {
      const flags = staticModuleFlags(`M${i}-00`, 6, 3);
      marked += flags.filter(Boolean).length;
      total += flags.length;
    }
    const ratio = marked / total;
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(0.75);
  });

  it('publishes exactly MAX_REPAIR_DEPTH scripted phrases', () => {
    expect(REPAIR_REQUESTS).toHaveLength(MAX_REPAIR_DEPTH);
    for (const phrase of REPAIR_REQUESTS) {
      expect(phrase.length).toBeGreaterThan(3);
    }
  });
});
