import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { generateWireMaze, solveWireMaze, validateWireMaze } from './logic';
import { firstCutRulesText, secondCutRulesText } from './prose';
import { FIRST_CUT_RULES, SECOND_CUT_RULES } from './rules';

const SEEDS_PER_TIER = 1500;

describe('wire maze — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every seeded instance is solvable from rule data alone`, () => {
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generateWireMaze(seed * 7919 + difficulty, difficulty);
        // solve() throws if any rule table is non-total or an action fails to resolve
        const answer = solveWireMaze(inst.state);
        expect(answer.length).toBe(inst.state.cutsRequired);
        // no duplicate cuts, all indices in range
        expect(new Set(answer).size).toBe(answer.length);
        for (const idx of answer) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(inst.state.wires.length);
        }
        expect(validateWireMaze(inst.state, answer)).toBe(true);
      }
    });
  }

  it('is deterministic: same seed, same puzzle and solution', () => {
    const a = generateWireMaze(12345, 2);
    const b = generateWireMaze(12345, 2);
    expect(a.state).toEqual(b.state);
    expect(solveWireMaze(a.state)).toEqual(solveWireMaze(b.state));
  });

  it('rejects wrong answers', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const inst = generateWireMaze(seed, 1);
      const answer = solveWireMaze(inst.state);
      const wrong = [(answer[0] + 1) % inst.state.wires.length];
      expect(validateWireMaze(inst.state, wrong)).toBe(false);
    }
  });
});

describe('wire maze — manual prose stays in sync with rule data', () => {
  it('renders one prose rule per data rule, both editions', () => {
    for (const count of [4, 5, 6]) {
      expect(firstCutRulesText(count, 'standard')).toHaveLength(FIRST_CUT_RULES[count].length);
      expect(firstCutRulesText(count, 'simplified')).toHaveLength(FIRST_CUT_RULES[count].length);
    }
    expect(secondCutRulesText('standard')).toHaveLength(SECOND_CUT_RULES.length);
    expect(secondCutRulesText('simplified')).toHaveLength(SECOND_CUT_RULES.length);
  });

  it('every rule list ends with a catch-all rule so the Handler can never get stuck', () => {
    for (const count of [4, 5, 6]) {
      const rules = FIRST_CUT_RULES[count];
      expect(rules[rules.length - 1].when.c).toBe('always');
    }
    expect(SECOND_CUT_RULES[SECOND_CUT_RULES.length - 1].when.c).toBe('always');
  });
});
