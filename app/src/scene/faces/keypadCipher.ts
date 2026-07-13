/**
 * Code Room (keypad cipher) in-case face: draws the word-key keypad onto the
 * plate's canvas texture and handles raycast taps. Mirrors KeypadCipher.tsx
 * behavior exactly — same solver (solveKeypadCipher), same soft-failure
 * semantics (a wrong press strikes and resets the locked sequence; the keys
 * themselves stay), solved when every key is locked in order.
 */
import { solveKeypadCipher, type KeypadCipherState } from '../../modules/keypadCipher/logic';
import {
  clearFace,
  drawStatus,
  drawTag,
  FACE_AMBER,
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

interface KeypadCipherUi extends FaceUi {
  /** key indices locked in so far, in press order */
  locked: number[];
  done: boolean;
  /** true right after a wrong press reset the sequence */
  justReset: boolean;
}

const SIZE = 1024;
const GRID_X = 60;
const GRID_W = SIZE - 120;
const GRID_TOP = 190;
const GRID_BOTTOM = SIZE - 110;
const GAP = 24;
const MAX_KEY_H = 250;

/** Keypad grid: 1 column for 3 keys, 2 columns for 4 or 6 (always even rows). */
function keyRect(i: number, count: number): { x: number; y: number; w: number; h: number } {
  const cols = count <= 3 ? 1 : 2;
  const rows = Math.ceil(count / cols);
  const w = (GRID_W - (cols - 1) * GAP) / cols;
  const h = Math.min((GRID_BOTTOM - GRID_TOP - (rows - 1) * GAP) / rows, MAX_KEY_H);
  const blockH = rows * h + (rows - 1) * GAP;
  const top = GRID_TOP + (GRID_BOTTOM - GRID_TOP - blockH) / 2;
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { x: GRID_X + col * (w + GAP), y: top + row * (h + GAP), w, h };
}

/** Vault-door glyph — decoration only (spokes rotate 45° when open). */
function drawVaultGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, open: boolean): void {
  ctx.save();
  ctx.translate(cx, cy);
  if (open) ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = open ? FACE_AMBER : FACE_TEXT_DIM;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();
  for (let s = 0; s < 4; s++) {
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(0, 26);
    ctx.stroke();
    ctx.rotate(Math.PI / 2);
  }
  ctx.restore();
}

/** Check mark — locked state is shown by number + shape, never color alone. */
function drawCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.05);
  ctx.lineTo(cx - r * 0.25, cy + r * 0.75);
  ctx.lineTo(cx + r, cy - r * 0.8);
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export const keypadCipherFace: ModuleFace<KeypadCipherState> = {
  canvasSize: SIZE,

  initUi(): KeypadCipherUi {
    return { locked: [], done: false, justReset: false };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as KeypadCipherUi;
    const { keys } = instance.state;
    clearFace(ctx, size);
    drawTag(ctx, size, 'CODE ROOM');
    drawVaultGlyph(ctx, 96, 56, ui.done);

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PRESS WORD KEYS IN HANDLER ORDER', size / 2, 78);
    ctx.fillText(`READ THE ${keys.length} WORDS ALOUD TO YOUR HANDLER`, size / 2, 116);

    keys.forEach((key, i) => {
      const r = keyRect(i, keys.length);
      const rank = ui.locked.indexOf(i);
      const isLocked = rank !== -1;

      // key cap
      roundRect(ctx, r.x, r.y, r.w, r.h, 18);
      ctx.fillStyle = isLocked ? '#3a2f1c' : FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = isLocked ? 4 : 3;
      ctx.strokeStyle = isLocked ? FACE_AMBER : FACE_LINE;
      ctx.stroke();
      if (isLocked) {
        // latched inset line — pressed state also carried by shape
        roundRect(ctx, r.x + 10, r.y + 10, r.w - 20, r.h - 20, 12);
        ctx.lineWidth = 2;
        ctx.strokeStyle = FACE_LINE;
        ctx.stroke();
      }

      // engraved word (info by text, never color alone)
      ctx.font = '700 46px ui-monospace, Menlo, monospace';
      ctx.fillStyle = isLocked ? FACE_TEXT_DIM : FACE_TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(key.word.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2 - (isLocked ? 24 : 0) + 2);

      if (isLocked) {
        // printed press-order rank + check mark badge
        const bx = r.x + r.w / 2;
        const by = r.y + r.h / 2 + 42;
        roundRect(ctx, bx - 66, by - 30, 132, 60, 12);
        ctx.lineWidth = 3;
        ctx.strokeStyle = FACE_AMBER;
        ctx.stroke();
        ctx.font = '700 38px ui-monospace, Menlo, monospace';
        ctx.fillStyle = FACE_AMBER;
        ctx.textAlign = 'center';
        ctx.fillText(String(rank + 1), bx - 24, by + 2);
        ctx.strokeStyle = FACE_AMBER;
        drawCheck(ctx, bx + 26, by, 15);
      }
    });

    const total = instance.state.keys.length;
    const statusText = ui.done
      ? 'CODE ACCEPTED — VAULT OPEN'
      : ui.justReset
        ? `WRONG ORDER — KEYPAD RESET · LOCKED 0/${total}`
        : `KEYS LOCKED ${ui.locked.length}/${total}`;
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.justReset ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as KeypadCipherUi;
    const { keys } = instance.state;
    return keys.map((key, i): FaceRegion => {
      const r = keyRect(i, keys.length);
      const rank = ui.locked.indexOf(i);
      const isLocked = rank !== -1;
      return px(
        `key-${i}`,
        isLocked
          ? `Word key "${key.word}", locked in as press ${rank + 1} of ${keys.length}`
          : `Word key "${key.word}", not yet pressed`,
        SIZE,
        r.x,
        r.y,
        r.w,
        r.h,
        isLocked || ui.done,
      );
    });
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as KeypadCipherUi;
    if (ui.done) return;
    const index = Number(regionId.slice('key-'.length));
    if (!Number.isInteger(index) || ui.locked.includes(index)) return;

    const { keys } = instance.state;
    const expected = solveKeypadCipher(instance.state);
    if (expected[ui.locked.length] !== index) {
      // wrong order: sequence resets, keys stay — soft failure, same as the 2D module
      ui.locked = [];
      ui.justReset = true;
      cb.setStatus(`Wrong order — the keypad reset. Keys locked in: 0 of ${keys.length}.`);
      cb.repaint();
      cb.onStrike();
      return;
    }

    ui.justReset = false;
    ui.locked = [...ui.locked, index];
    cb.sfx('buttonPress');
    if (ui.locked.length === keys.length) {
      ui.done = true;
      cb.setStatus('Code accepted — the vault is open!');
      cb.repaint();
      cb.onSolved();
    } else {
      cb.setStatus(`Keys locked in: ${ui.locked.length} of ${keys.length}.`);
      cb.repaint();
    }
  },

  initialStatus(instance) {
    const { keys } = instance.state;
    return `Keypad: ${keys.length} word keys. Read the word keys to your Handler. Press them in the order the Handler works out.`;
  },
};
