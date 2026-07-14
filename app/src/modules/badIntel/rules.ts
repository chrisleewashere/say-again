/**
 * Bad Intel — rule tables.
 *
 * Comprehension monitoring / listener-initiated repair: the Agent sees a
 * maintenance panel of hardware controls; the Handler's manual holds the
 * printed SERVICE SEQUENCE for every panel model. Exactly one step of the
 * generated panel's sequence names hardware the panel does not have — the
 * Agent must notice the instruction cannot be right and FLAG it instead of
 * forcing a tap. Both the app solver and the printed manual are generated
 * from THIS data.
 *
 * Evidence base: comprehension monitoring is the core of listener-initiated
 * repair — students who act on impossible directions instead of challenging
 * them are the classic barrier-game finding (Dollaghan & Kaston 1986), and
 * planting an unsatisfiable instruction is the standard way to elicit the
 * challenge.
 */
import type { Difficulty } from '../../engine/types';

/* ------------------------------------------------------------------ */
/* Hardware control types.                                             */
/* ------------------------------------------------------------------ */

export type ControlType = 'dial' | 'toggle' | 'lever' | 'valve';

export interface ControlTypeInfo {
  type: ControlType;
  /** printable name — manual tables, aria-labels, and face labels use this */
  label: string;
  /** how the Handler spots it from the Agent's description — standard edition */
  standard: string;
  /** easy-read edition */
  simplified: string;
}

export const CONTROL_TYPES: readonly ControlTypeInfo[] = [
  {
    type: 'dial',
    label: 'Dial',
    standard: 'A round gauge with tick marks and a needle pointing at its setting.',
    simplified: 'A round dial with a needle.',
  },
  {
    type: 'toggle',
    label: 'Toggle',
    standard: 'A stubby switch in a vertical slot, sitting either up or down.',
    simplified: 'A switch that sits up or down.',
  },
  {
    type: 'lever',
    label: 'Lever',
    standard: 'A long handle with a ball grip, mounted on a base plate.',
    simplified: 'A long handle with a ball on the end.',
  },
  {
    type: 'valve',
    label: 'Valve',
    standard: 'A spoked wheel you would turn, like the wheel on a pipe.',
    simplified: 'A wheel with spokes, like on a pipe.',
  },
];

export const CONTROL_TYPE_BY_ID: Record<ControlType, ControlTypeInfo> = Object.fromEntries(
  CONTROL_TYPES.map((c) => [c.type, c]),
) as Record<ControlType, ControlTypeInfo>;

/* ------------------------------------------------------------------ */
/* Tag letters. Vowel/consonant is the tag-class every step matches on. */
/* ------------------------------------------------------------------ */

export type TagClass = 'vowel' | 'consonant';

