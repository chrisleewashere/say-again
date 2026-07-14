import { mulberry32, pick, randInt, sample, shuffle } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  CONSONANT_TAGS,
  CONTROL_TYPE_BY_ID,
  DECOY_RANGE,
  MODELS_BY_DIFFICULTY,
  modelById,
  SETTING_MAX,
  SETTING_MIN,
  STEP_RULE_BY_ID,
  STEP_RULES,
  tagClassOf,
  VOWEL_TAGS,
  type ControlType,
  type StepRuleId,
  type TagClass,
} from './rules';

/** One hardware control on the panel. Everything the Agent can see and say. */
export interface PanelControl {
  type: ControlType;
  /** printed tag letter — its vowel/consonant class is what steps match on */
  tag: string;
  /** flavor for describing (needle position, switch up/down, ...) */
  setting: number;
}

/**
 * The whole screen: the model name printed on the panel plus the controls.
 * The broken step is deliberately NOT stored — it is derivable by checking
 * each printed step of the model against the controls, exactly as the
 * Handler does with the printed sequence tables.
 */
export interface BadIntelState {
  /** ServiceModel id — the panel names it, the manual prints its sequence */
  model: string;
  controls: PanelControl[];
}

/** One move per printed step: tap the matching control, or flag bad intel. */
export type BadIntelMove = { kind: 'tap'; control: number } | { kind: 'flag' };

export type BadIntelAnswer = BadIntelMove[];

/** Does this control satisfy a step's (type + tag-class) matcher? */
export function controlMatches(control: PanelControl, ruleId: StepRuleId): boolean {
  const rule = STEP_RULE_BY_ID[ruleId];
  return control.type === rule.control && tagClassOf(control.tag) === rule.tagClass;
}

export function generateBadIntel(seed: number, difficulty: Difficulty): PuzzleInstance<BadIntelState> {
  const rng = mulberry32(seed);
  const model = pick(rng, MODELS_BY_DIFFICULTY[difficulty]);
  const brokenStep = randInt(rng, 0, model.steps.length - 1);

  // one control satisfying each intact step; the broken step's matcher gets none
  const specs: { type: ControlType; tagClass: TagClass }[] = model.steps
    .filter((_, i) => i !== brokenStep)
    .map((id) => {
      const rule = STEP_RULE_BY_ID[id];
      return { type: rule.control, tagClass: rule.tagClass };
    });

  // decoys draw from matchers the model never uses, so they can never
  // satisfy a printed step (the broken one included)
  const used = new Set<StepRuleId>(model.steps);
  const decoyPool = STEP_RULES.filter((r) => !used.has(r.id));
  const [decoyMin, decoyMax] = DECOY_RANGE[difficulty];
  const decoyCount = randInt(rng, decoyMin, decoyMax);
  for (let i = 0; i < decoyCount; i++) {
    const decoy = pick(rng, decoyPool);
    specs.push({ type: decoy.control, tagClass: decoy.tagClass });
  }

  // distinct tag letters, each consistent with its control's tag class
  const vowelCount = specs.filter((s) => s.tagClass === 'vowel').length;
  const vowels = sample(rng, VOWEL_TAGS, vowelCount);
  const consonants = sample(rng, CONSONANT_TAGS, specs.length - vowelCount);
  let v = 0;
  let c = 0;
  const controls: PanelControl[] = specs.map((s) => ({
    type: s.type,
    tag: s.tagClass === 'vowel' ? vowels[v++] : consonants[c++],
    setting: randInt(rng, SETTING_MIN, SETTING_MAX),
  }));

  return {
    moduleId: 'bad-intel',
    difficulty,
    seed,
    state: { model: model.id, controls: shuffle(rng, controls) },
  };
}

/**
 * Robot Handler: walk the model's printed sequence step by step. A step whose
 * matcher fits exactly one control gets a tap on that control; a step whose
 * matcher fits nothing on the panel is bad intel and gets a flag — the same
 * check the printed exception rule tells the human Handler to make.
 */
export function solveBadIntel(state: BadIntelState): BadIntelAnswer {
  const model = modelById(state.model);
  return model.steps.map((ruleId): BadIntelMove => {
    const matches = state.controls
      .map((control, index) => ({ control, index }))
      .filter(({ control }) => controlMatches(control, ruleId));
    return matches.length === 0 ? { kind: 'flag' } : { kind: 'tap', control: matches[0].index };
  });
}

function sameMove(a: BadIntelMove, b: BadIntelMove): boolean {
  return a.kind === 'tap' ? b.kind === 'tap' && a.control === b.control : b.kind === 'flag';
}

export function validateBadIntel(state: BadIntelState, answer: BadIntelAnswer): boolean {
  const expected = solveBadIntel(state);
  return answer.length === expected.length && answer.every((move, i) => sameMove(move, expected[i]));
}

/* ------------------------------------------------------------------ */
/* Shared description text — used for aria-labels (2D), face region    */
/* labels (3D), and consistent with the manual's control language.     */
/* ------------------------------------------------------------------ */

export function describeControl(control: PanelControl): string {
  return `${CONTROL_TYPE_BY_ID[control.type].label} tagged ${control.tag}, set to ${control.setting}`;
}
