import type { ManualBlock, ManualSection } from '../../engine/types';
import { CATEGORIES } from './rules';
import { categoryNameText, categoryWordEntries, priorityRulesText, type Edition } from './prose';

/**
 * Flow-diagram figure: read the word -> find its table -> note its rank.
 * Black-on-white, self-contained, printable.
 */
const flowDiagramSvg = `
<svg viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;fill:#111}</style>
  <rect x="8" y="20" width="176" height="90" rx="10" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="24" y="50" font-size="20" font-weight="bold">1. READ</text>
  <text x="24" y="76" font-size="14">Agent says the word</text>
  <text x="24" y="96" font-size="14">on the key out loud.</text>
  <path d="M188 65 h24 m-8 -8 8 8 -8 8" fill="none" stroke="#111" stroke-width="2.5"/>
  <rect x="220" y="20" width="176" height="90" rx="10" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="236" y="50" font-size="20" font-weight="bold">2. FIND</text>
  <text x="236" y="76" font-size="14">Handler finds the ONE</text>
  <text x="236" y="96" font-size="14">table that lists it.</text>
  <path d="M400 65 h24 m-8 -8 8 8 -8 8" fill="none" stroke="#111" stroke-width="2.5"/>
  <rect x="432" y="20" width="176" height="90" rx="10" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="448" y="50" font-size="20" font-weight="bold">3. RANK</text>
  <text x="448" y="76" font-size="14">Note that table's</text>
  <text x="448" y="96" font-size="14">rank number.</text>
</svg>`;

const flowAlt =
  'Three steps joined by arrows: 1 READ, the Agent says the word out loud; ' +
  '2 FIND, the Handler finds the one table that lists it; 3 RANK, note that table\'s rank number.';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** One printable table block per category, generated from the same data the solver uses. */
function categoryTableBlocks(ed: Edition): ManualBlock[] {
  return CATEGORIES.map((cat, i): ManualBlock => {
    const name = categoryNameText(cat, ed);
    const entries = categoryWordEntries(cat, ed);
    if (ed === 'standard') {
      return {
        kind: 'table',
        caption: `Table ${i + 1} — ${name}`,
        header: [`${name} words (A to Z)`],
        rows: chunk(entries, 4).map((c) => [c.join(' · ')]),
      };
    }
    return {
      kind: 'table',
      caption: `List ${i + 1} — ${name}`,
      header: ['Word'],
      rows: entries.map((e) => [e]),
    };
  });
}

export const keypadCipherManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a keypad of word keys — one everyday English word printed on each key, in no ' +
      'special order. Every word belongs to exactly one of the eight category tables below. Ask the ' +
      'Agent to read every word aloud, find each word\'s table, then direct the presses: highest-ranked ' +
      'table first. When a key locks in, a numbered badge and a check mark appear on it.',
    blocks: [
      {
        kind: 'figure',
        svg: flowDiagramSvg,
        caption: 'Do this for every word on the keypad before pressing anything.',
        alt: flowAlt,
      },
      {
        kind: 'steps',
        items: [
          'Ask the Agent to read every word on the keypad out loud.',
          'For each word, find the one table that lists it and note that table\'s rank.',
          'Using the press-order rules, tell the Agent which key to press, one at a time.',
          'Confirm each word back to the Agent before saying "press".',
        ],
      },
      {
        kind: 'ruleList',
        caption: 'Press order — check ranks from the top.',
        rules: priorityRulesText('standard'),
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'If a word could fit two lists, only one table actually contains it — ask the Agent to spell it if unsure.',
      },
      { kind: 'h3', text: 'Category tables' },
      ...categoryTableBlocks('standard'),
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong press resets the keypad: every locked key unlocks and the sequence starts over from zero. The words never change, so slow down and re-check the tables.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees keys with words on them. Each word fits one list below. ' +
      'Ask the Agent to read each word. Find each word\'s list. ' +
      'Then say which key to press. List 1 words go first. Locked keys show a number and a check mark.',
    blocks: [
      {
        kind: 'figure',
        svg: flowDiagramSvg,
        caption: 'Read the word. Find its list. Note its number.',
        alt: flowAlt,
      },
      {
        kind: 'steps',
        items: [
          'Agent reads every word out loud.',
          'Find each word in one list below.',
          'Say the words in list order, one at a time.',
        ],
      },
      {
        kind: 'ruleList',
        caption: 'Press order.',
        rules: priorityRulesText('simplified'),
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'A word could fit two lists? Only one list really has it. Not sure? Ask the Agent to spell the word. Asking is smart!',
      },
      { kind: 'h3', text: 'Word lists' },
      ...categoryTableBlocks('simplified'),
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong press makes the keypad start over. The words stay the same. Take your time.',
      },
    ],
  },
};
