import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import { describeScene, generateDebriefTapes, solveDebriefTapes, validateDebriefTapes } from './logic';
import { LINK_RULES, MARKER_BY_SLOT, SLOT_ORDER, SLOTS_BY_DIFFICULTY } from './rules';

const SEEDS = 1000;

describe('debrief tapes generation', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: ${SEEDS} seeded instances are well-formed and robot-solvable`, () => {
      let nonCanonical = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { state } = generateDebriefTapes(seed, difficulty);
        const slots = SLOTS_BY_DIFFICULTY[difficulty];

        // structure
        expect(state.scenes).toHaveLength(slots.length);
        expect(state.connectivesRequired).toBe(difficulty >= 2);

        // one still per slot, no repeats; letters unique; one operative
        const slotSet = new Set(state.scenes.map((s) => s.slot));
        expect(slotSet.size).toBe(slots.length);
        for (const slot of slots) expect(slotSet.has(slot)).toBe(true);
        expect(new Set(state.scenes.map((s) => s.letter)).size).toBe(slots.length);
        expect(new Set(state.scenes.map((s) => s.operativeId)).size).toBe(1);
        // settings vary per still (rich describing)
        expect(new Set(state.scenes.map((s) => s.settingId)).size).toBe(slots.length);

        // only the outcome still carries the outcome flag
        for (const scene of state.scenes) {
          expect(scene.outcomeGood !== undefined).toBe(scene.slot === 'outcome');
        }

        // robot Handler solves from rule tables; the app accepts it
        const answer = solveDebriefTapes(state);
        expect(validateDebriefTapes(state, answer)).toBe(true);

        // solved order really is canonical story order
        const orderedSlots = answer.order.map((i) => state.scenes[i].slot);
        const ranks = orderedSlots.map((s) => SLOT_ORDER.indexOf(s));
        expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);

        // connectives match the link rules pairwise
        if (state.connectivesRequired) {
          expect(answer.connectives).toHaveLength(slots.length - 1);
          answer.connectives.forEach((c, i) => {
            const rule = LINK_RULES.find(
              (r) => r.from === orderedSlots[i] && r.to === orderedSlots[i + 1],
            );
            expect(rule?.connective).toBe(c);
          });
        } else {
          expect(answer.connectives).toHaveLength(0);
        }

        // wrong answers are rejected
        if (answer.order.length >= 2) {
          const swapped = [...answer.order];
          [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
          expect(validateDebriefTapes(state, { ...answer, order: swapped })).toBe(false);
        }

        if (state.scenes.some((_, i) => state.scenes[i].slot !== SLOTS_BY_DIFFICULTY[difficulty][i])) {
          nonCanonical++;
        }
      }
      // the tape is genuinely shuffled in the overwhelming majority of deals
      expect(nonCanonical / SEEDS).toBeGreaterThan(0.9);
    });
  }

  it('marker table is total: every slot has a marker rule with edition prose', () => {
    for (const slot of SLOT_ORDER) {
      const rule = MARKER_BY_SLOT[slot];
      expect(rule.slot).toBe(slot);
      expect(rule.standard.length).toBeGreaterThan(10);
      expect(rule.simplified.length).toBeGreaterThan(10);
      expect(rule.slotLabel).toContain('—');
    }
  });

  it('scene descriptions name the letter, operative, setting, and marker', () => {
    const { state } = generateDebriefTapes(42, 3);
    for (const scene of state.scenes) {
      const text = describeScene(scene);
      expect(text).toContain(`Still ${scene.letter}`);
      expect(text.length).toBeGreaterThan(30);
    }
  });
});
