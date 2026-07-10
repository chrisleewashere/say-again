/**
 * Turns id-check rule data into manual prose. The manual generator calls
 * these, so printed rules always match the engine — never write rule prose
 * by hand.
 */
import { CHECKLISTS, type AttrKey, type Atom, type EliminationRule, type Suspect } from './rules';

export type Edition = 'standard' | 'simplified';

type Words = { standard: string; simplified: string };

/** Attribute names, used as glossary row headers and in questions. */
const ATTR_LABEL: Record<AttrKey, Words> = {
  headwear: { standard: 'Headwear', simplified: 'Hat' },
  glasses: { standard: 'Glasses', simplified: 'Glasses' },
  hair: { standard: 'Hair', simplified: 'Hair' },
  accessory: { standard: 'Accessory', simplified: 'Extra item' },
  shirt: { standard: 'Shirt pattern', simplified: 'Shirt' },
};

/** Noun labels for every attribute value, used in the glossary and card descriptions. */
const VALUE_LABEL: Record<AttrKey, Record<string, Words>> = {
  headwear: {
    none: { standard: 'no headwear', simplified: 'no hat' },
    beanie: { standard: 'beanie', simplified: 'beanie' },
    cap: { standard: 'cap', simplified: 'cap' },
  },
  glasses: {
    none: { standard: 'no glasses', simplified: 'no glasses' },
    round: { standard: 'round glasses', simplified: 'round glasses' },
    square: { standard: 'square glasses', simplified: 'square glasses' },
  },
  hair: {
    short: { standard: 'short hair', simplified: 'short hair' },
    long: { standard: 'long hair', simplified: 'long hair' },
    curly: { standard: 'curly hair', simplified: 'curly hair' },
  },
  accessory: {
    none: { standard: 'no accessory', simplified: 'no extra item' },
    scarf: { standard: 'scarf', simplified: 'scarf' },
    badge: { standard: 'star badge', simplified: 'star badge' },
    bowtie: { standard: 'bow tie', simplified: 'bow tie' },
  },
  shirt: {
    plain: { standard: 'plain shirt', simplified: 'plain shirt' },
    striped: { standard: 'striped shirt', simplified: 'striped shirt' },
    spotted: { standard: 'spotted shirt', simplified: 'shirt with spots' },
  },
};

export function attrLabel(attr: AttrKey, ed: Edition): string {
  return ATTR_LABEL[attr][ed];
}

export function valueLabel(attr: AttrKey, value: string, ed: Edition): string {
  const w = VALUE_LABEL[attr][value];
  if (!w) throw new Error(`id-check prose: no label for ${attr}=${value}`);
  return w[ed];
}

/** Phrase describing a suspect who matches one atom, e.g. "wearing a cap". */
export function atomToText(atom: Atom, ed: Edition): string {
  const s = ed === 'standard';
  if (atom.t === 'wearsAny') {
    switch (atom.attr) {
      case 'headwear':
        return s ? 'wearing any headwear (a beanie or a cap)' : 'wearing a hat (beanie or cap)';
      case 'glasses':
        return s ? 'wearing glasses of any shape' : 'wearing glasses';
      case 'accessory':
        return s
          ? 'wearing any accessory (scarf, star badge, or bow tie)'
          : 'wearing a scarf, a star badge, or a bow tie';
    }
  }
  switch (atom.attr) {
    case 'headwear':
      return atom.value === 'none'
        ? s ? 'with nothing on their head' : 'with no hat'
        : `wearing a ${valueLabel('headwear', atom.value, ed)}`;
    case 'glasses':
      return atom.value === 'none'
        ? s ? 'not wearing glasses' : 'with no glasses'
        : `wearing ${valueLabel('glasses', atom.value, ed)}`;
    case 'hair':
      return s ? `with ${valueLabel('hair', atom.value, ed)}` : `who has ${valueLabel('hair', atom.value, ed)}`;
    case 'accessory':
      return atom.value === 'none'
        ? s ? 'with no accessory' : 'with no extra item'
        : `wearing a ${valueLabel('accessory', atom.value, ed)}`;
    case 'shirt':
      return atom.value === 'spotted' && !s
        ? 'with spots on their shirt'
        : s
          ? `in a ${valueLabel('shirt', atom.value, ed)}`
          : `with a ${valueLabel('shirt', atom.value, ed)}`;
  }
}

const NUMBER_WORD: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };

/** Render one checklist step to prose. */
export function ruleToText(rule: EliminationRule, ed: Edition): string {
  const s = ed === 'standard';
  if (rule.kind === 'eliminate') {
    const parts = rule.atoms.map((a) => atomToText(a, ed));
    if (parts.length === 1) return `Cross out anyone ${parts[0]}.`;
    return s
      ? `Cross out anyone ${parts.join(' AND ')}.`
      : `Cross out anyone ${parts.join(' and also ')}.`;
  }
  const n = NUMBER_WORD[rule.minRemaining] ?? String(rule.minRemaining);
  const p = rule.refPosition;
  return s
    ? `If ${n} or more suspects remain, check the shirt printed on suspect ${p}'s portrait ` +
        `(even if suspect ${p} is crossed out) and cross out every OTHER suspect with that same shirt pattern.`
    : `Are ${n} or more people left? Look at the shirt on portrait ${p}. ` +
        `(Do this even if person ${p} is crossed out.) Cross out each OTHER person who has that same shirt. Never cross out person ${p} in this step.`;
}

/** Render a full checklist (keyed by lineup size) to ordered prose steps. */
export function checklistText(lineupSize: number, ed: Edition): string[] {
  const rules = CHECKLISTS[lineupSize];
  if (!rules) throw new Error(`id-check prose: no checklist for ${lineupSize} suspects`);
  return rules.map((r) => ruleToText(r, ed));
}

/**
 * Full spoken-style description of one portrait, listing every attribute.
 * Used for the on-screen aria-labels so a described lineup matches the
 * glossary vocabulary in the printed manual.
 */
export function suspectDescription(s: Suspect, ed: Edition = 'standard'): string {
  return [
    valueLabel('headwear', s.headwear, ed),
    valueLabel('glasses', s.glasses, ed),
    valueLabel('hair', s.hair, ed),
    valueLabel('accessory', s.accessory, ed),
    valueLabel('shirt', s.shirt, ed),
  ].join(', ');
}
