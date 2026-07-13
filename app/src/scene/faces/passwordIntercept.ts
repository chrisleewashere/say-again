/**
 * Password Intercept in-case face: draws the intercept card + word bank onto
 * the plate's canvas texture and handles raycast taps. Mirrors
 * PasswordIntercept.tsx behavior exactly — same solver
 * (solvePasswordIntercept), same soft-failure semantics (a wrong pick leaves
 * the round open and strikes; the rejected word stays visible and marked).
 */
import { solvePasswordIntercept, type PasswordInterceptState } from '../../modules/passwordIntercept/logic';
import {
  clearFace,
  drawStatus,
  drawTag,
  FACE_AMBER,
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

interface PasswordInterceptUi extends FaceUi {
  chosen: string[];
  lastRejected: string | null;
  done: boolean;
}

const SIZE = 1024;
const ROW_X = 122;
const ROW_W = SIZE - 244;
const ROW_H = 98;
const ROW_GAP = 14;
const LIST_TOP = 388;
const CARD_X = 112;
const CARD_W = SIZE - 224;
const CARD_Y = 126;
const CARD_H = 150;
const DOTS_Y = 330;

function rowRect(i: number): { x: number; y: number; w: number; h: number } {
  return { x: ROW_X, y: LIST_TOP + i * (ROW_H + ROW_GAP), w: ROW_W, h: ROW_H };
}

function currentRoundIndex(state: PasswordInterceptState, ui: PasswordInterceptUi): number {
  return Math.min(ui.chosen.length, state.rounds.length - 1);
}

/** Decorative radio-signal motif flanking the card number (matches SignalGlyph). */
function drawSignalGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.strokeStyle = FACE_AMBER;
  ctx.fillStyle = FACE_AMBER;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 24, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 42, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Round progress dot. Never color-only: decoded rounds are filled circles
 * with a check mark, the current round is a ring with a center dot, and
 * upcoming rounds are dashed outlines. (Same shape channels as the 2D dots.)
 */
function drawProgressDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: 'done' | 'current' | 'upcoming',
): void {
  ctx.save();
  if (kind === 'done') {
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = FACE_GREEN;
    ctx.fill();
    ctx.strokeStyle = '#0f141a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 1);
    ctx.lineTo(cx - 3, cy + 9);
    ctx.lineTo(cx + 11, cy - 7);
    ctx.stroke();
  } else if (kind === 'current') {
    ctx.strokeStyle = FACE_AMBER;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = FACE_AMBER;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = FACE_LINE;
    ctx.lineWidth = 5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export const passwordInterceptFace: ModuleFace<PasswordInterceptState> = {
  canvasSize: SIZE,

  initUi(): PasswordInterceptUi {
    return { chosen: [], lastRejected: null, done: false };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as PasswordInterceptUi;
    const { rounds } = instance.state;
    const roundIdx = currentRoundIndex(instance.state, ui);
    const round = rounds[roundIdx];
    clearFace(ctx, size);
    drawTag(ctx, size, 'PASSWORD INTERCEPT');

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('READ THE CARD NUMBER TO YOUR HANDLER', size / 2, 78);

    // intercept card frame
    roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 20);
    ctx.fillStyle = FACE_PANEL;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ui.done ? FACE_GREEN : FACE_AMBER;
    ctx.stroke();
    drawSignalGlyph(ctx, CARD_X + 90, CARD_Y + CARD_H / 2 - 14);
    drawSignalGlyph(ctx, CARD_X + CARD_W - 90, CARD_Y + CARD_H / 2 - 14);
    ctx.font = '700 64px ui-monospace, Menlo, monospace';
    ctx.fillStyle = ui.done ? FACE_GREEN : FACE_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ui.done ? 'DECODED' : `CARD ${round.cardId}`, size / 2, CARD_Y + CARD_H / 2 + 4);

    // progress dots (shape-coded, never color alone)
    const dotGap = 76;
    const dotsLeft = size / 2 - ((rounds.length - 1) * dotGap) / 2;
    rounds.forEach((_, i) => {
      const kind = i < ui.chosen.length ? 'done' : i === ui.chosen.length ? 'current' : 'upcoming';
      drawProgressDot(ctx, dotsLeft + i * dotGap, DOTS_Y, kind);
    });

    // candidate word bank
    round.candidates.forEach((word, i) => {
      const r = rowRect(i);
      const rejected = !ui.done && ui.lastRejected === word;

      roundRect(ctx, r.x, r.y, r.w, r.h, 16);
      ctx.fillStyle = FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = rejected ? FACE_RED : FACE_LINE;
      ctx.stroke();

      // printed position number (position channel, like the row index)
      ctx.font = '700 38px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), r.x + 46, r.y + r.h / 2 + 2);

      // the candidate word
      ctx.font = '600 40px ui-monospace, Menlo, monospace';
      ctx.fillStyle = ui.done ? FACE_TEXT_DIM : FACE_TEXT;
      ctx.textAlign = 'center';
      ctx.fillText(word.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2 + 2);

      if (rejected) {
        // rejection is marked by an X glyph + printed word, not color alone
        const xx = r.x + r.w - 120;
        const xy = r.y + r.h / 2;
        ctx.strokeStyle = FACE_RED;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xx - 12, xy - 12);
        ctx.lineTo(xx + 12, xy + 12);
        ctx.moveTo(xx + 12, xy - 12);
        ctx.lineTo(xx - 12, xy + 12);
        ctx.stroke();
        ctx.font = '600 22px ui-monospace, Menlo, monospace';
        ctx.fillStyle = FACE_RED;
        ctx.textAlign = 'left';
        ctx.fillText('REJ', xx + 24, xy + 2);
      }
    });

    const statusText = ui.done
      ? 'TRANSMISSION DECODED'
      : ui.lastRejected !== null
        ? `"${ui.lastRejected.toUpperCase()}" REJECTED · ROUND ${roundIdx + 1}/${rounds.length}`
        : `ROUND ${roundIdx + 1}/${rounds.length} · CARD ${round.cardId}`;
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.lastRejected !== null ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as PasswordInterceptUi;
    const roundIdx = currentRoundIndex(instance.state, ui);
    const round = instance.state.rounds[roundIdx];
    return round.candidates.map((word, i): FaceRegion => {
      const r = rowRect(i);
      const rejected = !ui.done && ui.lastRejected === word;
      return px(
        `word-${i}`,
        `Candidate word ${i + 1} of ${round.candidates.length}: ${word}${rejected ? ', rejected on last try' : ''}`,
        SIZE,
        r.x,
        r.y,
        r.w,
        r.h,
        ui.done,
      );
    });
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as PasswordInterceptUi;
    if (ui.done) return;
    const { rounds } = instance.state;
    const roundIdx = currentRoundIndex(instance.state, ui);
    const round = rounds[roundIdx];
    const index = Number(regionId.slice('word-'.length));
    if (!Number.isInteger(index) || index < 0 || index >= round.candidates.length) return;
    const word = round.candidates[index];

    const expected = solvePasswordIntercept(instance.state);
    if (expected[roundIdx] !== word) {
      // round stays open on a wrong pick — soft failure, same as the 2D module
      ui.lastRejected = word;
      cb.setStatus(
        `"${word.toUpperCase()}" rejected. Still on card ${round.cardId}, round ${roundIdx + 1} of ${rounds.length} — try another word.`,
      );
      cb.repaint();
      cb.onStrike();
      return;
    }

    ui.lastRejected = null;
    ui.chosen = [...ui.chosen, word];
    cb.sfx('buttonPress');
    if (ui.chosen.length === rounds.length) {
      ui.done = true;
      cb.setStatus('Transmission decoded! All passwords recovered.');
      cb.repaint();
      cb.onSolved();
    } else {
      const next = rounds[ui.chosen.length];
      cb.setStatus(`Round ${ui.chosen.length + 1} of ${rounds.length}. Showing card ${next.cardId}.`);
      cb.repaint();
    }
  },

  initialStatus(instance) {
    const { rounds } = instance.state;
    return `Round 1 of ${rounds.length}. Showing card ${rounds[0].cardId}. Read the card number to your Handler.`;
  },
};
