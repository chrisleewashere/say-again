import type { Difficulty, ManualBlock, ManualSection } from '../../engine/types';
import { DIFFICULTY_LABELS } from '../../engine/types';
import {
  BAD_INTEL_RULE,
  CONTROL_TYPES,
  FLAG_LABEL,
  MODELS_BY_DIFFICULTY,
  STEP_RULE_BY_ID,
  TIER_NOTES,
  type ServiceModel,
} from './rules';

/**
 * Bad Intel manual — the control legend, every model's service sequence, and
 * the bad-intel exception are all rendered from the same rule data the
 * solver walks (CONTROL_TYPES, MODELS, STEP_RULES, BAD_INTEL_RULE), so the
 * printed sequences can never drift from app behavior.
 */

const controlFigureSvg = `
<svg viewBox="0 0 560 130" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;font-size:13px;fill:#111}</style>
  <g fill="none" stroke="#111" stroke-width="3">
    <circle cx="70" cy="38" r="24"/>
    <path d="M70 38 L83 21" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M52 22 l4 5 M88 22 l-4 5 M46 38 l6 0 M94 38 l-6 0" stroke-width="2"/>
  </g>
  <circle cx="70" cy="38" r="3.5" fill="#111"/>
  <text x="70" y="86" text-anchor="middle">dial</text>
  <rect x="196" y="12" width="24" height="52" rx="12" fill="none" stroke="#111" stroke-width="3"/>
  <circle cx="208" cy="25" r="9" fill="#111"/>
  <text x="208" y="86" text-anchor="middle">toggle</text>
  <rect x="316" y="56" width="44" height="9" rx="3" fill="#111"/>
  <path d="M338 58 L360 18" stroke="#111" stroke-width="4" stroke-linecap="round" fill="none"/>
  <circle cx="361" cy="15" r="7" fill="#111"/>
  <text x="340" y="86" text-anchor="middle">lever</text>
  <circle cx="480" cy="38" r="24" fill="none" stroke="#111" stroke-width="3"/>
  <path d="M480 38 L480 15 M480 38 L460 50 M480 38 L500 50" stroke="#111" stroke-width="3"/>
  <circle cx="480" cy="38" r="5" fill="#111"/>
  <text x="480" y="86" text-anchor="middle">valve</text>
  <text x="280" y="116" text-anchor="middle" font-style="italic">Every control also shows a big tag letter and a setting number.</text>
</svg>`;

type Edition = 'standard' | 'simplified';

function controlTable(edition: Edition): ManualBlock {
  return {
    kind: 'table',
    header: edition === 'standard' ? ['Control', 'How to spot it'] : ['Control', 'What it looks like'],
    rows: CONTROL_TYPES.map((c) => [c.label, edition === 'standard' ? c.standard : c.simplified]),
  };
}

function modelTable(model: ServiceModel, edition: Edition): ManualBlock {
  return {
    kind: 'table',
    caption: `${model.name} — ${DIFFICULTY_LABELS[model.difficulty]} (${model.steps.length} steps)`,
    header: edition === 'standard' ? ['Step', 'Instruction'] : ['Step', 'Do this'],
    rows: model.steps.map((id, i) => [
      String(i + 1),
      edition === 'standard' ? STEP_RULE_BY_ID[id].standard : STEP_RULE_BY_ID[id].simplified,
    ]),
  };
}

function sequenceBlocks(edition: Edition): ManualBlock[] {
  const blocks: ManualBlock[] = [];
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    const models = MODELS_BY_DIFFICULTY[difficulty];
    blocks.push({
      kind: 'h3',
      text: `${DIFFICULTY_LABELS[difficulty]} panels (${models[0].steps.length} steps)`,
    });
    const note = TIER_NOTES[difficulty];
    if (note) {
      blocks.push({
        kind: 'callout',
        tone: note.tone,
        text: edition === 'standard' ? note.standard : note.simplified,
      });
    }
    for (const model of models) blocks.push(modelTable(model, edition));
  }
  return blocks;
}

export const badIntelManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a maintenance panel: a model name printed across the top and a rack of ' +
      'hardware controls — dials, toggles, levers, valves — each stamped with a big tag letter ' +
      'and a setting number. You hold the service sequence for every model. Find the panel’s ' +
      'model below and read its steps aloud IN ORDER, one at a time; for each step the Agent ' +
      'finds the one control that matches and taps it. One warning before you start: these ' +
      'sequences were printed before the op.',
    blocks: [
      {
        kind: 'figure',
        svg: controlFigureSvg,
        caption: 'The four control types you may hear described.',
        alt: 'Four hardware controls: a round dial with a needle, a toggle switch in a slot, a lever with a ball grip, and a spoked valve wheel',
      },
      controlTable('standard'),
      {
        kind: 'p',
        text:
          'Tag letters: a VOWEL is A, E, I, O, or U; every other letter is a CONSONANT. Steps name ' +
          'hardware by control type plus tag letter — the setting number is just how the Agent ' +
          'describes a control, it never decides a step.',
      },
      ...sequenceBlocks('standard'),
      { kind: 'h3', text: 'The bad intel exception' },
      { kind: 'callout', tone: 'warning', text: BAD_INTEL_RULE.standard },
      { kind: 'h3', text: 'Working a step' },
      {
        kind: 'steps',
        items: [
          'Ask for the model name, then read the current step aloud exactly as printed.',
          'Ask: “What do you see that matches?” Have the Agent name the control — its type, its tag letter, its setting — before anything gets tapped.',
          'Exactly one control matches? The Agent taps it, and you read the next step.',
          'The Agent says nothing matches? Do not agree to flag yet. Ask: “What’s missing?” — have them list every control of that type, then every control with that kind of tag letter.',
          `Still nothing that fits both? The step is bad intel. The Agent presses ${FLAG_LABEL} and you both skip to the next step.`,
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'A wrong tap and a wrong flag both count as wrong answers, and the panel stays exactly ' +
          'as it was. Talking it through first costs nothing.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees a repair panel. The panel has a model name at the top and some controls. ' +
      'Each control has a big letter and a number. This book has the step list for every model. ' +
      'Find the right model below. Read the steps out loud, one at a time. The Agent taps the ' +
      'control each step asks for.',
    blocks: [
      {
        kind: 'figure',
        svg: controlFigureSvg,
        caption: 'The four kinds of controls.',
        alt: 'Four hardware controls: a round dial with a needle, a toggle switch in a slot, a lever with a ball grip, and a spoked valve wheel',
      },
      controlTable('simplified'),
      {
        kind: 'p',
        text: 'Vowel letters are A, E, I, O, U. All other letters are consonants. The number on a control does not matter for the steps.',
      },
      ...sequenceBlocks('simplified'),
      { kind: 'h3', text: 'Bad intel' },
      { kind: 'callout', tone: 'warning', text: BAD_INTEL_RULE.simplified },
      { kind: 'h3', text: 'How to do a step' },
      {
        kind: 'steps',
        items: [
          'Ask for the model name. Read step 1 out loud.',
          'Ask: “What do you see that matches?”',
          'One control matches? The Agent taps it. Read the next step.',
          'Nothing matches? First ask: “What’s missing?” Check the control types. Check the letters.',
          `Really nothing? The step is bad. The Agent presses ${FLAG_LABEL}. Go to the next step.`,
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Not sure? Ask again. Asking is free. A wrong tap or a wrong flag counts against you.',
      },
    ],
  },
};
