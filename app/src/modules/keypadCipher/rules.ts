/**
 * Code Room (keypad cipher) — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables.
 *
 * Original game content: every word list below is an original curation of
 * common English words. Each word appears in exactly ONE category table
 * (property-tested). Information is never carried by color alone — keys show
 * printed words, and locked keys show a printed rank number plus a check mark.
 */

/** Fixed master priority order. Index 0 = pressed first. */
export const CATEGORY_PRIORITY = [
  'animals',
  'tools',
  'food',
  'clothing',
  'vehicles',
  'weather',
  'school-supplies',
  'feelings',
] as const;

export type CategoryId = (typeof CATEGORY_PRIORITY)[number];

export interface CategoryWord {
  word: string;
  /**
   * Word tier: 1 = concrete everyday word (all difficulties);
   * 3 = less-frequent / more abstract word (Mastermind only).
   */
  tier: 1 | 3;
  /** One-word hint printed next to tier-3 words in the simplified manual. */
  gloss?: string;
}

export interface Category {
  id: CategoryId;
  /** Table name per manual edition. */
  name: { standard: string; simplified: string };
  words: CategoryWord[];
}

/** Categories listed in master priority order (index = rank - 1). */
export const CATEGORIES: readonly Category[] = [
  {
    id: 'animals',
    name: { standard: 'Animals', simplified: 'Animals' },
    words: [
      { word: 'badger', tier: 1 },
      { word: 'camel', tier: 1 },
      { word: 'dolphin', tier: 1 },
      { word: 'ferret', tier: 1 },
      { word: 'gecko', tier: 1 },
      { word: 'koala', tier: 1 },
      { word: 'moose', tier: 1 },
      { word: 'otter', tier: 1 },
      { word: 'panda', tier: 1 },
      { word: 'raccoon', tier: 1 },
      { word: 'heron', tier: 3, gloss: 'bird' },
      { word: 'ocelot', tier: 3, gloss: 'wildcat' },
      { word: 'stallion', tier: 3, gloss: 'horse' },
    ],
  },
  {
    id: 'tools',
    name: { standard: 'Tools', simplified: 'Tools' },
    words: [
      { word: 'clamp', tier: 1 },
      { word: 'crowbar', tier: 1 },
      { word: 'drill', tier: 1 },
      { word: 'hammer', tier: 1 },
      { word: 'mallet', tier: 1 },
      { word: 'pliers', tier: 1 },
      { word: 'saw', tier: 1 },
      { word: 'screwdriver', tier: 1 },
      { word: 'shovel', tier: 1 },
      { word: 'wrench', tier: 1 },
      { word: 'awl', tier: 3, gloss: 'spike' },
      { word: 'lathe', tier: 3, gloss: 'machine' },
      { word: 'trowel', tier: 3, gloss: 'scoop' },
    ],
  },
  {
    id: 'food',
    name: { standard: 'Food', simplified: 'Food' },
    words: [
      { word: 'bagel', tier: 1 },
      { word: 'burrito', tier: 1 },
      { word: 'carrot', tier: 1 },
      { word: 'mango', tier: 1 },
      { word: 'noodles', tier: 1 },
      { word: 'oatmeal', tier: 1 },
      { word: 'pancake', tier: 1 },
      { word: 'pretzel', tier: 1 },
      { word: 'taco', tier: 1 },
      { word: 'yogurt', tier: 1 },
      { word: 'falafel', tier: 3, gloss: 'snack' },
      { word: 'gnocchi', tier: 3, gloss: 'pasta' },
      { word: 'quiche', tier: 3, gloss: 'pie' },
    ],
  },
  {
    id: 'clothing',
    name: { standard: 'Clothing', simplified: 'Clothes' },
    words: [
      { word: 'apron', tier: 1 },
      { word: 'boots', tier: 1 },
      { word: 'gloves', tier: 1 },
      { word: 'hoodie', tier: 1 },
      { word: 'jacket', tier: 1 },
      { word: 'jeans', tier: 1 },
      { word: 'mittens', tier: 1 },
      { word: 'sandals', tier: 1 },
      { word: 'scarf', tier: 1 },
      { word: 'sweater', tier: 1 },
      { word: 'beret', tier: 3, gloss: 'hat' },
      { word: 'cardigan', tier: 3, gloss: 'sweater' },
      { word: 'poncho', tier: 3, gloss: 'cape' },
    ],
  },
  {
    id: 'vehicles',
    name: { standard: 'Vehicles', simplified: 'Rides' },
    words: [
      { word: 'bus', tier: 1 },
      { word: 'canoe', tier: 1 },
      { word: 'ferry', tier: 1 },
      { word: 'helicopter', tier: 1 },
      { word: 'kayak', tier: 1 },
      { word: 'scooter', tier: 1 },
      { word: 'subway', tier: 1 },
      { word: 'tractor', tier: 1 },
      { word: 'truck', tier: 1 },
      { word: 'van', tier: 1 },
      { word: 'gondola', tier: 3, gloss: 'boat' },
      { word: 'rickshaw', tier: 3, gloss: 'cart' },
      { word: 'zeppelin', tier: 3, gloss: 'blimp' },
    ],
  },
  {
    id: 'weather',
    name: { standard: 'Weather', simplified: 'Weather' },
    words: [
      { word: 'blizzard', tier: 1 },
      { word: 'breeze', tier: 1 },
      { word: 'drizzle', tier: 1 },
      { word: 'fog', tier: 1 },
      { word: 'hail', tier: 1 },
      { word: 'lightning', tier: 1 },
      { word: 'rainbow', tier: 1 },
      { word: 'sleet', tier: 1 },
      { word: 'sunshine', tier: 1 },
      { word: 'thunder', tier: 1 },
      { word: 'gale', tier: 3, gloss: 'windstorm' },
      { word: 'humidity', tier: 3, gloss: 'dampness' },
      { word: 'monsoon', tier: 3, gloss: 'rainstorm' },
    ],
  },
  {
    id: 'school-supplies',
    name: { standard: 'School supplies', simplified: 'School stuff' },
    words: [
      { word: 'backpack', tier: 1 },
      { word: 'binder', tier: 1 },
      { word: 'crayon', tier: 1 },
      { word: 'eraser', tier: 1 },
      { word: 'glue', tier: 1 },
      { word: 'highlighter', tier: 1 },
      { word: 'marker', tier: 1 },
      { word: 'notebook', tier: 1 },
      { word: 'pencil', tier: 1 },
      { word: 'ruler', tier: 1 },
      { word: 'compass', tier: 3, gloss: 'circle-drawer' },
      { word: 'protractor', tier: 3, gloss: 'angle-tool' },
      { word: 'stencil', tier: 3, gloss: 'tracer' },
    ],
  },
  {
    id: 'feelings',
    name: { standard: 'Feelings', simplified: 'Feelings' },
    words: [
      { word: 'angry', tier: 1 },
      { word: 'bored', tier: 1 },
      { word: 'calm', tier: 1 },
      { word: 'cheerful', tier: 1 },
      { word: 'excited', tier: 1 },
      { word: 'grumpy', tier: 1 },
      { word: 'jealous', tier: 1 },
      { word: 'nervous', tier: 1 },
      { word: 'proud', tier: 1 },
      { word: 'silly', tier: 1 },
      { word: 'anxious', tier: 3, gloss: 'worried' },
      { word: 'envious', tier: 3, gloss: 'jealous' },
      { word: 'reluctant', tier: 3, gloss: 'unsure' },
    ],
  },
];

/**
 * Tie-break rule (the catch-all at the end of the press-order rule list):
 * when two keys hold words from the SAME category table, alphabetical order
 * decides which is pressed first.
 */
export const TIE_BREAK: { kind: 'alphabetical' } = { kind: 'alphabetical' };

/** Word keys shown on the keypad, per difficulty. */
export const KEY_COUNT: Record<1 | 2 | 3, number> = { 1: 3, 2: 4, 3: 6 };

/** Highest word tier the generator may draw from, per difficulty. */
export const MAX_WORD_TIER: Record<1 | 2 | 3, 1 | 3> = { 1: 1, 2: 1, 3: 3 };

/**
 * Whether the generator may put TWO words from the same category on the
 * keypad (which is exactly when the tie-break rule matters).
 */
export const ALLOW_DOUBLE_CATEGORY: Record<1 | 2 | 3, boolean> = {
  1: false,
  2: false,
  3: true,
};
