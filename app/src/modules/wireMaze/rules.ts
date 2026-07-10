/**
 * Laser Grid Bypass (wire maze) — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables.
 *
 * Original game content. Color is never the only channel: every wire carries
 * color + pattern + a printed letter tag.
 */

export const WIRE_COLORS = ['amber', 'teal', 'crimson', 'violet', 'silver'] as const;
export type WireColor = (typeof WIRE_COLORS)[number];

export const WIRE_PATTERNS = ['solid', 'striped', 'dotted', 'zigzag'] as const;
export type WirePattern = (typeof WIRE_PATTERNS)[number];

/** Letter tags; A/E/U give vowel-based rules something to bite on. */
export const WIRE_LABELS = ['A', 'E', 'K', 'M', 'R', 'T', 'U', 'X', 'Z'] as const;
export type WireLabel = (typeof WIRE_LABELS)[number];

export const VOWEL_LABELS: readonly WireLabel[] = ['A', 'E', 'U'];

export interface Wire {
  color: WireColor;
  pattern: WirePattern;
  label: WireLabel;
}

export type CountOp = 'eq' | 'gte' | 'zero';

/** Conditions evaluate against the wires not yet cut. */
export type WireCondition =
  | { c: 'always' }
  | { c: 'countColor'; color: WireColor; op: CountOp; n: number }
  | { c: 'countPattern'; pattern: WirePattern; op: CountOp; n: number }
  | { c: 'lastWireColor'; color: WireColor }
  | { c: 'firstWirePattern'; pattern: WirePattern }
  | { c: 'anyVowelLabel' }
  | { c: 'noVowelLabel' };

/**
 * Actions select exactly one wire among those not yet cut. Positions are the
 * fixed printed positions (1 = top), which never renumber after a cut.
 */
export type WireAction =
  | { a: 'cutPosition'; pos: number }
  | { a: 'cutLastWire' }
  | { a: 'cutOnlyPattern'; pattern: WirePattern }
  | { a: 'cutFirstColor'; color: WireColor }
  | { a: 'cutLastColor'; color: WireColor }
  | { a: 'cutFirstVowelLabel' };

export interface WireRule {
  when: WireCondition;
  then: WireAction;
}

/**
 * First-cut rule tables, keyed by total wire count. Evaluated top-down; the
 * first rule whose condition holds is applied. Each table ends in an
 * always-rule so evaluation is total. Every action is guaranteed resolvable
 * whenever its condition holds (verified by property tests across seeds).
 */
export const FIRST_CUT_RULES: Record<number, WireRule[]> = {
  4: [
    { when: { c: 'countPattern', pattern: 'striped', op: 'eq', n: 1 }, then: { a: 'cutOnlyPattern', pattern: 'striped' } },
    { when: { c: 'countColor', color: 'crimson', op: 'zero', n: 0 }, then: { a: 'cutPosition', pos: 2 } },
    { when: { c: 'lastWireColor', color: 'teal' }, then: { a: 'cutLastWire' } },
    { when: { c: 'anyVowelLabel' }, then: { a: 'cutFirstVowelLabel' } },
    { when: { c: 'always' }, then: { a: 'cutPosition', pos: 3 } },
  ],
  5: [
    { when: { c: 'countPattern', pattern: 'dotted', op: 'eq', n: 1 }, then: { a: 'cutOnlyPattern', pattern: 'dotted' } },
    { when: { c: 'firstWirePattern', pattern: 'zigzag' }, then: { a: 'cutPosition', pos: 4 } },
    { when: { c: 'countColor', color: 'violet', op: 'gte', n: 2 }, then: { a: 'cutLastColor', color: 'violet' } },
    { when: { c: 'noVowelLabel' }, then: { a: 'cutPosition', pos: 1 } },
    { when: { c: 'always' }, then: { a: 'cutFirstVowelLabel' } },
  ],
  6: [
    { when: { c: 'countColor', color: 'silver', op: 'eq', n: 1 }, then: { a: 'cutFirstColor', color: 'silver' } },
    { when: { c: 'countPattern', pattern: 'solid', op: 'zero', n: 0 }, then: { a: 'cutPosition', pos: 5 } },
    { when: { c: 'lastWireColor', color: 'amber' }, then: { a: 'cutPosition', pos: 2 } },
    { when: { c: 'anyVowelLabel' }, then: { a: 'cutFirstVowelLabel' } },
    { when: { c: 'always' }, then: { a: 'cutLastWire' } },
  ],
};

/** Second-cut conditions may also reference the wire that was just cut. */
export type SecondCondition =
  | { c: 'always' }
  | { c: 'firstCutWasPattern'; pattern: WirePattern }
  | { c: 'firstCutWasColor'; color: WireColor }
  | { c: 'firstCutLabelVowel' };

export interface SecondRule {
  when: SecondCondition;
  then: WireAction;
}

/**
 * Second cut (Mastermind difficulty only, 6 wires). Actions apply to the
 * remaining uncut wires; printed positions do not renumber.
 */
export const SECOND_CUT_RULES: SecondRule[] = [
  { when: { c: 'firstCutWasPattern', pattern: 'striped' }, then: { a: 'cutLastWire' } },
  { when: { c: 'firstCutWasColor', color: 'silver' }, then: { a: 'cutPosition', pos: 1 } },
  { when: { c: 'firstCutLabelVowel' }, then: { a: 'cutPosition', pos: 3 } },
  { when: { c: 'always' }, then: { a: 'cutPosition', pos: 4 } },
];

/** Wires per difficulty. */
export const WIRE_COUNT: Record<1 | 2 | 3, number> = { 1: 4, 2: 5, 3: 6 };

/** Cuts required per difficulty. */
export const CUTS_REQUIRED: Record<1 | 2 | 3, number> = { 1: 1, 2: 1, 3: 2 };
