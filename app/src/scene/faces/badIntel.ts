/**
 * Bad Intel in-case face: the maintenance panel drawn on the plate — hardware
 * controls with engraved tag letters and settings, plus the FLAG BAD INTEL
 * button. Mirrors BadIntel.tsx behavior exactly via the same solver: one move
 * per printed step, wrong taps and wrong flags strike and leave the panel
 * unchanged.
 */
import {
  describeControl,
  solveBadIntel,
  type BadIntelState,
  type PanelControl,
} from '../../modules/badIntel/logic';
import { FLAG_LABEL, modelById } from '../../modules/badIntel/rules';
import {
  clearFace,
  drawStatus,
  drawTag,
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

interface BadIntelUi extends FaceUi {
  step: number;
  done: boolean;
  message: string | null;
}

const SIZE = 1024;
const GRID_TOP = 150;
const GRID_H = 620;
const FLAG_RECT = { x: 262, y: 800, w: 500, h: 92 };
const DEG = Math.PI / 180;

function cardRects(count: number): { x: number; y: number; w: number; h: number }[] {
  const cols = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const gap = 20;
  const w = Math.min(300, (SIZE - 80 - gap * (cols - 1)) / cols);
  const h = Math.min((GRID_H - gap * (rows - 1)) / rows, 300);
  const x0 = (SIZE - (cols * w + (cols - 1) * gap)) / 2;
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const inLastRow = r === rows - 1;
    const lastRowCount = count - (rows - 1) * cols;
    const rowX0 = inLastRow ? (SIZE - (lastRowCount * w + (lastRowCount - 1) * gap)) / 2 : x0;
    return { x: rowX0 + c * w, y: GRID_TOP + r * (h + gap), w, h };
  });
}

