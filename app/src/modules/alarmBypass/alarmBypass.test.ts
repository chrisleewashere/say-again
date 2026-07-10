import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { generateAlarmBypass, solveAlarmBypass, validateAlarmBypass } from './logic';
import { glyphPhrase, modelHeading, roundCaption, translationRows } from './prose';
import {
  GLYPHS,
  GLYPH_LETTERS,
  MODEL_FOR_DIFFICULTY,
  PANEL_MODELS,
  SEQUENCE_LENGTHS,
  TRANSLATION_TABLES,
  type Glyph,
} from './rules';

const SEEDS_PER_TIER = 1500;

describe('alarm bypass — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every seeded instance is solvable from rule data alone`, () => {
      const model = MODEL_FOR_DIFFICULTY[difficulty];
      const lengths = SEQUENCE_LENGTHS[model];
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generateAlarmBypass(seed * 7919 + difficulty, difficulty);
        expect(inst.state.model).toBe(model);
        // one flash sequence per round, with the exact per-round lengths
        expect(inst.state.rounds.map((r) => r.length)).toEqual(lengths);
        for (const round of inst.state.rounds) {
          for (const glyph of round) expect(GLYPHS).toContain(glyph);
          // playback readability: never the same glyph twice in a row
          for (let i = 1; i < round.length; i++) expect(round[i]).not.toBe(round[i - 1]);
        }
        // solve() throws if a table is missing or non-total
        const answer = solveAlarmBypass(inst.state);
        expect(answer.length).toBe(inst.state.rounds.length);
        answer.forEach((seq, r) => {
          expect(seq.length).toBe(inst.state.rounds[r].length);
          seq.forEach((glyph, i) => {
            expect(glyph).toBe(TRANSLATION_TABLES[model][r][inst.state.rounds[r][i]]);
          });
        });
        expect(validateAlarmBypass(inst.state, answer)).toBe(true);
      }
    });
  }

  it('the solution is unique: changing any single press invalidates the answer', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      for (let seed = 1; seed <= 100; seed++) {
        const inst = generateAlarmBypass(seed * 104729 + difficulty, difficulty);
        const answer = solveAlarmBypass(inst.state);
        answer.forEach((seq, r) => {
          seq.forEach((glyph, i) => {
            for (const other of GLYPHS) {
              if (other === glyph) continue;
              const mutated = answer.map((s) => [...s]);
              mutated[r][i] = other;
              expect(validateAlarmBypass(inst.state, mutated)).toBe(false);
            }
          });
        });
      }
    }
  });

  it('is deterministic: same seed, same puzzle and solution', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const a = generateAlarmBypass(987654, difficulty);
      const b = generateAlarmBypass(987654, difficulty);
      expect(a.state).toEqual(b.state);
      expect(solveAlarmBypass(a.state)).toEqual(solveAlarmBypass(b.state));
    }
  });

  it('rejects malformed answers', () => {
    const inst = generateAlarmBypass(42, 2);
    const answer = solveAlarmBypass(inst.state);
    // missing round
    expect(validateAlarmBypass(inst.state, answer.slice(0, -1))).toBe(false);
    // extra round
    expect(validateAlarmBypass(inst.state, [...answer, ['crescent']])).toBe(false);
    // truncated round
    expect(
      validateAlarmBypass(inst.state, [answer[0].slice(0, -1), ...answer.slice(1)]),
    ).toBe(false);
    // extra press in a round
    expect(
      validateAlarmBypass(inst.state, [[...answer[0], 'key'], ...answer.slice(1)]),
    ).toBe(false);
    // empty and junk shapes
    expect(validateAlarmBypass(inst.state, [])).toBe(false);
    expect(validateAlarmBypass(inst.state, null as unknown as Glyph[][])).toBe(false);
    expect(
      validateAlarmBypass(inst.state, answer.map(() => null) as unknown as Glyph[][]),
    ).toBe(false);
  });
});

