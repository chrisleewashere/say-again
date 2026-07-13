/**
 * Vault Dial ("Crack the Safe") in-case face: draws the gem row + keypad onto
 * the plate's canvas texture and handles raycast taps. Mirrors VaultDial.tsx
 * behavior exactly — same validator (validateVaultDial), same soft-failure
 * semantics (a rejected code clears the keypad and strikes; the vault stays
 * retryable).
 */
import { bandRect, coreDotRadius, gemShapePath } from '../../modules/vaultDial/gemArt';
import { validateVaultDial, type VaultDialState } from '../../modules/vaultDial/logic';
import { markingWord, shapeWord } from '../../modules/vaultDial/prose';
import { SIZE_TAGS, type Gem } from '../../modules/vaultDial/rules';
import {
  clearFace,
  drawButton,
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

interface VaultDialUi extends FaceUi {
  entry: string;
  done: boolean;
  rejected: boolean;
}

const SIZE = 1024;

/* Gem row card geometry (2-4 cards, centered). */
const CARD_W = 200;
const CARD_H = 240;
const CARD_GAP = 20;
const CARD_TOP = 122;

/* Large gems render at full radius; small at 60% (same ratio as the 2D
 * component). The printed S/L tag makes size unambiguous. */
const GEM_RADIUS: Record<Gem['size'], number> = { large: 64, small: 38 };

/* Code slot row. */
const SLOT_W = 88;
const SLOT_H = 72;
const SLOT_GAP = 16;
const SLOT_TOP = 394;

/* Keypad: same layout as the 2D component — 1-9, then DEL / 0 / ENTER. */
const KEY_W = 220;
const KEY_H = 104;
const KEY_GAP = 14;
const KEY_TOP = 492;
const KEY_LEFT = (SIZE - (KEY_W * 3 + KEY_GAP * 2)) / 2;

const KEYPAD: { id: string; glyph: string }[][] = [
  [
    { id: 'key-1', glyph: '1' },
    { id: 'key-2', glyph: '2' },
    { id: 'key-3', glyph: '3' },
  ],
  [
    { id: 'key-4', glyph: '4' },
    { id: 'key-5', glyph: '5' },
    { id: 'key-6', glyph: '6' },
  ],
  [
    { id: 'key-7', glyph: '7' },
    { id: 'key-8', glyph: '8' },
    { id: 'key-9', glyph: '9' },
  ],
  [
    { id: 'del', glyph: 'DEL' },
    { id: 'key-0', glyph: '0' },
    { id: 'enter', glyph: 'ENTER' },
  ],
];

function cardRect(i: number, count: number): { x: number; y: number; w: number; h: number } {
  const total = count * CARD_W + (count - 1) * CARD_GAP;
  return { x: (SIZE - total) / 2 + i * (CARD_W + CARD_GAP), y: CARD_TOP, w: CARD_W, h: CARD_H };
}

function keyRect(row: number, col: number): { x: number; y: number; w: number; h: number } {
  return { x: KEY_LEFT + col * (KEY_W + KEY_GAP), y: KEY_TOP + row * (KEY_H + KEY_GAP), w: KEY_W, h: KEY_H };
}

function gemLabel(gem: Gem, pos: number, count: number): string {
  return (
    `Gem ${pos} of ${count}: ${gem.size} ${shapeWord(gem.shape, 'standard')} with ` +
    `${markingWord(gem.marking, 'standard')}. Size tag ${SIZE_TAGS[gem.size]}.`
  );
}

/** Same status wording as the 2D component's role="status" line. */
function statusLine(codeLength: number, ui: VaultDialUi): string {
  return ui.done
    ? 'Vault unlocked!'
    : ui.entry.length === 0
      ? `${ui.rejected ? 'Code rejected — the keypad cleared. ' : ''}Keypad empty. Enter the ${codeLength}-digit code.`
      : `Entered ${ui.entry.split('').join(' ')} — ${ui.entry.length} of ${codeLength} digits.`;
}

function drawGem(ctx: CanvasRenderingContext2D, gem: Gem, gx: number, gy: number): void {
  const r = GEM_RADIUS[gem.size];
  // gemArt is the shared geometry source (component + printed manual); its
  // SVG path strings feed Path2D directly so shapes always match the manual.
  const shape = new Path2D(gemShapePath(gem.shape, gx, gy, r));

  ctx.fillStyle = FACE_AMBER;
  ctx.fill(shape, 'evenodd');
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0f141a';
  ctx.stroke(shape);

  if (gem.marking === 'band') {
    const band = bandRect(gx, gy, r);
    ctx.save();
    ctx.clip(shape, 'evenodd');
    ctx.fillStyle = '#0f141a';
    ctx.fillRect(band.x, band.y, band.width, band.height);
    ctx.restore();
  } else if (gem.marking === 'core-dot') {
    ctx.beginPath();
    ctx.arc(gx, gy, coreDotRadius(r), 0, Math.PI * 2);
    ctx.fillStyle = '#0f141a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = FACE_AMBER;
    ctx.stroke();
  }
}

export const vaultDialFace: ModuleFace<VaultDialState> = {
  canvasSize: SIZE,

  initUi(): VaultDialUi {
    return { entry: '', done: false, rejected: false };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as VaultDialUi;
    const { gems } = instance.state;
    const codeLength = gems.length;
    clearFace(ctx, size);
    drawTag(ctx, size, 'CRACK THE SAFE');

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`DESCRIBE EACH GEM — HANDLER COMPUTES THE ${codeLength}-DIGIT CODE`, size / 2, 78);

    // gem row: shape + marking + printed S/L size tag (info never by color alone)
    gems.forEach((gem, i) => {
      const r = cardRect(i, codeLength);

      roundRect(ctx, r.x, r.y, r.w, r.h, 16);
      ctx.fillStyle = FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = FACE_LINE;
      ctx.stroke();

      // printed position number (top-left, like the 2D card)
      ctx.font = '700 32px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i + 1), r.x + 18, r.y + 14);

      drawGem(ctx, gem, r.x + r.w / 2, r.y + 106);

      // engraved size tag under the gem (redundant, non-color channel)
      const tagX = r.x + r.w / 2;
      const tagY = r.y + r.h - 42;
      roundRect(ctx, tagX - 24, tagY - 8, 48, 44, 10);
      ctx.lineWidth = 3;
      ctx.strokeStyle = FACE_LINE;
      ctx.stroke();
      ctx.font = '700 30px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SIZE_TAGS[gem.size], tagX, tagY + 16);
    });

    // code slots (one per gem)
    const slotsTotal = codeLength * SLOT_W + (codeLength - 1) * SLOT_GAP;
    const slotsLeft = (size - slotsTotal) / 2;
    for (let i = 0; i < codeLength; i++) {
      const sx = slotsLeft + i * (SLOT_W + SLOT_GAP);
      const filled = i < ui.entry.length;
      roundRect(ctx, sx, SLOT_TOP, SLOT_W, SLOT_H, 12);
      ctx.fillStyle = filled ? '#3a2f1c' : FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = filled ? FACE_AMBER : FACE_LINE;
      ctx.stroke();
      if (filled) {
        ctx.font = '700 44px ui-monospace, Menlo, monospace';
        ctx.fillStyle = FACE_TEXT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ui.entry[i], sx + SLOT_W / 2, SLOT_TOP + SLOT_H / 2 + 2);
      }
    }

    // keypad
    KEYPAD.forEach((row, ri) => {
      row.forEach((key, ci) => {
        const r = keyRect(ri, ci);
        const disabled =
          ui.done ||
          (key.id === 'del'
            ? ui.entry.length === 0
            : key.id === 'enter'
              ? ui.entry.length !== codeLength
              : ui.entry.length >= codeLength);
        drawButton(ctx, r, {
          label: key.glyph,
          disabled,
          active: key.id === 'enter' && !ui.done && ui.entry.length === codeLength,
          font:
            key.id === 'del' || key.id === 'enter'
              ? '700 32px ui-monospace, Menlo, monospace'
              : '700 44px ui-monospace, Menlo, monospace',
        });
      });
    });

    const statusText = ui.done
      ? 'VAULT UNLOCKED'
      : ui.entry.length === 0
        ? `${ui.rejected ? 'CODE REJECTED — KEYPAD CLEARED · ' : ''}ENTER THE ${codeLength}-DIGIT CODE`
        : `ENTERED ${ui.entry.length}/${codeLength}`;
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.rejected && ui.entry.length === 0 ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as VaultDialUi;
    const { gems } = instance.state;
    const codeLength = gems.length;

    const gemRegions = gems.map((gem, i): FaceRegion => {
      const r = cardRect(i, codeLength);
      return px(`gem-${i}`, gemLabel(gem, i + 1, codeLength), SIZE, r.x, r.y, r.w, r.h);
    });

    const keyRegions = KEYPAD.flatMap((row, ri) =>
      row.map((key, ci): FaceRegion => {
        const r = keyRect(ri, ci);
        const label =
          key.id === 'del'
            ? 'Delete the last entered digit'
            : key.id === 'enter'
              ? `Enter: submit the ${codeLength}-digit code`
              : `Key ${key.glyph}`;
        const disabled =
          ui.done ||
          (key.id === 'del'
            ? ui.entry.length === 0
            : key.id === 'enter'
              ? ui.entry.length !== codeLength
              : ui.entry.length >= codeLength);
        return px(key.id, label, SIZE, r.x, r.y, r.w, r.h, disabled);
      }),
    );

    return [...gemRegions, ...keyRegions];
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as VaultDialUi;
    const { gems } = instance.state;
    const codeLength = gems.length;

    if (regionId.startsWith('gem-')) {
      // informational only — read the gem description into the live region
      const index = Number(regionId.slice('gem-'.length));
      const gem = gems[index];
      if (gem) cb.setStatus(gemLabel(gem, index + 1, codeLength));
      return;
    }

    if (ui.done) return;

    if (regionId.startsWith('key-')) {
      ui.rejected = false;
      if (ui.entry.length >= codeLength) return;
      ui.entry = ui.entry + regionId.slice('key-'.length);
      cb.sfx('dialDetent');
      cb.setStatus(statusLine(codeLength, ui));
      cb.repaint();
      return;
    }

    if (regionId === 'del') {
      if (ui.entry.length === 0) return;
      ui.entry = ui.entry.slice(0, -1);
      cb.sfx('buttonPress');
      cb.setStatus(statusLine(codeLength, ui));
      cb.repaint();
      return;
    }

    if (regionId === 'enter') {
      if (ui.entry.length !== codeLength) return;
      if (!validateVaultDial(instance.state, ui.entry)) {
        // rejected code clears the keypad; the vault stays retryable — soft
        // failure, same as the 2D module
        ui.entry = '';
        ui.rejected = true;
        cb.setStatus(statusLine(codeLength, ui));
        cb.repaint();
        cb.onStrike();
        return;
      }
      ui.done = true;
      cb.sfx('buttonPress');
      cb.setStatus('Vault unlocked!');
      cb.repaint();
      cb.onSolved();
    }
  },

  initialStatus(instance) {
    const codeLength = instance.state.gems.length;
    return (
      `Crack the Safe: ${codeLength} gems above the keypad. Describe each gem to your Handler — ` +
      `shape, marking, and size tag. Keypad empty. Enter the ${codeLength}-digit code.`
    );
  },
};
