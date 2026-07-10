import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { gemDigit, generateVaultDial, solveVaultDial, validateVaultDial } from './logic';
import { baseDigitTable, sizeModifierRulesText, twistRulesText, twistScopeText } from './prose';
import {
  BASE_DIGIT,
  DIFFICULTY_CONFIG,
  DIGIT_MOD,
  GEM_MARKINGS,
  GEM_SHAPES,
  SIZE_MODIFIER_RULES,
  TWIST_APPLIES_AT_COUNT,
  TWIST_RULES,
  type Gem,
} from './rules';

const SEEDS_PER_TIER = 1200;

describe('vault dial — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    const cfg = DIFFICULTY_CONFIG[difficulty];
    it(`difficulty ${difficulty}: every seeded instance is solvable from rule data alone`, () => {
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generateVaultDial(seed * 7919 + difficulty, difficulty);
        const { gems } = inst.state;

        // well-formed instance
        expect(gems).toHaveLength(cfg.gemCount);
        if (!cfg.mixedSizes) {
          // Rookie: all gems the same (small) size — pure table lookup
          expect(gems.every((g) => g.size === 'small')).toBe(true);
        }
        if (cfg.distinctShapes) {
          expect(new Set(gems.map((g) => g.shape)).size).toBe(gems.length);
        }

        // solvable, unique, well-formed answer
        const answer = solveVaultDial(inst.state);
        expect(answer).toMatch(/^[0-9]+$/);
        expect(answer).toHaveLength(cfg.gemCount);
        expect(validateVaultDial(inst.state, answer)).toBe(true);

        // solve() is a pure function of state — re-solving gives the same code
        expect(solveVaultDial(inst.state)).toBe(answer);
      }
    });
  }

  it('is deterministic: same seed, same puzzle and solution', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const a = generateVaultDial(987654, difficulty);
      const b = generateVaultDial(987654, difficulty);
      expect(a.state).toEqual(b.state);
      expect(solveVaultDial(a.state)).toEqual(solveVaultDial(b.state));
    }
  });

  it('rejects wrong answers', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      for (let seed = 1; seed <= 200; seed++) {
        const inst = generateVaultDial(seed, difficulty);
        const answer = solveVaultDial(inst.state);

        // one digit off
        const mutated =
          answer.slice(0, -1) + String((Number(answer[answer.length - 1]) + 1) % 10);
        expect(validateVaultDial(inst.state, mutated)).toBe(false);

        // wrong length / empty
        expect(validateVaultDial(inst.state, answer + '0')).toBe(false);
        expect(validateVaultDial(inst.state, answer.slice(0, -1))).toBe(false);
        expect(validateVaultDial(inst.state, '')).toBe(false);

        // reversed code is wrong unless it happens to be a palindrome
        const reversed = [...answer].reverse().join('');
        if (reversed !== answer) {
          expect(validateVaultDial(inst.state, reversed)).toBe(false);
        }
      }
    }
  });
});

describe('vault dial — rule semantics', () => {
  it('base digit table covers every shape x marking with a digit 0-9', () => {
    for (const shape of GEM_SHAPES) {
      for (const marking of GEM_MARKINGS) {
        const d = BASE_DIGIT[shape][marking];
        expect(Number.isInteger(d)).toBe(true);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThan(DIGIT_MOD);
      }
    }
  });

  it('size modifier adds delta with wrap-around (mod 10)', () => {
    // hexagon + core-dot has base 0; wedge + band has base 9
    const smallHex: Gem = { shape: 'hexagon', marking: 'core-dot', size: 'small' };
    const largeHex: Gem = { ...smallHex, size: 'large' };
    expect(gemDigit(smallHex)).toBe(BASE_DIGIT.hexagon['core-dot']);
    expect(gemDigit(largeHex)).toBe((BASE_DIGIT.hexagon['core-dot'] + 2) % 10);

    const largeWedge: Gem = { shape: 'wedge', marking: 'band', size: 'large' };
    expect(BASE_DIGIT.wedge.band).toBe(9);
    expect(gemDigit(largeWedge)).toBe(1); // 9 + 2 wraps to 1
  });

  it('shared-shape twist reverses the code on 4-gem vaults', () => {
    const gems: Gem[] = [
      { shape: 'star', marking: 'none', size: 'small' }, // 1
      { shape: 'star', marking: 'band', size: 'small' }, // 6
      { shape: 'ring', marking: 'none', size: 'small' }, // 3
      { shape: 'wedge', marking: 'core-dot', size: 'large' }, // 2 + 2 = 4
    ];
    expect(solveVaultDial({ gems })).toBe('4361'); // 1634 reversed
  });

  it('4-gem vaults with all-distinct shapes keep the code as computed', () => {
    const gems: Gem[] = [
      { shape: 'teardrop', marking: 'none', size: 'small' }, // 0
      { shape: 'star', marking: 'band', size: 'small' }, // 6
      { shape: 'ring', marking: 'core-dot', size: 'small' }, // 1
      { shape: 'wedge', marking: 'none', size: 'large' }, // 4 + 2 = 6
    ];
    expect(solveVaultDial({ gems })).toBe('0616');
  });

  it('twist never applies below the 4-gem threshold, even with shared shapes', () => {
    const gems: Gem[] = [
      { shape: 'star', marking: 'none', size: 'small' }, // 1
      { shape: 'star', marking: 'band', size: 'small' }, // 6
      { shape: 'ring', marking: 'none', size: 'small' }, // 3
    ];
    expect(gems.length).toBeLessThan(TWIST_APPLIES_AT_COUNT);
    expect(solveVaultDial({ gems })).toBe('163'); // not reversed
  });
});

describe('vault dial — manual prose stays in sync with rule data', () => {
  it('renders one prose rule per data rule, both editions', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      expect(sizeModifierRulesText(ed)).toHaveLength(SIZE_MODIFIER_RULES.length);
      expect(twistRulesText(ed)).toHaveLength(TWIST_RULES.length);
    }
  });

  it('base digit table renders one row per shape and one column per marking, both editions', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      const t = baseDigitTable(ed);
      expect(t.header).toHaveLength(GEM_MARKINGS.length + 1);
      expect(t.rows).toHaveLength(GEM_SHAPES.length);
      // every printed digit matches the data table
      GEM_SHAPES.forEach((shape, si) => {
        GEM_MARKINGS.forEach((marking, mi) => {
          expect(t.rows[si][mi + 1]).toBe(String(BASE_DIGIT[shape][marking]));
        });
      });
    }
  });

  it('the twist rule list ends with a catch-all rule so the Handler can never get stuck', () => {
    expect(TWIST_RULES[TWIST_RULES.length - 1].when.c).toBe('always');
  });

  it('twist scope prose states the gem-count threshold from data, both editions', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      expect(twistScopeText(ed)).toContain(String(TWIST_APPLIES_AT_COUNT));
    }
  });

  it('size modifier prose names the wrap examples computed from data', () => {
    // delta 2 wraps 8 -> 0 and 9 -> 1; the printed rule must show that math
    const std = sizeModifierRulesText('standard').join(' ');
    expect(std).toContain('8 becomes 0');
    expect(std).toContain('9 becomes 1');
  });
});
