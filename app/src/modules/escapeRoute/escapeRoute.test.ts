import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../engine/types';
import {
  generateEscapeRoute,
  solveEscapeRoute,
  validateEscapeRoute,
  type EscapeRouteState,
} from './logic';
import { escapeRouteManual } from './manual';
import {
  landmarkLegendRows,
  routeRulesText,
  routeRuns,
  routeScriptLines,
  routeSummary,
} from './prose';
import {
  FLOORS,
  floorsForDifficulty,
  GRID_SIZE,
  hasWall,
  LANDMARK_KINDS,
  MOVES,
  parseCell,
  ROUTE_RULES,
  stepFrom,
  wallKey,
  type Floor,
  type Move,
} from './rules';

const SEEDS_PER_TIER = 1200;

function inBounds(cell: string, floor: Floor): boolean {
  const { c, r } = parseCell(cell);
  return c >= 0 && c < floor.cols && r >= 0 && r < floor.rows;
}

/** Walk a move list from a floor's start; returns visited cells (excluding start). */
function walk(floor: Floor, path: Move[]): { cells: string[]; legal: boolean } {
  let pos = floor.start;
  const cells: string[] = [];
  for (const move of path) {
    const next = stepFrom(pos, move, floor.cols, floor.rows);
    if (next === null || hasWall(floor.walls, pos, next)) return { cells, legal: false };
    cells.push(next);
    pos = next;
  }
  return { cells, legal: true };
}

