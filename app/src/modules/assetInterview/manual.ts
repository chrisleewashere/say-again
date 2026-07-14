import type { ManualBlock, ManualSection } from '../../engine/types';
import { DIFFICULTY_LABELS, type Difficulty } from '../../engine/types';
import {
  FIELD_BY_ID,
  FIELD_RULES,
  FORMS_BY_DIFFICULTY,
  formDepth,
  VERDICT_BY_ID,
  VERDICTS,
  type FactIcon,
  type FieldId,
  type FlowNode,
  type FormRule,
} from './rules';

/**
 * Asset Interview manual — the question flows below are rendered from the
 * same FORMS tree data the solver walks, and the legend/verdict tables from
 * the same FIELD_RULES/VERDICTS tables the app renders, so the printed
 * manual can never drift from app behavior.
 */

/* ------------------------------------------------------------------ */
/* Fact-icon legend figure (same shapes the statement card draws).     */
/* ------------------------------------------------------------------ */

function iconMarkup(icon: FactIcon): string {
  switch (icon) {
    case 'dawn':
      return '<line x1="6" y1="28" x2="34" y2="28"/><path d="M12 28 a8 8 0 0 1 16 0"/><line x1="20" y1="16" x2="20" y2="8"/><path d="M16 12 l4 -4 l4 4"/>';
    case 'noon': {
      const rays = [0, 45, 90, 135, 180, 225, 270, 315]
        .map((deg) => {
          const r = (deg * Math.PI) / 180;
          const f = (n: number) => n.toFixed(1);
          return `<line x1="${f(20 + Math.cos(r) * 10)}" y1="${f(20 + Math.sin(r) * 10)}" x2="${f(20 + Math.cos(r) * 14)}" y2="${f(20 + Math.sin(r) * 14)}"/>`;
        })
        .join('');
      return `<circle cx="20" cy="20" r="7"/>${rays}`;
    }
    case 'dusk':
      return '<line x1="6" y1="28" x2="34" y2="28"/><path d="M12 28 a8 8 0 0 1 16 0"/><line x1="20" y1="8" x2="20" y2="16"/><path d="M16 12 l4 4 l4 -4"/>';
    case 'night':
      return '<path d="M24 8 a12 12 0 1 0 0 24 a9.5 9.5 0 1 1 0 -24 z" fill="#111" stroke="none"/><path d="M31 12 l1.4 2.8 2.8 1.4 -2.8 1.4 -1.4 2.8 -1.4 -2.8 -2.8 -1.4 2.8 -1.4 z" fill="#111" stroke="none"/>';
    case 'tram':
      return '<path d="M14 10 l6 -5 l6 5"/><rect x="10" y="10" width="20" height="16" rx="3"/><rect x="13" y="14" width="5" height="5"/><rect x="22" y="14" width="5" height="5"/><circle cx="15" cy="29" r="2.5"/><circle cx="25" cy="29" r="2.5"/>';
    case 'cafe':
      return '<path d="M10 18 h16 v8 a8 8 0 0 1 -16 0 z"/><path d="M26 20 h3 a3 3 0 0 1 0 6 h-3"/><path d="M15 8 q2 3 0 6"/><path d="M21 8 q2 3 0 6"/>';
    case 'bridge':
      return '<line x1="6" y1="20" x2="34" y2="20"/><line x1="6" y1="28" x2="34" y2="28"/><path d="M10 28 a10 10 0 0 1 20 0"/><line x1="9" y1="20" x2="9" y2="12"/><line x1="31" y1="20" x2="31" y2="12"/>';
    case 'kiosk':
      return '<path d="M8 16 l4 -7 h16 l4 7 z"/><rect x="11" y="16" width="18" height="14"/><rect x="15" y="20" width="10" height="5"/>';
    case 'case':
      return '<rect x="9" y="15" width="22" height="15" rx="2"/><path d="M16 15 v-4 h8 v4"/><line x1="9" y1="22" x2="31" y2="22"/>';
    case 'newspaper':
      return '<rect x="9" y="11" width="18" height="19"/><path d="M27 13 h4 v17 h-4"/><line x1="12" y1="16" x2="24" y2="16"/><line x1="12" y1="20" x2="24" y2="20"/><line x1="12" y1="24" x2="24" y2="24"/>';
    case 'flowers':
      return '<circle cx="20" cy="7.5" r="3.2"/><circle cx="14.5" cy="13" r="3.2"/><circle cx="25.5" cy="13" r="3.2"/><circle cx="20" cy="13" r="2.4" fill="#111" stroke="none"/><path d="M20 17 v15"/><path d="M20 26 q-6 -2 -7 -7"/>';
    case 'nothing':
      return '<circle cx="20" cy="20" r="10"/><line x1="15" y1="20" x2="25" y2="20"/>';
    case 'alone':
      return '<circle cx="20" cy="13" r="5"/><path d="M10 32 a10 8 0 0 1 20 0"/>';
    case 'companion':
      return '<circle cx="14" cy="13" r="4"/><path d="M6 30 a8 7 0 0 1 16 0"/><circle cx="27" cy="13" r="4"/><path d="M19 30 a8 7 0 0 1 16 0"/>';
    case 'chalkYes':
      return '<rect x="7" y="10" width="26" height="20"/><line x1="14" y1="15" x2="26" y2="25"/><line x1="26" y1="15" x2="14" y2="25"/>';
    case 'chalkNo':
      return '<rect x="7" y="10" width="26" height="20"/><line x1="7" y1="20" x2="33" y2="20"/><line x1="20" y1="10" x2="20" y2="20"/>';
  }
}

