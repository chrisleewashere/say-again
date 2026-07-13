/**
 * Builds the printable Handler Field Manual (HTML) for both editions from the
 * module registry — the exact same rule data the app evaluates. Run with:
 *   npx vite-node scripts/generateManualHtml.ts
 * Outputs ../manual/build/manual-standard.html and manual-simplified.html.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allModules } from '../src/engine/registry';
import { registerAllModules } from '../src/modules/registerAll';
import type { ManualBlock, ManualEdition } from '../src/engine/types';
import { DIFFICULTY_LABELS, THERAPY_TARGET_LABELS } from '../src/engine/types';

registerAllModules();

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../manual/build');

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderBlock(block: ManualBlock): string {
  switch (block.kind) {
    case 'h3':
      return `<h3>${esc(block.text)}</h3>`;
    case 'p':
      return `<p>${esc(block.text)}</p>`;
    case 'callout':
      return `<div class="callout callout-${block.tone}"><span class="callout-tag">${
        block.tone === 'tip' ? 'TIP' : 'CAREFUL'
      }</span> ${esc(block.text)}</div>`;
    case 'steps':
      return `<ol class="steps">${block.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
    case 'bullets':
      return `<ul class="bullets">${block.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'table':
      return `<table class="rule-table">${
        block.caption ? `<caption>${esc(block.caption)}</caption>` : ''
      }<thead><tr>${block.header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${block.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;
    case 'ruleList':
      return `<div class="rule-list">${
        block.caption ? `<p class="rule-list-caption">${esc(block.caption)}</p>` : ''
      }<ol>${block.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></div>`;
    case 'figure':
      // svg is authored in-repo (module manual data), not user input
      return `<figure role="img" aria-label="${esc(block.alt)}">${block.svg}<figcaption>${esc(
        block.caption,
      )}</figcaption></figure>`;
  }
}

function renderEdition(editionKey: 'standard' | 'simplified'): string {
  const modules = allModules();
  const editionName = editionKey === 'standard' ? 'Standard Edition' : 'Easy-Read Edition';

  const toc = modules
    .map((m, i) => `<li><span class="toc-num">${i + 1}</span> ${esc(m.codename)}</li>`)
    .join('');

  const sections = modules
    .map((m, i) => {
      const ed: ManualEdition = m.manual[editionKey];
      return `
<section class="module-section">
  <header class="module-head">
    <div class="module-num">PUZZLE ${i + 1}</div>
    <h2>${esc(m.codename)}</h2>
    <p class="module-goals">Practices: ${esc(
      [THERAPY_TARGET_LABELS[m.targets.primary], ...m.targets.secondary.map((t) => THERAPY_TARGET_LABELS[t])].join(
        ' · ',
      ),
    )}</p>
  </header>
  <p class="module-intro">${esc(ed.intro)}</p>
  ${ed.blocks.map(renderBlock).join('\n')}
</section>`;
    })
    .join('\n');

  const briefing =
    editionKey === 'standard'
      ? `<p>You are the <strong>Handler</strong>. Your partner — the <strong>Field Agent</strong> — can see the
         puzzles on the device, but cannot see this manual. You can see the rules, but not the screen.</p>
         <ol class="steps">
           <li>Ask the Agent what kind of puzzle is on screen, then turn to that puzzle's pages.</li>
           <li>Ask for details: colors, shapes, letters, numbers, positions.</li>
           <li>Work the rules out loud and give one clear direction at a time.</li>
           <li>Have the Agent repeat the direction back before they touch anything.</li>
           <li>Wrong guesses can fail the module and drag the mission grade down — asking another question never costs a thing.</li>
         </ol>`
      : `<p>You are the <strong>Handler</strong>. Your partner is the <strong>Agent</strong>.
         The Agent sees the puzzle. You see the rules. Talk to win!</p>
         <ol class="steps">
           <li>Ask: "What puzzle do you see?"</li>
           <li>Find that puzzle in this book.</li>
           <li>Ask about colors, shapes, and letters.</li>
           <li>Say one step at a time.</li>
           <li>Not sure? Ask again. Asking is always free. A wrong pick is not.</li>
         </ol>`;

  const difficultyNote = `The app calls easy puzzles ${esc(DIFFICULTY_LABELS[1])}, medium ${esc(
    DIFFICULTY_LABELS[2],
  )}, and hard ${esc(DIFFICULTY_LABELS[3])}. Some rules only appear on harder missions — those parts are labeled.`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Field Manual — ${editionName}</title>
<style>${MANUAL_CSS}</style>
</head>
<body class="${editionKey}">
<section class="cover">
  <div class="cover-stamp">HANDLER EYES ONLY</div>
  <svg class="cover-badge" viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
    <circle cx="60" cy="60" r="54" fill="none" stroke="#111" stroke-width="4"/>
    <circle cx="60" cy="60" r="42" fill="none" stroke="#111" stroke-width="1.5" stroke-dasharray="6 8"/>
    <path d="M40 62 l14 14 l26 -30" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <h1>Say Again?</h1>
  <p class="cover-sub">FIELD MANUAL — ${editionName.toUpperCase()}</p>
  <p class="cover-note">Print me. Hand me to the Handler. Never show the Agent.</p>
</section>

<section class="module-section">
  <header class="module-head"><h2>Handler Briefing</h2></header>
  ${briefing}
  <p>${difficultyNote}</p>
  ${
    editionKey === 'standard'
      ? `<div class="callout callout-tip"><span class="callout-tag">TIP</span> Every rule list runs in order from the top — but read its caption first. Lists captioned
  &ldquo;apply the first match&rdquo; stop at the first rule that fits. Checklists and step lists (like elimination
  checklists or &ldquo;apply to every gem&rdquo; rules) work EVERY step, top to bottom, without stopping.</div>`
      : `<div class="callout callout-tip"><span class="callout-tag">TIP</span> Always go down the list from the top. Read the words above the list first:
  if it says &ldquo;use the first rule that fits&rdquo;, stop when one fits. If it is a checklist, do every step.</div>`
  }
</section>

<section class="module-section">
  <header class="module-head"><h2>Contents</h2></header>
  <ul class="toc">${toc}</ul>
</section>

${sections}

<section class="module-section">
  <header class="module-head"><h2>Credits &amp; Privacy</h2></header>
  <p>Say Again? is an original cooperative communication game designed for
  speech-language practice. The app stores nothing off-device and collects no personal data.</p>
</section>
</body>
</html>`;
}

const MANUAL_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; line-height: 1.5; }
  body.simplified { font-family: Verdana, Tahoma, sans-serif; font-size: 1.02em; line-height: 1.7; }
  .cover { text-align: center; padding: 90px 40px 40px; page-break-after: always; }
  .cover h1 { font-size: 2.6em; margin: 24px 0 8px; letter-spacing: 0.01em; }
  .cover-sub { font-size: 1.1em; letter-spacing: 0.25em; }
  .cover-stamp { display: inline-block; border: 3px solid #111; padding: 6px 18px; font-weight: bold;
    letter-spacing: 0.2em; transform: rotate(-3deg); margin-bottom: 30px; }
  .cover-note { margin-top: 60px; font-style: italic; }
  .module-section { padding: 24px 40px; page-break-before: always; }
  .module-head { border-bottom: 3px solid #111; margin-bottom: 14px; padding-bottom: 6px; }
  .module-num { font-size: 0.8em; letter-spacing: 0.25em; font-weight: bold; }
  .module-head h2 { margin: 2px 0 2px; font-size: 1.7em; }
  .module-goals { margin: 0; font-size: 0.85em; font-style: italic; }
  .module-intro { font-size: 1.05em; }
  h3 { margin: 22px 0 8px; font-size: 1.15em; border-bottom: 1px solid #999; padding-bottom: 3px; }
  .callout { border: 2px solid #111; border-radius: 8px; padding: 10px 14px; margin: 14px 0; }
  .callout-tag { font-weight: bold; letter-spacing: 0.15em; margin-right: 8px; }
  .rule-list ol, ol.steps { margin: 8px 0; padding-left: 1.6em; }
  .rule-list li, ol.steps li { margin-bottom: 8px; }
  .rule-list-caption { font-style: italic; margin: 8px 0 4px; }
  .rule-table { border-collapse: collapse; margin: 12px 0; width: 100%; page-break-inside: avoid; }
  .rule-table caption { text-align: left; font-style: italic; margin-bottom: 6px; }
  .rule-table th, .rule-table td { border: 1.5px solid #111; padding: 6px 10px; text-align: left; }
  .rule-table th { background: #eee; }
  figure { margin: 16px 0; text-align: center; page-break-inside: avoid; }
  figure svg { max-width: 100%; height: auto; }
  figcaption { font-size: 0.85em; font-style: italic; margin-top: 6px; }
  .toc { list-style: none; padding: 0; font-size: 1.15em; }
  .toc li { margin-bottom: 10px; }
  .toc-num { display: inline-block; width: 2em; font-weight: bold; }
  ul.bullets { margin: 8px 0; padding-left: 1.4em; }
  ul.bullets li { margin-bottom: 6px; }
`;

mkdirSync(outDir, { recursive: true });
for (const edition of ['standard', 'simplified'] as const) {
  const html = renderEdition(edition);
  const file = resolve(outDir, `manual-${edition}.html`);
  writeFileSync(file, html);
  console.log(`wrote ${file} (${(html.length / 1024).toFixed(0)} kB)`);
}
