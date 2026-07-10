import type { ManualBlock, ManualSection } from '../../engine/types';
import { GLYPHS, PANEL_MODELS, TRANSLATION_TABLES, type Glyph } from './rules';
import { glyphPhrase, modelHeading, roundCaption, translationRows, type Edition } from './prose';

/** Printable black-on-white glyph art (same shapes the Agent's panel shows). */
const GLYPH_ART: Record<Glyph, string> = {
  crescent: '<path d="M42 25.58 A18 18 0 1 1 22.42 6 A14 14 0 0 0 42 25.58 Z" fill="#111"/>',
  key:
    '<circle cx="15" cy="24" r="8" fill="none" stroke="#111" stroke-width="4"/>' +
    '<line x1="23" y1="24" x2="42" y2="24" stroke="#111" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="34" y1="24" x2="34" y2="32" stroke="#111" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="41" y1="24" x2="41" y2="31" stroke="#111" stroke-width="4" stroke-linecap="round"/>',
  bolt: '<polygon points="27,3 10,28 21,28 19,45 38,19 26,19" fill="#111"/>',
  eye:
    '<path d="M4 24 C 12 11, 36 11, 44 24 C 36 37, 12 37, 4 24 Z" fill="none" stroke="#111" stroke-width="4"/>' +
    '<circle cx="24" cy="24" r="5.5" fill="#111"/>',
};

/** Legend figure: the four glyphs with their printed letters, from data. */
function glyphLegendSvg(ed: Edition): string {
  const cells = GLYPHS.map((glyph, i) => {
    const x = i * 120;
    return `
  <g transform="translate(${x + 30},14) scale(1.25)">${GLYPH_ART[glyph]}</g>
  <text x="${x + 60}" y="106" text-anchor="middle">${glyphPhrase(glyph, ed)}</text>`;
  }).join('');
  return `
<svg viewBox="0 0 480 124" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;font-size:15px;fill:#111}</style>
  <rect x="0" y="0" width="480" height="124" fill="#fff"/>${cells}
</svg>`;
}

function glyphListText(ed: Edition): string {
  return GLYPHS.map((g) => glyphPhrase(g, ed)).join(', ');
}

/** One h3 + one SEE→PRESS table per round, for every panel model — all from data. */
function tableBlocks(ed: Edition): ManualBlock[] {
  const blocks: ManualBlock[] = [];
  for (const model of PANEL_MODELS) {
    blocks.push({ kind: 'h3', text: modelHeading(model, ed) });
    for (let round = 0; round < TRANSLATION_TABLES[model].length; round++) {
      blocks.push({
        kind: 'table',
        caption: roundCaption(model, round, ed),
        header: ed === 'standard' ? ['SEE (flashed)', 'PRESS'] : ['SEE', 'PRESS'],
        rows: translationRows(model, round, ed),
      });
    }
  }
  return blocks;
}

export const alarmBypassManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a wall panel with four signal buttons — each has a shape and a printed letter: ' +
      `${glyphListText('standard')}. The panel flashes a short signal (a sequence of shapes), and the Agent ` +
      'can replay it as many times as needed. First ask the Agent for the MODEL CODE printed on the panel ' +
      'and the current ROUND number. Then have the Agent read out the flashed shapes in order. Translate ' +
      'each one using that round’s SEE → PRESS table below, and tell the Agent which buttons to press, in order.',
    blocks: [
      {
        kind: 'figure',
        svg: glyphLegendSvg('standard'),
        caption: 'The four signal glyphs and their printed letters. Go by shape and letter, never by color.',
        alt: 'Four glyphs with letters: Crescent C, Key K, Bolt B, Eye E',
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Have the Agent read the whole signal first, then translate one at a time. If a shape description is unclear, ask for the printed letter.',
      },
      {
        kind: 'steps',
        items: [
          'Ask: "What model code is printed on the panel?" (RK-2, AG-3, or MM-3)',
          'Ask: "What round are you on?"',
          'Have the Agent replay the signal and read every flashed shape in order.',
          'Find that model and round’s table below. Translate each flashed shape: SEE → PRESS.',
          'Tell the Agent the buttons to press, in order. Then move to the next round.',
        ],
      },
      ...tableBlocks('standard'),
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong press raises the alarm level and clears only that round’s presses — the flashed signal stays the same. Replay it, double-check the round number, and try again.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees four buttons with shapes and letters: ' +
      `${glyphListText('simplified')}. The panel flashes some shapes. The Agent can replay the flash any time. ` +
      'Ask for the model code on the panel. Ask for the round number. The Agent says the flashed shapes. ' +
      'You use the right table below. It tells you which buttons to press.',
    blocks: [
      {
        kind: 'figure',
        svg: glyphLegendSvg('simplified'),
        caption: 'The four shapes and their letters. Use shape and letter, not color.',
        alt: 'Four shapes with letters: Moon C, Key K, Bolt B, Eye E',
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Have the Agent read the whole signal first. Then translate one shape at a time. Not sure? Ask for the letter!',
      },
      {
        kind: 'steps',
        items: [
          'Ask: "What is the model code?"',
          'Ask: "What round is it?"',
          'The Agent says the flashed shapes, in order.',
          'Use that round’s table. SEE is what flashed. PRESS is the answer.',
          'Say the presses in order. The Agent presses them.',
        ],
      },
      ...tableBlocks('simplified'),
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong press bumps the alarm. Only that round starts over. The flash stays the same. Replay it and try again.',
      },
    ],
  },
};
