import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import {
  controlMatches,
  describeControl,
  generateBadIntel,
  solveBadIntel,
  validateBadIntel,
  type BadIntelMove,
} from './logic';
import {
  CONSONANT_TAGS,
  CONTROL_TYPE_BY_ID,
  CONTROL_TYPES,
  MODELS,
  MODELS_BY_DIFFICULTY,
  modelById,
  SETTING_MAX,
  SETTING_MIN,
  STEP_RULE_BY_ID,
  STEP_RULES,
  TIER_NOTES,
  VOWEL_TAGS,
  tagClassOf,
} from './rules';

const SEEDS = 1000;

describe('bad intel generation', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: ${SEEDS} seeded instances are well-formed and robot-solvable`, () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { state } = generateBadIntel(seed, difficulty);
        const model = modelById(state.model);

        // the panel names a model of this difficulty
        expect(MODELS_BY_DIFFICULTY[difficulty]).toContain(model);

        // panel size: (steps - 1) satisfied steps + 1-2 decoys, always 4-6
        expect(state.controls.length).toBeGreaterThanOrEqual(4);
        expect(state.controls.length).toBeLessThanOrEqual(6);
        expect(state.controls.length).toBeGreaterThanOrEqual(model.steps.length);

        // tags: unique, drawn from the printed pools, class-consistent
        const tags = state.controls.map((c) => c.tag);
        expect(new Set(tags).size).toBe(tags.length);
        for (const control of state.controls) {
          expect([...VOWEL_TAGS, ...CONSONANT_TAGS]).toContain(control.tag);
          expect(control.setting).toBeGreaterThanOrEqual(SETTING_MIN);
          expect(control.setting).toBeLessThanOrEqual(SETTING_MAX);
        }

        // exactly one step of the model matches ZERO controls; every other
        // step matches exactly ONE (decoys never create a second match)
        const matchCounts = model.steps.map(
          (ruleId) => state.controls.filter((c) => controlMatches(c, ruleId)).length,
        );
        expect(matchCounts.filter((n) => n === 0)).toHaveLength(1);
        for (const n of matchCounts) expect(n === 0 || n === 1).toBe(true);

        // robot Handler solves from the printed tables; the app accepts it
        const answer = solveBadIntel(state);
        expect(validateBadIntel(state, answer)).toBe(true);
        expect(answer).toHaveLength(model.steps.length);

        // the answer flags exactly the zero-match step and taps the single
        // matching control everywhere else
        answer.forEach((move, i) => {
          if (matchCounts[i] === 0) {
            expect(move.kind).toBe('flag');
          } else {
            expect(move.kind).toBe('tap');
            if (move.kind === 'tap') {
              expect(controlMatches(state.controls[move.control], model.steps[i])).toBe(true);
            }
          }
        });
        expect(answer.filter((m) => m.kind === 'flag')).toHaveLength(1);

        // controls never tapped are decoys: they match NONE of the model's steps
        const tapped = new Set(
          answer.filter((m): m is { kind: 'tap'; control: number } => m.kind === 'tap').map((m) => m.control),
        );
        state.controls.forEach((control, i) => {
          if (tapped.has(i)) return;
          for (const ruleId of model.steps) expect(controlMatches(control, ruleId)).toBe(false);
        });

        // wrong answers are rejected: tapping anything on the bad step...
        const flagIndex = answer.findIndex((m) => m.kind === 'flag');
        const tapOnBadStep: BadIntelMove[] = answer.map((m, i) =>
          i === flagIndex ? { kind: 'tap', control: 0 } : m,
        );
        expect(validateBadIntel(state, tapOnBadStep)).toBe(false);

        // ...flagging a good step...
        const tapIndex = answer.findIndex((m) => m.kind === 'tap');
        const flagOnGoodStep: BadIntelMove[] = answer.map((m, i) => (i === tapIndex ? { kind: 'flag' } : m));
        expect(validateBadIntel(state, flagOnGoodStep)).toBe(false);

        // ...tapping the wrong control on a good step, and truncated answers
        const right = answer[tapIndex];
        if (right.kind === 'tap') {
          const wrongControl = (right.control + 1) % state.controls.length;
          const wrongTap: BadIntelMove[] = answer.map((m, i) =>
            i === tapIndex ? { kind: 'tap', control: wrongControl } : m,
          );
          expect(validateBadIntel(state, wrongTap)).toBe(false);
        }
        expect(validateBadIntel(state, answer.slice(0, -1))).toBe(false);
      }
    });

    it(`difficulty ${difficulty}: every step index of every model gets broken across seeds`, () => {
      const brokenSeen = new Map<string, Set<number>>();
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { state } = generateBadIntel(seed, difficulty);
        const flagIndex = solveBadIntel(state).findIndex((m) => m.kind === 'flag');
        const set = brokenSeen.get(state.model) ?? new Set<number>();
        set.add(flagIndex);
        brokenSeen.set(state.model, set);
      }
      for (const model of MODELS_BY_DIFFICULTY[difficulty]) {
        expect(brokenSeen.get(model.id)?.size).toBe(model.steps.length);
      }
    });
  }

  it('generation is deterministic from (seed, difficulty)', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      for (let seed = 1; seed <= 50; seed++) {
        expect(generateBadIntel(seed, difficulty)).toEqual(generateBadIntel(seed, difficulty));
      }
    }
  });
});

describe('bad intel rule tables', () => {
  it('step rules are total: all 4 control types x both tag classes, with edition prose', () => {
    expect(STEP_RULES).toHaveLength(8);
    for (const info of CONTROL_TYPES) {
      for (const tagClass of ['vowel', 'consonant'] as const) {
        const rule = STEP_RULE_BY_ID[`${info.type}-${tagClass}`];
        expect(rule.control).toBe(info.type);
        expect(rule.tagClass).toBe(tagClass);
        expect(rule.standard.length).toBeGreaterThan(10);
        expect(rule.simplified.length).toBeGreaterThan(10);
      }
    }
  });

  it('models: 2 per difficulty with 3/4/5 distinct steps, all step refs valid', () => {
    expect(MODELS).toHaveLength(6);
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const models = MODELS_BY_DIFFICULTY[difficulty];
      expect(models).toHaveLength(2);
      for (const model of models) {
        expect(model.steps).toHaveLength(difficulty + 2);
        expect(new Set(model.steps).size).toBe(model.steps.length);
        for (const id of model.steps) expect(STEP_RULE_BY_ID[id]).toBeDefined();
      }
    }
  });

  it('tag pools are disjoint and class-correct', () => {
    for (const tag of VOWEL_TAGS) expect(tagClassOf(tag)).toBe('vowel');
    for (const tag of CONSONANT_TAGS) expect(tagClassOf(tag)).toBe('consonant');
    expect(VOWEL_TAGS.filter((t) => CONSONANT_TAGS.includes(t))).toHaveLength(0);
  });

  it('tier notes: Rookie warns that one step is always bad, Mastermind stays silent', () => {
    expect(TIER_NOTES[1]?.standard).toMatch(/exactly one step/i);
    expect(TIER_NOTES[1]?.simplified.length).toBeGreaterThan(10);
    expect(TIER_NOTES[3]).toBeNull();
  });

  it('control descriptions name the type, tag, and setting', () => {
    const { state } = generateBadIntel(42, 3);
    for (const control of state.controls) {
      const text = describeControl(control);
      expect(text).toContain(CONTROL_TYPE_BY_ID[control.type].label);
      expect(text).toContain(`tagged ${control.tag}`);
      expect(text).toContain(`set to ${control.setting}`);
    }
  });
});
