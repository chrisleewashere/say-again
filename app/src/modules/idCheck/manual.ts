import type { ManualBlock, ManualSection } from '../../engine/types';
import { attrLabel, checklistText, valueLabel, type Edition } from './prose';
import { ATTR_KEYS, ATTR_VALUES, LINEUP_SIZE } from './rules';

/* ------------------------------------------------------------------ */
/* Attribute glossary figure — built from the SAME attribute data the  */
/* engine uses (rules.ts) with labels from prose.ts, so the printed    */
/* glossary can never drift from the on-screen portraits.              */
/* Black-on-white, printable, self-contained.                          */
/* ------------------------------------------------------------------ */

/** Friendly face in a 60x60 icon cell: head at (30,26) r16. */
const FACE =
  '<circle cx="30" cy="26" r="16" fill="#fff" stroke="#111" stroke-width="2"/>' +
  '<circle cx="24" cy="24" r="1.8" fill="#111"/><circle cx="36" cy="24" r="1.8" fill="#111"/>' +
  '<path d="M24 31 Q30 36 36 31" fill="none" stroke="#111" stroke-width="1.8"/>';

/** Shoulder stub so neck accessories have somewhere to sit. */
const STUB =
  '<path d="M14 58 L16 47 Q19 42 30 41 Q41 42 44 47 L46 58 Z" fill="#eee" stroke="#111" stroke-width="1.5"/>';

const SHIRT_BOX = '<rect x="14" y="12" width="32" height="36" rx="4" fill="#fff" stroke="#111" stroke-width="2"/>';

/** Icon per attribute value, keyed "attr.value". Shape-only, never color-coded. */
const GLOSSARY_ICONS: Record<string, string> = {
  'headwear.none': FACE,
  'headwear.beanie':
    FACE +
    '<path d="M15 22 A15.5 13 0 0 1 45 22 Z" fill="#555"/>' +
    '<rect x="14" y="19" width="32" height="5" rx="2.5" fill="#111"/>' +
    '<circle cx="30" cy="7" r="3.5" fill="#111"/>',
  'headwear.cap':
    FACE +
    '<path d="M16 22 A14 12 0 0 1 44 22 Z" fill="#555"/>' +
    '<rect x="28" y="19" width="24" height="4.5" rx="2" fill="#111"/>',
  'glasses.none': FACE,
  'glasses.round':
    FACE +
    '<g stroke="#111" stroke-width="2" fill="none">' +
    '<circle cx="24" cy="24" r="5"/><circle cx="36" cy="24" r="5"/><line x1="29" y1="24" x2="31" y2="24"/></g>',
  'glasses.square':
    FACE +
    '<g stroke="#111" stroke-width="2" fill="none">' +
    '<rect x="18" y="19" width="11" height="10" rx="1.5"/><rect x="31" y="19" width="11" height="10" rx="1.5"/>' +
    '<line x1="29" y1="23" x2="31" y2="23"/></g>',
  'hair.short':
    FACE + '<path d="M15 21 A16 16 0 0 1 45 21" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round"/>',
  'hair.long':
    FACE +
    '<path d="M15 21 A16 16 0 0 1 45 21" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round"/>' +
    '<rect x="8.5" y="20" width="6" height="22" rx="3" fill="#111"/>' +
    '<rect x="45.5" y="20" width="6" height="22" rx="3" fill="#111"/>',
  'hair.curly':
    FACE +
    '<g fill="#111"><circle cx="16" cy="18" r="4.5"/><circle cx="23" cy="11" r="4.5"/><circle cx="30" cy="9" r="4.5"/>' +
    '<circle cx="37" cy="11" r="4.5"/><circle cx="44" cy="18" r="4.5"/></g>',
  'accessory.none': STUB + FACE,
  'accessory.scarf':
    STUB + FACE + '<rect x="20" y="40" width="20" height="6" rx="3" fill="#111"/>' +
    '<rect x="26" y="43" width="7" height="12" rx="3" fill="#111"/>',
  'accessory.badge':
    STUB +
    FACE +
    '<polygon points="39,44 40.3,47.2 43.8,47.5 41.1,49.7 41.9,53.1 39,51.2 36.1,53.1 36.9,49.7 34.2,47.5 37.7,47.2" fill="#111"/>',
  'accessory.bowtie':
    STUB +
    FACE +
    '<path d="M29 46 L20 42 L20 50 Z" fill="#111"/><path d="M31 46 L40 42 L40 50 Z" fill="#111"/>' +
    '<circle cx="30" cy="46" r="2.2" fill="#fff" stroke="#111" stroke-width="1"/>',
  'shirt.plain': SHIRT_BOX,
  'shirt.striped':
    SHIRT_BOX +
    '<g stroke="#111" stroke-width="2">' +
    Array.from({ length: 5 }, (_, i) => `<line x1="${19 + i * 5.5}" y1="13" x2="${19 + i * 5.5}" y2="47"/>`).join('') +
    '</g>',
  'shirt.spotted':
    SHIRT_BOX +
    '<g fill="#111">' +
    [
      [21, 20], [30, 20], [39, 20],
      [25.5, 29], [34.5, 29],
      [21, 38], [30, 38], [39, 38],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`)
      .join('') +
    '</g>',
};

const CELL_W = 110;
const ROW_H = 94;
const HEADER_W = 104;

/** Render the full glossary as one printable SVG for the given edition. */
function glossarySvg(ed: Edition): string {
  const rows = ATTR_KEYS.map((attr, rowIdx) => {
    const y = 14 + rowIdx * ROW_H;
    const header =
      `<text x="8" y="${y + 36}" font-weight="bold" font-size="13">${attrLabel(attr, ed)}</text>`;
    const cells = ATTR_VALUES[attr]
      .map((value, colIdx) => {
        const x = HEADER_W + colIdx * CELL_W;
        const icon = GLOSSARY_ICONS[`${attr}.${value}`];
        if (!icon) throw new Error(`id-check glossary: no icon for ${attr}.${value}`);
        return (
          `<g transform="translate(${x + 25},${y})">${icon}</g>` +
          `<text x="${x + 55}" y="${y + 76}" text-anchor="middle">${valueLabel(attr, value, ed)}</text>`
        );
      })
      .join('');
    return header + cells;
  }).join('');
  const width = HEADER_W + 4 * CELL_W + 8;
  const height = 14 + ATTR_KEYS.length * ROW_H;
  return (
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">` +
    '<style>text{font-family:sans-serif;font-size:12px;fill:#111}</style>' +
    rows +
    '</svg>'
  );
}

