/**
 * Turns escape-route data into manual prose and printable map figures.
 * The manual generator calls these, so printed rules, scripts, and maps
 * always match the engine — never write route prose or draw maps by hand.
 */
import {
  cellId,
  colLetter,
  LANDMARK_KINDS,
  LANDMARK_SHAPES,
  LANDMARK_TAGS,
  MOVE_DELTA,
  parseCell,
  ROUTE_RULES,
  type Floor,
  type LandmarkKind,
  type Move,
  type RouteRule,
} from './rules';

export type Edition = 'standard' | 'simplified';

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

const MOVE_WORDS: Record<Move, { standard: string; simplified: string }> = {
  N: { standard: 'north', simplified: 'north (up)' },
  S: { standard: 'south', simplified: 'south (down)' },
  E: { standard: 'east', simplified: 'east (right)' },
  W: { standard: 'west', simplified: 'west (left)' },
};

export function moveWord(move: Move, ed: Edition): string {
  return MOVE_WORDS[move][ed];
}

const SHAPE_WORDS: Record<string, { standard: string; simplified: string }> = {
  square: { standard: 'square', simplified: 'square' },
  triangle: { standard: 'triangle', simplified: 'triangle' },
  circle: { standard: 'circle', simplified: 'circle' },
  diamond: { standard: 'diamond', simplified: 'diamond' },
  hexagon: { standard: 'hexagon', simplified: 'six-sided shape' },
};

export function landmarkPhrase(kind: LandmarkKind, ed: Edition): string {
  return ed === 'standard'
    ? `${kind} (tag ${LANDMARK_TAGS[kind]})`
    : `${kind} — letter ${LANDMARK_TAGS[kind]}`;
}

/** Rows for the landmark legend table: [name, letter tag, shape]. */
export function landmarkLegendRows(ed: Edition): string[][] {
  return LANDMARK_KINDS.map((kind) => [
    kind,
    LANDMARK_TAGS[kind],
    SHAPE_WORDS[LANDMARK_SHAPES[kind]][ed],
  ]);
}

/* ------------------------------------------------------------------ */
/* Movement rules -> prose (one prose line per data rule)              */
/* ------------------------------------------------------------------ */

export function routeRuleToText(rule: RouteRule, ed: Edition): string {
  const s = ed === 'standard';
  switch (rule.r) {
    case 'announceFloor':
      return s
        ? 'First, ask the Agent for the floor code on their screen (for example "FLOOR K-3"), then turn to that floor\'s map in this manual.'
        : 'Ask: "What floor are you on?" Find that map in this book.';
    case 'startCell':
      return s
        ? 'The Agent begins on the cell marked START — the filled dot on your map.'
        : 'The Agent starts on the dot marked START.';
    case 'oneCellPerMove':
      return s
        ? 'Each command moves the Agent exactly one cell north, south, east, or west. North is the top of the map.'
        : 'One move = one square. North is up. South is down. East is right. West is left.';
    case 'wallsBlock':
      return s
        ? 'Thick lines are walls. The Agent cannot move through a wall — and the Agent CAN see the walls on screen.'
        : 'Thick lines are walls. Nobody can walk through a wall. The Agent can see walls too.';
    case 'sensorsHidden':
      return s
        ? 'Hatched squares are floor sensors. They are INVISIBLE on the Agent\'s screen — only your map shows them.'
        : 'Striped squares are sensors. The Agent CANNOT see them. Only you can.';
    case 'sensorTrip':
      return s
        ? 'If the Agent steps on a sensor, the alarm level rises and the Agent is sent back to START. Nothing is lost — guide them again.'
        : 'If the Agent steps on a sensor, the alarm beeps. The Agent goes back to START. Try again.';
    case 'reachExit':
      return s
        ? 'The mission is complete the moment the Agent reaches the cell marked EXIT.'
        : 'When the Agent reaches EXIT, you win.';
    case 'anySafePath':
      return s
        ? 'The dashed line is the recommended route, but ANY path that avoids walls and sensors works.'
        : 'The dashed line is one safe way. Other safe ways work too.';
  }
}

export function routeRulesText(ed: Edition): string[] {
  return ROUTE_RULES.map((rule) => routeRuleToText(rule, ed));
}

/* ------------------------------------------------------------------ */
/* Canonical route -> spoken directions (generated from floor data)    */
/* ------------------------------------------------------------------ */

interface RouteRun {
  move: Move;
  count: number;
  /** Cell reached at the end of this run. */
  endCell: string;
}

