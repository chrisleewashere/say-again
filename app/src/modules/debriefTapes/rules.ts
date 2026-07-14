/**
 * Debrief Tapes — rule tables.
 *
 * Narrative assembly: the Agent sees shuffled surveillance stills from a
 * completed operation; the Handler's manual holds the mission-report
 * template (story-grammar slots in canonical order) and the marker rules
 * that identify which still fills which slot. Both the app solver and the
 * printed manual are generated from THIS data.
 *
 * Evidence base: narrative intervention is the best-verified adolescent
 * language target (Joffe et al. 2019; Spencer & Petersen 2020), and
 * controlled, pre-structured story content is recommended practice — which
 * is exactly what seeded generation from these tables produces.
 */
import type { Difficulty } from '../../engine/types';

/* ------------------------------------------------------------------ */
/* Story grammar slots.                                                */
/* ------------------------------------------------------------------ */

export type StorySlot = 'opening' | 'incident' | 'plan' | 'attempt' | 'complication' | 'outcome';

/** Canonical report order — the mission report always reads this way. */
export const SLOT_ORDER: readonly StorySlot[] = [
  'opening',
  'incident',
  'plan',
  'attempt',
  'complication',
  'outcome',
];

/** Which slots appear per difficulty (always in SLOT_ORDER order). */
export const SLOTS_BY_DIFFICULTY: Record<Difficulty, readonly StorySlot[]> = {
  1: ['opening', 'incident', 'attempt', 'outcome'],
  2: ['opening', 'incident', 'plan', 'attempt', 'outcome'],
  3: ['opening', 'incident', 'plan', 'attempt', 'complication', 'outcome'],
};

/**
 * Marker rules: every still carries exactly one corner marker (the opening
 * carries none) that identifies its report slot. Markers are shapes, never
 * colors, and each has a printable name so the pair can talk about them.
 */
export interface SlotMarkerRule {
  slot: StorySlot;
  marker: 'none' | 'alert' | 'thought' | 'motion' | 'break' | 'seal';
  markerName: string;
  /** what the card shows / how the Handler identifies it — standard edition */
  standard: string;
  /** easy-read edition */
  simplified: string;
  /** report-slot label used in the manual's template */
  slotLabel: string;
}

export const SLOT_MARKER_RULES: readonly SlotMarkerRule[] = [
  {
    slot: 'opening',
    marker: 'none',
    markerName: 'no marker',
    standard: 'No corner marker at all — just the operative in a place. This is where the operation begins.',
    simplified: 'No small symbol in the corner. Just the person in a place.',
    slotLabel: 'THE OPENING — who and where',
  },
  {
    slot: 'incident',
    marker: 'alert',
    markerName: 'the alert bolt',
    standard: 'A jagged alert bolt in the corner — something unexpected has just happened.',
    simplified: 'A zigzag bolt in the corner. Something just happened!',
    slotLabel: 'THE INCIDENT — what went wrong',
  },
  {
    slot: 'plan',
    marker: 'thought',
    markerName: 'the thought bubble',
    standard: 'A thought bubble in the corner — the operative is deciding what to do about it.',
    simplified: 'A thought bubble. The person is making a plan.',
    slotLabel: 'THE PLAN — what they decided to do',
  },
  {
    slot: 'attempt',
    marker: 'motion',
    markerName: 'the motion arrows',
    standard: 'Double motion arrows in the corner — the operative is carrying out the plan.',
    simplified: 'Two arrows. The person is doing the plan.',
    slotLabel: 'THE ATTEMPT — what they did',
  },
  {
    slot: 'complication',
    marker: 'break',
    markerName: 'the crack',
    standard: 'A crack symbol in the corner — the plan has hit trouble mid-attempt.',
    simplified: 'A crack symbol. The plan hit trouble.',
    slotLabel: 'THE COMPLICATION — the trouble on the way',
  },
  {
    slot: 'outcome',
    marker: 'seal',
    markerName: 'the case seal',
    standard: 'A round case seal in the corner — the operation is over. A check inside means it worked; a dash means it did not.',
    simplified: 'A round seal. The story is over. Check = it worked. Dash = it did not.',
    slotLabel: 'THE OUTCOME — how it ended',
  },
];

export const MARKER_BY_SLOT: Record<StorySlot, SlotMarkerRule> = Object.fromEntries(
  SLOT_MARKER_RULES.map((r) => [r.slot, r]),
) as Record<StorySlot, SlotMarkerRule>;

/* ------------------------------------------------------------------ */
/* Connectives — the words that link consecutive report entries.       */
/* ------------------------------------------------------------------ */

export type Connective = 'then' | 'so' | 'but';

