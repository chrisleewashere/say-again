import { mulberry32, pick, sample } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  CUTS_REQUIRED,
  FIRST_CUT_RULES,
  SECOND_CUT_RULES,
  VOWEL_LABELS,
  WIRE_COLORS,
  WIRE_COUNT,
  WIRE_LABELS,
  WIRE_PATTERNS,
  type SecondCondition,
  type Wire,
  type WireAction,
  type WireCondition,
} from './rules';

export interface WireMazeState {
  wires: Wire[];
  cutsRequired: number;
}

/** Answer = ordered list of 0-based wire indices to cut. */
export type WireMazeAnswer = number[];

export function generateWireMaze(seed: number, difficulty: Difficulty): PuzzleInstance<WireMazeState> {
  const rng = mulberry32(seed);
  const count = WIRE_COUNT[difficulty];
  const labels = sample(rng, WIRE_LABELS, count);
  const wires: Wire[] = labels.map((label) => ({
    color: pick(rng, WIRE_COLORS),
    pattern: pick(rng, WIRE_PATTERNS),
    label,
  }));
  return {
    moduleId: 'wire-maze',
    difficulty,
    seed,
    state: { wires, cutsRequired: CUTS_REQUIRED[difficulty] },
  };
}

function isVowel(label: string): boolean {
  return (VOWEL_LABELS as readonly string[]).includes(label);
}

/** Wires not yet cut, with their original printed positions (0-based index). */
type Live = { wire: Wire; index: number }[];

function evalCondition(cond: WireCondition, live: Live): boolean {
  switch (cond.c) {
    case 'always':
      return true;
    case 'countColor': {
      const n = live.filter((w) => w.wire.color === cond.color).length;
      return cond.op === 'eq' ? n === cond.n : cond.op === 'gte' ? n >= cond.n : n === 0;
    }
    case 'countPattern': {
      const n = live.filter((w) => w.wire.pattern === cond.pattern).length;
      return cond.op === 'eq' ? n === cond.n : cond.op === 'gte' ? n >= cond.n : n === 0;
    }
    case 'lastWireColor':
      return live[live.length - 1].wire.color === cond.color;
    case 'firstWirePattern':
      return live[0].wire.pattern === cond.pattern;
    case 'anyVowelLabel':
      return live.some((w) => isVowel(w.wire.label));
    case 'noVowelLabel':
      return !live.some((w) => isVowel(w.wire.label));
  }
}

/**
 * Resolve an action to the printed position (0-based) of the wire to cut.
 * Returns null when the action cannot resolve (rule tables are designed so
 * this never happens when the paired condition holds — property-tested).
 */
function resolveAction(action: WireAction, live: Live): number | null {
  switch (action.a) {
    case 'cutPosition': {
      const hit = live.find((w) => w.index === action.pos - 1);
      return hit ? hit.index : null;
    }
    case 'cutLastWire':
      return live[live.length - 1].index;
    case 'cutOnlyPattern': {
      const hits = live.filter((w) => w.wire.pattern === action.pattern);
      return hits.length === 1 ? hits[0].index : null;
    }
    case 'cutFirstColor': {
      const hit = live.find((w) => w.wire.color === action.color);
      return hit ? hit.index : null;
    }
    case 'cutLastColor': {
      const hits = live.filter((w) => w.wire.color === action.color);
      return hits.length ? hits[hits.length - 1].index : null;
    }
    case 'cutFirstVowelLabel': {
      const hit = live.find((w) => isVowel(w.wire.label));
      return hit ? hit.index : null;
    }
  }
}

function evalSecondCondition(cond: SecondCondition, firstCut: Wire): boolean {
  switch (cond.c) {
    case 'always':
      return true;
    case 'firstCutWasPattern':
      return firstCut.pattern === cond.pattern;
    case 'firstCutWasColor':
      return firstCut.color === cond.color;
    case 'firstCutLabelVowel':
      return isVowel(firstCut.label);
  }
}

/** Robot Handler: derive the answer from the rule tables alone. */
export function solveWireMaze(state: WireMazeState): WireMazeAnswer {
  const all: Live = state.wires.map((wire, index) => ({ wire, index }));
  const table = FIRST_CUT_RULES[state.wires.length];
  if (!table) throw new Error(`No rule table for ${state.wires.length} wires`);

  const cuts: number[] = [];
  let live = all;

  for (const rule of table) {
    if (evalCondition(rule.when, live)) {
      const idx = resolveAction(rule.then, live);
      if (idx === null) throw new Error(`Unresolvable first-cut action: ${JSON.stringify(rule)}`);
      cuts.push(idx);
      break;
    }
  }
  if (cuts.length === 0) throw new Error('First-cut table not total');

  if (state.cutsRequired === 2) {
    const firstCutWire = state.wires[cuts[0]];
    live = all.filter((w) => w.index !== cuts[0]);
    for (const rule of SECOND_CUT_RULES) {
      if (evalSecondCondition(rule.when, firstCutWire)) {
        let idx = resolveAction(rule.then, live);
        // Documented fallback (also stated in the manual): if the indicated
        // wire is already cut or absent, cut the lowest remaining wire.
        if (idx === null) idx = live[live.length - 1].index;
        cuts.push(idx);
        break;
      }
    }
  }

  return cuts;
}

export function validateWireMaze(state: WireMazeState, answer: WireMazeAnswer): boolean {
  const expected = solveWireMaze(state);
  return answer.length === expected.length && answer.every((v, i) => v === expected[i]);
}
