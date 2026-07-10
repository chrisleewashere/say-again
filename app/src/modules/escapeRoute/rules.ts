/**
 * Escape Route — rule tables and floor data.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver, the on-screen map, AND the
 * printed manual maps are all generated from the data in this file. Never
 * hand-edit manual prose or map figures for this module; edit these tables.
 *
 * Barrier game: the Agent's screen shows the grid, walls, and landmarks but
 * NOT the sensor cells or the safe route — those appear only in the Handler's
 * printed manual. Original game content; school-appropriate.
 *
 * Color is never the only channel: every landmark pairs a color with a
 * distinct shape AND a printed letter tag, and sensors print as hatched
 * squares (no color needed).
 */

/* ------------------------------------------------------------------ */
/* Grid vocabulary                                                     */
/* ------------------------------------------------------------------ */

/** Compass moves. North is the top of the map; row 1 is the north row. */
export const MOVES = ['N', 'S', 'E', 'W'] as const;
export type Move = (typeof MOVES)[number];

export const MOVE_DELTA: Record<Move, { dc: number; dr: number }> = {
  N: { dc: 0, dr: -1 },
  S: { dc: 0, dr: 1 },
  E: { dc: 1, dr: 0 },
  W: { dc: -1, dr: 0 },
};

/** Column index 0..5 -> letter A..F (printed on the map's top axis). */
export function colLetter(c: number): string {
  return String.fromCharCode(65 + c);
}

/** Cell id like "B3": column letter + 1-based row number (row 1 = north). */
export function cellId(c: number, r: number): string {
  return `${colLetter(c)}${r + 1}`;
}

export function parseCell(cell: string): { c: number; r: number } {
  return { c: cell.charCodeAt(0) - 65, r: parseInt(cell.slice(1), 10) - 1 };
}

/** Canonical key for the wall between two adjacent cells (order-free). */
export function wallKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export function hasWall(walls: readonly string[], a: string, b: string): boolean {
  const key = wallKey(a, b);
  return walls.some((w) => {
    const [x, y] = w.split('|');
    return wallKey(x, y) === key;
  });
}

/** One step from a cell; null when the move would leave the grid. */
export function stepFrom(cell: string, move: Move, cols: number, rows: number): string | null {
  const { c, r } = parseCell(cell);
  const { dc, dr } = MOVE_DELTA[move];
  const nc = c + dc;
  const nr = r + dr;
  if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) return null;
  return cellId(nc, nr);
}

/* ------------------------------------------------------------------ */
/* Landmarks                                                           */
/* ------------------------------------------------------------------ */

export const LANDMARK_KINDS = ['desk', 'plant', 'camera', 'crate', 'fountain'] as const;
export type LandmarkKind = (typeof LANDMARK_KINDS)[number];

/** Printed letter tag — the redundant channel alongside color and shape. */
export const LANDMARK_TAGS: Record<LandmarkKind, string> = {
  desk: 'D',
  plant: 'P',
  camera: 'C',
  crate: 'K',
  fountain: 'F',
};

/** Distinct outline shape per kind — the second redundant channel. */
export type LandmarkShape = 'square' | 'triangle' | 'circle' | 'diamond' | 'hexagon';
export const LANDMARK_SHAPES: Record<LandmarkKind, LandmarkShape> = {
  desk: 'square',
  plant: 'triangle',
  camera: 'circle',
  crate: 'diamond',
  fountain: 'hexagon',
};

export interface Landmark {
  cell: string;
  kind: LandmarkKind;
}

/* ------------------------------------------------------------------ */
/* Floors                                                              */
/* ------------------------------------------------------------------ */

export type FloorDifficulty = 1 | 2 | 3;

export interface Floor {
  /** Code the Agent reads off the screen, e.g. "K-3" ("FLOOR K-3"). */
  floorId: string;
  difficulty: FloorDifficulty;
  cols: number;
  rows: number;
  start: string;
  exit: string;
  /** Walls between adjacent cells, e.g. "A1|A2". Visible on screen AND in the manual. */
  walls: string[];
  /** Visible on screen AND in the manual. */
  landmarks: Landmark[];
  /** HIDDEN from the Agent's screen — printed ONLY in the Handler's manual. */
  sensorCells: string[];
  /** The recommended safe route, printed ONLY in the manual (dashed line). */
  canonicalRoute: Move[];
}

/** Grid side length per difficulty tier. */
export const GRID_SIZE: Record<FloorDifficulty, number> = { 1: 4, 2: 5, 3: 6 };