function glossaryAlt(ed: Edition): string {
  return ATTR_KEYS.map(
    (attr) => `${attrLabel(attr, ed)}: ${ATTR_VALUES[attr].map((v) => valueLabel(attr, v, ed)).join(', ')}`,
  ).join('. ');
}

/* ------------------------------------------------------------------ */
/* Manual editions. Checklist prose comes from prose.ts (rule data).   */
/* ------------------------------------------------------------------ */

function checklistBlocks(ed: Edition): ManualBlock[] {
  const tiers: { label: string; size: number }[] = [
    { label: 'Rookie', size: LINEUP_SIZE[1] },
    { label: 'Agent', size: LINEUP_SIZE[2] },
    { label: 'Mastermind', size: LINEUP_SIZE[3] },
  ];
  return tiers.flatMap((t): ManualBlock[] => [
    { kind: 'h3', text: `${t.label} checklist — ${t.size} suspects` },
    {
      kind: 'ruleList',
      caption:
        ed === 'standard'
          ? 'Work the steps strictly in order, top to bottom.'
          : 'Do the steps in order. Start at the top.',
      rules: checklistText(t.size, ed),
    },
  ]);
}

export const idCheckManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a lineup of numbered suspect portraits — exactly one is your secret contact. ' +
      'Every portrait shows five features: headwear, glasses, hair, accessory, and shirt pattern. ' +
      'First ask, "How many suspects are in the lineup?" — the count tells you which checklist to use. ' +
      'Have the Agent describe the suspects, cross people out on scrap paper as the checklist directs, ' +
      'and the last suspect standing is the contact. Tell the Agent which number to tap, then confirm.',
    blocks: [
      {
        kind: 'figure',
        svg: glossarySvg('standard'),
        caption: 'Feature glossary: every look the Agent might describe, with the exact name to use.',
        alt: `Glossary of suspect features. ${glossaryAlt('standard')}`,
      },
      {
        kind: 'steps',
        items: [
          'Ask how many suspects are in the lineup, then find the matching checklist below.',
          'Ask the Agent to describe each suspect by number: headwear, glasses, hair, accessory, shirt.',
          'Work the checklist in order, crossing out suspects on paper. The screen never changes and positions never renumber.',
          'Exactly one suspect will be left. Tell the Agent: "Tap suspect N, then press Confirm Contact."',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Narrowing questions save time: "Does anyone wear glasses?" or "Who has curly hair?" can cross out ' +
          'several suspects at once. If a description is unclear, ask the Agent to say it another way — ' +
          'clarifying is part of the job.',
      },
      ...checklistBlocks('standard'),
      {
        kind: 'callout',
        tone: 'warning',
        text:
          'Confirming the wrong suspect raises the alarm level. Before you say "confirm", double-check the ' +
          'last suspect standing against every step you crossed out.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees a row of numbered people. One of them is your secret contact. ' +
      'Each person shows five things: hat, glasses, hair, extra item, and shirt. ' +
      'First ask: "How many people do you see?" That picks your list below. ' +
      'Ask about each person. Cross people out on paper, step by step. ' +
      'One person will be left. That is the contact. Say the number. The Agent taps it and confirms.',
    blocks: [
      {
        kind: 'figure',
        svg: glossarySvg('simplified'),
        caption: 'Picture guide: every look, with its name.',
        alt: `Picture guide of looks. ${glossaryAlt('simplified')}`,
      },
      {
        kind: 'steps',
        items: [
          'Ask: "How many people?" Pick that list below.',
          'Ask about each person: hat, glasses, hair, extra item, shirt.',
          'Do the list in order. Cross people out on paper. The numbers on screen never change.',
          'One person is left. Say: "Tap person N. Press Confirm Contact."',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Good questions help a lot. Try: "Does anyone wear glasses?" or "Who has curly hair?" ' +
          'Not sure what the Agent means? Ask again. Asking is smart!',
      },
      ...checklistBlocks('simplified'),
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A wrong pick raises the alarm. Check your paper one more time before you say "confirm".',
      },
    ],
  },
};
