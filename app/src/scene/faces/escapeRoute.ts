/**
 * Escape Route in-case face: draws the floor map onto the plate's canvas
 * texture and handles raycast taps. Mirrors EscapeRoute.tsx behavior exactly —
 * same step checks (canStep), same hidden-sensor lookup (isSensorCell), same
 * soft-failure semantics (a wall bump costs nothing; a tripped sensor strikes
 * and sends the Agent back to START), same solve condition (reach the EXIT).
 * Sensors and the safe route are never drawn — they live only in the
 * Handler's manual, exactly like the 2D module.
 */
import { canStep, isSensorCell, type EscapeRouteState } from '../../modules/escapeRoute/logic';
import {
  colLetter,
  LANDMARK_SHAPES,
  LANDMARK_TAGS,
  MOVES,
  parseCell,
  stepFrom,
  type LandmarkKind,
  type Move,
} from '../../modules/escapeRoute/rules';
import {
  clearFace,
  drawStatus,
  drawTag,
  FACE_AMBER,
  FACE_BG,
  FACE_GREEN,
  FACE_LINE,
  FACE_PANEL,
  FACE_RED,
  FACE_TEXT,
  FACE_TEXT_DIM,
  px,
  roundRect,
  type FaceCallbacks,
  type FaceRegion,
  type FaceUi,
  type ModuleFace,
} from './types';

/** On-face landmark colors — always paired with shape + letter tag. */
const LANDMARK_HEX: Record<LandmarkKind, string> = {
  desk: '#2dd4bf',
  plant: FACE_GREEN,
  camera: '#a78bfa',
  crate: FACE_AMBER,
  fountain: '#60a5fa',
};

const MOVE_NAMES: Record<Move, string> = { N: 'north', S: 'south', E: 'east', W: 'west' };
const MOVE_DIRS: Record<Move, string> = { N: 'up', S: 'down', E: 'right', W: 'left' };

interface EscapeRouteUi extends FaceUi {
  pos: string;
  moves: Move[];
  done: boolean;
  tripped: boolean;
  /** short engraved status line for the canvas (full text goes to setStatus) */
  note: string;
}

const SIZE = 1024;
const GRID_MAX = 560;
const GRID_TOP = 190;

const PAD_ORDER: Move[] = ['W', 'N', 'S', 'E'];
const PAD_Y = 790;
const PAD_W = 200;
const PAD_H = 130;
const PAD_GAP = 24;

function gridMetrics(state: EscapeRouteState): { cell: number; x: number; y: number; w: number; h: number } {
  const cell = Math.floor(GRID_MAX / Math.max(state.cols, state.rows));
  const w = cell * state.cols;
  const h = cell * state.rows;
  return { cell, x: Math.round((SIZE - w) / 2), y: GRID_TOP, w, h };
}

function padRect(i: number): { x: number; y: number; w: number; h: number } {
  const total = PAD_ORDER.length * PAD_W + (PAD_ORDER.length - 1) * PAD_GAP;
  const x0 = Math.round((SIZE - total) / 2);
  return { x: x0 + i * (PAD_W + PAD_GAP), y: PAD_Y, w: PAD_W, h: PAD_H };
}

function landmarkAt(state: EscapeRouteState, cell: string): LandmarkKind | null {
  const hit = state.landmarks.find((l) => l.cell === cell);
  return hit ? hit.kind : null;
}

/** Spoken-friendly description of the current cell and its surroundings (mirrors the 2D module). */
function describe(state: EscapeRouteState, cell: string): string {
  const parts: string[] = [`You are in cell ${cell}.`];
  const here = landmarkAt(state, cell);
  if (here) parts.push(`Landmark here: ${here} (${LANDMARK_TAGS[here]}).`);
  for (const m of MOVES) {
    const next = canStep(state, cell, m);
    if (next === null) {
      parts.push(`${MOVE_NAMES[m]}: blocked by a wall.`);
    } else {
      const lm = landmarkAt(state, next);
      if (lm) parts.push(`${MOVE_NAMES[m]}: ${lm} (${LANDMARK_TAGS[lm]}) in ${next}.`);
      if (next === state.exit) parts.push(`${MOVE_NAMES[m]}: the exit door!`);
    }
  }
  return parts.join(' ');
}

