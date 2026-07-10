import { mulberry32, pick, sample, shuffle } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  ALLOW_DOUBLE_CATEGORY,
  CATEGORIES,
  KEY_COUNT,
  MAX_WORD_TIER,
  type Category,
} from './rules';

/** One word key on the keypad. The Agent sees ONLY the word — never its category. */
export interface KeypadKey {
  word: string;
}

export interface KeypadCipherState {
  keys: KeypadKey[];
}

/** Answer = 0-based key indices in the order they must be pressed. */
export type KeypadCipherAnswer = number[];

/**
 * Word -> (priority rank, word) lookup built from the published category
 * tables — the same data the printed manual is generated from. Every word
 * lives in exactly one table (property-tested), so the lookup is unambiguous.
 */
const WORD_PRIORITY: ReadonlyMap<string, number> = (() => {
  const map = new Map<string, number>();
  CATEGORIES.forEach((cat, rank) => {
    for (const w of cat.words) map.set(w.word, rank);
  });
  return map;
})();

export function generateKeypadCipher(
  seed: number,
  difficulty: Difficulty,
): PuzzleInstance<KeypadCipherState> {
  const rng = mulberry32(seed);
  const keyCount = KEY_COUNT[difficulty];
  const maxTier = MAX_WORD_TIER[difficulty];

  // On Mastermind, half the panels double up one category so the printed
  // alphabetical tie-break rule comes into play.
  const doubled = ALLOW_DOUBLE_CATEGORY[difficulty] && rng() < 0.5;
  const categoryCount = doubled ? keyCount - 1 : keyCount;

  const cats = sample(rng, CATEGORIES, categoryCount);
  const doubledCat: Category | null = doubled ? pick(rng, cats) : null;

  const words: string[] = [];
  for (const cat of cats) {
    const pool = cat.words.filter((w) => w.tier <= maxTier).map((w) => w.word);
    const take = cat === doubledCat ? 2 : 1;
    words.push(...sample(rng, pool, take));
  }

  const keys: KeypadKey[] = shuffle(rng, words).map((word) => ({ word }));
  return { moduleId: 'keypad-cipher', difficulty, seed, state: { keys } };
}

/**
 * Robot Handler: sort key indices by (category priority rank, then
 * alphabetical within the same category) using only the published tables.
 */
export function solveKeypadCipher(state: KeypadCipherState): KeypadCipherAnswer {
  const ranked = state.keys.map((key, index) => {
    const priority = WORD_PRIORITY.get(key.word);
    if (priority === undefined) {
      throw new Error(`Word is not in any category table: ${key.word}`);
    }
    return { index, priority, word: key.word };
  });
  ranked.sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : a.word < b.word
        ? -1
        : a.word > b.word
          ? 1
          : 0,
  );
  return ranked.map((r) => r.index);
}

export function validateKeypadCipher(
  state: KeypadCipherState,
  answer: KeypadCipherAnswer,
): boolean {
  const expected = solveKeypadCipher(state);
  return answer.length === expected.length && answer.every((v, i) => v === expected[i]);
}