export const FLOORS: Floor[] = [
  /* ---------------- Rookie: 4x4, short routes ---------------- */
  {
    floorId: 'K-1',
    difficulty: 1,
    cols: 4,
    rows: 4,
    start: 'A4',
    exit: 'D1',
    walls: ['A1|A2', 'D1|D2', 'B4|B3'],
    landmarks: [
      { cell: 'B3', kind: 'plant' },
      { cell: 'C2', kind: 'desk' },
    ],
    sensorCells: ['B4', 'C3', 'A1'],
    canonicalRoute: ['N', 'N', 'E', 'E', 'N', 'E'],
  },
  {
    floorId: 'K-2',
    difficulty: 1,
    cols: 4,
    rows: 4,
    start: 'D4',
    exit: 'A1',
    walls: ['A4|A3', 'D4|D3', 'B2|B1'],
    landmarks: [
      { cell: 'B3', kind: 'crate' },
      { cell: 'C2', kind: 'camera' },
    ],
    sensorCells: ['C3', 'A3', 'D2'],
    canonicalRoute: ['W', 'W', 'N', 'N', 'W', 'N'],
  },
  {
    floorId: 'K-3',
    difficulty: 1,
    cols: 4,
    rows: 4,
    start: 'A1',
    exit: 'D4',
    walls: ['B2|B3', 'D3|D4', 'A3|A4'],
    landmarks: [
      { cell: 'B2', kind: 'fountain' },
      { cell: 'C4', kind: 'plant' },
    ],
    sensorCells: ['B1', 'C2', 'B4'],
    canonicalRoute: ['S', 'S', 'E', 'E', 'S', 'E'],
  },
  {
    floorId: 'K-4',
    difficulty: 1,
    cols: 4,
    rows: 4,
    start: 'B4',
    exit: 'C1',
    walls: ['B4|B3', 'C1|C2', 'D2|D3'],
    landmarks: [
      { cell: 'A2', kind: 'desk' },
      { cell: 'D3', kind: 'camera' },
    ],
    sensorCells: ['C3', 'B2', 'D1'],
    canonicalRoute: ['W', 'N', 'N', 'N', 'E', 'E'],
  },

  /* ---------------- Agent: 5x5, medium routes ---------------- */
  {
    floorId: 'M-1',
    difficulty: 2,
    cols: 5,
    rows: 5,
    start: 'A5',
    exit: 'E1',
    walls: ['A4|A3', 'E1|E2', 'D2|D3', 'B3|C3'],
    landmarks: [
      { cell: 'B4', kind: 'plant' },
      { cell: 'C2', kind: 'desk' },
      { cell: 'E3', kind: 'camera' },
    ],
    sensorCells: ['B5', 'A3', 'D3', 'C1'],
    canonicalRoute: ['N', 'E', 'N', 'N', 'E', 'E', 'N', 'E'],
  },
  {
    floorId: 'M-2',
    difficulty: 2,
    cols: 5,
    rows: 5,
    start: 'E5',
    exit: 'A1',
    walls: ['A2|A1', 'E5|E4', 'C4|C3', 'B2|A2'],
    landmarks: [
      { cell: 'D4', kind: 'crate' },
      { cell: 'B3', kind: 'fountain' },
      { cell: 'A4', kind: 'camera' },
    ],
    sensorCells: ['C5', 'A3', 'C3', 'D2'],
    canonicalRoute: ['W', 'N', 'W', 'W', 'N', 'N', 'N', 'W'],
  },
  {
    floorId: 'M-3',
    difficulty: 2,
    cols: 5,
    rows: 5,
    start: 'C5',
    exit: 'C1',
    walls: ['C5|C4', 'C2|C1', 'A4|A3'],
    landmarks: [
      { cell: 'A3', kind: 'plant' },
      { cell: 'B4', kind: 'crate' },
      { cell: 'D2', kind: 'camera' },
    ],
    sensorCells: ['D5', 'C3', 'B2', 'D1'],
    canonicalRoute: ['W', 'N', 'N', 'W', 'N', 'N', 'E', 'E'],
  },
  {
    floorId: 'M-4',
    difficulty: 2,
    cols: 5,
    rows: 5,
    start: 'A1',
    exit: 'E5',
    walls: ['D1|D2', 'E5|E4', 'C4|C3', 'B2|C2'],
    landmarks: [
      { cell: 'C2', kind: 'fountain' },
      { cell: 'D4', kind: 'plant' },
      { cell: 'B3', kind: 'desk' },
    ],
    sensorCells: ['A2', 'D2', 'B4', 'E4'],
    canonicalRoute: ['E', 'E', 'S', 'S', 'E', 'S', 'S', 'E'],
  },

  /* ------- Mastermind: 6x6, long routes, decoy landmark pairs ------- */
  {
    floorId: 'X-1',
    difficulty: 3,
    cols: 6,
    rows: 6,
    start: 'A6',
    exit: 'F1',
    walls: ['A5|A4', 'B4|B3', 'C1|C2', 'E1|E2', 'F1|F2', 'D4|D3'],
    landmarks: [
      { cell: 'B5', kind: 'plant' },
      { cell: 'D4', kind: 'plant' }, // decoy pair: two plants
      { cell: 'C3', kind: 'desk' },
      { cell: 'E2', kind: 'camera' },
      { cell: 'F5', kind: 'crate' },
    ],
    sensorCells: ['A3', 'C2', 'D2', 'E3', 'D5'],
    canonicalRoute: ['N', 'E', 'E', 'N', 'N', 'W', 'N', 'N', 'E', 'E', 'E', 'E'],
  },
  {
    floorId: 'X-2',
    difficulty: 3,
    cols: 6,
    rows: 6,
    start: 'F6',
    exit: 'A1',
    walls: ['D3|C3', 'F5|F4', 'E3|E2', 'A1|B1', 'C2|C1', 'B2|B1'],
    landmarks: [
      { cell: 'E4', kind: 'camera' },
      { cell: 'B5', kind: 'camera' }, // decoy pair: two cameras
      { cell: 'D4', kind: 'desk' },
      { cell: 'A4', kind: 'crate' },
      { cell: 'C2', kind: 'fountain' },
    ],
    sensorCells: ['D2', 'C5', 'B3', 'F3', 'A3'],
    canonicalRoute: ['N', 'W', 'N', 'N', 'W', 'S', 'W', 'N', 'N', 'W', 'W', 'N'],
  },
  {
    floorId: 'X-3',
    difficulty: 3,
    cols: 6,
    rows: 6,
    start: 'C6',
    exit: 'F2',
    walls: ['E3|E2', 'E2|D2', 'F2|E2', 'F2|F3', 'C5|B5', 'D5|D4'],
    landmarks: [
      { cell: 'D5', kind: 'crate' },
      { cell: 'B4', kind: 'crate' }, // decoy pair: two crates
      { cell: 'E4', kind: 'fountain' },
      { cell: 'A5', kind: 'plant' },
      { cell: 'D1', kind: 'desk' },
    ],
    sensorCells: ['E2', 'C4', 'D4', 'F5', 'B6'],
    canonicalRoute: ['N', 'E', 'E', 'N', 'N', 'W', 'N', 'N', 'E', 'E', 'S'],
  },
  {
    floorId: 'X-4',
    difficulty: 3,
    cols: 6,
    rows: 6,
    start: 'F1',
    exit: 'A6',
    walls: ['B5|C5', 'F3|F4', 'E3|E2', 'D5|E5', 'A6|A5', 'C4|C3'],
    landmarks: [
      { cell: 'D4', kind: 'desk' },
      { cell: 'B2', kind: 'desk' }, // decoy pair: two desks
      { cell: 'E5', kind: 'plant' },
      { cell: 'C5', kind: 'camera' },
      { cell: 'A4', kind: 'crate' },
    ],
    sensorCells: ['E4', 'C6', 'B3', 'D2', 'A5'],
    canonicalRoute: ['S', 'S', 'W', 'W', 'S', 'S', 'W', 'N', 'W', 'S', 'S', 'W'],
  },
];