describe('alarm bypass — rule data is well-formed', () => {
  it('every panel model defines one table per round, matching its sequence list', () => {
    for (const model of PANEL_MODELS) {
      expect(TRANSLATION_TABLES[model].length).toBe(SEQUENCE_LENGTHS[model].length);
    }
  });

  it('every table is total over all four glyphs and is a permutation', () => {
    for (const model of PANEL_MODELS) {
      for (const table of TRANSLATION_TABLES[model]) {
        const keys = Object.keys(table).sort();
        expect(keys).toEqual([...GLYPHS].sort());
        const values = GLYPHS.map((g) => table[g]);
        for (const v of values) expect(GLYPHS).toContain(v);
        expect(new Set(values).size).toBe(GLYPHS.length);
      }
    }
  });

  it('difficulty scaling: Rookie tables keep identity mappings, Mastermind tables have none', () => {
    const identities = (model: (typeof PANEL_MODELS)[number], round: number) =>
      GLYPHS.filter((g) => TRANSLATION_TABLES[model][round][g] === g).length;
    // RK-2: every round has at least one glyph that maps to itself
    for (let r = 0; r < TRANSLATION_TABLES['RK-2'].length; r++) {
      expect(identities('RK-2', r)).toBeGreaterThan(0);
    }
    // MM-3: no glyph ever maps to itself
    for (let r = 0; r < TRANSLATION_TABLES['MM-3'].length; r++) {
      expect(identities('MM-3', r)).toBe(0);
    }
  });
});

describe('alarm bypass — manual prose stays in sync with rule data', () => {
  it('renders one SEE→PRESS row per data mapping, both editions, every model and round', () => {
    for (const model of PANEL_MODELS) {
      for (let round = 0; round < TRANSLATION_TABLES[model].length; round++) {
        for (const ed of ['standard', 'simplified'] as const) {
          const rows = translationRows(model, round, ed);
          expect(rows).toHaveLength(GLYPHS.length);
          rows.forEach((row, i) => {
            expect(row).toHaveLength(2);
            const glyph = GLYPHS[i];
            // the SEE column carries the printed letter (color-free channel)
            expect(row[0]).toContain(`(${GLYPH_LETTERS[glyph]})`);
            // the PRESS column matches the data table exactly
            expect(row[1]).toBe(glyphPhrase(TRANSLATION_TABLES[model][round][glyph], ed));
          });
        }
      }
    }
  });

  it('every glyph phrase includes the printed letter in both editions', () => {
    for (const glyph of GLYPHS) {
      expect(glyphPhrase(glyph, 'standard')).toContain(`(${GLYPH_LETTERS[glyph]})`);
      expect(glyphPhrase(glyph, 'simplified')).toContain(`(${GLYPH_LETTERS[glyph]})`);
    }
  });

  it('headings and captions carry the model code and flash count from data', () => {
    for (const model of PANEL_MODELS) {
      for (const ed of ['standard', 'simplified'] as const) {
        expect(modelHeading(model, ed)).toContain(model);
        expect(modelHeading(model, ed)).toContain(String(TRANSLATION_TABLES[model].length));
        for (let round = 0; round < TRANSLATION_TABLES[model].length; round++) {
          const caption = roundCaption(model, round, ed);
          expect(caption).toContain(model);
          expect(caption).toContain(String(round + 1));
          expect(caption).toContain(String(SEQUENCE_LENGTHS[model][round]));
        }
      }
    }
  });

  it('manual editions include one printed table per data table, a glyph figure, and callouts', async () => {
    const { alarmBypassManual } = await import('./manual');
    const expectedTables = PANEL_MODELS.reduce(
      (n, model) => n + TRANSLATION_TABLES[model].length,
      0,
    );
    for (const ed of ['standard', 'simplified'] as const) {
      const blocks = alarmBypassManual[ed].blocks;
      expect(blocks.filter((b) => b.kind === 'table')).toHaveLength(expectedTables);
      const figures = blocks.filter((b) => b.kind === 'figure');
      expect(figures.length).toBeGreaterThanOrEqual(1);
      expect(figures[0].kind === 'figure' && figures[0].svg).toContain('<svg');
      expect(blocks.some((b) => b.kind === 'callout' && b.tone === 'tip')).toBe(true);
      expect(blocks.some((b) => b.kind === 'callout' && b.tone === 'warning')).toBe(true);
    }
  });

  it('tables are total, so no catch-all rule is needed (totality asserted instead)', () => {
    // Unlike ordered rule lists, these translation tables cover every possible
    // flashed glyph — the Handler can never fall off the end of a table.
    for (const model of PANEL_MODELS) {
      for (const table of TRANSLATION_TABLES[model]) {
        for (const glyph of GLYPHS) {
          expect(table[glyph]).toBeDefined();
        }
      }
    }
  });
});
