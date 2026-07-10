/**
 * Crack the Safe (vault dial) — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables.
 *
 * Original game content. Information is never carried by color: every gem is
 * identified by shape + marking + size, and size is additionally printed as
 * an S/L tag under the gem.
 */

export const GEM_SHAPES = ['teardrop', 'star', 'hexagon', 'ring', 'wedge'] as const;
export type GemShape = (typeof GEM_SHAPES)[number];

export const GEM_MARKINGS = ['none', 'band', 'core-dot'] as const;
export type GemMarking = (typeof GEM_MARKINGS)[number];

export const GEM_SIZES = ['small', 'large'] as const;
export type GemSize = (typeof GEM_SIZES)[number];

/** Printed size tags shown under every gem (redundant, non-color channel). */
export const SIZE_TAGS: Record<GemSize, string> = { small: 'S', large: 'L' };

export interface Gem {
  shape: GemShape;
  marking: GemMarking;
  size: GemSize;
}

/**
 * Base digit lookup: (shape, marking) -> digit. This is the table printed in
 * the Handler's manual. Every cell is a digit 0–9.
 */
export const BASE_DIGIT: Record<GemShape, Record<GemMarking, number>> = {
  teardrop: { none: 0, band: 5, 'core-dot': 8 },
  star: { none: 1, band: 6, 'core-dot': 9 },
  hexagon: { none: 2, band: 7, 'core-dot': 0 },
  ring: { none: 3, band: 8, 'core-dot': 1 },
  wedge: { none: 4, band: 9, 'core-dot': 2 },
};

/** Digits wrap modulo this after modifiers (9 + 1 wraps to 0). */
export const DIGIT_MOD = 10;

/**
 * Size modifiers, applied to every gem's base digit. Exact wrap math:
 * digit = (base + delta) mod DIGIT_MOD. With delta 2: 8 -> 0, 9 -> 1.
 * Sizes not listed here keep their base digit unchanged.
 */
export interface SizeModifierRule {
  size: GemSize;
  delta: number;
}

export const SIZE_MODIFIER_RULES: SizeModifierRule[] = [{ size: 'large', delta: 2 }];

/**
 * Twist rules, evaluated top-down over the WHOLE gem row after every digit
 * has been computed; the first matching rule is applied and evaluation
 * stops. The list ends in an always-rule so evaluation is total.
 * Twist rules only apply to vaults with TWIST_APPLIES_AT_COUNT or more gems
 * (i.e. Mastermind vaults) — the Handler can tell by asking how many gems
 * there are.
 */
export type TwistCondition = { c: 'sharedShape' } | { c: 'always' };

export type TwistAction = { a: 'reverse' } | { a: 'keep' };

export interface TwistRule {
  when: TwistCondition;
  then: TwistAction;
}

export const TWIST_RULES: TwistRule[] = [
  { when: { c: 'sharedShape' }, then: { a: 'reverse' } },
  { when: { c: 'always' }, then: { a: 'keep' } },
];

/** Twist rules apply only when the row has at least this many gems. */
export const TWIST_APPLIES_AT_COUNT = 4;

/**
 * Generation profile per difficulty.
 * - gemCount: gems in the row (and digits in the code).
 * - mixedSizes: false = every gem is small, so the size modifier never fires
 *   (Rookie is pure table lookup); true = sizes vary per gem.
 * - distinctShapes: true = no two gems share a shape (so the shared-shape
 *   twist can never fire below Mastermind).
 */
export const DIFFICULTY_CONFIG: Record<
  1 | 2 | 3,
  { gemCount: number; mixedSizes: boolean; distinctShapes: boolean }
> = {
  1: { gemCount: 2, mixedSizes: false, distinctShapes: true },
  2: { gemCount: 3, mixedSizes: true, distinctShapes: true },
  3: { gemCount: 4, mixedSizes: true, distinctShapes: false },
};