export function floorsForDifficulty(difficulty: FloorDifficulty): Floor[] {
  return FLOORS.filter((f) => f.difficulty === difficulty);
}

export function floorById(floorId: string): Floor {
  const floor = FLOORS.find((f) => f.floorId === floorId);
  if (!floor) throw new Error(`Unknown floor: ${floorId}`);
  return floor;
}

/* ------------------------------------------------------------------ */
/* Movement rules — the game logic as data.                            */
/*                                                                     */
/* Every rule here is BOTH enforced by logic.ts/the component AND      */
/* rendered to manual prose by prose.ts. These rules all apply at all  */
/* times (they are not a first-match list), so no catch-all is needed. */
/* ------------------------------------------------------------------ */

export type RouteRule =
  | { r: 'announceFloor' }
  | { r: 'startCell' }
  | { r: 'oneCellPerMove' }
  | { r: 'wallsBlock' }
  | { r: 'sensorsHidden' }
  | { r: 'sensorTrip' }
  | { r: 'reachExit' }
  | { r: 'anySafePath' };

export const ROUTE_RULES: RouteRule[] = [
  { r: 'announceFloor' },
  { r: 'startCell' },
  { r: 'oneCellPerMove' },
  { r: 'wallsBlock' },
  { r: 'sensorsHidden' },
  { r: 'sensorTrip' },
  { r: 'reachExit' },
  { r: 'anySafePath' },
];
