/**
 * Wire Maze in-case face: draws the wire panel onto the plate's canvas
 * texture and handles raycast taps. Mirrors WireMaze.tsx behavior exactly —
 * same solver (solveWireMaze), same soft-failure semantics (a wrong cut
 * leaves the wire intact and strikes).
 */
import { solveWireMaze, type WireMazeState } from '../../modules/wireMaze/logic';
import type { WirePattern } from '../../modules/wireMaze/rules';
import {
  clearFace,
  drawStatus,
  drawTag,
  FACE_LINE,
  FACE_PANEL,
  FACE_TEXT,
  FACE_TEXT_DIM,
  px,
  roundRect,
  type FaceCallbacks,
  type FaceRegion,
  type FaceUi,
  type ModuleFace,
} from './types';

const WIRE_HEX: Record<string, string> = {
  amber: '#ffb347',
  teal: '#2dd4bf',
  crimson: '#f4587a',
  violet: '#a78bfa',
  silver: '#cbd5e1',
};

interface WireMazeUi extends FaceUi {
  cuts: number[];
  done: boolean;
  wrongWire: number | null;
}

const SIZE = 1024;
const ROW_X = 60;
const ROW_W = SIZE - 120;
const ROW_H = 108;
const ROW_GAP = 18;
const LIST_TOP = 150;

function rowRect(i: number): { x: number; y: number; w: number; h: number } {
  return { x: ROW_X, y: LIST_TOP + i * (ROW_H + ROW_GAP), w: ROW_W, h: ROW_H };
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: WirePattern,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.clip();
  ctx.strokeStyle = '#0f141a';
  ctx.fillStyle = '#0f141a';
  if (pattern === 'striped') {
    ctx.lineWidth = 10;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * (w / 12) - 12, y + h + 8);
      ctx.lineTo(x + i * (w / 12) + 18, y - 8);
      ctx.stroke();
    }
  } else if (pattern === 'dotted') {
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(x + 24 + i * (w / 11.5), y + h / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'zigzag') {
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const zx = x + i * (w / 18);
      const zy = i % 2 === 0 ? y + 6 : y + h - 6;
      if (i === 0) ctx.moveTo(zx, zy);
      else ctx.lineTo(zx, zy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export const wireMazeFace: ModuleFace<WireMazeState> = {
  canvasSize: SIZE,

  initUi(): WireMazeUi {
    return { cuts: [], done: false, wrongWire: null };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as WireMazeUi;
    const { wires, cutsRequired } = instance.state;
    clearFace(ctx, size);
    drawTag(ctx, size, 'LASER GRID BYPASS');

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      cutsRequired === 1 ? 'ONE WIRE DISARMS THE GRID' : `CUT ${cutsRequired} WIRES IN ORDER`,
      size / 2,
      78,
    );

    wires.forEach((wire, i) => {
      const r = rowRect(i);
      const cut = ui.cuts.includes(i);
      const wrong = ui.wrongWire === i;

      // row plate
      roundRect(ctx, r.x, r.y, r.w, r.h, 16);
      ctx.fillStyle = FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = wrong ? '#ff6b6b' : FACE_LINE;
      ctx.stroke();

      // printed position number
      ctx.font = '700 40px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), r.x + 44, r.y + r.h / 2 + 2);

      // wire band
      const wx = r.x + 84;
      const wy = r.y + r.h / 2 - 16;
      const ww = r.w - 84 - 240;
      const wh = 32;
      const hex = WIRE_HEX[wire.color] ?? '#888';
      if (cut) {
        // two stubs with a gap — the wire is snipped
        ctx.globalAlpha = 0.4;
        roundRect(ctx, wx, wy, ww * 0.4, wh, wh / 2);
        ctx.fillStyle = hex;
        ctx.fill();
        roundRect(ctx, wx + ww * 0.6, wy, ww * 0.4, wh, wh / 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        roundRect(ctx, wx, wy, ww, wh, wh / 2);
        ctx.fillStyle = hex;
        ctx.fill();
        drawPattern(ctx, wire.pattern, wx, wy, ww, wh);
      }

      // color name + letter tag (info never by color alone)
      ctx.font = '600 28px ui-monospace, Menlo, monospace';
      ctx.fillStyle = cut ? FACE_TEXT_DIM : FACE_TEXT;
      ctx.textAlign = 'left';
      ctx.fillText(wire.color.toUpperCase(), wx + ww + 24, r.y + r.h / 2 + 2);

      ctx.font = '700 34px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      const tagX = r.x + r.w - 52;
      roundRect(ctx, tagX - 30, r.y + r.h / 2 - 28, 60, 56, 10);
      ctx.strokeStyle = FACE_LINE;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = cut ? FACE_TEXT_DIM : FACE_TEXT;
      ctx.fillText(wire.label, tagX, r.y + r.h / 2 + 2);
    });

    const statusText = ui.done
      ? 'GRID DISARMED'
      : ui.wrongWire !== null
        ? `WRONG WIRE — ${ui.wrongWire + 1} NOT SAFE · CUTS ${ui.cuts.length}/${cutsRequired}`
        : `CUTS MADE ${ui.cuts.length}/${cutsRequired}`;
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.wrongWire !== null ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as WireMazeUi;
    return instance.state.wires.map((wire, i): FaceRegion => {
      const r = rowRect(i);
      const cut = ui.cuts.includes(i);
      return px(
        `wire-${i}`,
        `Wire ${i + 1}: ${wire.color}, ${wire.pattern}, tag ${wire.label}${cut ? ', already cut' : ''}`,
        SIZE,
        r.x,
        r.y,
        r.w,
        r.h,
        cut || ui.done,
      );
    });
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as WireMazeUi;
    if (ui.done) return;
    const index = Number(regionId.slice('wire-'.length));
    if (!Number.isInteger(index) || ui.cuts.includes(index)) return;

    const expected = solveWireMaze(instance.state);
    const step = ui.cuts.length;
    if (expected[step] !== index) {
      // wrong wire stays intact — soft failure, same as the 2D module
      ui.wrongWire = index;
      cb.setStatus(`Wrong wire — Wire ${index + 1} was not safe to cut. The panel is unchanged.`);
      cb.repaint();
      cb.onStrike();
      return;
    }

    ui.wrongWire = null;
    ui.cuts = [...ui.cuts, index];
    cb.sfx('wireSnip');
    if (ui.cuts.length === instance.state.cutsRequired) {
      ui.done = true;
      cb.setStatus('Grid disarmed!');
      cb.repaint();
      cb.onSolved();
    } else {
      cb.setStatus(`Cut wire ${index + 1}. Cuts made: ${ui.cuts.length} of ${instance.state.cutsRequired}.`);
      cb.repaint();
    }
  },

  initialStatus(instance) {
    const { cutsRequired, wires } = instance.state;
    return `Wire panel: ${wires.length} wires. ${
      cutsRequired === 1 ? 'One wire disarms the grid.' : `Cut ${cutsRequired} wires in the right order.`
    }`;
  },
};
