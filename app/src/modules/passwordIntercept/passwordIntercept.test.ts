import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import {
  generatePasswordIntercept,
  solvePasswordIntercept,
  validatePasswordIntercept,
} from './logic';
import { cardRowChunks, cardRows, relationHelpText, relationText } from './prose';
import {
  CANDIDATES_PER_ROUND,
  CARDS,
  DISTRACTORS_PER_ROUND,
  RELATIONS,
  RELATION_SYMBOLS,
  ROUNDS_PER_DIFFICULTY,
  getCard,
} from './rules';

const SEEDS_PER_TIER = 1500;

describe('password intercept — card table integrity', () => {
  it('has at least 36 cards with unique ids', () => {
    expect(CARDS.length).toBeGreaterThanOrEqual(36);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });

  it('every tier has enough cards for its round count', () => {
    for (const tier of [1, 2, 3] as const) {
      const n = CARDS.filter((c) => c.tier === tier).length;
      expect(n).toBeGreaterThanOrEqual(ROUNDS_PER_DIFFICULTY[tier]);
    }
  });

  it('no distractor ever equals any accepted answer for its card (case-insensitive)', () => {
    for (const card of CARDS) {
      const accepted = new Set(card.correctAnswers.map((w) => w.toLowerCase()));
      for (const d of card.distractors) {
        expect(accepted.has(d.toLowerCase()), `card ${card.id}: "${d}"`).toBe(false);
      }
    }
  });

  it('distractor pools are large enough, duplicate-free, and words are clean', () => {
    for (const card of CARDS) {
      expect(card.distractors.length).toBeGreaterThanOrEqual(DISTRACTORS_PER_ROUND);
      expect(new Set(card.distractors).size).toBe(card.distractors.length);
      expect(card.correctAnswers.length).toBeGreaterThanOrEqual(1);
      expect(new Set(card.correctAnswers).size).toBe(card.correctAnswers.length);
      for (const w of [...card.correctAnswers, ...card.distractors]) {
        expect(w).toBe(w.trim().toLowerCase());
        expect(w.length).toBeGreaterThan(0);
      }
    }
  });

  it('getCard resolves every id and throws on unknown ids', () => {
    for (const card of CARDS) expect(getCard(card.id)).toBe(card);
    expect(() => getCard(9999)).toThrow();
  });
});

describe('password intercept — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every seeded instance solves from card data alone`, () => {
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generatePasswordIntercept(seed * 7919 + difficulty, difficulty);
        const { rounds } = inst.state;

        expect(rounds.length).toBe(ROUNDS_PER_DIFFICULTY[difficulty]);
        // rounds use distinct cards, all from the matching tier
        expect(new Set(rounds.map((r) => r.cardId)).size).toBe(rounds.length);
        for (const round of rounds) {
          const card = getCard(round.cardId);
          expect(card.tier).toBe(difficulty);
          // 5 distinct candidates, exactly one of which is accepted (uniqueness)
          expect(round.candidates.length).toBe(CANDIDATES_PER_ROUND);
          expect(new Set(round.candidates).size).toBe(CANDIDATES_PER_ROUND);
          const accepted = round.candidates.filter((w) => card.correctAnswers.includes(w));
          expect(accepted.length).toBe(1);
        }

        // solve() throws if any round lacks a unique accepted candidate
        const answer = solvePasswordIntercept(inst.state);
        expect(answer.length).toBe(rounds.length);
        expect(validatePasswordIntercept(inst.state, answer)).toBe(true);
      }
    });
  }

  it('is deterministic: same seed, same puzzle and solution', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const a = generatePasswordIntercept(424242, difficulty);
      const b = generatePasswordIntercept(424242, difficulty);
      expect(a.state).toEqual(b.state);
      expect(solvePasswordIntercept(a.state)).toEqual(solvePasswordIntercept(b.state));
    }
  });

  it('rejects wrong answers', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const inst = generatePasswordIntercept(seed, 3);
      const answer = solvePasswordIntercept(inst.state);

      // swapping any round's word for a shown distractor must fail
      for (let i = 0; i < answer.length; i++) {
        const distractor = inst.state.rounds[i].candidates.find((w) => w !== answer[i])!;
        const wrong = [...answer];
        wrong[i] = distractor;
        expect(validatePasswordIntercept(inst.state, wrong)).toBe(false);
      }

      // wrong length must fail
      expect(validatePasswordIntercept(inst.state, answer.slice(0, -1))).toBe(false);
      expect(validatePasswordIntercept(inst.state, [...answer, answer[0]])).toBe(false);
      expect(validatePasswordIntercept(inst.state, [])).toBe(false);
    }
  });

  it('rejects an accepted word that was never shown as a candidate', () => {
    const inst = generatePasswordIntercept(7, 1);
    const answer = solvePasswordIntercept(inst.state);
    const card = getCard(inst.state.rounds[0].cardId);
    const offScreen = card.correctAnswers.find((w) => !inst.state.rounds[0].candidates.includes(w));
    if (offScreen) {
      const wrong = [...answer];
      wrong[0] = offScreen;
      expect(validatePasswordIntercept(inst.state, wrong)).toBe(false);
    }
  });
});

describe('password intercept — manual prose stays in sync with card data', () => {
  it('renders one table row per card, both editions, in card-number order', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      const rows = cardRows(ed);
      expect(rows).toHaveLength(CARDS.length);
      const sortedIds = [...CARDS].map((c) => c.id).sort((a, b) => a - b);
      rows.forEach((row, i) => {
        expect(row[0]).toBe(String(sortedIds[i]));
        expect(row[2]).toBe(getCard(sortedIds[i]).clue);
      });
    }
  });

  it('chunked tables cover every card exactly once', () => {
    for (const ed of ['standard', 'simplified'] as const) {
      const chunkRows = cardRowChunks(ed).flatMap((c) => c.rows);
      expect(chunkRows).toEqual(cardRows(ed));
    }
  });

  it('covers every relation in both editions (catch-all: no relation is unrenderable)', () => {
    // The relation vocabulary is closed; prose must handle all of it so the
    // Handler can never hit a card the manual does not explain.
    for (const rel of RELATIONS) {
      const std = relationText(rel, 'standard');
      expect(std).toContain(RELATION_SYMBOLS[rel]); // word + symbol, two channels
      expect(std.replace(`(${RELATION_SYMBOLS[rel]})`, '').trim().length).toBeGreaterThan(0);
      expect(relationHelpText(rel, 'standard').length).toBeGreaterThan(0);
      expect(relationHelpText(rel, 'simplified').length).toBeGreaterThan(0);
    }
  });

  it('simplified edition uses only the words SAME / OPPOSITE / MEANS', () => {
    const allowed = new Set(['SAME', 'OPPOSITE', 'MEANS']);
    for (const rel of RELATIONS) {
      expect(allowed.has(relationText(rel, 'simplified'))).toBe(true);
    }
    for (const row of cardRows('simplified')) {
      expect(allowed.has(row[1])).toBe(true);
    }
  });
});
