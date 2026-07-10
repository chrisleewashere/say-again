import type { ManualBlock, ManualSection } from '../../engine/types';
import { cardCallText, cardRowChunks, relationHelpText, relationText, type Edition } from './prose';
import { RELATIONS, RELATION_SYMBOLS, getCard } from './rules';

/**
 * Symbol legend figure, generated from the same relation data the card table
 * uses. Black-on-white for print.
 */
function legendSvg(ed: Edition): string {
  const rows = RELATIONS.map((rel, i) => {
    const y = 26 + i * 46;
    return `
  <rect x="16" y="${y - 20}" width="36" height="36" rx="6" fill="#fff" stroke="#111" stroke-width="2"/>
  <text x="34" y="${y + 5}" text-anchor="middle" font-size="22" font-weight="bold">${RELATION_SYMBOLS[rel]}</text>
  <text x="66" y="${y - 2}" font-size="15" font-weight="bold">${relationText(rel, ed)}</text>
  <text x="66" y="${y + 16}" font-size="13">${relationHelpText(rel, ed)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 480 152" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;fill:#111}</style>
  <rect x="1" y="1" width="478" height="150" rx="10" fill="#fff" stroke="#111" stroke-width="2"/>${rows}
</svg>`;
}

function legendAlt(ed: Edition): string {
  return RELATIONS.map((rel) => `${relationText(rel, ed)}: ${relationHelpText(rel, ed)}`).join('; ');
}

/** Worked example built from real card data so it can never drift. */
const EXAMPLE_CARD = getCard(15);

function cardTableBlocks(ed: Edition): ManualBlock[] {
  const header =
    ed === 'standard' ? ['Card', 'Relation', 'Clue'] : ['Card', 'Rule', 'Clue'];
  return cardRowChunks(ed).map(
    (chunk): ManualBlock => ({ kind: 'table', caption: chunk.caption, header, rows: chunk.rows }),
  );
}

export const passwordInterceptManual: ManualSection = {
  standard: {
    intro:
      'An enemy transmission is coming in. The Agent’s screen shows an intercept card number ' +
      '(for example, "CARD 17") and a bank of five candidate words — but no clues. Only this manual ' +
      'holds the card table. Ask the Agent for the card number, look it up below, and read the clue ' +
      'with its relation aloud. The Agent then picks the one candidate word that fits. Each ' +
      'transmission has several cards to decode, one at a time.',
    blocks: [
      {
        kind: 'figure',
        svg: legendSvg('standard'),
        caption: 'Relation symbols used in the card table.',
        alt: `Legend of the three relation symbols. ${legendAlt('standard')}.`,
      },
      {
        kind: 'steps',
        items: [
          'Ask the Agent: "What card number do you see?"',
          'Repeat the number back and wait for a "confirmed" before you look it up.',
          'Find that row in the card table and read the relation and clue aloud — for example: ' +
            `"${cardCallText(EXAMPLE_CARD, 'standard')}"`,
          'Have the Agent read all five candidate words before choosing.',
          'Agree on the one word that fits, then the Agent taps it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Confirm the card number out loud before decoding — "Card seventeen, one-seven, confirm?" ' +
          'A misheard number sends you to the wrong clue. If a clue seems to fit nothing, re-confirm ' +
          'the number and ask the Agent to reread the candidate words.',
      },
      ...cardTableBlocks('standard'),
      {
        kind: 'callout',
        tone: 'warning',
        text:
          'A wrong word raises the alarm level, but the round can be retried. Watch for trap words: ' +
          'on an "opposite of" card, a word that means the SAME as the clue is always wrong.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees a card number and five words. You have the card list. ' +
      'Ask: "What card number?" Find that card below. Read the rule and the clue out loud. ' +
      'The Agent picks the one word that fits.',
    blocks: [
      {
        kind: 'figure',
        svg: legendSvg('simplified'),
        caption: 'The three card rules.',
        alt: `The three card rules. ${legendAlt('simplified')}.`,
      },
      {
        kind: 'steps',
        items: [
          'Ask: "What card number?"',
          'Say the number back. Wait for "yes".',
          `Find the card in the list. Read it out loud, like: "${cardCallText(EXAMPLE_CARD, 'simplified')}"`,
          'Ask the Agent to read all five words.',
          'Pick the one word together. The Agent taps it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Say the card number back before you decode. Not sure? Ask the Agent to say it again. Asking is smart!',
      },
      ...cardTableBlocks('simplified'),
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong word raises the alarm. You can try again. On an OPPOSITE card, a word that means the same as the clue is a trap.',
      },
    ],
  },
};
