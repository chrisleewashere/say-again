import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { applyChecklist, generateIdCheck, solveIdCheck, validateIdCheck } from './logic';
import { checklistText, ruleToText, suspectDescription } from './prose';
import { ATTR_KEYS, ATTR_VALUES, CHECKLISTS, LINEUP_SIZE, type Suspect } from './rules';

const SEEDS_PER_TIER = 1200;

describe('id-check — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every seeded instance has exactly one contact, found from rule data alone`, () => {
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generateIdCheck(seed * 6271 + difficulty, difficulty);
        const { suspects } = inst.state;

        // lineup is well-formed
        expect(suspects).toHaveLength(LINEUP_SIZE[difficulty]);
        for (const s of suspects) {
          for (const attr of ATTR_KEYS) {
            expect(ATTR_VALUES[attr]).toContain(s[attr]);
          }
        }
        // no two suspects are identical (every one is describably distinct)
        const keys = suspects.map((s) => ATTR_KEYS.map((a) => s[a]).join('|'));
        expect(new Set(keys).size).toBe(suspects.length);

        // the checklist leaves exactly one survivor — the unique solution
        const survivors = applyChecklist(suspects, CHECKLISTS[suspects.length]);
        expect(survivors).toHaveLength(1);

        const answer = solveIdCheck(inst.state);
        expect(answer).toBe(survivors[0]);
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBeLessThan(suspects.length);
        expect(validateIdCheck(inst.state, answer)).toBe(true);

        // uniqueness: every other index is rejected
        for (let i = 0; i < suspects.length; i++) {
          if (i !== answer) expect(validateIdCheck(inst.state, i)).toBe(false);
        }
      }
    });
  }

  it('is deterministic: same seed, same lineup and same contact', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const a = generateIdCheck(987654, difficulty);
      const b = generateIdCheck(987654, difficulty);
      expect(a.state).toEqual(b.state);
      expect(solveIdCheck(a.state)).toBe(solveIdCheck(b.state));
    }
  });

  it('rejects wrong and malformed answers', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const inst = generateIdCheck(seed, 1);
      const answer = solveIdCheck(inst.state);
      expect(validateIdCheck(inst.state, (answer + 1) % inst.state.suspects.length)).toBe(false);
      expect(validateIdCheck(inst.state, -1)).toBe(false);
      expect(validateIdCheck(inst.state, inst.state.suspects.length)).toBe(false);
      expect(validateIdCheck(inst.state, answer + 0.5)).toBe(false);
    }
  });

  it('difficulty tiers use their specified checklist shapes', () => {
    // d1: 3 simple single-atom rules
    expect(CHECKLISTS[LINEUP_SIZE[1]]).toHaveLength(3);
    for (const rule of CHECKLISTS[LINEUP_SIZE[1]]) {
      expect(rule.kind).toBe('eliminate');
      if (rule.kind === 'eliminate') expect(rule.atoms).toHaveLength(1);
    }
    // d2: 4 rules including exactly one AND-condition
    const d2 = CHECKLISTS[LINEUP_SIZE[2]];
    expect(d2).toHaveLength(4);
    expect(d2.filter((r) => r.kind === 'eliminate' && r.atoms.length === 2)).toHaveLength(1);
    // d3: 5 rules including a relative same-shirt rule
    const d3 = CHECKLISTS[LINEUP_SIZE[3]];
    expect(d3).toHaveLength(5);
    expect(d3.filter((r) => r.kind === 'eliminateSameShirt')).toHaveLength(1);
  });
});

describe('id-check — manual prose stays in sync with rule data', () => {
  it('renders one prose step per data rule, both editions', () => {
    for (const size of Object.values(LINEUP_SIZE)) {
      expect(checklistText(size, 'standard')).toHaveLength(CHECKLISTS[size].length);
      expect(checklistText(size, 'simplified')).toHaveLength(CHECKLISTS[size].length);
    }
  });

  it('every prose step is a complete sentence in both editions', () => {
    for (const size of Object.values(LINEUP_SIZE)) {
      for (const ed of ['standard', 'simplified'] as const) {
        for (const line of checklistText(size, ed)) {
          expect(line.length).toBeGreaterThan(10);
          expect(line.endsWith('.') || line.endsWith(')')).toBe(true);
        }
      }
    }
  });

  it('AND rules join both atoms in the prose', () => {
    for (const size of Object.values(LINEUP_SIZE)) {
      for (const rule of CHECKLISTS[size]) {
        if (rule.kind === 'eliminate' && rule.atoms.length === 2) {
          expect(ruleToText(rule, 'standard')).toContain(' AND ');
          expect(ruleToText(rule, 'simplified')).toContain(' and also ');
        }
      }
    }
  });

  it('the relative rule names its reference position and remaining-count guard, both editions', () => {
    const relative = CHECKLISTS[LINEUP_SIZE[3]].find((r) => r.kind === 'eliminateSameShirt');
    expect(relative).toBeDefined();
    if (relative && relative.kind === 'eliminateSameShirt') {
      const std = ruleToText(relative, 'standard');
      const simp = ruleToText(relative, 'simplified');
      expect(std).toContain(`suspect ${relative.refPosition}`);
      expect(simp).toContain(`portrait ${relative.refPosition}`);
      expect(std.toLowerCase()).toContain('or more');
      expect(simp.toLowerCase()).toContain('or more');
    }
  });

  it('checklists are pure eliminations (no first-match catch-all applies); every step is renderable', () => {
    // Unlike first-match rule tables, an elimination checklist runs EVERY step,
    // so no catch-all terminator is applicable. Instead we assert totality:
    // each data rule renders to prose without throwing, in both editions.
    for (const size of Object.values(LINEUP_SIZE)) {
      for (const rule of CHECKLISTS[size]) {
        expect(() => ruleToText(rule, 'standard')).not.toThrow();
        expect(() => ruleToText(rule, 'simplified')).not.toThrow();
      }
    }
  });

  it('suspect descriptions name all five attributes using glossary vocabulary', () => {
    const s: Suspect = { headwear: 'cap', glasses: 'round', hair: 'curly', accessory: 'badge', shirt: 'spotted' };
    const text = suspectDescription(s);
    expect(text).toContain('cap');
    expect(text).toContain('round glasses');
    expect(text).toContain('curly hair');
    expect(text).toContain('star badge');
    expect(text).toContain('spotted shirt');
    expect(text.split(', ')).toHaveLength(ATTR_KEYS.length);
  });
});
