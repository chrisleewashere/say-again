/**
 * Spot the Contact (id-check) in-case face: draws the suspect lineup onto the
 * plate's canvas texture and handles raycast taps. Mirrors IdCheck.tsx
 * behavior exactly — same solver (solveIdCheck), same soft-failure semantics
 * (a wrong confirm leaves the lineup unchanged, clears the selection, and
 * strikes), same select-then-confirm flow.
 *
 * Every attribute is a distinct drawn SHAPE (never color alone): hat
 * silhouettes, glasses frame shapes, hair outlines, accessory objects, shirt
 * patterns — the same geometry as the 2D SVG portraits, plus a printed
 * position number on every card.
 */
import { solveIdCheck, type IdCheckState } from '../../modules/idCheck/logic';
import { suspectDescription } from '../../modules/idCheck/prose';
import type { Suspect } from '../../modules/idCheck/rules';
import {
  clearFace,
  drawButton,
  drawStatus,
  drawTag,
  FACE_AMBER,
  FACE_GREEN,
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

/* Portrait inks — decorative only; attributes read by shape. */
const INK = '#1c2733';
const SKIN = '#e9c49a';
const SKIN_EDGE = '#8a6b4a';
const HAIR_FILL = '#4a3626';
const SHIRT_FILL = '#5b6b7c';

interface IdCheckUi extends FaceUi {
  selected: number | null;
  done: boolean;
  rejected: number | null;
}

const SIZE = 1024;
const GRID_TOP = 118;
const CARD_H = 330;
const CARD_GAP = 18;
const PORTRAIT_SCALE = 1.8; // SVG viewBox 120x150 -> 216x270 canvas px

const CONFIRM = { x: (SIZE - 560) / 2, y: 816, w: 560, h: 96 };

function cardRect(count: number, i: number): { x: number; y: number; w: number; h: number } {
  const cols = count <= 4 ? 2 : 3;
  const cardW = cols === 2 ? 400 : 310;
  const row = Math.floor(i / cols);
  const col = i % cols;
  const inRow = Math.min(cols, count - row * cols);
  const rowW = inRow * cardW + (inRow - 1) * CARD_GAP;
  const startX = (SIZE - rowW) / 2;
  return {
    x: startX + col * (cardW + CARD_GAP),
    y: GRID_TOP + row * (CARD_H + CARD_GAP),
    w: cardW,
    h: CARD_H,
  };
}

/** Torso path in SVG portrait coordinates (viewBox 0 0 120 150). */
function torsoPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(20, 150);
  ctx.lineTo(24, 116);
  ctx.quadraticCurveTo(28, 100, 46, 96);
  ctx.lineTo(60, 92);
  ctx.lineTo(74, 96);
  ctx.quadraticCurveTo(92, 100, 96, 116);
  ctx.lineTo(100, 150);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
): void {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Canvas port of the 2D component's SVG portrait. Drawn in the SVG's own
 * 120x150 coordinate space via translate+scale, so geometry matches exactly.
 */
function drawPortrait(ctx: CanvasRenderingContext2D, s: Suspect, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(PORTRAIT_SCALE, PORTRAIT_SCALE);
  ctx.lineCap = 'butt';

  // torso + shirt pattern (pattern clipped to the torso)
  torsoPath(ctx);
  ctx.fillStyle = SHIRT_FILL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  if (s.shirt !== 'plain') {
    ctx.save();
    torsoPath(ctx);
    ctx.clip();
    if (s.shirt === 'striped') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(26 + i * 10, 92);
        ctx.lineTo(26 + i * 10, 150);
        ctx.stroke();
      }
    } else {
      // spotted
      ctx.fillStyle = INK;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          ctx.beginPath();
          ctx.arc(30 + col * 15 + (row % 2 === 0 ? 0 : 7), 108 + row * 14, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // neck + head
  ctx.fillStyle = SKIN;
  ctx.fillRect(52, 80, 16, 16);
  ctx.beginPath();
  ctx.arc(60, 62, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = SKIN_EDGE;
  ctx.stroke();

  // hair (distinct outline per value)
  if (s.hair === 'short' || s.hair === 'long') {
    ctx.beginPath();
    ctx.arc(60, 56, 29, Math.PI, Math.PI * 2); // upper arc from (31,56) to (89,56)
    ctx.strokeStyle = HAIR_FILL;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
    if (s.hair === 'long') {
      fillRoundRect(ctx, 23, 52, 14, 52, 7, HAIR_FILL);
      fillRoundRect(ctx, 83, 52, 14, 52, 7, HAIR_FILL);
    }
  } else {
    // curly: crown of circles
    ctx.fillStyle = HAIR_FILL;
    const curls: Array<[number, number]> = [[34, 46], [46, 37], [60, 33], [74, 37], [86, 46]];
    for (const [cx, cy] of curls) {
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // face
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(48, 60, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(72, 60, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(48, 74);
  ctx.quadraticCurveTo(60, 84, 72, 74);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';

  // glasses (frame shape distinguishes round vs square)
  if (s.glasses !== 'none') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    if (s.glasses === 'round') {
      ctx.beginPath();
      ctx.arc(48, 60, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(72, 60, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(57, 60);
      ctx.lineTo(63, 60);
      ctx.stroke();
    } else {
      roundRect(ctx, 39, 51, 18, 17, 2);
      ctx.stroke();
      roundRect(ctx, 63, 51, 18, 17, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(57, 58);
      ctx.lineTo(63, 58);
      ctx.stroke();
    }
  }

  // headwear (silhouette distinguishes beanie vs cap)
  if (s.headwear === 'beanie') {
    ctx.beginPath();
    ctx.ellipse(60, 50, 28, 24, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#37536e';
    ctx.fill();
    fillRoundRect(ctx, 30, 46, 60, 10, 5, '#24384d');
    ctx.beginPath();
    ctx.arc(60, 26, 6, 0, Math.PI * 2); // pompom
    ctx.fill();
  } else if (s.headwear === 'cap') {
    ctx.beginPath();
    ctx.ellipse(60, 50, 26, 22, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#6e3745';
    ctx.fill();
    fillRoundRect(ctx, 56, 46, 46, 9, 4.5, '#52242f'); // brim
  }

  // accessory (distinct object per value)
  if (s.accessory === 'scarf') {
    fillRoundRect(ctx, 40, 88, 40, 11, 5.5, '#c2703f');
    fillRoundRect(ctx, 52, 94, 13, 28, 6, '#c2703f');
  } else if (s.accessory === 'badge') {
    const star: Array<[number, number]> = [
      [78, 103], [80.4, 108.8], [86.6, 109.2], [81.8, 113.2], [83.3, 119.3],
      [78, 116], [72.7, 119.3], [74.2, 113.2], [69.4, 109.2], [75.6, 108.8],
    ];
    ctx.beginPath();
    star.forEach(([sx, sy], i) => (i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)));
    ctx.closePath();
    ctx.fillStyle = '#d9b23c';
    ctx.fill();
    ctx.strokeStyle = '#7c621a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (s.accessory === 'bowtie') {
    ctx.fillStyle = '#7c4a8f';
    ctx.beginPath();
    ctx.moveTo(58, 96);
    ctx.lineTo(40, 88);
    ctx.lineTo(40, 104);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(62, 96);
    ctx.lineTo(80, 88);
    ctx.lineTo(80, 104);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(60, 96, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export const idCheckFace: ModuleFace<IdCheckState> = {
  canvasSize: SIZE,

  initUi(): IdCheckUi {
    return { selected: null, done: false, rejected: null };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as IdCheckUi;
    const { suspects } = instance.state;
    const contact = ui.done ? solveIdCheck(instance.state) : null;
    clearFace(ctx, size);
    drawTag(ctx, size, 'SPOT THE CONTACT');

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`ONE OF THESE ${suspects.length} PEOPLE IS YOUR CONTACT`, size / 2, 78);

    suspects.forEach((suspect, i) => {
      const r = cardRect(suspects.length, i);
      const isSelected = ui.selected === i;
      const isContactDone = ui.done && i === contact;

      // card plate — selection/confirmation always paired with a printed chip
      roundRect(ctx, r.x, r.y, r.w, r.h, 16);
      ctx.fillStyle = isSelected || isContactDone ? '#3a2f1c' : FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = isSelected || isContactDone ? 5 : 3;
      ctx.strokeStyle = isContactDone ? FACE_GREEN : isSelected ? FACE_AMBER : FACE_LINE;
      ctx.stroke();

      // printed position number (positions never renumber)
      roundRect(ctx, r.x + 14, r.y + 14, 56, 56, 10);
      ctx.strokeStyle = FACE_LINE;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '700 40px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), r.x + 42, r.y + 44);

      drawPortrait(ctx, suspect, r.x + (r.w - 120 * PORTRAIT_SCALE) / 2, r.y + 40);

      // state chip: shape+text, never color alone (mirrors the 2D chip)
      if (isSelected || isContactDone) {
        const chipW = 176;
        const chipX = r.x + (r.w - chipW) / 2;
        const chipY = r.y + r.h - 54;
        roundRect(ctx, chipX, chipY, chipW, 40, 8);
        ctx.fillStyle = '#16130f';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isContactDone ? FACE_GREEN : FACE_AMBER;
        ctx.stroke();
        ctx.font = '700 26px ui-monospace, Menlo, monospace';
        ctx.fillStyle = FACE_TEXT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isContactDone ? 'CONTACT' : 'SELECTED', chipX + chipW / 2, chipY + 22);
      }
    });

    drawButton(ctx, CONFIRM, {
      label: 'CONFIRM CONTACT',
      active: ui.selected !== null && !ui.done,
      disabled: ui.done || ui.selected === null,
    });

    const statusText = ui.done
      ? `CONTACT CONFIRMED — SUSPECT ${(contact ?? 0) + 1}`
      : ui.selected !== null
        ? `SUSPECT ${ui.selected + 1} SELECTED — CONFIRM TO COMMIT`
        : ui.rejected !== null
          ? `SUSPECT ${ui.rejected + 1} NOT THE CONTACT — LINEUP UNCHANGED`
          : 'NO SUSPECT SELECTED — DESCRIBE THE LINEUP';
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.rejected !== null && ui.selected === null ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as IdCheckUi;
    const { suspects } = instance.state;
    const contact = ui.done ? solveIdCheck(instance.state) : null;
    const list = suspects.map((suspect, i): FaceRegion => {
      const r = cardRect(suspects.length, i);
      const isSelected = ui.selected === i;
      const isContactDone = ui.done && i === contact;
      const label =
        `Suspect ${i + 1}: ${suspectDescription(suspect)}` +
        (isContactDone ? '. Confirmed as the contact' : isSelected ? '. Currently selected' : '');
      return px(`suspect-${i}`, label, SIZE, r.x, r.y, r.w, r.h, ui.done);
    });
    list.push(
      px(
        'confirm',
        ui.selected === null
          ? 'Confirm contact (select a suspect first)'
          : `Confirm suspect ${ui.selected + 1} as the contact`,
        SIZE,
        CONFIRM.x,
        CONFIRM.y,
        CONFIRM.w,
        CONFIRM.h,
        ui.done || ui.selected === null,
      ),
    );
    return list;
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as IdCheckUi;
    if (ui.done) return;

    if (regionId.startsWith('suspect-')) {
      const index = Number(regionId.slice('suspect-'.length));
      if (!Number.isInteger(index) || index < 0 || index >= instance.state.suspects.length) return;
      // toggle, same as the 2D component's handleSelect
      ui.selected = ui.selected === index ? null : index;
      cb.sfx('dialDetent');
      if (ui.selected !== null) {
        cb.setStatus(`Suspect ${ui.selected + 1} selected. Press Confirm Contact to commit.`);
      } else if (ui.rejected !== null) {
        cb.setStatus(
          `Suspect ${ui.rejected + 1} is not the contact — the lineup is unchanged. Describe them again and retry.`,
        );
      } else {
        cb.setStatus('No suspect selected. Describe the lineup to your Handler.');
      }
      cb.repaint();
      return;
    }

    if (regionId !== 'confirm' || ui.selected === null) return;
    const contact = solveIdCheck(instance.state);
    if (ui.selected !== contact) {
      // wrong pick: lineup unchanged — soft failure, same as the 2D module
      ui.rejected = ui.selected;
      ui.selected = null;
      cb.setStatus(
        `Suspect ${ui.rejected + 1} is not the contact — the lineup is unchanged. Describe them again and retry.`,
      );
      cb.repaint();
      cb.onStrike();
      return;
    }

    ui.done = true;
    ui.rejected = null;
    cb.sfx('buttonPress');
    cb.setStatus(`Contact confirmed: suspect ${contact + 1}. Rendezvous secured.`);
    cb.repaint();
    cb.onSolved();
  },

  initialStatus(instance) {
    const n = instance.state.suspects.length;
    return `Suspect lineup: ${n} portraits. One of them is your contact — your Handler's checklist knows who. No suspect selected. Describe the lineup to your Handler.`;
  },
};
