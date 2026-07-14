import type { ManualBlock, ManualSection } from '../../engine/types';
import { LINK_RULES, SLOT_MARKER_RULES, SLOTS_BY_DIFFICULTY, MARKER_BY_SLOT } from './rules';

/**
 * Debrief Tapes manual — every table below is rendered from the same rule
 * data the solver uses (marker rules, slot order, link rules), so the
 * printed report template can never drift from the app.
 */

const markerFigureSvg = `
<svg viewBox="0 0 560 120" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;font-size:13px;fill:#111}</style>
  <polygon points="40,14 32,30 39,30 34,44 48,26 40,26 46,14" fill="#111"/>
  <text x="40" y="66" text-anchor="middle">alert bolt</text>
  <g fill="none" stroke="#111" stroke-width="2.5">
    <ellipse cx="150" cy="24" rx="14" ry="10"/>
  </g>
  <circle cx="139" cy="38" r="2.5" fill="#111"/>
  <circle cx="134" cy="45" r="1.5" fill="#111"/>
  <text x="150" y="66" text-anchor="middle">thought bubble</text>
  <g fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M250 14 l11 10 l-11 10"/>
    <path d="M262 14 l11 10 l-11 10"/>
  </g>
  <text x="266" y="66" text-anchor="middle">motion arrows</text>
  <path d="M376 12 l6 9 l-7 4 l9 8 l-5 10" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/>
  <text x="380" y="66" text-anchor="middle">crack</text>
  <g>
    <circle cx="490" cy="26" r="14" fill="none" stroke="#111" stroke-width="3"/>
    <path d="M482 26 l6 6 l10 -11" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="490" y="66" text-anchor="middle">case seal</text>
  <text x="280" y="100" text-anchor="middle" font-style="italic">The opening still has NO corner marker.</text>
</svg>`;

function markerTable(edition: 'standard' | 'simplified'): ManualBlock {
  return {
    kind: 'table',
    caption:
      edition === 'standard'
        ? 'Identify each still by its corner marker.'
        : 'Match the corner symbol to the report part.',
    header: ['Corner marker', 'Report entry'],
    rows: SLOT_MARKER_RULES.map((r) => [
      edition === 'standard' ? r.standard : r.simplified,
      r.slotLabel,
    ]),
  };
}

function orderList(edition: 'standard' | 'simplified'): ManualBlock {
  const tierNames: [string, string, string] = ['Rookie', 'Agent', 'Mastermind'];
  return {
    kind: 'table',
    caption:
      edition === 'standard'
        ? 'The report template — entries always go in this order (skip entries the tape does not have).'
        : 'The report order. Skip parts that are not in the tape.',
    header: ['Tape size', 'Report order'],
    rows: ([1, 2, 3] as const).map((d, i) => [
      `${tierNames[i]} — ${SLOTS_BY_DIFFICULTY[d].length} stills`,
      SLOTS_BY_DIFFICULTY[d].map((slot) => MARKER_BY_SLOT[slot].slotLabel.split(' — ')[0]).join(' → '),
    ]),
  };
}

function linkList(edition: 'standard' | 'simplified'): ManualBlock {
  return {
    kind: 'ruleList',
    caption:
      edition === 'standard'
        ? 'Linking words (Agent and Mastermind tapes): find the pair of entries, use its word.'
        : 'Linking words. Find the two parts, say the word.',
    rules: LINK_RULES.map((r) => (edition === 'standard' ? r.standard : r.simplified)),
  };
}

export const debriefTapesManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees numbered surveillance stills from a finished operation — but the tape got ' +
      'shuffled. Each still shows the operative somewhere, and most carry a corner marker. Ask the ' +
      'Agent to describe every still (its letter, who, where, and the corner marker). Use the marker ' +
      'table to identify each entry, then dictate the report order. Letters on the stills are NAMES ' +
      'for talking about them — they say nothing about order.',
    blocks: [
      {
        kind: 'figure',
        svg: markerFigureSvg,
        caption: 'The corner markers you may hear described.',
        alt: 'Five corner markers: alert bolt, thought bubble, motion arrows, crack, case seal',
      },
      markerTable('standard'),
      orderList('standard'),
      { kind: 'h3', text: 'Linking the entries (Agent and Mastermind tapes)' },
      {
        kind: 'p',
        text:
          'After the order is locked, the tape asks for the word that joins each pair of entries: ' +
          'THEN (it simply comes next), SO (it happens because of the one before), or BUT (it gets in the way).',
      },
      linkList('standard'),
      { kind: 'h3', text: 'Record the debrief' },
      {
        kind: 'steps',
        items: [
          'When the order (and links) are locked, the Agent retells the WHOLE operation aloud, start to finish, using the linking words.',
          'Listen for every entry: who and where, what went wrong, the plan, what they did, and how it ended.',
          'Something missing or out of order? Ask the Agent to rewind and tell that part again.',
          'Satisfied? The Agent presses “Tape recorded”.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        text:
          'Locking a still into the wrong report position counts as a wrong answer. If you are unsure which entry a still is, ask about its corner marker again before you dictate.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees photo stills from a spy story. The story is mixed up. ' +
      'Ask about each still: What letter? Who is in it? Where are they? What small symbol is in the corner? ' +
      'The letters are just names. They do NOT show the order.',
    blocks: [
      {
        kind: 'figure',
        svg: markerFigureSvg,
        caption: 'The corner symbols.',
        alt: 'Five corner symbols: alert bolt, thought bubble, motion arrows, crack, case seal',
      },
      markerTable('simplified'),
      orderList('simplified'),
      { kind: 'h3', text: 'Linking words (harder tapes)' },
      {
        kind: 'p',
        text: 'THEN = it comes next. SO = it happens because of the last part. BUT = trouble gets in the way.',
      },
      linkList('simplified'),
      { kind: 'h3', text: 'Tell the story' },
      {
        kind: 'steps',
        items: [
          'When all the stills are in order, the Agent tells the whole story out loud.',
          'Listen. Is every part there? Is it in order?',
          'If a part is missing, ask for it again.',
          'Then the Agent presses “Tape recorded”.',
        ],
      },
      { kind: 'callout', tone: 'tip', text: 'Not sure which part a still is? Ask about the corner symbol again. Asking is free!' },
    ],
  },
};