export interface LinkRule {
  from: StorySlot;
  to: StorySlot;
  connective: Connective;
  standard: string;
  simplified: string;
}

/**
 * One rule per consecutive slot pair that can occur. 'so' = the second part
 * happens BECAUSE of the first; 'then' = it simply comes next; 'but' = it
 * gets in the way.
 */
export const LINK_RULES: readonly LinkRule[] = [
  {
    from: 'opening',
    to: 'incident',
    connective: 'then',
    standard: 'Opening → Incident: the incident simply comes next. Link with THEN.',
    simplified: 'Opening to Incident: say THEN.',
  },
  {
    from: 'incident',
    to: 'plan',
    connective: 'so',
    standard: 'Incident → Plan: the plan happens BECAUSE of the incident. Link with SO.',
    simplified: 'Incident to Plan: say SO.',
  },
  {
    from: 'incident',
    to: 'attempt',
    connective: 'so',
    standard: 'Incident → Attempt (no plan card): the action happens BECAUSE of the incident. Link with SO.',
    simplified: 'Incident to Attempt: say SO.',
  },
  {
    from: 'plan',
    to: 'attempt',
    connective: 'then',
    standard: 'Plan → Attempt: the attempt simply carries the plan out next. Link with THEN.',
    simplified: 'Plan to Attempt: say THEN.',
  },
  {
    from: 'attempt',
    to: 'complication',
    connective: 'but',
    standard: 'Attempt → Complication: the trouble gets in the way. Link with BUT.',
    simplified: 'Attempt to Complication: say BUT.',
  },
  {
    from: 'complication',
    to: 'outcome',
    connective: 'so',
    standard: 'Complication → Outcome: the ending happens BECAUSE of the trouble. Link with SO.',
    simplified: 'Complication to Outcome: say SO.',
  },
  {
    from: 'attempt',
    to: 'outcome',
    connective: 'so',
    standard: 'Attempt → Outcome (no complication card): the ending happens BECAUSE of the attempt. Link with SO.',
    simplified: 'Attempt to Outcome: say SO.',
  },
];

export const CONNECTIVES: readonly Connective[] = ['then', 'so', 'but'];

export function linkFor(from: StorySlot, to: StorySlot): Connective {
  const rule = LINK_RULES.find((r) => r.from === from && r.to === to);
  if (!rule) throw new Error(`No link rule for ${from} -> ${to}`);
  return rule.connective;
}

/* ------------------------------------------------------------------ */
/* Story surface content: operatives and settings (visual + name).     */
/* All describable without color; accessories are shapes.              */
/* ------------------------------------------------------------------ */

export interface Operative {
  id: string;
  label: string;
  /** distinguishing accessory, drawable and describable */
  accessory: 'satchel' | 'umbrella' | 'camera' | 'flatcap' | 'scarf';
  accessoryName: string;
}

export const OPERATIVES: readonly Operative[] = [
  { id: 'courier', label: 'the courier', accessory: 'satchel', accessoryName: 'a shoulder satchel' },
  { id: 'lookout', label: 'the lookout', accessory: 'umbrella', accessoryName: 'an umbrella' },
  { id: 'archivist', label: 'the archivist', accessory: 'camera', accessoryName: 'a camera on a strap' },
  { id: 'driver', label: 'the driver', accessory: 'flatcap', accessoryName: 'a flat cap' },
  { id: 'contact', label: 'the contact', accessory: 'scarf', accessoryName: 'a long scarf' },
];

export interface Setting {
  id: string;
  label: string;
  /** landmark glyph drawn behind the operative */
  glyph: 'clock' | 'arch' | 'crane' | 'lamp' | 'stairs' | 'antenna';
  glyphName: string;
}

export const SETTINGS: readonly Setting[] = [
  { id: 'station', label: 'the rail station', glyph: 'clock', glyphName: 'a big station clock' },
  { id: 'gallery', label: 'the gallery', glyph: 'arch', glyphName: 'an arched doorway' },
  { id: 'docks', label: 'the docks', glyph: 'crane', glyphName: 'a loading crane' },
  { id: 'plaza', label: 'the night plaza', glyph: 'lamp', glyphName: 'a street lamp' },
  { id: 'archive', label: 'the old archive', glyph: 'stairs', glyphName: 'a grand staircase' },
  { id: 'rooftop', label: 'the rooftop', glyph: 'antenna', glyphName: 'a radio antenna' },
];

/** Reference letters stamped on the stills — names for cards, never order. */
export const CARD_LETTERS: readonly string[] = ['K', 'R', 'V', 'T', 'N', 'L', 'P', 'Z'];