/** BFS for a wall-legal move path from -> to that avoids `avoid` cells. */
function bfsPath(floor: Floor, from: string, to: string, avoid: string[]): Move[] | null {
  const prev = new Map<string, { cell: string; move: Move }>();
  const seen = new Set<string>([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) {
      const moves: Move[] = [];
      let c = cur;
      while (c !== from) {
        const p = prev.get(c)!;
        moves.unshift(p.move);
        c = p.cell;
      }
      return moves;
    }
    for (const move of MOVES) {
      const next = stepFrom(cur, move, floor.cols, floor.rows);
      if (!next || seen.has(next) || hasWall(floor.walls, cur, next)) continue;
      if (next !== to && avoid.includes(next)) continue;
      seen.add(next);
      prev.set(next, { cell: cur, move });
      queue.push(next);
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Floor data integrity: every hand-authored floor is verified by      */
/* walking its data, exactly the way the engine walks it.              */
/* ------------------------------------------------------------------ */

describe('escape route — floor data integrity', () => {
  it('has 12+ floors, 4 per difficulty, with unique floor codes', () => {
    expect(FLOORS.length).toBeGreaterThanOrEqual(12);
    for (const d of [1, 2, 3] as const) {
      expect(floorsForDifficulty(d)).toHaveLength(4);
    }
    expect(new Set(FLOORS.map((f) => f.floorId)).size).toBe(FLOORS.length);
  });

  for (const floor of FLOORS) {
    describe(`floor ${floor.floorId}`, () => {
      it('grid size matches its difficulty tier', () => {
        expect(floor.cols).toBe(GRID_SIZE[floor.difficulty]);
        expect(floor.rows).toBe(GRID_SIZE[floor.difficulty]);
      });

      it('start and exit are distinct, in-bounds cells', () => {
        expect(inBounds(floor.start, floor)).toBe(true);
        expect(inBounds(floor.exit, floor)).toBe(true);
        expect(floor.start).not.toBe(floor.exit);
      });

      it('walls join adjacent in-bounds cells with no duplicates', () => {
        const keys = new Set<string>();
        for (const wall of floor.walls) {
          const [a, b] = wall.split('|');
          expect(inBounds(a, floor)).toBe(true);
          expect(inBounds(b, floor)).toBe(true);
          const pa = parseCell(a);
          const pb = parseCell(b);
          expect(Math.abs(pa.c - pb.c) + Math.abs(pa.r - pb.r)).toBe(1);
          keys.add(wallKey(a, b));
        }
        expect(keys.size).toBe(floor.walls.length);
      });

      it('landmarks are in bounds, off start/exit, off sensors, one per cell', () => {
        const cells = floor.landmarks.map((l) => l.cell);
        expect(new Set(cells).size).toBe(cells.length);
        for (const lm of floor.landmarks) {
          expect(inBounds(lm.cell, floor)).toBe(true);
          expect(lm.cell).not.toBe(floor.start);
          expect(lm.cell).not.toBe(floor.exit);
          expect(floor.sensorCells).not.toContain(lm.cell);
        }
      });

      it('sensors are in bounds, unique, and never on start or exit', () => {
        expect(new Set(floor.sensorCells).size).toBe(floor.sensorCells.length);
        for (const cell of floor.sensorCells) {
          expect(inBounds(cell, floor)).toBe(true);
          expect(cell).not.toBe(floor.start);
          expect(cell).not.toBe(floor.exit);
        }
      });

      it('canonical route walks the grid data: no wall crossings, no sensors, ends at EXIT', () => {
        expect(floor.canonicalRoute.length).toBeGreaterThan(0);
        const { cells, legal } = walk(floor, floor.canonicalRoute);
        expect(legal).toBe(true);
        for (const cell of cells) {
          expect(floor.sensorCells).not.toContain(cell);
        }
        expect(cells[cells.length - 1]).toBe(floor.exit);
      });
    });
  }

  it('Mastermind floors each contain a decoy landmark pair (two of the same kind)', () => {
    for (const floor of floorsForDifficulty(3)) {
      const counts = new Map<string, number>();
      for (const lm of floor.landmarks) {
        counts.set(lm.kind, (counts.get(lm.kind) ?? 0) + 1);
      }
      expect(Math.max(...counts.values())).toBeGreaterThanOrEqual(2);
    }
  });

  it('route lengths scale with difficulty', () => {
    const avg = (d: 1 | 2 | 3) => {
      const fs = floorsForDifficulty(d);
      return fs.reduce((n, f) => n + f.canonicalRoute.length, 0) / fs.length;
    };
    expect(avg(1)).toBeLessThan(avg(2));
    expect(avg(2)).toBeLessThan(avg(3));
  });
});

/* ------------------------------------------------------------------ */
/* Robot Handler property tests                                        */
/* ------------------------------------------------------------------ */

describe('escape route — robot Handler property tests', () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every seeded instance is solvable from rules data alone`, () => {
      for (let seed = 1; seed <= SEEDS_PER_TIER; seed++) {
        const inst = generateEscapeRoute(seed * 7919 + difficulty, difficulty);
        const state = inst.state;

        // The Agent's state must never leak the manual-only data.
        expect('sensorCells' in state).toBe(false);
        expect('canonicalRoute' in state).toBe(false);
        const floor = FLOORS.find((f) => f.floorId === state.floorId)!;
        expect(floor).toBeDefined();
        expect(floor.difficulty).toBe(difficulty);
        expect(state.cols).toBe(GRID_SIZE[difficulty]);

        const answer = solveEscapeRoute(state);
        expect(answer).toEqual(floor.canonicalRoute);
        expect(answer.length).toBeGreaterThan(0);
        for (const move of answer) {
          expect(MOVES).toContain(move);
        }
        expect(validateEscapeRoute(state, answer)).toBe(true);
      }
    });
  }

  it('is deterministic: same seed, same floor and solution', () => {
    for (const difficulty of [1, 2, 3] as Difficulty[]) {
      const a = generateEscapeRoute(987654, difficulty);
      const b = generateEscapeRoute(987654, difficulty);
      expect(a.state).toEqual(b.state);
      expect(solveEscapeRoute(a.state)).toEqual(solveEscapeRoute(b.state));
    }
  });

  it('accepts ANY safe path, not just the canonical route', () => {
    for (const floor of FLOORS) {
      const state = stateFor(floor);
      // Alternate safe path found by BFS avoiding all sensors.
      const alt = bfsPath(floor, floor.start, floor.exit, floor.sensorCells);
      expect(alt).not.toBeNull();
      expect(validateEscapeRoute(state, alt!)).toBe(true);
      // Canonical route plus a legal detour off the exit and back is also safe.
      const route = [...floor.canonicalRoute];
      const last = route[route.length - 1];
      const undo: Record<Move, Move> = { N: 'S', S: 'N', E: 'W', W: 'E' };
      const wander: Move[] = [...route, undo[last], last];
      const { cells, legal } = walk(floor, wander);
      if (legal && cells.every((c) => !floor.sensorCells.includes(c))) {
        expect(validateEscapeRoute(state, wander)).toBe(true);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Wrong answers rejected                                              */
/* ------------------------------------------------------------------ */

function stateFor(floor: Floor): EscapeRouteState {
  return {
    floorId: floor.floorId,
    cols: floor.cols,
    rows: floor.rows,
    start: floor.start,
    exit: floor.exit,
    walls: [...floor.walls],
    landmarks: floor.landmarks.map((l) => ({ ...l })),
  };
}

describe('escape route — wrong answers rejected', () => {
  it('rejects the empty path', () => {
    for (const floor of FLOORS) {
      expect(validateEscapeRoute(stateFor(floor), [])).toBe(false);
    }
  });

  it('rejects a truncated canonical route (stops short of the exit)', () => {
    for (const floor of FLOORS) {
      const short = floor.canonicalRoute.slice(0, -1);
      expect(validateEscapeRoute(stateFor(floor), short)).toBe(false);
    }
  });

  it('rejects any path whose first move bumps a wall or leaves the grid', () => {
    for (const floor of FLOORS) {
      const illegal = MOVES.find((m) => {
        const next = stepFrom(floor.start, m, floor.cols, floor.rows);
        return next === null || hasWall(floor.walls, floor.start, next);
      });
      if (!illegal) continue; // start cell fully open on this floor
      expect(validateEscapeRoute(stateFor(floor), [illegal, ...floor.canonicalRoute])).toBe(false);
    }
  });

  it('rejects every path that crosses a hidden sensor, even if it reaches the exit', () => {
    let constructed = 0;
    for (const floor of FLOORS) {
      for (const sensor of floor.sensorCells) {
        const toSensor = bfsPath(floor, floor.start, sensor, floor.sensorCells.filter((s) => s !== sensor));
        if (!toSensor) continue;
        const onward = bfsPath(floor, sensor, floor.exit, floor.sensorCells.filter((s) => s !== sensor));
        if (!onward) continue;
        const through: Move[] = [...toSensor, ...onward];
        // Sanity: the path is wall-legal and ends at the exit...
        const { cells, legal } = walk(floor, through);
        expect(legal).toBe(true);
        expect(cells[cells.length - 1]).toBe(floor.exit);
        // ...but it stepped on a sensor, so it must be rejected.
        expect(validateEscapeRoute(stateFor(floor), through)).toBe(false);
        constructed++;
        break; // one sensor path per floor is enough
      }
    }
    expect(constructed).toBe(FLOORS.length); // every floor has a reachable sensor trap
  });
});

/* ------------------------------------------------------------------ */
/* Manual prose stays in sync with rules data                          */
/* ------------------------------------------------------------------ */

describe('escape route — manual prose stays in sync with rules data', () => {
  it('renders one prose rule per movement rule, both editions', () => {
    expect(routeRulesText('standard')).toHaveLength(ROUTE_RULES.length);
    expect(routeRulesText('simplified')).toHaveLength(ROUTE_RULES.length);
    // Movement rules all apply at once (not a first-match list), so no
    // catch-all rule is applicable; both manuals render them as steps.
    for (const line of [...routeRulesText('standard'), ...routeRulesText('simplified')]) {
      expect(line.length).toBeGreaterThan(10);
    }
  });

  it('renders one legend row per landmark kind, both editions', () => {
    expect(landmarkLegendRows('standard')).toHaveLength(LANDMARK_KINDS.length);
    expect(landmarkLegendRows('simplified')).toHaveLength(LANDMARK_KINDS.length);
  });

  it('generates route directions from floor data for every floor', () => {
    for (const floor of FLOORS) {
      const runs = routeRuns(floor);
      expect(runs.reduce((n, r) => n + r.count, 0)).toBe(floor.canonicalRoute.length);
      expect(runs[runs.length - 1].endCell).toBe(floor.exit);

      const summary = routeSummary(floor, 'standard');
      expect(summary).toContain(floor.start);
      expect(summary).toContain(floor.exit);

      const script = routeScriptLines(floor);
      expect(script.filter((l) => l.startsWith('Say: "Go ')).length).toBe(runs.length);
    }
  });

  it('every floor in rules.ts has a printed map figure in BOTH manual editions', () => {
    for (const edition of ['standard', 'simplified'] as const) {
      const figures = escapeRouteManual[edition].blocks.filter((b) => b.kind === 'figure');
      for (const floor of FLOORS) {
        const fig = figures.find((f) => f.caption.includes(`Floor ${floor.floorId}`));
        expect(fig, `${edition} manual missing map for floor ${floor.floorId}`).toBeDefined();
        // The figure is generated from the same floor data: sensors hatched,
        // exit marked, and the dashed route drawn.
        expect(fig!.svg).toContain(`er-hatch-${floor.floorId}`);
        const sensorRects = fig!.svg.match(/er-print-sensor/g) ?? [];
        expect(sensorRects).toHaveLength(floor.sensorCells.length);
        expect(fig!.svg).toContain('EXIT');
        expect(fig!.svg).toContain('er-print-route');
        expect(fig!.alt).toContain(floor.floorId);
      }
    }
  });

  it('both editions include a compass + legend figure and pragmatics callouts', () => {
    for (const edition of ['standard', 'simplified'] as const) {
      const { blocks, intro } = escapeRouteManual[edition];
      expect(intro.length).toBeGreaterThan(40);
      expect(blocks.filter((b) => b.kind === 'figure').length).toBeGreaterThanOrEqual(FLOORS.length + 2);
      const callouts = blocks.filter((b) => b.kind === 'callout');
      expect(callouts.length).toBeGreaterThanOrEqual(2);
      expect(callouts.some((c) => c.tone === 'tip' && c.text.toLowerCase().includes('ask'))).toBe(true);
    }
  });
});
