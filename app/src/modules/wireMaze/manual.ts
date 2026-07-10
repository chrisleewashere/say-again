import type { ManualSection } from '../../engine/types';
import { firstCutRulesText, secondCutRulesText } from './prose';

/** Pattern legend figure so the Handler can name patterns confidently. */
const patternLegendSvg = `
<svg viewBox="0 0 480 150" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;font-size:14px;fill:#111}</style>
  <rect x="20" y="20" width="200" height="18" rx="9" fill="#888"/>
  <text x="20" y="58">plain / solid</text>
  <rect x="260" y="20" width="200" height="18" rx="9" fill="#888"/>
  <g>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${268 + i * 22}" y1="16" x2="${280 + i * 22}" y2="42" stroke="#111" stroke-width="4"/>`).join('')}
  </g>
  <text x="260" y="58">striped</text>
  <rect x="20" y="90" width="200" height="18" rx="9" fill="#888"/>
  <g>
    ${Array.from({ length: 8 }, (_, i) => `<circle cx="${36 + i * 24}" cy="99" r="3.5" fill="#111"/>`).join('')}
  </g>
  <text x="20" y="128">dotted / dotty</text>
  <rect x="260" y="90" width="200" height="18" rx="9" fill="#888"/>
  <polyline points="${Array.from({ length: 11 }, (_, i) => `${262 + i * 20},${i % 2 === 0 ? 92 : 106}`).join(' ')}" fill="none" stroke="#111" stroke-width="3.5"/>
  <text x="260" y="128">zigzag</text>
</svg>`;

export const wireMazeManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a panel of numbered wires. Each wire has a color, a pattern, and a letter tag. ' +
      'Ask the Agent how many wires there are, then work through the matching rule list from top to ' +
      'bottom. Use the FIRST rule that matches — then stop.',
    blocks: [
      { kind: 'figure', svg: patternLegendSvg, caption: 'Wire patterns you may hear described.', alt: 'Four wire patterns: solid, striped, dotted, zigzag' },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Wires are numbered from the top. Wire numbers never change, even after a cut. Colors can repeat; letter tags never repeat. Each wire also shows its color name printed on it, so the Agent can read the color out loud instead of judging it by eye.',
      },
      { kind: 'h3', text: 'If there are 4 wires' },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: firstCutRulesText(4, 'standard') },
      { kind: 'h3', text: 'If there are 5 wires' },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: firstCutRulesText(5, 'standard') },
      { kind: 'h3', text: 'If there are 6 wires' },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: firstCutRulesText(6, 'standard') },
      { kind: 'h3', text: 'Mastermind missions: the second cut' },
      {
        kind: 'p',
        text: 'Six-wire panels on Mastermind missions need TWO cuts. After the first correct cut, use this second list. If the wire it points to is already cut, cut the bottom-most remaining wire instead.',
      },
      { kind: 'ruleList', caption: 'Second cut — check in order; apply the first match.', rules: secondCutRulesText('standard') },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong cut raises the alarm level. If you are not sure, ask the Agent to describe the wire again before saying "cut".',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees wires. Each wire has a color, a pattern, and one letter. ' +
      'First ask: "How many wires?" Then use that list below. Go rule by rule. Stop at the first rule that fits.',
    blocks: [
      { kind: 'figure', svg: patternLegendSvg, caption: 'The four wire patterns.', alt: 'Four wire patterns: plain, striped, dotty, zigzag' },
      {
        kind: 'bullets',
        items: [
          'Wire 1 is at the top.',
          'Wire numbers do not change.',
          'Ask about colors, patterns, and letters.',
          'The color name is printed on each wire — the Agent can read it out.',
        ],
      },
      { kind: 'h3', text: '4 wires' },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: firstCutRulesText(4, 'simplified') },
      { kind: 'h3', text: '5 wires' },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: firstCutRulesText(5, 'simplified') },
      { kind: 'h3', text: '6 wires' },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: firstCutRulesText(6, 'simplified') },
      { kind: 'h3', text: 'Second cut (hard missions only)' },
      {
        kind: 'p',
        text: 'Hard missions need two cuts. After cut one, use this list. If that wire is already cut, cut the bottom wire that is left.',
      },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: secondCutRulesText('simplified') },
      { kind: 'callout', tone: 'tip', text: 'Not sure? Ask the Agent to say the wire again. Asking is smart!' },
    ],
  },
};
