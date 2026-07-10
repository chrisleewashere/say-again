import { mulberry32, pick, sample } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  BASE_DIGIT,
  DIFFICULTY_CONFIG,
  DIGIT_MOD,
  GEM_MARKINGS,
  GEM_SHAPES,
  GEM_SIZES,
  SIZE_MODIFIER_RULES,
  TWIST_APPLIES_AT_COUNT,
  TWIST_RULES,
  type Gem,
  type GemShape,
  type TwistAction,
  type TwistCondition,
} from './rules';

export interface VaultDialState {
  /** Gems left to right — everything the Agent sees above the keypad. */
  gems: Gem[];
}

/** Answer = the digit string keyed in, e.g. "4072". */
export type VaultDialAnswer = string;

export function generateVaultDial(seed: number, difficulty: Difficulty): PuzzleInstance<VaultDialState> {
  const rng = mulberry32(seed);
  const cfg = DIFFICULTY_CONFIG[difficulty];

  const shapes: GemShape[] = cfg.distinctShapes
    ? sample(rng, GEM_SHAPES, cfg.gemCount)
    : Array.from({ length: cfg.gemCount }, () => pick(rng, GEM_SHAPES));

  const gems: Gem[] = shapes.map((shape) => ({
    shape,
    marking: pick(rng, GEM_MARKINGS),
    size: cfg.mixedSizes ? pick(rng, GEM_SIZES) : 'small',
  }));

  return {
    moduleId: 'vault-dial',
    difficulty,
    seed,
    state: { gems },
  };
}

/** Digit for one gem: base table lookup, then every matching size modifier. */
export function gemDigit(gem: Gem): number {
  let digit = BASE_DIGIT[gem.shape][gem.marking];
  for (const rule of SIZE_MODIFIER_RULES) {
    if (gem.size === rule.size) digit = (digit + rule.delta) % DIGIT_MOD;
  }
  return digit;
}

function evalTwistCondition(cond: TwistCondition, gems: Gem[]): boolean {
  switch (cond.c) {
    case 'always':
      return true;
    case 'sharedShape':
      return new Set(gems.map((g) => g.shape)).size < gems.length;
  }
}

function applyTwistAction(action: TwistAction, digits: number[]): number[] {
  switch (action.a) {
    case 'keep':
      return digits;
    case 'reverse':
      return [...digits].reverse();
  }
}

/** Robot Handler: derive the code from the rule tables alone. */
export function solveVaultDial(state: VaultDialState): VaultDialAnswer {
  let digits = state.gems.map(gemDigit);

  if (state.gems.length >= TWIST_APPLIES_AT_COUNT) {
    for (const rule of TWIST_RULES) {
      if (evalTwistCondition(rule.when, state.gems)) {
        digits = applyTwistAction(rule.then, digits);
        break;
      }
    }
  }

  return digits.join('');
}

export function validateVaultDial(state: VaultDialState, answer: VaultDialAnswer): boolean {
  return answer === solveVaultDial(state);
}
