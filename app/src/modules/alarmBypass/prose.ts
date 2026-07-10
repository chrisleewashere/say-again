/**
 * Turns alarm-bypass rule data into manual prose. The manual generator calls
 * these, so printed tables always match the engine — never write translation
 * rows by hand.
 */
import {
  GLYPHS,
  GLYPH_LETTERS,
  SEQUENCE_LENGTHS,
  TRANSLATION_TABLES,
  type Glyph,
  type PanelModel,
} from './rules';

export type Edition = 'standard' | 'simplified';

/** Glyph display names per edition. Simplified swaps "crescent" for "moon". */
const GLYPH_NAMES: Record<Glyph, { standard: string; simplified: string }> = {
  crescent: { standard: 'Crescent', simplified: 'Moon' },
  key: { standard: 'Key', simplified: 'Key' },
  bolt: { standard: 'Bolt', simplified: 'Bolt' },
  eye: { standard: 'Eye', simplified: 'Eye' },
};

/** "Crescent (C)" / "Moon (C)" — name plus the printed letter, never color. */
export function glyphPhrase(glyph: Glyph, ed: Edition): string {
  return `${GLYPH_NAMES[glyph][ed]} (${GLYPH_LETTERS[glyph]})`;
}

/** One SEE -> PRESS row per glyph, straight from the data table. */
export function translationRows(model: PanelModel, round: number, ed: Edition): string[][] {
  const table = TRANSLATION_TABLES[model][round];
  if (!table) throw new Error(`No round ${round} table for panel model ${model}`);
  return GLYPHS.map((glyph) => [glyphPhrase(glyph, ed), glyphPhrase(table[glyph], ed)]);
}

/** Caption for one round's table. */
export function roundCaption(model: PanelModel, round: number, ed: Edition): string {
  const len = SEQUENCE_LENGTHS[model][round];
  return ed === 'standard'
    ? `Model ${model} — Round ${round + 1} (signal has ${len} flashes): SEE → PRESS`
    : `Model ${model}, Round ${round + 1}. The signal has ${len} flashes. SEE → PRESS`;
}

/** Section heading for one panel model. */
export function modelHeading(model: PanelModel, ed: Edition): string {
  const rounds = TRANSLATION_TABLES[model].length;
  return ed === 'standard'
    ? `Panel model ${model} (${rounds} rounds)`
    : `Model ${model} — ${rounds} rounds`;
}