/** Compress the canonical route into runs of same-direction moves. */
export function routeRuns(floor: Floor): RouteRun[] {
  const runs: RouteRun[] = [];
  let pos = parseCell(floor.start);
  for (const move of floor.canonicalRoute) {
    const { dc, dr } = MOVE_DELTA[move];
    pos = { c: pos.c + dc, r: pos.r + dr };
    const last = runs[runs.length - 1];
    if (last && last.move === move) {
      last.count += 1;
      last.endCell = cellId(pos.c, pos.r);
    } else {
      runs.push({ move, count: 1, endCell: cellId(pos.c, pos.r) });
    }
  }
  return runs;
}

function landmarkAt(floor: Floor, cell: string): LandmarkKind | null {
  const hit = floor.landmarks.find((l) => l.cell === cell);
  return hit ? hit.kind : null;
}

/**
 * One-line summary of the canonical route for the standard edition,
 * with landmark checkpoints called out. Generated from floor data.
 */
export function routeSummary(floor: Floor, ed: Edition): string {
  const parts = routeRuns(floor).map((run) => {
    const kind = landmarkAt(floor, run.endCell);
    const base = `${moveWord(run.move, ed)} ${run.count}`;
    return kind
      ? `${base} to the ${landmarkPhrase(kind, ed)} at ${run.endCell}`
      : `${base} to ${run.endCell}`;
  });
  return `From START at ${floor.start}: ${parts.join('; ')}. That last cell, ${floor.exit}, is the EXIT.`;
}

/**
 * Short spoken script for the simplified edition — one line per run,
 * with a checkpoint question at every landmark. Generated from floor data.
 */
export function routeScriptLines(floor: Floor): string[] {
  const lines: string[] = [`Say: "You start at ${floor.start}."`];
  for (const run of routeRuns(floor)) {
    lines.push(`Say: "Go ${moveWord(run.move, 'simplified')} ${run.count}. Stop."`);
    const kind = landmarkAt(floor, run.endCell);
    if (kind) {
      lines.push(`Ask: "Do you see the ${kind} — letter ${LANDMARK_TAGS[kind]}? What cell are you in?"`);
    }
  }
  lines.push(`Say: "You made it! ${floor.exit} is the EXIT."`);
  return lines;
}

/* ------------------------------------------------------------------ */
/* Printable map figures (black on white) — shared by both editions    */
/* ------------------------------------------------------------------ */

const CELL = 54;
const PAD = 30; // room for axis labels (columns on top, rows on the left)

function cx(c: number): number {
  return PAD + c * CELL + CELL / 2;
}
function cy(r: number): number {
  return PAD + r * CELL + CELL / 2;
}

