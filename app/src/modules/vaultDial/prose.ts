/**
 * Turns vault-dial rule data into manual prose and table cells. The manual
 * generator calls these, so printed rules always match the engine — never
 * write rule prose by hand.
 */
import {
  BASE_DIGIT,
  DIGIT_MOD,
  GEM_MARKINGS,
  GEM_SHAPES,
  GEM_SIZES,
  SIZE_MODIFIER_RULES,
  SIZE_TAGS,
  TWIST_APPLIES_AT_COUNT,
  TWIST_RULES,
  type GemMarking,
  type GemShape,
  type SizeModifierRule,
  type TwistAction,
  type TwistCondition,
} from './rules';

export type Edition = 'standard' | 'simplified';

const shapeWords: Record<GemShape, { standard: string; simplified: string }> = {
  teardrop: { standard: 'teardrop', simplified: 'teardrop (rain drop)' },
  star: { standard: 'star', simplified: 'star' },
  hexagon: { standard: 'hexagon', simplified: 'hexagon (6 sides)' },
  ring: { standard: 'ring', simplified: 'ring (donut)' },
  wedge: { standard: 'wedge', simplified: 'wedge (triangle)' },
};

export function shapeWord(shape: GemShape, ed: Edition): string {
  return shapeWords[shape][ed];
}

/** Marking described in a sentence: "a star with ___". */
const markingWords: Record<GemMarking, { standard: string; simplified: string }> = {
  none: { standard: 'no marking', simplified: 'no mark' },
  band: { standard: 'a band across the middle', simplified: 'a band (stripe)' },
  'core-dot': { standard: 'a core dot in the center', simplified: 'a dot in the middle' },
};

export function markingWord(marking: GemMarking, ed: Edition): string {
  return markingWords[marking][ed];
}

/** Marking as a short table-column heading. */
const markingHeads: Record<GemMarking, { standard: string; simplified: string }> = {
  none: { standard: 'No marking', simplified: 'No mark' },
  band: { standard: 'Band', simplified: 'Band (stripe)' },
  'core-dot': { standard: 'Core dot', simplified: 'Middle dot' },
};

export function markingHead(marking: GemMarking, ed: Edition): string {
  return markingHeads[marking][ed];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The printed (shape, marking) -> base digit table, generated from BASE_DIGIT. */
export function baseDigitTable(ed: Edition): { header: string[]; rows: string[][] } {
  return {
    header: ['Shape', ...GEM_MARKINGS.map((m) => markingHead(m, ed))],
    rows: GEM_SHAPES.map((shape) => [
      cap(shapeWord(shape, ed)),
      ...GEM_MARKINGS.map((m) => String(BASE_DIGIT[shape][m])),
    ]),
  };
}

/** Wrap examples computed from the modifier data, e.g. "8 becomes 0, 9 becomes 1". */
function wrapExamples(rule: SizeModifierRule, ed: Edition): string {
  const joins: string[] = [];
  for (let base = DIGIT_MOD - rule.delta; base < DIGIT_MOD; base++) {
    joins.push(
      ed === 'standard'
        ? `${base} becomes ${(base + rule.delta) % DIGIT_MOD}`
        : `${base} turns into ${(base + rule.delta) % DIGIT_MOD}`,
    );
  }
  return joins.join(', ');
}

export function sizeModifierRuleToText(rule: SizeModifierRule, ed: Edition): string {
  const other = GEM_SIZES.find((sz) => sz !== rule.size);
  const otherPart = other
    ? ed === 'standard'
      ? ` ${cap(other)} gems (tag ${SIZE_TAGS[other]}) keep their table digit.`
      : ` A ${other} gem (tag ${SIZE_TAGS[other]}) does not change.`
    : '';
  if (ed === 'standard') {
    return (
      `If a gem is ${rule.size.toUpperCase()} (tag ${SIZE_TAGS[rule.size]}), add ${rule.delta} to its digit. ` +
      `There is no digit above ${DIGIT_MOD - 1}, so wrap around: ${wrapExamples(rule, ed)}.${otherPart}`
    );
  }
  return (
    `${cap(rule.size)} gem (tag ${SIZE_TAGS[rule.size]})? Add ${rule.delta}. ` +
    `After ${DIGIT_MOD - 1} you start over at 0: ${wrapExamples(rule, ed)}.${otherPart}`
  );
}

export function sizeModifierRulesText(ed: Edition): string[] {
  return SIZE_MODIFIER_RULES.map((r) => sizeModifierRuleToText(r, ed));
}

export function twistConditionToText(cond: TwistCondition, ed: Edition): string {
  switch (cond.c) {
    case 'always':
      return ed === 'standard' ? 'If none of the rules above matched' : 'If no rule above worked';
    case 'sharedShape':
      return ed === 'standard'
        ? 'If two or more gems have the SAME shape'
        : 'If any two gems are the same shape';
  }
}

export function twistActionToText(action: TwistAction, ed: Edition): string {
  switch (action.a) {
    case 'reverse':
      return ed === 'standard'
        ? 'reverse the whole code before reading it out (last digit becomes first)'
        : 'say the code backwards (last number first)';
    case 'keep':
      return ed === 'standard' ? 'read the code exactly as computed' : 'say the code just as it is';
  }
}

export function twistRulesText(ed: Edition): string[] {
  return TWIST_RULES.map((r) => `${twistConditionToText(r.when, ed)}, ${twistActionToText(r.then, ed)}.`);
}

/** When the twist step applies, generated from TWIST_APPLIES_AT_COUNT. */
export function twistScopeText(ed: Edition): string {
  return ed === 'standard'
    ? `This step only applies when the vault shows ${TWIST_APPLIES_AT_COUNT} or more gems. After you have every digit, check this list in order and apply the first rule that matches.`
    : `Only do this if there are ${TWIST_APPLIES_AT_COUNT} gems. Do it after you have all the numbers. Use the first rule that fits.`;
}
