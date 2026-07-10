/**
 * Turns wire-maze rule data into manual prose. The manual generator calls
 * these, so printed rules always match the engine — never write rule prose
 * by hand.
 */
import {
  FIRST_CUT_RULES,
  SECOND_CUT_RULES,
  VOWEL_LABELS,
  type SecondCondition,
  type WireAction,
  type WireCondition,
} from './rules';

export type Edition = 'standard' | 'simplified';

const patternWord: Record<string, { standard: string; simplified: string }> = {
  solid: { standard: 'solid', simplified: 'plain' },
  striped: { standard: 'striped', simplified: 'striped' },
  dotted: { standard: 'dotted', simplified: 'dotty' },
  zigzag: { standard: 'zigzag', simplified: 'zigzag' },
};

function pat(p: string, ed: Edition): string {
  return patternWord[p][ed];
}

const vowelList = VOWEL_LABELS.join(', ');

export function conditionToText(cond: WireCondition, ed: Edition): string {
  const s = ed === 'standard';
  switch (cond.c) {
    case 'always':
      return s ? 'If none of the rules above matched' : 'If no rule above worked';
    case 'countColor':
      if (cond.op === 'zero') {
        return s ? `If there are no ${cond.color} wires` : `If you see zero ${cond.color} wires`;
      }
      if (cond.op === 'eq') {
        return s
          ? `If there ${cond.n === 1 ? 'is exactly one' : `are exactly ${cond.n}`} ${cond.color} wire${cond.n === 1 ? '' : 's'}`
          : `If there ${cond.n === 1 ? 'is only one' : `are exactly ${cond.n}`} ${cond.color} wire${cond.n === 1 ? '' : 's'}`;
      }
      return s
        ? `If there are ${cond.n} or more ${cond.color} wires`
        : `If you count ${cond.n} or more ${cond.color} wires`;
    case 'countPattern':
      if (cond.op === 'zero') {
        return s ? `If no wire is ${pat(cond.pattern, ed)}` : `If zero wires are ${pat(cond.pattern, ed)}`;
      }
      if (cond.op === 'eq' && cond.n === 1) {
        return s ? `If exactly one wire is ${pat(cond.pattern, ed)}` : `If only one wire is ${pat(cond.pattern, ed)}`;
      }
      return s
        ? `If ${cond.op === 'eq' ? 'exactly' : 'at least'} ${cond.n} wires are ${pat(cond.pattern, ed)}`
        : `If ${cond.n} or more wires are ${pat(cond.pattern, ed)}`;
    case 'lastWireColor':
      return s ? `If the bottom wire is ${cond.color}` : `If the last wire is ${cond.color}`;
    case 'firstWirePattern':
      return s ? `If the top wire is ${pat(cond.pattern, ed)}` : `If the first wire is ${pat(cond.pattern, ed)}`;
    case 'anyVowelLabel':
      return s
        ? `If any wire tag is a vowel (${vowelList})`
        : `If any wire has a vowel letter (${vowelList})`;
    case 'noVowelLabel':
      return s
        ? `If no wire tag is a vowel (${vowelList})`
        : `If no wire has a vowel letter (${vowelList})`;
  }
}

export function actionToText(action: WireAction, ed: Edition): string {
  const s = ed === 'standard';
  switch (action.a) {
    case 'cutPosition':
      return s ? `cut wire ${action.pos} (counting from the top)` : `cut wire number ${action.pos}`;
    case 'cutLastWire':
      return s ? 'cut the bottom wire' : 'cut the last wire';
    case 'cutOnlyPattern':
      return s ? `cut the ${pat(action.pattern, ed)} wire` : `cut that ${pat(action.pattern, ed)} wire`;
    case 'cutFirstColor':
      return s ? `cut the first ${action.color} wire from the top` : `cut the first ${action.color} wire`;
    case 'cutLastColor':
      return s ? `cut the last ${action.color} wire from the top` : `cut the lowest ${action.color} wire`;
    case 'cutFirstVowelLabel':
      return s ? 'cut the first wire with a vowel tag' : 'cut the first wire with a vowel letter';
  }
}

export function secondConditionToText(cond: SecondCondition, ed: Edition): string {
  const s = ed === 'standard';
  switch (cond.c) {
    case 'always':
      return s ? 'If none of the rules above matched' : 'If no rule above worked';
    case 'firstCutWasPattern':
      return s
        ? `If the wire you already cut was ${pat(cond.pattern, ed)}`
        : `If your first cut was a ${pat(cond.pattern, ed)} wire`;
    case 'firstCutWasColor':
      return s
        ? `If the wire you already cut was ${cond.color}`
        : `If your first cut was ${cond.color}`;
    case 'firstCutLabelVowel':
      return s
        ? 'If the wire you already cut had a vowel tag'
        : 'If your first cut had a vowel letter';
  }
}

/** Render a full first-cut rule table to ordered prose rules. */
export function firstCutRulesText(wireCount: number, ed: Edition): string[] {
  return FIRST_CUT_RULES[wireCount].map(
    (r) => `${conditionToText(r.when, ed)}, ${actionToText(r.then, ed)}.`,
  );
}

export function secondCutRulesText(ed: Edition): string[] {
  return SECOND_CUT_RULES.map(
    (r) => `${secondConditionToText(r.when, ed)}, ${actionToText(r.then, ed)}.`,
  );
}
