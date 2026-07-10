/**
 * Turns Password Intercept card data into manual prose. The manual generator
 * calls these, so the printed card table always matches the engine — never
 * write card rows or relation wording by hand.
 */
import {
  CARDS,
  MANUAL_TABLE_CHUNK,
  RELATION_SYMBOLS,
  type InterceptCard,
  type Relation,
} from './rules';

export type Edition = 'standard' | 'simplified';

const RELATION_WORD: Record<Relation, { standard: string; simplified: string }> = {
  synonym: { standard: 'synonym of', simplified: 'SAME' },
  opposite: { standard: 'opposite of', simplified: 'OPPOSITE' },
  means: { standard: 'means', simplified: 'MEANS' },
};

const RELATION_HELP: Record<Relation, { standard: string; simplified: string }> = {
  synonym: {
    standard: 'a word with the same meaning as the clue',
    simplified: 'the word means the SAME as the clue',
  },
  opposite: {
    standard: 'a word with the reverse meaning of the clue',
    simplified: 'the word means the OPPOSITE of the clue',
  },
  means: {
    standard: 'the clue is the definition of the word',
    simplified: 'the clue tells what the word MEANS',
  },
};

/**
 * Relation cell text. Standard edition pairs the word with its print symbol
 * (word + symbol = two channels); simplified edition uses only the plain
 * words SAME / OPPOSITE / MEANS.
 */
export function relationText(rel: Relation, ed: Edition): string {
  return ed === 'standard'
    ? `${RELATION_WORD[rel].standard} (${RELATION_SYMBOLS[rel]})`
    : RELATION_WORD[rel].simplified;
}

/** One-line explanation of a relation, for the symbol legend. */
export function relationHelpText(rel: Relation, ed: Edition): string {
  return RELATION_HELP[rel][ed];
}

/** One printed table row per card: [card number, relation, clue]. */
export function cardRow(card: InterceptCard, ed: Edition): string[] {
  return [String(card.id), relationText(card.relation, ed), card.clue];
}

/** Every card as a table row, in card-number order. */
export function cardRows(ed: Edition): string[][] {
  return [...CARDS].sort((a, b) => a.id - b.id).map((c) => cardRow(c, ed));
}

/** Card rows split into digestible chunks (by tens) for the printed manual. */
export function cardRowChunks(ed: Edition): { caption: string; rows: string[][] }[] {
  const rows = cardRows(ed);
  const chunks: { caption: string; rows: string[][] }[] = [];
  for (let i = 0; i < rows.length; i += MANUAL_TABLE_CHUNK) {
    const slice = rows.slice(i, i + MANUAL_TABLE_CHUNK);
    const first = slice[0][0];
    const last = slice[slice.length - 1][0];
    chunks.push({
      caption:
        ed === 'standard' ? `Intercept cards ${first}–${last}` : `Cards ${first} to ${last}`,
      rows: slice,
    });
  }
  return chunks;
}

/**
 * How the Handler reads a card aloud, generated from the same data. Used for
 * the worked example in the manual so it can never drift from the table.
 */
export function cardCallText(card: InterceptCard, ed: Edition): string {
  if (ed === 'standard') {
    switch (card.relation) {
      case 'synonym':
        return `Card ${card.id}: a synonym of "${card.clue}".`;
      case 'opposite':
        return `Card ${card.id}: the opposite of "${card.clue}".`;
      case 'means':
        return `Card ${card.id}: a word that means "${card.clue}".`;
    }
  }
  switch (card.relation) {
    case 'synonym':
      return `Card ${card.id}. Find the word that is the SAME as "${card.clue}".`;
    case 'opposite':
      return `Card ${card.id}. Find the word that is the OPPOSITE of "${card.clue}".`;
    case 'means':
      return `Card ${card.id}. Find the word that MEANS "${card.clue}".`;
  }
}