/** Outline shape + letter tag for a landmark (print version, black on white). */
function landmarkGlyph(kind: LandmarkKind, x: number, y: number): string {
  const tag = LANDMARK_TAGS[kind];
  const s = 15; // half-size
  let shape = '';
  switch (LANDMARK_SHAPES[kind]) {
    case 'square':
      shape = `<rect x="${x - s}" y="${y - s}" width="${s * 2}" height="${s * 2}" fill="#fff" stroke="#111" stroke-width="2"/>`;
      break;
    case 'triangle':
      shape = `<polygon points="${x},${y - s - 3} ${x - s - 2},${y + s} ${x + s + 2},${y + s}" fill="#fff" stroke="#111" stroke-width="2"/>`;
      break;
    case 'circle':
      shape = `<circle cx="${x}" cy="${y}" r="${s + 1}" fill="#fff" stroke="#111" stroke-width="2"/>`;
      break;
    case 'diamond':
      shape = `<polygon points="${x},${y - s - 3} ${x + s + 3},${y} ${x},${y + s + 3} ${x - s - 3},${y}" fill="#fff" stroke="#111" stroke-width="2"/>`;
      break;
    case 'hexagon': {
      const h = s + 2;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${(x + h * Math.cos(a)).toFixed(1)},${(y + h * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      shape = `<polygon points="${pts}" fill="#fff" stroke="#111" stroke-width="2"/>`;
      break;
    }
  }
  const dy = LANDMARK_SHAPES[kind] === 'triangle' ? 7 : 5;
  return `${shape}<text x="${x}" y="${y + dy}" text-anchor="middle" font-size="15" font-weight="bold" fill="#111">${tag}</text>`;
}

/**
 * Build the printable map for one floor from its data: grid with coordinate
 * axes, thick walls, landmark shapes with letter tags, hatched sensor
 * squares, START/EXIT marks, and the canonical route as a dashed line.
 */
export function floorMapSvg(floor: Floor): string {
  const w = PAD + floor.cols * CELL + 12;
  const h = PAD + floor.rows * CELL + 12;
  const hatchId = `er-hatch-${floor.floorId}`;
  const parts: string[] = [];

  parts.push(
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="sans-serif">`,
    `<defs><pattern id="${hatchId}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#111" stroke-width="3"/></pattern></defs>`,
    `<rect x="${PAD}" y="${PAD}" width="${floor.cols * CELL}" height="${floor.rows * CELL}" fill="#fff" stroke="#111" stroke-width="4"/>`,
  );

  // Axis labels: column letters on top, row numbers on the left.
  for (let c = 0; c < floor.cols; c++) {
    parts.push(
      `<text x="${cx(c)}" y="${PAD - 9}" text-anchor="middle" font-size="15" font-weight="bold" fill="#111">${colLetter(c)}</text>`,
    );
  }
  for (let r = 0; r < floor.rows; r++) {
    parts.push(
      `<text x="${PAD - 10}" y="${cy(r) + 5}" text-anchor="middle" font-size="15" font-weight="bold" fill="#111">${r + 1}</text>`,
    );
  }

  // Thin grid lines.
  for (let c = 1; c < floor.cols; c++) {
    const x = PAD + c * CELL;
    parts.push(`<line x1="${x}" y1="${PAD}" x2="${x}" y2="${PAD + floor.rows * CELL}" stroke="#999" stroke-width="1"/>`);
  }
  for (let r = 1; r < floor.rows; r++) {
    const y = PAD + r * CELL;
    parts.push(`<line x1="${PAD}" y1="${y}" x2="${PAD + floor.cols * CELL}" y2="${y}" stroke="#999" stroke-width="1"/>`);
  }

  // Sensor squares (hatched) — manual only; the Agent never sees these.
  for (const cell of floor.sensorCells) {
    const { c, r } = parseCell(cell);
    parts.push(
      `<rect class="er-print-sensor" x="${PAD + c * CELL + 2}" y="${PAD + r * CELL + 2}" width="${CELL - 4}" height="${CELL - 4}" fill="url(#${hatchId})" stroke="#111" stroke-width="1.5"/>`,
    );
  }

  // Canonical route as a dashed line through cell centers, dot at start.
  let pc = parseCell(floor.start);
  const pts = [`${cx(pc.c)},${cy(pc.r)}`];
  for (const move of floor.canonicalRoute) {
    const { dc, dr } = MOVE_DELTA[move];
    pc = { c: pc.c + dc, r: pc.r + dr };
    pts.push(`${cx(pc.c)},${cy(pc.r)}`);
  }
  parts.push(
    `<polyline class="er-print-route" points="${pts.join(' ')}" fill="none" stroke="#111" stroke-width="3" stroke-dasharray="7 6" stroke-linejoin="round"/>`,
  );

  // Thick interior walls (drawn after the route so they stay crisp).
  for (const wall of floor.walls) {
    const [a, b] = wall.split('|');
    const pa = parseCell(a);
    const pb = parseCell(b);
    if (pa.r === pb.r) {
      // vertical wall between horizontally adjacent cells
      const x = PAD + Math.max(pa.c, pb.c) * CELL;
      const y = PAD + pa.r * CELL;
      parts.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + CELL}" stroke="#111" stroke-width="6" stroke-linecap="square"/>`);
    } else {
      // horizontal wall between vertically adjacent cells
      const x = PAD + pa.c * CELL;
      const y = PAD + Math.max(pa.r, pb.r) * CELL;
      parts.push(`<line x1="${x}" y1="${y}" x2="${x + CELL}" y2="${y}" stroke="#111" stroke-width="6" stroke-linecap="square"/>`);
    }
  }

  // Landmarks.
  for (const lm of floor.landmarks) {
    const { c, r } = parseCell(lm.cell);
    parts.push(landmarkGlyph(lm.kind, cx(c), cy(r)));
  }

  // START and EXIT marks.
  const sp = parseCell(floor.start);
  parts.push(
    `<circle cx="${cx(sp.c)}" cy="${cy(sp.r)}" r="9" fill="#111"/>`,
    `<text x="${cx(sp.c)}" y="${cy(sp.r) + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#111">START</text>`,
  );
  const ep = parseCell(floor.exit);
  parts.push(
    `<rect x="${cx(ep.c) - 12}" y="${cy(ep.r) - 14}" width="24" height="24" fill="#fff" stroke="#111" stroke-width="3"/>`,
    `<line x1="${cx(ep.c) - 12}" y1="${cy(ep.r) - 14}" x2="${cx(ep.c) + 12}" y2="${cy(ep.r) + 10}" stroke="#111" stroke-width="3"/>`,
    `<text x="${cx(ep.c)}" y="${cy(ep.r) + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#111">EXIT</text>`,
  );

  parts.push('</svg>');
  return parts.join('\n');
}