/** Same accessible name as the 2D d-pad buttons. */
function moveLabel(move: Move, pos: string): string {
  return `Move ${MOVE_NAMES[move]}, one cell ${MOVE_DIRS[move]}. You are in cell ${pos}.`;
}

/** Dart-shaped arrow glyph, same silhouette as the 2D ArrowGlyph. */
function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, move: Move, color: string): void {
  const rot: Record<Move, number> = { N: 0, E: Math.PI / 2, S: Math.PI, W: -Math.PI / 2 };
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot[move]);
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(14, 12);
  ctx.lineTo(0, 5);
  ctx.lineTo(-14, 12);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Landmark = color + distinct shape + printed letter tag (never color alone). */
function drawLandmark(
  ctx: CanvasRenderingContext2D,
  kind: LandmarkKind,
  x: number,
  y: number,
  cell: number,
): void {
  const s = cell * 0.24;
  const shape = LANDMARK_SHAPES[kind];
  ctx.beginPath();
  if (shape === 'square') {
    ctx.rect(x - s, y - s, s * 2, s * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - s - 5);
    ctx.lineTo(x - s - 4, y + s);
    ctx.lineTo(x + s + 4, y + s);
    ctx.closePath();
  } else if (shape === 'circle') {
    ctx.arc(x, y, s + 2, 0, Math.PI * 2);
  } else if (shape === 'diamond') {
    ctx.moveTo(x, y - s - 5);
    ctx.lineTo(x + s + 5, y);
    ctx.lineTo(x, y + s + 5);
    ctx.lineTo(x - s - 5, y);
    ctx.closePath();
  } else {
    // hexagon
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const hx = x + (s + 3) * Math.cos(a);
      const hy = y + (s + 3) * Math.sin(a);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  }
  ctx.fillStyle = LANDMARK_HEX[kind];
  ctx.fill();
  ctx.strokeStyle = FACE_BG;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = `700 ${Math.round(cell * 0.28)}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = FACE_BG;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(LANDMARK_TAGS[kind], x, y + (shape === 'triangle' ? cell * 0.07 : 2));
}

/** Engraved compass rose — north is the top of the map. */
function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = FACE_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x - 7, y + 8);
  ctx.lineTo(x, y + 1);
  ctx.lineTo(x + 7, y + 8);
  ctx.closePath();
  ctx.fillStyle = FACE_AMBER;
  ctx.fill();
  ctx.font = '700 26px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = FACE_TEXT;
  ctx.fillText('N', x, y - 48);
  ctx.font = '600 22px ui-monospace, Menlo, monospace';
  ctx.fillStyle = FACE_TEXT_DIM;
  ctx.fillText('S', x, y + 48);
  ctx.fillText('E', x + 48, y);
  ctx.fillText('W', x - 48, y);
}

export const escapeRouteFace: ModuleFace<EscapeRouteState> = {
  canvasSize: SIZE,

  initUi(instance): EscapeRouteUi {
    return {
      pos: instance.state.start,
      moves: [],
      done: false,
      tripped: false,
      note: 'READ FLOOR CODE TO HANDLER',
    };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as EscapeRouteUi;
    const state = instance.state;
    const g = gridMetrics(state);
    clearFace(ctx, size);
    drawTag(ctx, size, 'ESCAPE ROUTE');

    // floor code — the thing the Agent reads to the Handler
    ctx.font = '500 24px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('READ THE FLOOR CODE TO YOUR HANDLER', size / 2, 78);
    ctx.font = '700 46px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_AMBER;
    ctx.fillText(`FLOOR ${state.floorId}`, size / 2, 112);

    drawCompass(ctx, g.x + g.w + 116, GRID_TOP + 48);

    // floor plate
    roundRect(ctx, g.x - 14, g.y - 14, g.w + 28, g.h + 28, 16);
    ctx.fillStyle = FACE_PANEL;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = FACE_LINE;
    ctx.stroke();
    if (ui.tripped) {
      // sensor tripped: red wash + border (redundant with the status text)
      ctx.fillStyle = 'rgba(255, 107, 107, 0.10)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
    }

    // axis labels
    ctx.font = '600 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let c = 0; c < state.cols; c++) {
      ctx.fillText(colLetter(c), g.x + c * g.cell + g.cell / 2, g.y - 34);
    }
    for (let r = 0; r < state.rows; r++) {
      ctx.fillText(String(r + 1), g.x - 34, g.y + r * g.cell + g.cell / 2);
    }

    // grid lines
    ctx.strokeStyle = FACE_LINE;
    ctx.lineWidth = 2;
    for (let c = 1; c < state.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(g.x + c * g.cell, g.y);
      ctx.lineTo(g.x + c * g.cell, g.y + g.h);
      ctx.stroke();
    }
    for (let r = 1; r < state.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(g.x, g.y + r * g.cell);
      ctx.lineTo(g.x + g.w, g.y + r * g.cell);
      ctx.stroke();
    }

    const center = (cell: string): { x: number; y: number } => {
      const p = parseCell(cell);
      return { x: g.x + p.c * g.cell + g.cell / 2, y: g.y + p.r * g.cell + g.cell / 2 };
    };
    const markFont = `600 ${Math.max(18, Math.round(g.cell * 0.18))}px ui-monospace, Menlo, monospace`;

    // start pad
    const sp = center(state.start);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, g.cell * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.fill();
    ctx.font = markFont;
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', sp.x, sp.y + g.cell * 0.34);

    // exit door: green square + diagonal + printed EXIT (shape and text, not color alone)
    const ep = center(state.exit);
    const es = g.cell * 0.23;
    ctx.strokeStyle = FACE_GREEN;
    ctx.lineWidth = 5;
    ctx.strokeRect(ep.x - es, ep.y - es - 2, es * 2, es * 2);
    ctx.beginPath();
    ctx.moveTo(ep.x - es, ep.y - es - 2);
    ctx.lineTo(ep.x + es, ep.y + es - 2);
    ctx.stroke();
    ctx.font = markFont;
    ctx.fillStyle = FACE_GREEN;
    ctx.fillText('EXIT', ep.x, ep.y + g.cell * 0.36);

    // landmarks
    for (const lm of state.landmarks) {
      const p = center(lm.cell);
      drawLandmark(ctx, lm.kind, p.x, p.y, g.cell);
    }

    // interior walls (visible barriers, thick engraved bars)
    ctx.strokeStyle = FACE_AMBER;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const wall of state.walls) {
      const [a, b] = wall.split('|');
      const pa = parseCell(a);
      const pb = parseCell(b);
      ctx.beginPath();
      if (pa.r === pb.r) {
        const wx = g.x + Math.max(pa.c, pb.c) * g.cell;
        const wy = g.y + pa.r * g.cell;
        ctx.moveTo(wx, wy + 5);
        ctx.lineTo(wx, wy + g.cell - 5);
      } else {
        const wx = g.x + pa.c * g.cell;
        const wy = g.y + Math.max(pa.r, pb.r) * g.cell;
        ctx.moveTo(wx + 5, wy);
        ctx.lineTo(wx + g.cell - 5, wy);
      }
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // outer border
    ctx.strokeStyle = ui.tripped ? FACE_RED : FACE_LINE;
    ctx.lineWidth = 4;
    ctx.strokeRect(g.x, g.y, g.w, g.h);

    // dashed outline on open adjacent cells — the tappable steps
    if (!ui.done) {
      ctx.save();
      ctx.strokeStyle = FACE_AMBER;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.globalAlpha = 0.65;
      for (const m of MOVES) {
        const next = canStep(state, ui.pos, m);
        if (next === null) continue;
        const p = parseCell(next);
        ctx.strokeRect(g.x + p.c * g.cell + 7, g.y + p.r * g.cell + 7, g.cell - 14, g.cell - 14);
      }
      ctx.restore();
    }

    // agent avatar: ring + dot at the current position
    const ap = center(ui.pos);
    ctx.beginPath();
    ctx.arc(ap.x, ap.y, g.cell * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = FACE_AMBER;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ap.x, ap.y, g.cell * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = FACE_AMBER;
    ctx.fill();

    // movement d-pad
    ctx.font = '500 22px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('M O V E M E N T   C O N T R O L S', size / 2, PAD_Y - 18);
    PAD_ORDER.forEach((m, i) => {
      const r = padRect(i);
      roundRect(ctx, r.x, r.y, r.w, r.h, 14);
      ctx.fillStyle = FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = FACE_LINE;
      ctx.stroke();
      const tone = ui.done ? FACE_TEXT_DIM : FACE_TEXT;
      drawArrow(ctx, r.x + r.w / 2 - 34, r.y + r.h / 2, m, tone);
      ctx.font = '700 40px ui-monospace, Menlo, monospace';
      ctx.fillStyle = tone;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m, r.x + r.w / 2 + 30, r.y + r.h / 2 + 2);
    });

    const statusText = ui.done ? ui.note : `${ui.note} · MOVES ${ui.moves.length}`;
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.tripped ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as EscapeRouteUi;
    const state = instance.state;
    const g = gridMetrics(state);
    const out: FaceRegion[] = [];
    PAD_ORDER.forEach((m, i) => {
      const r = padRect(i);
      out.push(px(`move-${m}`, moveLabel(m, ui.pos), SIZE, r.x, r.y, r.w, r.h, ui.done));
    });
    if (!ui.done) {
      // one region per adjacent on-grid cell — tapping it walks that direction
      // (walled directions still respond with a harmless bump, like the d-pad)
      for (const m of MOVES) {
        const next = stepFrom(ui.pos, m, state.cols, state.rows);
        if (next === null) continue;
        const p = parseCell(next);
        out.push(
          px(`cell-${m}`, moveLabel(m, ui.pos), SIZE, g.x + p.c * g.cell, g.y + p.r * g.cell, g.cell, g.cell),
        );
      }
    }
    return out;
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as EscapeRouteUi;
    if (ui.done) return;
    const raw = regionId.replace(/^(move|cell)-/, '');
    const move = MOVES.find((m) => m === raw);
    if (!move) return;

    const state = instance.state;
    const next = canStep(state, ui.pos, move);
    if (next === null) {
      // walls are visible — no strike, nothing committed (same as the 2D module)
      ui.note = `BUMP — WALL TO THE ${MOVE_NAMES[move].toUpperCase()}`;
      cb.setStatus(
        `Bump! A wall blocks you to the ${MOVE_NAMES[move]}. ${describe(state, ui.pos)} Moves so far: ${ui.moves.length}.`,
      );
      cb.repaint();
      return;
    }

    const path: Move[] = [...ui.moves, move];
    if (isSensorCell(state.floorId, next)) {
      // hidden sensor: soft failure — strike, then back to START to retry
      ui.tripped = true;
      ui.pos = state.start;
      ui.moves = [];
      ui.note = `SENSOR TRIPPED IN ${next} — BACK TO START`;
      cb.setStatus(
        `A hidden floor sensor tripped in ${next}! You are back at START (${state.start}). Tell your Handler exactly where the alarm went off. Moves so far: 0.`,
      );
      cb.repaint();
      cb.onStrike();
      return;
    }

    ui.tripped = false;
    ui.pos = next;
    ui.moves = path;
    cb.sfx('buttonPress');
    if (next === state.exit) {
      ui.done = true;
      ui.note = `EXIT REACHED IN ${next} — ${path.length} MOVES`;
      cb.setStatus(`You reached the EXIT in ${next}. Route clear — ${path.length} moves.`);
      cb.repaint();
      cb.onSolved();
      return;
    }
    ui.note = `IN ${next}`;
    cb.setStatus(`${describe(state, next)} Moves so far: ${path.length}.`);
    cb.repaint();
  },

  initialStatus(instance) {
    const { floorId, cols, rows, start, exit } = instance.state;
    return `Floor ${floorId}: ${cols} columns (A to ${colLetter(cols - 1)}) by ${rows} rows. Start at ${start}. Exit at ${exit}. Read the floor code to your Handler, then wait for directions.`;
  },
};
