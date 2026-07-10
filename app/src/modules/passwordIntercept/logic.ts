import { mulberry32, pick, sample, shuffle } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  CARDS,
  DISTRACTORS_PER_ROUND,
  ROUNDS_PER_DIFFICULTY,
  getCard,
} from './rules';

export interface InterceptRound {
  /** Printed card number the Agent reads to the Handler. */
  cardId: number;
  /** Exactly one accepted word plus verified non-match distractors, shuffled. */
  candidates: string[];
}

export interface PasswordInterceptState {
  rounds: InterceptRound[];
}

/** Answer = the chosen candidate word for each round, in round order. */
export type PasswordInterceptAnswer = string[];

/**
 * Uniqueness by construction: every round's candidate set is one word drawn
 * from the card's answer key plus distractors drawn from that card's pool,
 * and tests verify no distractor ever matches an accepted answer.
 */
export function generatePasswordIntercept(
  seed: number,
  difficulty: Difficulty,
): PuzzleInstance<PasswordInterceptState> {
  const rng = mulberry32(seed);
  const tierCards = CARDS.filter((c) => c.tier === difficulty);
  const chosenCards = sample(rng, tierCards, ROUNDS_PER_DIFFICULTY[difficulty]);
  const rounds: InterceptRound[] = chosenCards.map((card) => {
    const correct = pick(rng, card.correctAnswers);
    const distractors = sample(rng, card.distractors, DISTRACTORS_PER_ROUND);
    return { cardId: card.id, candidates: shuffle(rng, [correct, ...distractors]) };
  });
  return {
    moduleId: 'password-intercept',
    difficulty,
    seed,
    state: { rounds },
  };
}

/**
 * Robot Handler: for each round, look the card number up in the published
 * card table and return the single candidate its answer key accepts.
 */
export function solvePasswordIntercept(state: PasswordInterceptState): PasswordInterceptAnswer {
  return state.rounds.map((round) => {
    const card = getCard(round.cardId);
    const matches = round.candidates.filter((w) => card.correctAnswers.includes(w));
    if (matches.length !== 1) {
      throw new Error(
        `Card ${round.cardId}: expected exactly one accepted candidate, found ${matches.length}`,
      );
    }
    return matches[0];
  });
}

export function validatePasswordIntercept(
  state: PasswordInterceptState,
  answer: PasswordInterceptAnswer,
): boolean {
  if (answer.length !== state.rounds.length) return false;
  return state.rounds.every((round, i) => {
    const card = getCard(round.cardId);
    return round.candidates.includes(answer[i]) && card.correctAnswers.includes(answer[i]);
  });
}
