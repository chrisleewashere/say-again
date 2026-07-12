#!/usr/bin/env node
/**
 * Module scaffolder — the extensibility contract in executable form.
 *
 *   node scripts/newModule.mjs <kebab-id> "<Codename>" <primaryTarget>
 *   e.g. node scripts/newModule.mjs dead-drop "Dead Drop Decoder" vocabulary
 *
 * Generates src/modules/<camelId>/ with the full module contract (rules,
 * logic, prose, manual, component, css, index, property-test skeleton),
 * mirroring the wireMaze reference module. New modules NEVER require 3D
 * work: index.ts ships the default faceplate descriptor and the Field Case
 * shell mounts the module automatically.
 *
 * Interactive-free by design: all input comes from argv, exit code 1 on any
 * validation failure. Templates live in this file as string literals.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES_DIR = join(APP_ROOT, 'src', 'modules');
const TARGETS = ['receptive', 'expressive', 'pragmatics', 'vocabulary'];

function fail(msg) {
  console.error(`\nerror: ${msg}\n`);
  console.error('usage: node scripts/newModule.mjs <kebab-id> "<Codename>" <primaryTarget>');
  console.error(`       primaryTarget: ${TARGETS.join(' | ')}`);
  console.error('       e.g. node scripts/newModule.mjs dead-drop "Dead Drop Decoder" vocabulary');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Validate argv.                                                      */
/* ------------------------------------------------------------------ */

const [, , kebab, codename, target, ...extra] = process.argv;

if (!kebab || !codename || !target) fail('expected exactly 3 arguments');
if (extra.length > 0) fail(`unexpected extra argument(s): ${extra.join(' ')} (quote the codename?)`);
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(kebab)) {
  fail(`id "${kebab}" is not kebab-case (lowercase letters/digits, single dashes, starts with a letter)`);
}
if (!TARGETS.includes(target)) fail(`unknown target "${target}" — expected one of: ${TARGETS.join(' | ')}`);
if (codename.trim().length < 2) fail('codename looks empty — pass it quoted, e.g. "Dead Drop Decoder"');

const camel = kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const pascal = camel[0].toUpperCase() + camel.slice(1);
const CONST = kebab.replace(/-/g, '_').toUpperCase();
const moduleDir = join(MODULES_DIR, camel);

