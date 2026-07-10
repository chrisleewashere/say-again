/**
 * Turns keypad-cipher rule data into manual prose. The manual generator calls
 * these, so printed rules always match the engine — never write rule prose
 * by hand.
 */
import { CATEGORIES, TIE_BREAK, type Category } from './rules';

export type Edition = 'standard' | 'simplified';

export function categoryNameText(cat: Category, ed: Edition): string {
  return cat.name[ed];
}

/** The catch-all tie-break rule, rendered from TIE_BREAK data. */
export function tieBreakText(ed: Edition): string {
  switch (TIE_BREAK.kind) {
    case 'alphabetical':
      return ed === 'standard'
        ? 'If two keys hold words from the same table, press them in alphabetical order (A before Z).'
        : 'Two words from the same list? Press the word that comes first in ABC order.';
  }
}

/**
 * The press-order rule list: one ordered rule per category (rank = position
 * in CATEGORY_PRIORITY), ending in the tie-break catch-all.
 */
export function priorityRulesText(ed: Edition): string[] {
  const s = ed === 'standard';
  const rules = CATEGORIES.map((cat, i) => {
    const name = categoryNameText(cat, ed);
    if (s) {
      return i === 0
        ? `Rank 1 — ${name}: keys with a word from the ${name} table are pressed before everything below.`
        : `Rank ${i + 1} — ${name}: keys with a word from the ${name} table are pressed only after every table above is done.`;
    }
    return i === 0 ? `1. ${name} words go first.` : `${i + 1}. ${name} words go next.`;
  });
  rules.push(tieBreakText(ed));
  return rules;
}

/**
 * A category's word list for the manual, alphabetized so the Handler can
 * scan it fast. The simplified edition appends a one-word gloss to the
 * less-frequent words.
 */
export function categoryWordEntries(cat: Category, ed: Edition): string[] {
  const sorted = [...cat.words].sort((a, b) => (a.word < b.word ? -1 : 1));
  return sorted.map((w) =>
    ed === 'simplified' && w.gloss ? `${w.word} (${w.gloss})` : w.word,
  );
}
