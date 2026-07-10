import { mulberry32, pick, type Rng } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  ACCESSORY,
  CHECKLISTS,
  GLASSES,
  HAIR,
  HEADWEAR,
  LINEUP_SIZE,
  SHIRT,
  type Atom,
  type EliminationRule,
  type Suspect,
} from './rules';

export interface IdCheckState {
  /** The lineup, in printed position order (position 1 = index 0). */
  suspects: Suspect[];
}

/** Answer = 0-based index of the secret contact in the lineup. */
export type IdCheckAnswer = number;

function matchesAtom(s: Suspect, atom: Atom): boolean {
  if (atom.t === 'wearsAny') return s[atom.attr] !== 'none';
  return (s[atom.attr] as string) === atom.value;
}

/**
 * Work an ordered checklist against a lineup; return the surviving 0-based
 * indices. This is exactly what the Handler does on paper.
 */
export function applyChecklist(suspects: Suspect[], rules: EliminationRule[]): number[] {
  let alive = suspects.map((_, i) => i);
  for (const rule of rules) {
    if (rule.kind === 'eliminate') {
      alive = alive.filter((i) => !rule.atoms.every((a) => matchesAtom(suspects[i], a)));
    } else {
      if (alive.length < rule.minRemaining) continue;
      const refIndex = rule.refPosition - 1;
      const refShirt = suspects[refIndex].shirt;
      alive = alive.filter((i) => i === refIndex || suspects[i].shirt !== refShirt);
    }
  }
  return alive;
}

function randomSuspect(rng: Rng): Suspect {
  return {
    headwear: pick(rng, HEADWEAR),
    glasses: pick(rng, GLASSES),
    hair: pick(rng, HAIR),
    accessory: pick(rng, ACCESSORY),
    shirt: pick(rng, SHIRT),
  };
}

function suspectKey(s: Suspect): string {
  return [s.headwear, s.glasses, s.hair, s.accessory, s.shirt].join('|');
}

const MAX_ATTEMPTS = 20000;

/**
 * Deterministic rejection sampling: draw lineups from the seeded rng until
 * (a) no two suspects are identical (so every suspect is describable in a
 * distinguishing way) and (b) the difficulty's checklist leaves EXACTLY one
 * survivor. Acceptance rates are high (~20–40% per draw), so the attempt cap
 * is never reached in practice (property-tested across thousands of seeds).
 */
export function generateIdCheck(seed: number, difficulty: Difficulty): PuzzleInstance<IdCheckState> {
  const rng = mulberry32(seed);
  const size = LINEUP_SIZE[difficulty];
  const rules = CHECKLISTS[size];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const suspects = Array.from({ length: size }, () => randomSuspect(rng));
    if (new Set(suspects.map(suspectKey)).size !== size) continue;
    if (applyChecklist(suspects, rules).length !== 1) continue;
    return { moduleId: 'id-check', difficulty, seed, state: { suspects } };
  }
  throw new Error(`id-check: no valid lineup found for seed ${seed}, difficulty ${difficulty}`);
}

/**
 * Robot Handler: derive the contact from the checklist data alone. The
 * checklist is picked by lineup size, exactly as the printed manual instructs.
 */
export function solveIdCheck(state: IdCheckState): IdCheckAnswer {
  const rules = CHECKLISTS[state.suspects.length];
  if (!rules) throw new Error(`id-check: no checklist for ${state.suspects.length} suspects`);
  const survivors = applyChecklist(state.suspects, rules);
  if (survivors.length !== 1) {
    throw new Error(`id-check: checklist left ${survivors.length} survivors, expected exactly 1`);
  }
  return survivors[0];
}

export function validateIdCheck(state: IdCheckState, answer: IdCheckAnswer): boolean {
  return Number.isInteger(answer) && answer === solveIdCheck(state);
}
