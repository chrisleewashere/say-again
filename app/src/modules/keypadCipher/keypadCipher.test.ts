import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { generateKeypadCipher, solveKeypadCipher, validateKeypadCipher } from './logic';
import { keypadCipherManual } from './manual';
import { categoryWordEntries, priorityRulesText, tieBreakText } from './prose';
import {
  ALLOW_DOUBLE_CATEGORY,
  CATEGORIES,
  KEY_COUNT,
  MAX_WORD_TIER,
  type CategoryId,
} from './rules';

const SEEDS_PER_TIER = 1200;

/** word -> category rank, built independently for test assertions. */
const wordRank = new Map<string, number>();
CATEGORIES.forEach((cat, rank) => {
  for (const w of cat.words) wordRank.set(w.word, rank);
});

const tier1Words = new Set(
  CATEGORIES.flatMap((c) => c.words.filter((w) => w.tier === 1).map((w) => w.word)),
);

describe('keypad cipher — rule data integrity', () => {
  it('every word appears in exactly one category table', () => {
    const all = CATEGORIES.flatMap((c) => c.words.map((w) => w.word));
    expect(new Set(all).size).toBe(all.length);
  });

  it('every category has at least 10 words, with enough everyday (tier 1) words to draw from', () => {
    for (const cat of CATEGORIES) {
      expect(cat.words.length).toBeGreaterThanOrEqual(10);
      expect(cat.words.filter((w) => w.tier === 1).length).toBeGreaterThanOrEqual(8);
    }
  });

  it('every less-frequent (tier 3) word carries a one-word gloss for the simplified manual', () => {
    for (const cat of CATEGORIES) {
      for (const w of cat.words) {
        if (w.tier === 3) {
          expect(w.gloss, `${w.word} needs a gloss`).toBeTruthy();
        }
      }
    }
  });
});

describe('keypad cipher — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every seeded instance is solvable from rule data alone`, () => {
      let sawDoubled = false;
      let sawAllDistinct = false;

      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generateKeypadCipher(seed * 104729 + difficulty, difficulty);
        const { keys } = inst.state;

        // right key count, unique words
        expect(keys.length).toBe(KEY_COUNT[difficulty]);
        const words = keys.map((k) => k.word);
        expect(new Set(words).size).toBe(words.length);

        // words drawn only from the allowed tier pool
        if (MAX_WORD_TIER[difficulty] === 1) {
          for (const w of words) expect(tier1Words.has(w), `${w} must be tier 1`).toBe(true);
        }

        // category distribution: distinct, except d3 may double up ONE category
        const counts = new Map<number, number>();
        for (const w of words) {
          const rank = wordRank.get(w);
          expect(rank, `${w} must be in a category table`).toBeDefined();
          counts.set(rank!, (counts.get(rank!) ?? 0) + 1);
        }
        const doubles = [...counts.values()].filter((n) => n > 1);
        if (ALLOW_DOUBLE_CATEGORY[difficulty]) {
          expect(doubles.length).toBeLessThanOrEqual(1);
          if (doubles.length === 1) {
            expect(doubles[0]).toBe(2);
            sawDoubled = true;
          } else {
            sawAllDistinct = true;
          }
        } else {
          expect(doubles.length).toBe(0);
        }

        // solution: a permutation of all key indices…
        const answer = solveKeypadCipher(inst.state);
        expect([...answer].sort((a, b) => a - b)).toEqual(keys.map((_, i) => i));

        // …strictly ordered by (category rank, then alphabetical) — i.e. unique
        for (let i = 1; i < answer.length; i++) {
          const prev = keys[answer[i - 1]].word;
          const curr = keys[answer[i]].word;
          const pr = wordRank.get(prev)!;
          const cr = wordRank.get(curr)!;
          expect(pr < cr || (pr === cr && prev < curr)).toBe(true);
        }

        expect(validateKeypadCipher(inst.state, answer)).toBe(true);
      }

      if (ALLOW_DOUBLE_CATEGORY[difficulty]) {
        // Mastermind exercises BOTH branches across seeds: some panels double
        // a category (tie-break in play), some do not.
        expect(sawDoubled).toBe(true);
        expect(sawAllDistinct).toBe(true);
      }
    });
  }

  it('is deterministic: same seed, same puzzle and solution', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const a = generateKeypadCipher(987654, difficulty);
      const b = generateKeypadCipher(987654, difficulty);
      expect(a.state).toEqual(b.state);
      expect(solveKeypadCipher(a.state)).toEqual(solveKeypadCipher(b.state));
    }
  });

  it('rejects wrong answers', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const difficulty of [1, 2, 3] as Difficulty[]) {
        const inst = generateKeypadCipher(seed, difficulty);
        const answer = solveKeypadCipher(inst.state);

        // swapped first two presses
        const swapped = [...answer];
        [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
        expect(validateKeypadCipher(inst.state, swapped)).toBe(false);

        // truncated and empty sequences
        expect(validateKeypadCipher(inst.state, answer.slice(0, -1))).toBe(false);
        expect(validateKeypadCipher(inst.state, [])).toBe(false);

        // reversed
        expect(validateKeypadCipher(inst.state, [...answer].reverse())).toBe(false);
      }
    }
  });
});

describe('keypad cipher — manual prose stays in sync with rule data', () => {
  it('renders one press-order rule per category plus the tie-break catch-all, both editions', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      const rules = priorityRulesText(ed);
      expect(rules).toHaveLength(CATEGORIES.length + 1);
      // the rule list ends in the catch-all tie-break rule
      expect(rules[rules.length - 1]).toBe(tieBreakText(ed));
    }
  });

  it('renders one word entry per data word in every category, both editions', () => {
    for (const cat of CATEGORIES) {
      for (const ed of ['standard', 'simplified'] as const) {
        expect(categoryWordEntries(cat, ed)).toHaveLength(cat.words.length);
      }
    }
  });

  it('simplified entries carry the gloss for less-frequent words; standard entries do not', () => {
    for (const cat of CATEGORIES) {
      const simplified = categoryWordEntries(cat, 'simplified');
      const standard = categoryWordEntries(cat, 'standard');
      for (const w of cat.words) {
        if (w.tier === 3 && w.gloss) {
          expect(simplified).toContain(`${w.word} (${w.gloss})`);
          expect(standard).toContain(w.word);
        }
      }
    }
  });

  it('both manual editions include a figure, callouts, the rule list, and one table per category', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      const blocks = keypadCipherManual[ed].blocks;
      expect(blocks.some((b) => b.kind === 'figure')).toBe(true);
      expect(blocks.some((b) => b.kind === 'callout')).toBe(true);
      const ruleLists = blocks.filter((b) => b.kind === 'ruleList');
      expect(ruleLists).toHaveLength(1);
      expect(ruleLists[0].rules).toEqual(priorityRulesText(ed));
      const tables = blocks.filter((b) => b.kind === 'table');
      expect(tables).toHaveLength(CATEGORIES.length);
    }
  });

  it('the master priority order in rules data covers all eight required categories', () => {
    const ids = CATEGORIES.map((c) => c.id);
    const expected: CategoryId[] = [
      'animals',
      'tools',
      'food',
      'clothing',
      'vehicles',
      'weather',
      'school-supplies',
      'feelings',
    ];
    expect(ids).toEqual(expected);
  });
});