function legendSvg(): string {
  const cellW = 128;
  const rowH = 92;
  let y = 8;
  let body = '';
  for (const field of FIELD_RULES) {
    body += `<text x="8" y="${y + 12}" font-weight="700">${field.label}</text>`;
    field.values.forEach((value, i) => {
      const x = 8 + i * cellW;
      body += `<g transform="translate(${x + 24},${y + 20})" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${iconMarkup(value.icon)}</g>`;
      body += `<text x="${x + 44}" y="${y + 62}" text-anchor="middle">${value.label}</text>`;
    });
    y += rowH;
  }
  return `
<svg viewBox="0 0 540 ${y + 4}" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;font-size:13px;fill:#111}</style>
  ${body}
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Rendering helpers — all generated from the rule tables.             */
/* ------------------------------------------------------------------ */

type Edition = 'standard' | 'simplified';

function valueName(fieldId: FieldId, valueId: string): string {
  const value = FIELD_BY_ID[fieldId].values.find((v) => v.id === valueId)!;
  return value.label.toUpperCase();
}

function nodeLine(node: FlowNode, edition: Edition): string {
  const field = FIELD_BY_ID[node.ask];
  const question = edition === 'standard' ? field.standard : field.simplified;
  const branches = node.branches.map((branch) => {
    const names = branch.values.map((v) => valueName(node.ask, v)).join(' or ');
    const target =
      branch.verdict !== undefined
        ? `verdict: ${VERDICT_BY_ID[branch.verdict].label.toUpperCase()}`
        : `go to step ${branch.goTo! + 1}`;
    return edition === 'standard' ? `If ${names}, ${target}.` : `${names} → ${target}.`;
  });
  return `${question} ${branches.join(' ')}`;
}

function formBlocks(form: FormRule, edition: Edition): ManualBlock[] {
  const tier = DIFFICULTY_LABELS[form.difficulty];
  const heading =
    edition === 'standard'
      ? `FORM ${form.id} — ${tier} (at most ${formDepth(form)} questions)`
      : `FORM ${form.id} — ${tier}`;
  return [
    { kind: 'h3', text: heading },
    { kind: 'steps', items: form.nodes.map((node) => nodeLine(node, edition)) },
  ];
}

function allFormBlocks(edition: Edition): ManualBlock[] {
  return ([1, 2, 3] as Difficulty[]).flatMap((d) =>
    FORMS_BY_DIFFICULTY[d].flatMap((form) => formBlocks(form, edition)),
  );
}

function verdictTable(edition: Edition): ManualBlock {
  return {
    kind: 'table',
    caption:
      edition === 'standard'
        ? 'The six verdicts. Dictate the verdict word for word — the Agent commits it from six buttons.'
        : 'The six verdicts. Say the verdict. The Agent presses its button.',
    header: ['Verdict', 'Button badge', 'Dossier note'],
    rows: VERDICTS.map((v) => [
      v.label.toUpperCase(),
      v.iconName,
      edition === 'standard' ? v.standard : v.simplified,
    ]),
  };
}

const legendFigure: ManualBlock = {
  kind: 'figure',
  svg: legendSvg(),
  caption: 'The statement icons, row by row — everything the Agent may report seeing.',
  alt:
    'Legend of statement icons: time of day (dawn, noon, dusk, night), place (the tram stop, the cafe, ' +
    'the bridge, the kiosk), carrying (a case, a newspaper, flowers, nothing), company (alone, with a ' +
    'companion), and chalk mark seen (yes, no)',
};

export const assetInterviewManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a WITNESS STATEMENT: an interview form letter and five observed facts — time of ' +
      'day, place, what the person was carrying, company, and whether a chalk mark was seen. You hold ' +
      'the question flows; the Agent cannot see them. Ask for the FORM LETTER first, then walk that ' +
      "form's numbered flow from step 1, asking one question at a time, until it ends in a verdict. " +
      'Dictate the verdict and the Agent commits it on screen.',
    blocks: [
      legendFigure,
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Ask ONE question at a time, and have the Agent answer only the question you asked. Getting ' +
          'exactly the information you need — no more, no less — is the whole exercise.',
      },
      { kind: 'h3', text: 'The verdicts' },
      verdictTable('standard'),
      { kind: 'h3', text: 'The question flows' },
      {
        kind: 'p',
        text:
          'Find the form the Agent reads off the statement stamp. Start at step 1. Every answer sends ' +
          'you to another step or ends in a verdict. The facts the flow never asks about do not matter — ' +
          'do not let them distract you.',
      },
      ...allFormBlocks('standard'),
      {
        kind: 'callout',
        tone: 'warning',
        text:
          'A wrong verdict raises the alarm, but the statement does not change. The fix is to re-walk ' +
          "the same flow OUT LOUD from step 1 — read each question, hear the Agent's answer, and say " +
          'which step it sends you to — until you both hear where it leads.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees a witness card: a FORM LETTER and five facts. You have the question lists. ' +
      'Ask: "What is the form letter?" Then use that form. Start at step 1. Ask one question. ' +
      'The answer tells you the next step. At the end, say the verdict. The Agent presses its button.',
    blocks: [
      legendFigure,
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Ask ONE question at a time. The Agent answers ONLY that question.',
      },
      { kind: 'h3', text: 'The verdicts' },
      verdictTable('simplified'),
      { kind: 'h3', text: 'The question lists' },
      { kind: 'p', text: 'Use the form with the letter the Agent read. Start at step 1.' },
      ...allFormBlocks('simplified'),
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Wrong verdict? The card did not change. Walk the same list again, out loud, from step 1. ' +
          'Say each question and each answer. You will find the right verdict together.',
      },
    ],
  },
};