if (existsSync(moduleDir)) fail(`src/modules/${camel}/ already exists`);
// The id must be unused across every registered module (ids live in each module's index.ts).
for (const entry of readdirSync(MODULES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = join(MODULES_DIR, entry.name, 'index.ts');
  if (existsSync(indexPath) && readFileSync(indexPath, 'utf8').includes(`id: '${kebab}'`)) {
    fail(`module id "${kebab}" is already used by src/modules/${entry.name}/`);
  }
}

/* ------------------------------------------------------------------ */
/* Templates. Mirror src/modules/wireMaze/ — keep them in sync when    */
/* the reference module's structure evolves.                           */
/* ------------------------------------------------------------------ */

const rulesTs = `/**
 * ${codename} (${kebab}) — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables and let prose.ts render them.
 *
 * Original game content only. Design rules the Handler can apply from print:
 * ordered if/then lists where the first matching rule wins, ending in an
 * always-rule so evaluation is total. Never encode information in color or
 * sound alone — pair every color with a pattern, label, or position.
 */

/** Conditions evaluate against the puzzle state the Field Agent describes. */
export type ${pascal}Condition =
  | { c: 'always' };
// TODO: add real conditions, e.g. | { c: 'countSymbol'; symbol: ...; op: 'eq' | 'gte'; n: number }

/** Actions select exactly one answer. Every action must be resolvable whenever its condition holds. */
export type ${pascal}Action =
  | { a: 'todo' };
// TODO: add real actions, e.g. | { a: 'pressPosition'; pos: number }

export interface ${pascal}Rule {
  when: ${pascal}Condition;
  then: ${pascal}Action;
}

/**
 * Rule tables keyed by difficulty. Evaluated top-down; the first rule whose
 * condition holds is applied. Each table ends in an always-rule so evaluation
 * is total (verified by the 1000-seed property tests in ${camel}.test.ts).
 */
export const ${CONST}_RULES: Record<1 | 2 | 3, ${pascal}Rule[]> = {
  1: [{ when: { c: 'always' }, then: { a: 'todo' } }],
  2: [{ when: { c: 'always' }, then: { a: 'todo' } }],
  3: [{ when: { c: 'always' }, then: { a: 'todo' } }],
};
`;

const logicTs = `import { mulberry32, randInt } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import { ${CONST}_RULES, type ${pascal}Rule } from './rules';

/**
 * Everything the Field Agent sees on screen — and nothing more. The solution
 * must be derivable from this state plus the rule tables in rules.ts (which is
 * exactly what the Handler's printed manual contains). Never hide extra
 * solution data in here.
 */
export interface ${pascal}State {
  // TODO: replace with the real puzzle state.
  placeholderValue: number;
}

/** TODO: replace with the answer shape the Agent commits (index, sequence, ...). */
export type ${pascal}Answer = number;

export function generate${pascal}(seed: number, difficulty: Difficulty): PuzzleInstance<${pascal}State> {
  const rng = mulberry32(seed);
  // TODO: derive the full puzzle from rng + difficulty. Deterministic only —
  // never call Math.random(); same (seed, difficulty) must yield same state.
  return {
    moduleId: '${kebab}',
    difficulty,
    seed,
    state: { placeholderValue: randInt(rng, 1, 4) },
  };
}

/**
 * Robot Handler: derive the correct answer using ONLY the module's exported
 * rule tables — the same data the printed manual is generated from. Tests
 * assert validate(state, solve(state)) across 1000 seeds per difficulty.
 */
export function solve${pascal}(state: ${pascal}State): ${pascal}Answer {
  const table: ${pascal}Rule[] = ${CONST}_RULES[1]; // TODO: key by real state/difficulty signal
  for (const rule of table) {
    switch (rule.when.c) {
      case 'always':
        // TODO: resolve rule.then against state instead of echoing state.
        return state.placeholderValue;
    }
  }
  throw new Error('${kebab}: rule table not total — every table must end in an always-rule');
}

export function validate${pascal}(state: ${pascal}State, answer: ${pascal}Answer): boolean {
  return answer === solve${pascal}(state);
}
`;

const proseTs = `/**
 * Turns ${kebab} rule data into manual prose. The manual generator calls
 * these, so printed rules always match the engine — never write rule prose
 * by hand.
 */
import { ${CONST}_RULES, type ${pascal}Action, type ${pascal}Condition } from './rules';

export type Edition = 'standard' | 'simplified';

export function conditionToText(cond: ${pascal}Condition, ed: Edition): string {
  const s = ed === 'standard'; // standard: ~7th–9th grade; simplified: ~3rd–5th grade
  switch (cond.c) {
    case 'always':
      return s ? 'If none of the rules above matched' : 'If no rule above worked';
    // TODO: one case per real condition, both editions.
  }
}

export function actionToText(action: ${pascal}Action, ed: Edition): string {
  const s = ed === 'standard';
  switch (action.a) {
    case 'todo':
      return s ? 'do the placeholder action (TODO)' : 'do the placeholder action (TODO)';
    // TODO: one case per real action, both editions.
  }
}

/** Render a full rule table to ordered prose rules — the manual prints these verbatim. */
export function rulesText(difficulty: 1 | 2 | 3, ed: Edition): string[] {
  return ${CONST}_RULES[difficulty].map(
    (r) => \`\${conditionToText(r.when, ed)}, \${actionToText(r.then, ed)}.\`,
  );
}
`;

const manualTs = `import type { ManualSection } from '../../engine/types';
import { rulesText } from './prose';

/**
 * TODO: replace with a real figure, ideally drawn FROM rule data so it can
 * never drift from app behavior (see wireMaze's pattern legend).
 */
const placeholderFigureSvg = \`
<svg viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg" role="img">
  <style>text{font-family:sans-serif;font-size:14px;fill:#111}</style>
  <rect x="20" y="20" width="440" height="80" rx="8" fill="none" stroke="#888" stroke-width="2"/>
  <text x="40" y="66">TODO: figure for ${codename}</text>
</svg>\`;

export const ${camel}Manual: ManualSection = {
  standard: {
    intro:
      'TODO (~7th–9th grade): what the Agent sees, what the Handler asks first, ' +
      'and that rules are checked top to bottom — first match wins, then stop.',
    blocks: [
      { kind: 'figure', svg: placeholderFigureSvg, caption: 'TODO caption.', alt: 'TODO alt text describing the figure without relying on color.' },
      { kind: 'callout', tone: 'tip', text: 'TODO: the one orientation fact that prevents most confusion (numbering, what never changes, what is printed on screen).' },
      { kind: 'h3', text: 'Rookie missions' },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: rulesText(1, 'standard') },
      { kind: 'h3', text: 'Agent missions' },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: rulesText(2, 'standard') },
      { kind: 'h3', text: 'Mastermind missions' },
      { kind: 'ruleList', caption: 'Check in order; apply the first match.', rules: rulesText(3, 'standard') },
      { kind: 'callout', tone: 'warning', text: 'A wrong answer raises the alarm level. If you are not sure, ask the Agent to describe it again first.' },
    ],
  },
  simplified: {
    intro: 'TODO (~3rd–5th grade, short sentences): what the Agent sees. What to ask first. Use the first rule that fits.',
    blocks: [
      { kind: 'figure', svg: placeholderFigureSvg, caption: 'TODO short caption.', alt: 'TODO alt text describing the figure without relying on color.' },
      { kind: 'bullets', items: ['TODO: orientation fact 1.', 'TODO: orientation fact 2.', 'TODO: what to ask about.'] },
      { kind: 'h3', text: 'Easy missions' },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: rulesText(1, 'simplified') },
      { kind: 'h3', text: 'Medium missions' },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: rulesText(2, 'simplified') },
      { kind: 'h3', text: 'Hard missions' },
      { kind: 'ruleList', caption: 'Use the first rule that fits.', rules: rulesText(3, 'simplified') },
      { kind: 'callout', tone: 'tip', text: 'Not sure? Ask the Agent to say it again. Asking is smart!' },
    ],
  },
};
`;

const componentTsx = `import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import { solve${pascal}, type ${pascal}Answer, type ${pascal}State } from './logic';
import './${camel}.css';

/**
 * ${codename} — Field Agent view.
 *
 * Accessibility invariants (mirrors wireMaze):
 * - every interactive element gets an aria-label naming ALL channels
 *   (never color alone — pair color with pattern/label/position, and print
 *   the color name so the Agent can read it out loud);
 * - progress + feedback line uses role="status" so screen readers announce it;
 * - min touch target var(--touch); wrong answers are soft (state unchanged).
 */
export function ${pascal}({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<${pascal}State, ${pascal}Answer>) {
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(false);

  const expected = solve${pascal}(instance.state);

  function commit(answer: ${pascal}Answer) {
    if (done) return;
    const correct = answer === expected;
    onAttempt?.(correct, answer);
    if (!correct) {
      setWrong(true);
      onStrike();
      return; // soft failure — the panel is unchanged, the Agent retries
    }
    setWrong(false);
    setDone(true);
    onSolved(); // call exactly once
  }

  return (
    <div className="${camel} card" data-testid="module-${kebab}">
      <header className="module-header">
        <h2>${codename}</h2>
        <p className="module-sub">TODO: one-line instruction ending in “Your Handler knows which.”</p>
      </header>
      <div className="${camel}-controls" role="group" aria-label="${codename} panel">
        {/* TODO: real controls rendered from instance.state. */}
        <button
          className="${camel}-commit"
          onClick={() => commit(instance.state.placeholderValue)}
          disabled={disabled || done}
          aria-label="Commit placeholder answer (TODO: describe the control fully)"
        >
          Commit (TODO)
        </button>
      </div>
      <p className="module-status" role="status">
        {done
          ? 'Solved!'
          : \`\${wrong ? 'Wrong answer — the panel is unchanged. ' : ''}Awaiting instructions from your Handler.\`}
      </p>
    </div>
  );
}
`;

const css = `/* ${codename} — design tokens only (see src/index.css); never hard-code colors. */

.${camel} {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
}

.module-header h2 {
  margin: 0 0 4px;
  font-size: 1.25em;
  letter-spacing: 0.02em;
}

.module-sub {
  margin: 0;
  color: var(--text-mid);
  font-size: 0.92em;
}

.${camel}-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.${camel}-commit {
  padding: 10px 14px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  min-height: var(--touch);
}

.${camel}-commit:not(:disabled):active {
  background: var(--bg-3);
}

.module-status {
  margin: 0;
  color: var(--text-mid);
  font-size: 0.9em;
}
`;

const indexTs = `import type { ModuleDefinition } from '../../engine/types';
import { generate${pascal}, solve${pascal}, validate${pascal}, type ${pascal}Answer, type ${pascal}State } from './logic';
import { ${camel}Manual } from './manual';
import { ${pascal} } from './${pascal}';

export const ${camel}Module: ModuleDefinition<${pascal}State, ${pascal}Answer> = {
  id: '${kebab}',
  codename: '${codename}',
  tagline: 'TODO: one-line description shown in the mission builder.',
  targets: { primary: '${target}', secondary: [] },
  minutes: { 1: 3, 2: 4, 3: 5 }, // TODO: rough solve times for mission sizing
  generate: generate${pascal},
  solve: solve${pascal},
  validate: validate${pascal},
  Component: ${pascal},
  manual: ${camel}Manual,
  // Standard rack mount — 1 slot, standard bezel — is the default even when
  // omitted; custom 3D presentation is opt-in later and never required.
  faceplate: { slots: 1, bezel: 'standard' },
};
`;

const testTs = `import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { generate${pascal}, solve${pascal}, validate${pascal} } from './logic';
import { ${CONST}_RULES } from './rules';

const SEEDS_PER_TIER = 1000;

describe('${kebab} — robot Handler property tests', () => {
  // Marked .todo while rules.ts / logic.ts are stubs. Once implemented,
  // change it.todo -> it and make these pass before registering the module.
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it.todo(\`difficulty \${difficulty}: every seeded instance is solvable from rule data alone\`, () => {
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generate${pascal}(seed * 7919 + difficulty, difficulty);
        // solve() throws if a rule table is non-total or an action fails to resolve
        const answer = solve${pascal}(inst.state);
        expect(validate${pascal}(inst.state, answer)).toBe(true);
        // TODO: add answer-shape assertions (range, no duplicates, ...).
      }
    });
  }

  it('is deterministic: same seed, same puzzle and solution', () => {
    const a = generate${pascal}(12345, 2);
    const b = generate${pascal}(12345, 2);
    expect(a.state).toEqual(b.state);
    expect(solve${pascal}(a.state)).toEqual(solve${pascal}(b.state));
  });

  it('every rule table ends with a catch-all rule so the Handler can never get stuck', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const rules = ${CONST}_RULES[difficulty];
      expect(rules[rules.length - 1].when.c).toBe('always');
    }
  });
});
`;

/* ------------------------------------------------------------------ */
/* Write files.                                                        */
/* ------------------------------------------------------------------ */

const files = {
  'rules.ts': rulesTs,
  'logic.ts': logicTs,
  'prose.ts': proseTs,
  'manual.ts': manualTs,
  [`${pascal}.tsx`]: componentTsx,
  [`${camel}.css`]: css,
  'index.ts': indexTs,
  [`${camel}.test.ts`]: testTs,
};

mkdirSync(moduleDir, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(moduleDir, name), content, 'utf8');
}

console.log(`\nScaffolded src/modules/${camel}/ — "${codename}" (${kebab}, primary target: ${target})\n`);
for (const name of Object.keys(files)) console.log(`  src/modules/${camel}/${name}`);
console.log(`
Next steps:
  1. Implement the rule tables in src/modules/${camel}/rules.ts (single source
     of truth), then generate/solve/validate in logic.ts and the prose
     renderers in prose.ts + manual.ts.
  2. Unmark the .todo property tests in src/modules/${camel}/${camel}.test.ts
     (it.todo -> it) and make the 1000-seed solvability loop pass.
  3. Register the module — add 2 lines to src/modules/registerAll.ts:
       import { ${camel}Module } from './${camel}';
       registerModule(${camel}Module);
  4. npm test && npm run typecheck — then npm run manual to see it in print.

The module mounts into the 3D Field Case automatically (standard faceplate,
1 slot). No 3D work is required — ever. Custom presentation is opt-in later.
`);