/** Needle/tick angle for a 1-8 setting, degrees clockwise from 12 o'clock. */
function dialAngle(step8: number): number {
  return -135 + (step8 - 1) * (270 / 7);
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  control: PanelControl,
  cx: number,
  cy: number,
  r: number,
  ink: string,
): void {
  const { type, setting } = control;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = Math.max(3, r * 0.09);
  ctx.lineCap = 'round';
  if (type === 'dial') {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, r * 0.05);
    for (let i = 1; i <= 8; i++) {
      const t = dialAngle(i) * DEG;
      ctx.beginPath();
      ctx.moveTo(cx + 0.72 * r * Math.sin(t), cy - 0.72 * r * Math.cos(t));
      ctx.lineTo(cx + 0.9 * r * Math.sin(t), cy - 0.9 * r * Math.cos(t));
      ctx.stroke();
    }
    const n = dialAngle(setting) * DEG;
    ctx.lineWidth = Math.max(4, r * 0.11);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 0.62 * r * Math.sin(n), cy - 0.62 * r * Math.cos(n));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'toggle') {
    const slotW = r * 0.72;
    roundRect(ctx, cx - slotW / 2, cy - r, slotW, 2 * r, slotW / 2);
    ctx.stroke();
    const knobY = setting >= 5 ? cy - r * 0.55 : cy + r * 0.55;
    ctx.beginPath();
    ctx.arc(cx, knobY, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'lever') {
    const baseY = cy + r * 0.85;
    roundRect(ctx, cx - r * 0.65, baseY, r * 1.3, r * 0.22, 4);
    ctx.fill();
    const tilt = (setting <= 4 ? -35 : 35) * DEG;
    const ex = cx + 1.35 * r * Math.sin(tilt);
    const ey = baseY - 1.35 * r * Math.cos(tilt);
    ctx.lineWidth = Math.max(4, r * 0.11);
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // valve wheel
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const t = setting * 15 * DEG + (k * 2 * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 0.94 * r * Math.sin(t), cy - 0.94 * r * Math.cos(t));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = 'butt';
}

function drawControl(
  ctx: CanvasRenderingContext2D,
  control: PanelControl,
  r: { x: number; y: number; w: number; h: number },
  servicedStep: number | null,
): void {
  const ink = servicedStep !== null ? FACE_TEXT_DIM : FACE_TEXT;

  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = FACE_PANEL;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = servicedStep !== null ? FACE_LINE : FACE_TEXT_DIM;
  if (servicedStep !== null) ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // tag letter box, top-left
  const box = Math.min(56, r.h * 0.24);
  roundRect(ctx, r.x + 14, r.y + 12, box, box, 8);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = `700 ${box * 0.62}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(control.tag, r.x + 14 + box / 2, r.y + 12 + box / 2 + 2);

  // hardware glyph, centered
  const gr = Math.min(r.w, r.h) * 0.26;
  drawGlyph(ctx, control, r.x + r.w / 2, r.y + r.h * 0.47, gr, ink);

  // type name + setting along the bottom
  ctx.font = `600 ${Math.min(26, r.h * 0.11)}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = FACE_TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${control.type.toUpperCase()} · SET ${control.setting}`, r.x + r.w / 2, r.y + r.h - 16);

  // serviced check badge
  if (servicedStep !== null) {
    const bx = r.x + r.w - 30;
    const by = r.y + 30;
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fillStyle = FACE_GREEN;
    ctx.fill();
    ctx.strokeStyle = '#0c1f16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by);
    ctx.lineTo(bx - 2, by + 6);
    ctx.lineTo(bx + 9, by - 6);
    ctx.stroke();
  }
}

function servicedMap(state: BadIntelState, step: number): Map<number, number> {
  const map = new Map<number, number>();
  solveBadIntel(state)
    .slice(0, step)
    .forEach((move, i) => {
      if (move.kind === 'tap') map.set(move.control, i + 1);
    });
  return map;
}

export const badIntelFace: ModuleFace<BadIntelState> = {
  canvasSize: SIZE,

  initUi(): BadIntelUi {
    return { step: 0, done: false, message: null };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as BadIntelUi;
    const { controls } = instance.state;
    const model = modelById(instance.state.model);
    const total = model.steps.length;
    clearFace(ctx, size);
    drawTag(ctx, size, 'BAD INTEL');

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      ui.done ? `${model.name} · SERVICED` : `${model.name} · STEP ${ui.step + 1}/${total}`,
      size / 2,
      78,
    );

    const rects = cardRects(controls.length);
    const serviced = servicedMap(instance.state, ui.step);
    controls.forEach((control, i) => drawControl(ctx, control, rects[i], serviced.get(i) ?? null));

    if (!ui.done) {
      // FLAG BAD INTEL button with warning triangle
      roundRect(ctx, FLAG_RECT.x, FLAG_RECT.y, FLAG_RECT.w, FLAG_RECT.h, 14);
      ctx.fillStyle = FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = FACE_RED;
      ctx.stroke();
      const tx = FLAG_RECT.x + 62;
      const ty = FLAG_RECT.y + FLAG_RECT.h / 2;
      ctx.strokeStyle = FACE_RED;
      ctx.fillStyle = FACE_RED;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 20);
      ctx.lineTo(tx + 22, ty + 17);
      ctx.lineTo(tx - 22, ty + 17);
      ctx.closePath();
      ctx.stroke();
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 8);
      ctx.lineTo(tx, ty + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, ty + 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 30px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FLAG_LABEL, FLAG_RECT.x + FLAG_RECT.w / 2 + 30, ty + 2);
    }

    drawStatus(
      ctx,
      size,
      ui.done
        ? 'PANEL SERVICED — SEQUENCE COMPLETE'
        : ui.message
          ? ui.message.toUpperCase()
          : `STEP ${ui.step + 1}/${total} — THE HANDLER READS THE STEPS`,
      ui.done ? 'good' : ui.message ? 'bad' : 'dim',
    );
  },

  regions(instance, rawUi) {
    const ui = rawUi as BadIntelUi;
    if (ui.done) return [];
    const { controls } = instance.state;
    const rects = cardRects(controls.length);
    const serviced = servicedMap(instance.state, ui.step);
    const regions: FaceRegion[] = controls.map((control, i) => {
      const r = rects[i];
      const at = serviced.get(i);
      return px(
        `ctl-${i}`,
        `${describeControl(control)}${at !== undefined ? `, serviced at step ${at}` : ''}`,
        SIZE,
        r.x,
        r.y,
        r.w,
        r.h,
        at !== undefined,
      );
    });
    regions.push(
      px(
        'flag',
        'Flag bad intel — this step names hardware the panel does not have',
        SIZE,
        FLAG_RECT.x,
        FLAG_RECT.y,
        FLAG_RECT.w,
        FLAG_RECT.h,
      ),
    );
    return regions;
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as BadIntelUi;
    if (ui.done) return;
    const { controls } = instance.state;
    const model = modelById(instance.state.model);
    const expected = solveBadIntel(instance.state);
    const total = model.steps.length;
    const want = expected[ui.step];

    const advance = (flagged: boolean): void => {
      ui.message = null;
      ui.step += 1;
      cb.sfx('buttonPress');
      if (ui.step === total) {
        ui.done = true;
        cb.setStatus('Panel serviced — sequence complete. Nice catch.');
        cb.repaint();
        cb.onSolved();
        return;
      }
      cb.setStatus(
        flagged
          ? `Bad intel flagged on step ${ui.step} — good catch. Now on step ${ui.step + 1} of ${total}.`
          : `Step ${ui.step} serviced. Now on step ${ui.step + 1} of ${total}.`,
      );
      cb.repaint();
    };

    if (regionId === 'flag') {
      if (want.kind !== 'flag') {
        ui.message = `Step ${ui.step + 1} is not bad intel`;
        cb.setStatus(
          `Step ${ui.step + 1} is not bad intel — something on this panel does match it. Ask your Handler to read the step again: what do you see that matches?`,
        );
        cb.repaint();
        cb.onStrike();
        return;
      }
      advance(true);
      return;
    }

    if (regionId.startsWith('ctl-')) {
      const i = Number(regionId.slice('ctl-'.length));
      if (!Number.isInteger(i) || i < 0 || i >= controls.length) return;
      if (servicedMap(instance.state, ui.step).has(i)) return;
      if (want.kind !== 'tap' || want.control !== i) {
        ui.message = `That control is not step ${ui.step + 1}`;
        cb.setStatus(
          `The ${describeControl(controls[i]).toLowerCase()} does not match step ${ui.step + 1} as printed. The panel is unchanged — read the step again together.`,
        );
        cb.repaint();
        cb.onStrike();
        return;
      }
      advance(false);
    }
  },

  initialStatus(instance) {
    const model = modelById(instance.state.model);
    return `Maintenance panel: ${model.name}, ${instance.state.controls.length} controls. The Handler reads that model's service sequence step by step — find the one control that matches each step, and flag any step this panel cannot obey.`;
  },
};
