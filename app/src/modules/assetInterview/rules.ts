/**
 * Asset Interview — rule tables.
 *
 * Two-way information gap: the Agent's screen shows a WITNESS STATEMENT
 * (an interview form letter plus five observed facts); the Handler's
 * printed manual holds each form's numbered QUESTION FLOW — a small
 * decision tree that ends in a verdict. The Handler cannot see the facts;
 * the Agent cannot see which facts matter or in what order to reveal them.
 * Both the app solver and the printed manual are generated from THIS data.
 *
 * Evidence base: requesting and supplying exactly the information asked
 * for is a core pragmatics/repair target for adolescents; barrier tasks
 * with a genuine two-way gap force the exchange to be verbal.
 */
import type { Difficulty } from '../../engine/types';

/* ------------------------------------------------------------------ */
/* Fields — the five observed facts on every witness statement.        */
/* ------------------------------------------------------------------ */

export type FieldId = 'time' | 'place' | 'carrying' | 'company' | 'chalk';

/** Icon keys are SHAPES — information is never carried by color alone. */
export type FactIcon =
  | 'dawn'
  | 'noon'
  | 'dusk'
  | 'night'
  | 'tram'
  | 'cafe'
  | 'bridge'
  | 'kiosk'
  | 'case'
  | 'newspaper'
  | 'flowers'
  | 'nothing'
  | 'alone'
  | 'companion'
  | 'chalkYes'
  | 'chalkNo';

export interface FieldValue {
  id: string;
  /** statement-row text — exactly what the Agent reads aloud */
  label: string;
  icon: FactIcon;
}

export interface FieldRule {
  id: FieldId;
  /** row label on the statement card, e.g. "Time of day" */
  label: string;
  /** the Handler's question — standard edition */
  standard: string;
  /** easy-read edition */
  simplified: string;
  values: readonly FieldValue[];
}

