import { describe, expect, it } from 'vitest';
import { gradeMission, letterFromScore, missionScore, moduleScore } from './grade';
import type { ModuleResult } from './types';

function mod(solved: boolean, strikes: number): ModuleResult {
  return { moduleId: 'wire-maze', difficulty: 1, solved, strikes, hintsUsed: 0, elapsedMs: 1000 };
}

describe('grade', () => {
  it('scores a clean pass at 100 and applies the wrong-answer penalty', () => {
    expect(moduleScore(mod(true, 0))).toBe(100);
    expect(moduleScore(mod(true, 1))).toBe(80);
    expect(moduleScore(mod(true, 2))).toBe(60);
  });

  it('floors a passed module at 40 and zeroes failed/unreached modules', () => {
    expect(moduleScore(mod(true, 10))).toBe(40);
    expect(moduleScore(mod(false, 1))).toBe(0);
    expect(moduleScore(mod(false, 0))).toBe(0);
  });

  it('averages module scores into the mission score', () => {
    expect(missionScore([mod(true, 0), mod(true, 0)])).toBe(100);
    expect(missionScore([mod(true, 0), mod(false, 1)])).toBe(50);
    expect(missionScore([])).toBe(0);
  });

  it('maps scores onto the standard letter scale', () => {
    expect(letterFromScore(100)).toBe('A+');
    expect(letterFromScore(95)).toBe('A');
    expect(letterFromScore(90)).toBe('A-');
    expect(letterFromScore(85)).toBe('B');
    expect(letterFromScore(75)).toBe('C');
    expect(letterFromScore(65)).toBe('D');
    expect(letterFromScore(59)).toBe('F');
    expect(letterFromScore(0)).toBe('F');
  });

  it('grades a perfect mission A+ and a fully failed mission F', () => {
    expect(gradeMission('complete', [mod(true, 0), mod(true, 0)]).letter).toBe('A+');
    expect(gradeMission('complete', [mod(false, 1), mod(false, 1)]).letter).toBe('F');
  });

  it('grades abandoned missions as Incomplete', () => {
    const g = gradeMission('abandoned', [mod(true, 0)]);
    expect(g.letter).toBe('I');
  });

  it('grades timeouts on what was actually played (unreached modules score 0)', () => {
    const g = gradeMission('timeout', [mod(true, 0), mod(false, 0)]);
    expect(g.score).toBe(50);
    expect(g.letter).toBe('F');
  });
});
