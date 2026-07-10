import { mulberry32, pick } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  GLYPHS,
  MODEL_FOR_DIFFICULTY,
  SEQUENCE_LENGTHS,
  TRANSLATION_TABLES,
  type Glyph,
  type PanelModel,
} from './rules';

/**
 * Everything the Field Agent sees on screen:
 * - the panel model code printed on the panel (selects the Handler's tables)
 * - the flashed glyph sequence for every round (replayable, no timing pressure)
 */
export interface AlarmBypassState {
  model: PanelModel;
  rounds: Glyph[][];
}

/** Answer = the pressed-glyph sequence for each round, in order. */
export type AlarmBypassAnswer = Glyph[][];

export function generateAlarmBypass(
  seed: number,
  difficulty: Difficulty,
): PuzzleInstance<AlarmBypassState> {
  const rng = mulberry32(seed);
  const model = MODEL_FOR_DIFFICULTY[difficulty];
  const rounds = SEQUENCE_LENGTHS[model].map((len) => {
    const seq: Glyph[] = [];
    for (let i = 0; i < len; i++) {
      // Never flash the same glyph twice in a row, so playback stays readable.
      const options =
        seq.length > 0 ? GLYPHS.filter((g) => g !== seq[seq.length - 1]) : [...GLYPHS];
      seq.push(pick(rng, options));
    }
    return seq;
  });
  return {
    moduleId: 'alarm-bypass',
    difficulty,
    seed,
    state: { model, rounds },
  };
}

/**
 * Robot Handler: translate every flashed glyph through that round's table.
 * Uses ONLY state + the exported rule data (same data the manual prints).
 */
export function solveAlarmBypass(state: AlarmBypassState): AlarmBypassAnswer {
  const tables = TRANSLATION_TABLES[state.model];
  if (!tables) throw new Error(`No translation tables for panel model ${state.model}`);
  if (state.rounds.length !== tables.length) {
    throw new Error(
      `Panel model ${state.model} defines ${tables.length} rounds but state has ${state.rounds.length}`,
    );
  }
  return state.rounds.map((seq, round) => seq.map((glyph) => tables[round][glyph]));
}

export function validateAlarmBypass(state: AlarmBypassState, answer: AlarmBypassAnswer): boolean {
  const expected = solveAlarmBypass(state);
  if (!Array.isArray(answer) || answer.length !== expected.length) return false;
  return expected.every(
    (seq, i) =>
      Array.isArray(answer[i]) &&
      answer[i].length === seq.length &&
      seq.every((glyph, j) => answer[i][j] === glyph),
  );
}