export const FIELD_RULES: readonly FieldRule[] = [
  {
    id: 'time',
    label: 'Time of day',
    standard: 'Ask: what time of day was it?',
    simplified: 'Ask: what time was it?',
    values: [
      { id: 'dawn', label: 'dawn', icon: 'dawn' },
      { id: 'noon', label: 'noon', icon: 'noon' },
      { id: 'dusk', label: 'dusk', icon: 'dusk' },
      { id: 'night', label: 'night', icon: 'night' },
    ],
  },
  {
    id: 'place',
    label: 'Place',
    standard: 'Ask: where did the meeting happen?',
    simplified: 'Ask: where were they?',
    values: [
      { id: 'tram', label: 'the tram stop', icon: 'tram' },
      { id: 'cafe', label: 'the cafe', icon: 'cafe' },
      { id: 'bridge', label: 'the bridge', icon: 'bridge' },
      { id: 'kiosk', label: 'the kiosk', icon: 'kiosk' },
    ],
  },
  {
    id: 'carrying',
    label: 'Carrying',
    standard: 'Ask: what were they carrying?',
    simplified: 'Ask: what did they carry?',
    values: [
      { id: 'case', label: 'a case', icon: 'case' },
      { id: 'newspaper', label: 'a newspaper', icon: 'newspaper' },
      { id: 'flowers', label: 'flowers', icon: 'flowers' },
      { id: 'nothing', label: 'nothing', icon: 'nothing' },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    standard: 'Ask: were they alone or with a companion?',
    simplified: 'Ask: were they alone?',
    values: [
      { id: 'alone', label: 'alone', icon: 'alone' },
      { id: 'companion', label: 'with a companion', icon: 'companion' },
    ],
  },
  {
    id: 'chalk',
    label: 'Chalk mark seen',
    standard: 'Ask: was a chalk mark seen nearby?',
    simplified: 'Ask: was there a chalk mark?',
    values: [
      { id: 'yes', label: 'yes', icon: 'chalkYes' },
      { id: 'no', label: 'no', icon: 'chalkNo' },
    ],
  },
];

export const FIELD_BY_ID: Record<FieldId, FieldRule> = Object.fromEntries(
  FIELD_RULES.map((f) => [f.id, f]),
) as Record<FieldId, FieldRule>;

/** The Agent's answer sheet: one chosen value id per field. */
export type Facts = Record<FieldId, string>;

/* ------------------------------------------------------------------ */
/* Verdicts — the six possible outcomes of every interview.            */
/* ------------------------------------------------------------------ */

export type VerdictId = 'genuine' | 'double' | 'courier' | 'bystander' | 'scout' | 'watcher';

/** Distinct badge SHAPES so verdicts are never color-coded. */
export type VerdictIcon = 'star' | 'splitDiamond' | 'envelope' | 'ring' | 'flag' | 'eye';

export interface VerdictRule {
  id: VerdictId;
  label: string;
  icon: VerdictIcon;
  /** printable badge name so the pair can talk about the buttons */
  iconName: string;
  /** one-line dossier note — standard edition */
  standard: string;
  /** easy-read edition */
  simplified: string;
}

export const VERDICTS: readonly VerdictRule[] = [
  {
    id: 'genuine',
    label: 'genuine contact',
    icon: 'star',
    iconName: 'the star badge',
    standard: 'The real rendezvous. Proceed with the exchange.',
    simplified: 'The right person. Safe to meet.',
  },
  {
    id: 'double',
    label: 'double agent',
    icon: 'splitDiamond',
    iconName: 'the split diamond',
    standard: 'Working both sides of the street. Break contact and report in.',
    simplified: 'They work for both sides. Walk away.',
  },
  {
    id: 'courier',
    label: 'courier for the other side',
    icon: 'envelope',
    iconName: 'the envelope',
    standard: "Carrying the other side's messages. Do not engage.",
    simplified: "They carry the other side's mail. Do not talk to them.",
  },
  {
    id: 'bystander',
    label: 'innocent bystander',
    icon: 'ring',
    iconName: 'the open ring',
    standard: 'A passer-by with no part in this. No action needed.',
    simplified: 'Just a normal person. Do nothing.',
  },
  {
    id: 'scout',
    label: 'talent scout',
    icon: 'flag',
    iconName: 'the flag',
    standard: 'Recruiting new eyes for a rival network. Note the face and keep moving.',
    simplified: 'They look for new spies. Remember their face. Keep walking.',
  },
  {
    id: 'watcher',
    label: 'street watcher',
    icon: 'eye',
    iconName: 'the eye',
    standard: 'Paid to watch the block and report movement. Vary your route.',
    simplified: 'They watch the street. Take a new path next time.',
  },
];

export const VERDICT_BY_ID: Record<VerdictId, VerdictRule> = Object.fromEntries(
  VERDICTS.map((v) => [v.id, v]),
) as Record<VerdictId, VerdictRule>;

/* ------------------------------------------------------------------ */
/* Forms — six question flows (decision trees), two per difficulty.    */
/* Every node asks one field; its branches cover EVERY value of that   */
/* field exactly once, so every flow is total over the fact space.     */
/* goTo indices are 0-based and strictly forward, so flows always      */
/* terminate. In the printed manual, step N is node index N-1.         */
/* ------------------------------------------------------------------ */

export type FormId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface FlowBranch {
  /** matched value ids of the asked field */
  values: readonly string[];
  /** 0-based index of the next node — exactly one of goTo / verdict is set */
  goTo?: number;
  verdict?: VerdictId;
}

export interface FlowNode {
  ask: FieldId;
  branches: readonly FlowBranch[];
}

export interface FormRule {
  id: FormId;
  difficulty: Difficulty;
  nodes: readonly FlowNode[];
}

export const FORMS: readonly FormRule[] = [
  {
    id: 'A',
    difficulty: 1,
    nodes: [
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], goTo: 1 },
          { values: ['no'], goTo: 2 },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['alone'], verdict: 'genuine' },
          { values: ['companion'], verdict: 'double' },
        ],
      },
      {
        ask: 'carrying',
        branches: [
          { values: ['case'], verdict: 'courier' },
          { values: ['newspaper'], verdict: 'watcher' },
          { values: ['flowers'], verdict: 'scout' },
          { values: ['nothing'], verdict: 'bystander' },
        ],
      },
    ],
  },
  {
    id: 'B',
    difficulty: 1,
    nodes: [
      {
        ask: 'place',
        branches: [
          { values: ['bridge', 'tram'], goTo: 1 },
          { values: ['cafe', 'kiosk'], goTo: 2 },
        ],
      },
      {
        ask: 'time',
        branches: [
          { values: ['night'], verdict: 'watcher' },
          { values: ['dawn'], verdict: 'courier' },
          { values: ['noon', 'dusk'], verdict: 'bystander' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], verdict: 'genuine' },
          { values: ['no'], verdict: 'scout' },
        ],
      },
    ],
  },
  {
    id: 'C',
    difficulty: 2,
    nodes: [
      {
        ask: 'time',
        branches: [
          { values: ['night'], goTo: 1 },
          { values: ['dawn', 'dusk'], goTo: 2 },
          { values: ['noon'], verdict: 'bystander' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], goTo: 3 },
          { values: ['no'], verdict: 'watcher' },
        ],
      },
      {
        ask: 'carrying',
        branches: [
          { values: ['flowers'], verdict: 'scout' },
          { values: ['case'], goTo: 4 },
          { values: ['newspaper', 'nothing'], verdict: 'bystander' },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['alone'], verdict: 'genuine' },
          { values: ['companion'], verdict: 'double' },
        ],
      },
      {
        ask: 'place',
        branches: [
          { values: ['bridge'], verdict: 'courier' },
          { values: ['tram', 'cafe', 'kiosk'], verdict: 'watcher' },
        ],
      },
    ],
  },
  {
    id: 'D',
    difficulty: 2,
    nodes: [
      {
        ask: 'carrying',
        branches: [
          { values: ['case'], goTo: 1 },
          { values: ['newspaper'], goTo: 2 },
          { values: ['flowers'], verdict: 'scout' },
          { values: ['nothing'], goTo: 3 },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], goTo: 4 },
          { values: ['no'], verdict: 'courier' },
        ],
      },
      {
        ask: 'time',
        branches: [
          { values: ['noon'], verdict: 'bystander' },
          { values: ['dusk', 'night'], verdict: 'watcher' },
          { values: ['dawn'], verdict: 'courier' },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['alone'], verdict: 'bystander' },
          { values: ['companion'], goTo: 5 },
        ],
      },
      {
        ask: 'place',
        branches: [
          { values: ['kiosk'], verdict: 'genuine' },
          { values: ['tram', 'cafe', 'bridge'], verdict: 'double' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], verdict: 'double' },
          { values: ['no'], verdict: 'bystander' },
        ],
      },
    ],
  },
  {
    id: 'E',
    difficulty: 3,
    nodes: [
      {
        ask: 'place',
        branches: [
          { values: ['bridge'], goTo: 1 },
          { values: ['tram'], goTo: 2 },
          { values: ['cafe', 'kiosk'], goTo: 3 },
        ],
      },
      {
        ask: 'time',
        branches: [
          { values: ['night'], goTo: 4 },
          { values: ['dawn', 'noon', 'dusk'], goTo: 5 },
        ],
      },
      {
        ask: 'carrying',
        branches: [
          { values: ['case'], goTo: 4 },
          { values: ['newspaper'], verdict: 'watcher' },
          { values: ['flowers', 'nothing'], goTo: 6 },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], goTo: 6 },
          { values: ['no'], verdict: 'bystander' },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['alone'], goTo: 7 },
          { values: ['companion'], verdict: 'double' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], verdict: 'courier' },
          { values: ['no'], verdict: 'bystander' },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['companion'], verdict: 'scout' },
          { values: ['alone'], verdict: 'watcher' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], verdict: 'genuine' },
          { values: ['no'], verdict: 'courier' },
        ],
      },
    ],
  },
  {
    id: 'F',
    difficulty: 3,
    nodes: [
      {
        ask: 'time',
        branches: [
          { values: ['dusk', 'night'], goTo: 1 },
          { values: ['dawn'], goTo: 2 },
          { values: ['noon'], goTo: 3 },
        ],
      },
      {
        ask: 'carrying',
        branches: [
          { values: ['case'], goTo: 4 },
          { values: ['flowers'], goTo: 5 },
          { values: ['newspaper', 'nothing'], goTo: 3 },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['alone'], goTo: 6 },
          { values: ['companion'], verdict: 'scout' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], goTo: 5 },
          { values: ['no'], verdict: 'bystander' },
        ],
      },
      {
        ask: 'chalk',
        branches: [
          { values: ['yes'], goTo: 7 },
          { values: ['no'], verdict: 'courier' },
        ],
      },
      {
        ask: 'company',
        branches: [
          { values: ['companion'], verdict: 'double' },
          { values: ['alone'], verdict: 'watcher' },
        ],
      },
      {
        ask: 'carrying',
        branches: [
          { values: ['newspaper'], verdict: 'watcher' },
          { values: ['nothing'], verdict: 'bystander' },
          { values: ['case', 'flowers'], goTo: 7 },
        ],
      },
      {
        ask: 'place',
        branches: [
          { values: ['kiosk', 'cafe'], verdict: 'genuine' },
          { values: ['bridge'], verdict: 'double' },
          { values: ['tram'], verdict: 'courier' },
        ],
      },
    ],
  },
];

export const FORM_BY_ID: Record<FormId, FormRule> = Object.fromEntries(
  FORMS.map((f) => [f.id, f]),
) as Record<FormId, FormRule>;

export const FORMS_BY_DIFFICULTY: Record<Difficulty, readonly FormRule[]> = {
  1: FORMS.filter((f) => f.difficulty === 1),
  2: FORMS.filter((f) => f.difficulty === 2),
  3: FORMS.filter((f) => f.difficulty === 3),
};

/** Design depth (max questions asked on any path) per difficulty. */
export const FLOW_DEPTH: Record<Difficulty, number> = { 1: 2, 2: 3, 3: 4 };

/** Max root-to-leaf question count of a form (flows are forward-only DAGs). */
export function formDepth(form: FormRule): number {
  const depthFrom = (index: number): number => {
    const node = form.nodes[index];
    let deepest = 0;
    for (const branch of node.branches) {
      if (branch.goTo !== undefined) deepest = Math.max(deepest, depthFrom(branch.goTo));
    }
    return 1 + deepest;
  };
  return depthFrom(0);
}
