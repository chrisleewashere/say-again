import { mulberry32, pick, sample, shuffle } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  CARD_LETTERS,
  linkFor,
  MARKER_BY_SLOT,
  OPERATIVES,
  SETTINGS,
  SLOT_ORDER,
  SLOTS_BY_DIFFICULTY,
  type Connective,
  type StorySlot,
} from './rules';

/** One surveillance still. Everything the Agent can see and describe. */
export interface TapeScene {
  slot: StorySlot;
  /** reference letter stamped on the still — a NAME, never an order cue */
  letter: string;
  operativeId: string;
  settingId: string;
  /** outcome stills only: did the operation succeed? (seal shows check/dash) */
  outcomeGood?: boolean;
}

export interface DebriefTapesState {
  /** stills in shuffled DISPLAY order */
  scenes: TapeScene[];
  /** Agent/Rookie tapes skip the connective pass */
  connectivesRequired: boolean;
}

/**
 * Answer = the report: display-order indices arranged into canonical story
 * order, plus (when required) the connective linking each consecutive pair.
 */
export interface DebriefTapesAnswer {
  order: number[];
  connectives: Connective[];
}

export function generateDebriefTapes(seed: number, difficulty: Difficulty): PuzzleInstance<DebriefTapesState> {
  const rng = mulberry32(seed);
  const slots = SLOTS_BY_DIFFICULTY[difficulty];
  const operative = pick(rng, OPERATIVES);
  // settings vary per still (rich describing) but the operative stays the
  // same — it is one operation, told in stills
  const settings = sample(rng, SETTINGS, slots.length);
  const letters = sample(rng, CARD_LETTERS, slots.length);
  const outcomeGood = rng() < 0.6;

  const ordered: TapeScene[] = slots.map((slot, i) => ({
    slot,
    letter: letters[i],
    operativeId: operative.id,
    settingId: settings[i].id,
    ...(slot === 'outcome' ? { outcomeGood } : {}),
  }));

  // shuffle the display order; re-deal once if it lands fully canonical so
  // there is (almost) always real sequencing work to do
  let scenes = shuffle(rng, ordered);
  if (scenes.every((s, i) => s === ordered[i])) {
    scenes = shuffle(rng, ordered);
  }

  return {
    moduleId: 'debrief-tapes',
    difficulty,
    seed,
    state: { scenes, connectivesRequired: difficulty >= 2 },
  };
}

/**
 * Robot Handler: derive the report from the rule tables alone — classify
 * each still by its marker (MARKER_BY_SLOT), arrange by canonical SLOT_ORDER,
 * then read each junction's connective from LINK_RULES.
 */
export function solveDebriefTapes(state: DebriefTapesState): DebriefTapesAnswer {
  const order = state.scenes
    .map((scene, index) => {
      // the marker on the card identifies the slot — same table the manual prints
      const rule = MARKER_BY_SLOT[scene.slot];
      return { index, rank: SLOT_ORDER.indexOf(rule.slot) };
    })
    .sort((a, b) => a.rank - b.rank)
    .map((s) => s.index);

  const connectives: Connective[] = [];
  if (state.connectivesRequired) {
    for (let i = 0; i < order.length - 1; i++) {
      connectives.push(linkFor(state.scenes[order[i]].slot, state.scenes[order[i + 1]].slot));
    }
  }
  return { order, connectives };
}

export function validateDebriefTapes(state: DebriefTapesState, answer: DebriefTapesAnswer): boolean {
  const expected = solveDebriefTapes(state);
  return (
    answer.order.length === expected.order.length &&
    answer.order.every((v, i) => v === expected.order[i]) &&
    answer.connectives.length === expected.connectives.length &&
    answer.connectives.every((c, i) => c === expected.connectives[i])
  );
}

/* ------------------------------------------------------------------ */
/* Shared description text — used for aria-labels (2D), face region    */
/* labels (3D), and consistent with the manual's marker language.      */
/* ------------------------------------------------------------------ */

export function describeScene(scene: TapeScene): string {
  const op = OPERATIVES.find((o) => o.id === scene.operativeId)!;
  const setting = SETTINGS.find((s) => s.id === scene.settingId)!;
  const marker = MARKER_BY_SLOT[scene.slot];
  const markerPart =
    marker.marker === 'none'
      ? 'no corner marker'
      : marker.marker === 'seal'
        ? `${marker.markerName} with a ${scene.outcomeGood ? 'check' : 'dash'} inside`
        : marker.markerName;
  return `Still ${scene.letter}: ${op.label} with ${op.accessoryName} at ${setting.label} (${setting.glyphName}), ${markerPart}`;
}
