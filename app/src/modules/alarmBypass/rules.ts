/**
 * Alarm Bypass — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables.
 *
 * Original game content. Color is never the only channel: every signal button
 * carries a distinct glyph SHAPE plus a printed LETTER, and the manual refers
 * to glyphs by name + letter, never by color.
 */

/** The four signal glyphs on the wall panel. */
export const GLYPHS = ['crescent', 'key', 'bolt', 'eye'] as const;
export type Glyph = (typeof GLYPHS)[number];

/** Printed letter tag on each button (the redundant, color-free channel). */
export const GLYPH_LETTERS: Record<Glyph, string> = {
  crescent: 'C',
  key: 'K',
  bolt: 'B',
  eye: 'E',
};

/**
 * Panel model codes. The model code is printed on the Agent's panel; the
 * Handler asks for it to pick the right table set. One model per difficulty.
 */
export const PANEL_MODELS = ['RK-2', 'AG-3', 'MM-3'] as const;
export type PanelModel = (typeof PANEL_MODELS)[number];

export const MODEL_FOR_DIFFICULTY: Record<1 | 2 | 3, PanelModel> = {
  1: 'RK-2',
  2: 'AG-3',
  3: 'MM-3',
};

/** Flash-sequence length for each round, per panel model. */
export const SEQUENCE_LENGTHS: Record<PanelModel, number[]> = {
  'RK-2': [2, 3],
  'AG-3': [2, 3, 4],
  'MM-3': [3, 4, 5],
};

/** A per-round translation: (flashed glyph) -> (glyph to press). */
export type GlyphMap = Record<Glyph, Glyph>;

/**
 * Translation tables keyed [panel model][round index][flashed glyph].
 * Every table is a total permutation of the four glyphs.
 *
 * Design intent (property-tested):
 * - RK-2 (Rookie) keeps several identity mappings so early success comes easy.
 * - AG-3 (Agent) keeps at most one identity per round.
 * - MM-3 (Mastermind) has NO identity mappings anywhere, and consecutive
 *   rounds remap every glyph.
 */
export const TRANSLATION_TABLES: Record<PanelModel, GlyphMap[]> = {
  'RK-2': [
    // Round 1: crescent and key stay themselves; bolt and eye swap.
    { crescent: 'crescent', key: 'key', bolt: 'eye', eye: 'bolt' },
    // Round 2: bolt and eye stay themselves; crescent and key swap.
    { crescent: 'key', key: 'crescent', bolt: 'bolt', eye: 'eye' },
  ],
  'AG-3': [
    // Round 1: only eye stays itself.
    { crescent: 'key', key: 'bolt', bolt: 'crescent', eye: 'eye' },
    // Round 2: only crescent stays itself.
    { crescent: 'crescent', key: 'eye', bolt: 'key', eye: 'bolt' },
    // Round 3: nothing stays itself.
    { crescent: 'eye', key: 'crescent', bolt: 'key', eye: 'bolt' },
  ],
  'MM-3': [
    // Round 1: two swaps, no identities.
    { crescent: 'bolt', key: 'eye', bolt: 'crescent', eye: 'key' },
    // Round 2: full four-cycle, no identities.
    { crescent: 'key', key: 'bolt', bolt: 'eye', eye: 'crescent' },
    // Round 3: different swaps again, no identities.
    { crescent: 'eye', key: 'bolt', bolt: 'key', eye: 'crescent' },
  ],
};
