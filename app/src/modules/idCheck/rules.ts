/**
 * Spot the Contact (id-check) — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables.
 *
 * Original game content. No attribute is encoded by color alone: every
 * attribute is a distinct drawn SHAPE (hat silhouette, glasses frame shape,
 * hair shape, accessory shape, shirt pattern), every portrait carries a
 * printed position number, and the manual glossary names each shape.
 */

export const HEADWEAR = ['none', 'beanie', 'cap'] as const;
export type Headwear = (typeof HEADWEAR)[number];

export const GLASSES = ['none', 'round', 'square'] as const;
export type Glasses = (typeof GLASSES)[number];

export const HAIR = ['short', 'long', 'curly'] as const;
export type Hair = (typeof HAIR)[number];

export const ACCESSORY = ['none', 'scarf', 'badge', 'bowtie'] as const;
export type Accessory = (typeof ACCESSORY)[number];

export const SHIRT = ['plain', 'striped', 'spotted'] as const;
export type Shirt = (typeof SHIRT)[number];

/** One portrait in the lineup. Positions are printed and never renumber. */
export interface Suspect {
  headwear: Headwear;
  glasses: Glasses;
  hair: Hair;
  accessory: Accessory;
  shirt: Shirt;
}

export type AttrKey = keyof Suspect;

export const ATTR_KEYS: readonly AttrKey[] = ['headwear', 'glasses', 'hair', 'accessory', 'shirt'];

export const ATTR_VALUES: Record<AttrKey, readonly string[]> = {
  headwear: HEADWEAR,
  glasses: GLASSES,
  hair: HAIR,
  accessory: ACCESSORY,
  shirt: SHIRT,
};

/**
 * An atom is one describable test on a single suspect. Atoms in a rule are
 * combined with AND. `wearsAny` means the attribute is anything except 'none'
 * (only meaningful for attributes with a 'none' option).
 */
export type Atom =
  | { t: 'is'; attr: 'headwear'; value: Headwear }
  | { t: 'is'; attr: 'glasses'; value: Glasses }
  | { t: 'is'; attr: 'hair'; value: Hair }
  | { t: 'is'; attr: 'accessory'; value: Accessory }
  | { t: 'is'; attr: 'shirt'; value: Shirt }
  | { t: 'wearsAny'; attr: 'headwear' | 'glasses' | 'accessory' };

/**
 * Checklist steps, worked strictly in order. `eliminate` crosses out every
 * remaining suspect matching ALL atoms. `eliminateSameShirt` is a relative
 * step: if at least `minRemaining` suspects are still in when the step is
 * reached, read the shirt pattern printed on the portrait at `refPosition`
 * (whether or not that suspect is crossed out) and cross out every OTHER
 * remaining suspect with that same shirt pattern.
 */
export type EliminationRule =
  | { kind: 'eliminate'; atoms: Atom[] }
  | { kind: 'eliminateSameShirt'; refPosition: number; minRemaining: number };

/**
 * Checklists keyed by lineup size (which is what the Handler can ask about):
 * 4 suspects = Rookie, 5 = Agent, 6 = Mastermind. Working the whole list on
 * any generated lineup leaves exactly one suspect — the contact (verified by
 * property tests across thousands of seeds).
 */
export const CHECKLISTS: Record<number, EliminationRule[]> = {
  4: [
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'headwear', value: 'cap' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'accessory', value: 'scarf' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'shirt', value: 'striped' }] },
  ],
  5: [
    { kind: 'eliminate', atoms: [{ t: 'wearsAny', attr: 'headwear' }, { t: 'wearsAny', attr: 'glasses' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'hair', value: 'curly' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'shirt', value: 'spotted' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'accessory', value: 'badge' }] },
  ],
  6: [
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'headwear', value: 'beanie' }, { t: 'wearsAny', attr: 'glasses' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'hair', value: 'long' }] },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'accessory', value: 'bowtie' }] },
    { kind: 'eliminateSameShirt', refPosition: 1, minRemaining: 2 },
    { kind: 'eliminate', atoms: [{ t: 'is', attr: 'glasses', value: 'square' }] },
  ],
};

/** Lineup size per difficulty. */
export const LINEUP_SIZE: Record<1 | 2 | 3, number> = { 1: 4, 2: 5, 3: 6 };
