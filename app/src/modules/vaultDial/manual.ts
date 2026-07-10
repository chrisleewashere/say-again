import type { ManualBlock, ManualSection } from '../../engine/types';
import { bandRect, coreDotRadius, gemShapePath } from './gemArt';
import {
  baseDigitTable,
  markingHead,
  shapeWord,
  sizeModifierRulesText,
  twistRulesText,
  twistScopeText,
  type Edition,
} from './prose';
import { GEM_MARKINGS, GEM_SHAPES, SIZE_TAGS, TWIST_APPLIES_AT_COUNT, type GemMarking, type GemShape } from './rules';

/* ------------------------------------------------------------------ */
/* Figures — generated from the same shape geometry the app renders.   */
/* Printable: black on white only.                                     */
/* ------------------------------------------------------------------ */

/** One gem drawing (shape outline + marking) as an SVG fragment. */
function gemFragment(shape: GemShape, marking: GemMarking, cx: number, cy: number, r: number, uid: string): string {
  const path = gemShapePath(shape, cx, cy, r);
  const shapeEl = `<path d="${path}" fill="white" stroke="#111" stroke-width="3" fill-rule="evenodd"/>`;
  if (marking === 'band') {
    const b = bandRect(cx, cy, r);
    return (
      `<clipPath id="${uid}"><path d="${path}" clip-rule="evenodd"/></clipPath>` +
      shapeEl +
      `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="#111" clip-path="url(#${uid})"/>`
    );
  }
  if (marking === 'core-dot') {
    return shapeEl + `<circle cx="${cx}" cy="${cy}" r="${coreDotRadius(r)}" fill="#111"/>`;
  }
  return shapeEl;
}

/** Gem glossary: every shape (rows) x marking (columns), labeled. */
function glossarySvg(ed: Edition): string {
  const labelW = 150;
  const colW = 120;
  const headerH = 34;
  const rowH = 82;
  const r = 26;
  const width = labelW + colW * GEM_MARKINGS.length;
  const height = headerH + rowH * GEM_SHAPES.length;

  const headers = GEM_MARKINGS.map(
    (m, i) =>
      `<text x="${labelW + colW * i + colW / 2}" y="24" text-anchor="middle" font-weight="bold">${markingHead(m, ed)}</text>`,
  ).join('');

  const rows = GEM_SHAPES.map((shape, si) => {
    const cy = headerH + rowH * si + rowH / 2;
    const label = `<text x="8" y="${cy + 5}">${shapeWord(shape, ed)}</text>`;
    const cells = GEM_MARKINGS.map((marking, mi) =>
      gemFragment(shape, marking, labelW + colW * mi + colW / 2, cy, r, `vd-gl-${ed}-${si}-${mi}`),
    ).join('');
    return label + cells;
  }).join('');

  return (
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">` +
    `<style>text{font-family:sans-serif;font-size:15px;fill:#111}</style>` +
    headers +
    rows +
    `</svg>`
  );
}

