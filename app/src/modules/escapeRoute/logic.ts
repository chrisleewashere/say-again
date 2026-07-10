import { mulberry32, pick } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  floorById,
  floorsForDifficulty,
  hasWall,
  stepFrom,
  type Landmark,
  type Move,
} from './rules';

/**
 * Everything the Field Agent's screen shows — and NOTHING more. Sensor cells
 * and the safe route are deliberately absent: they live only in rules.ts and
 * are printed only in the Handler's manual. solve()/validate() look them up
 * by floorId, exactly as the Handler looks up the matching manual page.
 */
export interface EscapeRouteState {
  floorId: string;
  cols: number;
  rows: number;
  start: string;
  exit: string;
  walls: string[];
  landmarks: Landmark[];
}

/** Answer = the sequence of compass moves the Agent walked. */
export type EscapeRouteAnswer = Move[];

export function generateEscapeRoute(
  seed: number,
  difficulty: Difficulty,
): PuzzleInstance<EscapeRouteState> {
  const rng = mulberry32(seed);
  const floor = pick(rng, floorsForDifficulty(difficulty));
  return {
    moduleId: 'escape-route',
    difficulty,
    seed,
    state: {
      floorId: floor.floorId,
      cols: floor.cols,
      rows: floor.rows,
      start: floor.start,
      exit: floor.exit,
      walls: [...floor.walls],
      landmarks: floor.landmarks.map((l) => ({ ...l })),
    },
  };
}

/**
 * Robot Handler: look the floor up in the published floor table (the same
 * data the printed manual maps are generated from) and read off the safe
 * route drawn on that page.
 */
export function solveEscapeRoute(state: EscapeRouteState): EscapeRouteAnswer {
  return [...floorById(state.floorId).canonicalRoute];
}

/**
 * Walk a path against the floor data. Legal = starts at START, every step
 * stays on the grid and crosses no wall, never enters a hidden sensor cell,
 * and the final cell is the EXIT. ANY safe path counts — not just the
 * canonical one drawn in the manual.
 */
export function validateEscapeRoute(state: EscapeRouteState, answer: EscapeRouteAnswer): boolean {
  const floor = floorById(state.floorId);
  if (answer.length === 0) return false;
  let pos = floor.start;
  for (const move of answer) {
    const next = stepFrom(pos, move, floor.cols, floor.rows);
    if (next === null) return false; // walked off the grid
    if (hasWall(floor.walls, pos, next)) return false; // bumped a wall
    if (floor.sensorCells.includes(next)) return false; // tripped a sensor
    pos = next;
  }
  return pos === floor.exit;
}

/** True when this single step is legal (on-grid, no wall). Used by the UI. */
export function canStep(state: EscapeRouteState, from: string, move: Move): string | null {
  const next = stepFrom(from, move, state.cols, state.rows);
  if (next === null) return null;
  if (hasWall(state.walls, from, next)) return null;
  return next;
}

/** Sensor check for a cell — looked up from rules data, never from state. */
export function isSensorCell(floorId: string, cell: string): boolean {
  return floorById(floorId).sensorCells.includes(cell);
}