export const VOWEL_TAGS: readonly string[] = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANT_TAGS: readonly string[] = ['B', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P'];

export function tagClassOf(tag: string): TagClass {
  return VOWEL_TAGS.includes(tag) ? 'vowel' : 'consonant';
}

/* ------------------------------------------------------------------ */
/* Step rules: the 8 matchers a printed sequence step can use.          */
/* Each names hardware by (control type + tag class).                   */
/* ------------------------------------------------------------------ */

export type StepRuleId = `${ControlType}-${TagClass}`;

export interface StepRule {
  id: StepRuleId;
  control: ControlType;
  tagClass: TagClass;
  /** the step as the Handler reads it aloud — standard edition */
  standard: string;
  /** easy-read edition */
  simplified: string;
}

export const STEP_RULES: readonly StepRule[] = CONTROL_TYPES.flatMap((c): StepRule[] => [
  {
    id: `${c.type}-vowel`,
    control: c.type,
    tagClass: 'vowel',
    standard: `Service the ${c.type} tagged with a vowel (A, E, I, O, or U).`,
    simplified: `Tap the ${c.type} with a vowel letter (A, E, I, O, U).`,
  },
  {
    id: `${c.type}-consonant`,
    control: c.type,
    tagClass: 'consonant',
    standard: `Service the ${c.type} tagged with a consonant (any letter that is not A, E, I, O, or U).`,
    simplified: `Tap the ${c.type} with a consonant letter (not A, E, I, O, U).`,
  },
]);

export const STEP_RULE_BY_ID: Record<StepRuleId, StepRule> = Object.fromEntries(
  STEP_RULES.map((r) => [r.id, r]),
) as Record<StepRuleId, StepRule>;

/* ------------------------------------------------------------------ */
/* Service models: each model is an ordered sequence of distinct step   */
/* rules, printed as a static table in the manual. Per-seed variation   */
/* lives entirely in WHICH model the panel names and WHICH controls it  */
/* carries — the tables never change.                                   */
/* ------------------------------------------------------------------ */

export interface ServiceModel {
  id: string;
  /** printed across the top of the panel, e.g. "SERVICE MODEL C" */
  name: string;
  difficulty: Difficulty;
  steps: readonly StepRuleId[];
}

export const MODELS: readonly ServiceModel[] = [
  {
    id: 'model-a',
    name: 'SERVICE MODEL A',
    difficulty: 1,
    steps: ['dial-vowel', 'toggle-consonant', 'valve-vowel'],
  },
  {
    id: 'model-b',
    name: 'SERVICE MODEL B',
    difficulty: 1,
    steps: ['toggle-vowel', 'dial-consonant', 'lever-vowel'],
  },
  {
    id: 'model-c',
    name: 'SERVICE MODEL C',
    difficulty: 2,
    steps: ['dial-consonant', 'valve-vowel', 'toggle-consonant', 'lever-consonant'],
  },
  {
    id: 'model-d',
    name: 'SERVICE MODEL D',
    difficulty: 2,
    steps: ['valve-consonant', 'dial-vowel', 'lever-vowel', 'toggle-vowel'],
  },
  {
    id: 'model-e',
    name: 'SERVICE MODEL E',
    difficulty: 3,
    steps: ['toggle-consonant', 'dial-vowel', 'valve-consonant', 'lever-vowel', 'dial-consonant'],
  },
  {
    id: 'model-f',
    name: 'SERVICE MODEL F',
    difficulty: 3,
    steps: ['lever-consonant', 'valve-vowel', 'toggle-vowel', 'dial-consonant', 'valve-consonant'],
  },
];

export const MODELS_BY_DIFFICULTY: Record<Difficulty, readonly ServiceModel[]> = {
  1: MODELS.filter((m) => m.difficulty === 1),
  2: MODELS.filter((m) => m.difficulty === 2),
  3: MODELS.filter((m) => m.difficulty === 3),
};

export function modelById(id: string): ServiceModel {
  const model = MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown service model: ${id}`);
  return model;
}

/* ------------------------------------------------------------------ */
/* The bad-intel exception — the rule that makes the module.            */
/* ------------------------------------------------------------------ */

/** Printed label on the challenge button; manual and aria text match it. */
export const FLAG_LABEL = 'FLAG BAD INTEL';

export const BAD_INTEL_RULE = {
  standard:
    'These sequences were printed before the op — panels drift in the field. If a step names ' +
    'hardware this panel simply does not have (no control of that type carries that kind of tag ' +
    'letter), the step is BAD INTEL. The Agent presses FLAG BAD INTEL and the pair skips to the ' +
    'next step. Tapping any control on a bad step is a wrong answer — and so is flagging a step ' +
    'the panel can actually satisfy.',
  simplified:
    'This book was printed before the mission. Panels change. If a step asks for a control the ' +
    'panel does not have, that step is BAD INTEL. The Agent presses FLAG BAD INTEL. Then skip to ' +
    'the next step. Do not tap anything on a bad step. Do not flag a good step.',
} as const;

/**
 * Per-tier reminders about drift. Rookie handlers get the full warning;
 * Mastermind handlers get no reminder at all — spotting the impossible step
 * unprompted is the point (the subtlety lever).
 */
export interface TierNote {
  tone: 'warning' | 'tip';
  standard: string;
  simplified: string;
}

export const TIER_NOTES: Record<Difficulty, TierNote | null> = {
  1: {
    tone: 'warning',
    standard:
      'Rookie panels always drift: exactly one step in the sequence will be bad intel. It is ' +
      'never the same one twice — make the Agent prove each step before anyone taps.',
    simplified: 'One step will always be bad. Check every step before you tap.',
  },
  2: {
    tone: 'tip',
    standard:
      'Panels at this tier drift too. A step the panel cannot satisfy must be flagged — never forced.',
    simplified: 'Watch out. A step can still be bad.',
  },
  3: null,
};

/* ------------------------------------------------------------------ */
/* Panel dressing.                                                      */
/* ------------------------------------------------------------------ */

/** Setting numbers are flavor for describing — they never decide a step. */
export const SETTING_MIN = 1;
export const SETTING_MAX = 8;

/** Decoy controls added per panel (Rookie always gets 2 so panels stay 4+). */
export const DECOY_RANGE: Record<Difficulty, readonly [number, number]> = {
  1: [2, 2],
  2: [1, 2],
  3: [1, 2],
};