/** Size legend: the same shape shown small and large, each with its printed tag. */
function sizeLegendSvg(ed: Edition): string {
  const small = 'small';
  const large = ed === 'standard' ? 'large' : 'big';
  return (
    `<svg viewBox="0 0 380 140" xmlns="http://www.w3.org/2000/svg" role="img">` +
    `<style>text{font-family:sans-serif;font-size:15px;fill:#111}.vd-tag{font-weight:bold;font-size:18px}</style>` +
    gemFragment('hexagon', 'none', 90, 55, 20, `vd-sz-${ed}-s`) +
    `<rect x="76" y="92" width="28" height="26" fill="white" stroke="#111" stroke-width="2" rx="4"/>` +
    `<text x="90" y="111" text-anchor="middle" class="vd-tag">${SIZE_TAGS.small}</text>` +
    `<text x="90" y="134" text-anchor="middle">${SIZE_TAGS.small} = ${small}</text>` +
    gemFragment('hexagon', 'none', 270, 55, 34, `vd-sz-${ed}-l`) +
    `<rect x="256" y="92" width="28" height="26" fill="white" stroke="#111" stroke-width="2" rx="4"/>` +
    `<text x="270" y="111" text-anchor="middle" class="vd-tag">${SIZE_TAGS.large}</text>` +
    `<text x="270" y="134" text-anchor="middle">${SIZE_TAGS.large} = ${large}</text>` +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ */
/* Manual editions. Rule prose comes from prose.ts (rule data);        */
/* framing text is procedural only.                                    */
/* ------------------------------------------------------------------ */

function tableBlock(ed: Edition): ManualBlock {
  const t = baseDigitTable(ed);
  return {
    kind: 'table',
    caption:
      ed === 'standard'
        ? 'Base digit: find the shape row, then the marking column.'
        : 'Find the shape. Then find the mark. That is the number.',
    header: t.header,
    rows: t.rows,
  };
}

export const vaultDialManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a row of gems mounted above a 0–9 keypad. Each gem has a SHAPE (teardrop, star, ' +
      'hexagon, ring, or wedge), a MARKING (no marking, a band across the middle, or a core dot in the ' +
      'center), and a SIZE (small or large — a printed S or L tag sits under every gem, so size is never ' +
      'a guess). Ask the Agent to describe the gems left to right, one at a time: shape, marking, then ' +
      'size tag. Turn each gem into a digit with the steps below, then read the whole code back so the ' +
      'Agent can key it in and press ENTER.',
    blocks: [
      {
        kind: 'figure',
        svg: glossarySvg('standard'),
        caption: 'Gem glossary: every shape with each of the three markings.',
        alt: 'Grid of five gem shapes — teardrop, star, hexagon, ring, wedge — each drawn three ways: with no marking, with a dark band across the middle, and with a dark core dot in the center.',
      },
      {
        kind: 'figure',
        svg: sizeLegendSvg('standard'),
        caption: 'Size legend: every gem carries a printed S (small) or L (large) tag beneath it.',
        alt: 'Two hexagon gems side by side: a small one above a boxed letter S, and a larger one above a boxed letter L.',
      },
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Vague descriptions crack no safes. If the Agent says "the pointy one," ask a clarifying question: ' +
          '"Pointy at the top or the bottom? Does it have a band, a dot, or no marking? What is its size tag?"',
      },
      { kind: 'h3', text: 'Step 1 — Look up each gem’s base digit' },
      tableBlock('standard'),
      { kind: 'h3', text: 'Step 2 — Apply the size rule to each gem' },
      { kind: 'ruleList', caption: 'Apply to every gem.', rules: sizeModifierRulesText('standard') },
      { kind: 'h3', text: `Step 3 — The twist (${TWIST_APPLIES_AT_COUNT}-gem vaults only)` },
      { kind: 'p', text: twistScopeText('standard') },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: twistRulesText('standard') },
      {
        kind: 'steps',
        items: [
          'Ask: "How many gems do you see?"',
          'For each gem, left to right: get its shape, its marking, and its printed size tag.',
          'Compute each digit with Steps 1 and 2. Jot them down in order.',
          `If there are ${TWIST_APPLIES_AT_COUNT} or more gems, run Step 3 on the whole code.`,
          'Read the final code aloud, digit by digit. The Agent keys it in, reads it back, then presses ENTER.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        text:
          'A wrong ENTER raises the alarm level and clears the keypad. Before ENTER, have the Agent read the ' +
          'entered digits back to you and confirm they match.',
      },
    ],
  },
  simplified: {
    intro:
      'The Agent sees gems in a row. Under the gems is a number pad. Each gem has a shape, a mark, and a ' +
      'size tag (S or L). Ask about one gem at a time: "What shape? What mark? S or L?" Use the table to ' +
      'get each number. Then tell the Agent the code.',
    blocks: [
      {
        kind: 'figure',
        svg: glossarySvg('simplified'),
        caption: 'All the gems and marks.',
        alt: 'Five gem shapes — teardrop, star, hexagon, ring, wedge — each shown plain, with a band, and with a middle dot.',
      },
      {
        kind: 'figure',
        svg: sizeLegendSvg('simplified'),
        caption: 'S means small. L means big.',
        alt: 'A small hexagon gem with the letter S under it, and a big hexagon gem with the letter L under it.',
      },
      {
        kind: 'bullets',
        items: [
          'Gems go left to right. Gem 1 is on the left.',
          'Every gem has a tag: S or L.',
          'Ask about shape, mark, and tag.',
        ],
      },
      { kind: 'h3', text: 'Step 1 — Find the number' },
      tableBlock('simplified'),
      { kind: 'h3', text: 'Step 2 — Check the size tag' },
      { kind: 'ruleList', caption: 'Do this for every gem.', rules: sizeModifierRulesText('simplified') },
      { kind: 'h3', text: `Step 3 — Only for ${TWIST_APPLIES_AT_COUNT} gems` },
      { kind: 'p', text: twistScopeText('simplified') },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: twistRulesText('simplified') },
      {
        kind: 'steps',
        items: [
          'Ask: "How many gems?"',
          'Ask about each gem: shape, mark, tag.',
          'Turn each gem into a number.',
          `${TWIST_APPLIES_AT_COUNT} gems? Do Step 3.`,
          'Say the code. The Agent types it and presses ENTER.',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Not sure about a gem? Ask again. Asking is smart! Have the Agent read the code back before ENTER.',
      },
    ],
  },
};