/** Alt text for a floor map figure, generated from the same data. */
export function floorMapAlt(floor: Floor, ed: Edition): string {
  const lms = floor.landmarks.map((l) => `${l.kind} at ${l.cell}`).join(', ');
  return ed === 'standard'
    ? `Map of floor ${floor.floorId}: ${floor.cols} by ${floor.rows} grid. Start at ${floor.start}, exit at ${floor.exit}. Landmarks: ${lms}. Hatched squares are hidden sensors at ${floor.sensorCells.join(', ')}. A dashed line shows the safe route.`
    : `Floor ${floor.floorId} map. Start ${floor.start}. Exit ${floor.exit}. Landmarks: ${lms}. Striped squares are sensors: ${floor.sensorCells.join(', ')}. The dashed line is the safe way.`;
}

/**
 * Legend figure: what every mark on the maps means. Built from the same
 * landmark tables the engine and screen use.
 */
export function legendSvg(): string {
  const rows: string[] = [];
  let y = 34;
  for (const kind of LANDMARK_KINDS) {
    rows.push(landmarkGlyph(kind, 40, y));
    rows.push(`<text x="72" y="${y + 5}" font-size="15" fill="#111">${kind} — letter ${LANDMARK_TAGS[kind]}, ${LANDMARK_SHAPES[kind]} shape</text>`);
    y += 44;
  }
  // Sensor swatch
  rows.push(
    `<defs><pattern id="er-hatch-legend" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#111" stroke-width="3"/></pattern></defs>`,
    `<rect x="24" y="${y - 16}" width="32" height="32" fill="url(#er-hatch-legend)" stroke="#111" stroke-width="1.5"/>`,
    `<text x="72" y="${y + 5}" font-size="15" fill="#111">hidden sensor (Agent cannot see it)</text>`,
  );
  y += 44;
  rows.push(
    `<line x1="24" y1="${y}" x2="56" y2="${y}" stroke="#111" stroke-width="6"/>`,
    `<text x="72" y="${y + 5}" font-size="15" fill="#111">wall (blocks movement; Agent sees it)</text>`,
  );
  y += 44;
  rows.push(
    `<line x1="24" y1="${y}" x2="56" y2="${y}" stroke="#111" stroke-width="3" stroke-dasharray="7 6"/>`,
    `<text x="72" y="${y + 5}" font-size="15" fill="#111">safe route (manual only)</text>`,
  );
  y += 44;
  rows.push(
    `<circle cx="40" cy="${y}" r="9" fill="#111"/>`,
    `<text x="72" y="${y + 5}" font-size="15" fill="#111">START</text>`,
  );
  y += 44;
  rows.push(
    `<rect x="28" y="${y - 12}" width="24" height="24" fill="#fff" stroke="#111" stroke-width="3"/>`,
    `<line x1="28" y1="${y - 12}" x2="52" y2="${y + 12}" stroke="#111" stroke-width="3"/>`,
    `<text x="72" y="${y + 5}" font-size="15" fill="#111">EXIT</text>`,
  );
  return `<svg viewBox="0 0 420 ${y + 32}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="sans-serif">${rows.join('\n')}</svg>`;
}

/** Compass figure so the Handler and Agent share direction words. */
export function compassSvg(): string {
  return `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" role="img" font-family="sans-serif">
<circle cx="70" cy="70" r="46" fill="#fff" stroke="#111" stroke-width="3"/>
<polygon points="70,32 62,74 70,66 78,74" fill="#111"/>
<text x="70" y="22" text-anchor="middle" font-size="16" font-weight="bold" fill="#111">N</text>
<text x="70" y="132" text-anchor="middle" font-size="16" font-weight="bold" fill="#111">S</text>
<text x="128" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="#111">E</text>
<text x="12" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="#111">W</text>
</svg>`;
}
