import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import {
  describeFact,
  generateAssetInterview,
  solveAssetInterview,
  statementReadout,
  validateAssetInterview,
} from './logic';
import {
  FIELD_BY_ID,
  FIELD_RULES,
  FLOW_DEPTH,
  FORMS,
  FORMS_BY_DIFFICULTY,
  formDepth,
  VERDICTS,
  type Facts,
} from './rules';

const SEEDS = 1000;

/** Enumerate the full fact space (every combination of every field value). */
function allFactCombos(): Facts[] {
  let combos: Facts[] = [{} as Facts];
  for (const field of FIELD_RULES) {
    combos = combos.flatMap((partial) =>
      field.values.map((value) => ({ ...partial, [field.id]: value.id })),
    );
  }
  return combos;
}

describe('asset interview generation', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: ${SEEDS} seeded instances are well-formed and robot-solvable`, () => {
      const formsSeen = new Set<string>();
      const verdictsSeen = new Set<string>();
      const tierForms = FORMS_BY_DIFFICULTY[difficulty];

      for (let seed = 1; seed <= SEEDS; seed++) {
        const instance = generateAssetInterview(seed, difficulty);
        expect(instance.moduleId).toBe('asset-interview');
        const { state } = instance;

        // the form belongs to this difficulty tier
        expect(tierForms.some((f) => f.id === state.formId)).toBe(true);

        // every field carries exactly one legal value
        expect(Object.keys(state.facts).sort()).toEqual(FIELD_RULES.map((f) => f.id).sort());
        for (const field of FIELD_RULES) {
          expect(field.values.some((v) => v.id === state.facts[field.id])).toBe(true);
        }

        // determinism: same (seed, difficulty) -> same instance
        expect(generateAssetInterview(seed, difficulty).state).toEqual(state);

        // robot Handler walks the printed flow; the app accepts it
        const answer = solveAssetInterview(state);
        expect(validateAssetInterview(state, answer)).toBe(true);

        // every one of the five wrong verdicts is rejected
        for (const v of VERDICTS) {
          if (v.id !== answer) expect(validateAssetInterview(state, v.id)).toBe(false);
        }

        formsSeen.add(state.formId);
        verdictsSeen.add(answer);
      }

      // both forms of the tier get selected across seeds
      expect(formsSeen.size).toBe(tierForms.length);
      expect(tierForms.length).toBe(2);
      // all six verdicts are reachable across seeds within the tier
      expect(verdictsSeen.size).toBe(VERDICTS.length);
    });
  }

  it('every form is a total, forward-only flow: all 256 fact combinations reach a verdict', () => {
    const combos = allFactCombos();
    expect(combos).toHaveLength(256); // 4 * 4 * 4 * 2 * 2

    for (const form of FORMS) {
      form.nodes.forEach((node, index) => {
        const field = FIELD_BY_ID[node.ask];
        // branches partition the field's values exactly: no gaps, no overlaps
        const covered = node.branches.flatMap((b) => [...b.values]);
        expect([...covered].sort()).toEqual(field.values.map((v) => v.id).sort());
        expect(new Set(covered).size).toBe(covered.length);
        for (const branch of node.branches) {
          expect(branch.values.length).toBeGreaterThan(0);
          // exactly one of goTo / verdict
          expect((branch.goTo === undefined) !== (branch.verdict === undefined)).toBe(true);
          if (branch.goTo !== undefined) {
            // strictly forward and in range -> the walk always terminates
            expect(branch.goTo).toBeGreaterThan(index);
            expect(branch.goTo).toBeLessThan(form.nodes.length);
          }
          if (branch.verdict !== undefined) {
            expect(VERDICTS.some((v) => v.id === branch.verdict)).toBe(true);
          }
        }
      });

      // exhaustive: every possible statement resolves to a verdict
      for (const facts of combos) {
        const verdict = solveAssetInterview({ formId: form.id, facts });
        expect(VERDICTS.some((v) => v.id === verdict)).toBe(true);
      }
    }
  });

  it('flow depth matches the design: 2 questions (Rookie), 3 (Agent), 4 (Mastermind)', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      expect(FORMS_BY_DIFFICULTY[difficulty]).toHaveLength(2);
      for (const form of FORMS_BY_DIFFICULTY[difficulty]) {
        expect(formDepth(form)).toBe(FLOW_DEPTH[difficulty]);
      }
    }
  });

  it('rule tables carry edition prose for every field and verdict', () => {
    for (const field of FIELD_RULES) {
      expect(field.standard.startsWith('Ask:')).toBe(true);
      expect(field.simplified.startsWith('Ask:')).toBe(true);
      expect(field.label.length).toBeGreaterThan(2);
      for (const value of field.values) {
        expect(value.label.length).toBeGreaterThan(1);
        expect(value.icon.length).toBeGreaterThan(1);
      }
    }
    for (const verdict of VERDICTS) {
      expect(verdict.label.length).toBeGreaterThan(3);
      expect(verdict.iconName.startsWith('the ')).toBe(true);
      expect(verdict.standard.length).toBeGreaterThan(10);
      expect(verdict.simplified.length).toBeGreaterThan(10);
    }
    expect(VERDICTS).toHaveLength(6);
    // badge shapes are distinct — never color-coded
    expect(new Set(VERDICTS.map((v) => v.icon)).size).toBe(VERDICTS.length);
  });

  it('fact descriptions read the field and the value, and the readout names the form', () => {
    const { state } = generateAssetInterview(42, 2);
    for (const field of FIELD_RULES) {
      const text = describeFact(field.id, state.facts);
      expect(text.startsWith(`${field.label}: `)).toBe(true);
      const value = field.values.find((v) => v.id === state.facts[field.id])!;
      expect(text.endsWith(value.label)).toBe(true);
    }
    const readout = statementReadout(state);
    expect(readout).toContain(`Interview form ${state.formId}`);
    expect(readout).toContain('Time of day:');
    expect(readout).toContain('Chalk mark seen:');
  });
});
