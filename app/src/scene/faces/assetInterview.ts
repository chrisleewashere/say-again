/**
 * Asset Interview in-case face: the witness statement (form stamp + five
 * fact rows with icons) drawn on the plate, six verdict buttons and a
 * commit button below. Mirrors AssetInterview.tsx behavior exactly via the
 * same solver; region labels match the 2D component's aria-labels.
 */
import {
  describeFact,
  solveAssetInterview,
  statementReadout,
  type AssetInterviewState,
} from '../../modules/assetInterview/logic';
import {
  FIELD_RULES,
  VERDICT_BY_ID,
  VERDICTS,
  type FactIcon,
  type VerdictIcon,
  type VerdictId,
} from '../../modules/assetInterview/rules';
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

interface AssetInterviewUi extends FaceUi {
  selected: VerdictId | null;
  done: boolean;
  message: string | null;
}

const SIZE = 1024;

const STATEMENT_RECT = { x: 72, y: 104, w: 880, h: 348 };
const VERDICT_RECTS = VERDICTS.map((v, i) => ({
  id: v.id,
  x: 60 + (i % 2) * 464,
  y: 478 + Math.floor(i / 2) * 118,
  w: 440,
  h: 96,
}));
const COMMIT_RECT = { x: 252, y: 840, w: 520, h: 94 };

/* ------------------------------------------------------------------ */
/* Icon glyphs — same shapes as the 2D SVG icons, via Path2D.          */
/* ------------------------------------------------------------------ */

/** Stroke/fill parts of an icon defined in the icons' 40x40 art space. */
function factIconParts(icon: FactIcon): { stroke: string; fill: string } {
  switch (icon) {
    case 'dawn':
      return { stroke: 'M6 28 H34 M12 28 a8 8 0 0 1 16 0 M20 16 V8 M16 12 l4 -4 l4 4', fill: '' };
    case 'noon': {
      let rays = '';
      for (const deg of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const r = (deg * Math.PI) / 180;
        rays += ` M${20 + Math.cos(r) * 10} ${20 + Math.sin(r) * 10} L${20 + Math.cos(r) * 14} ${20 + Math.sin(r) * 14}`;
      }
      return { stroke: `M27 20 a7 7 0 1 1 -14 0 a7 7 0 1 1 14 0${rays}`, fill: '' };
    }
    case 'dusk':
      return { stroke: 'M6 28 H34 M12 28 a8 8 0 0 1 16 0 M20 8 V16 M16 12 l4 4 l4 -4', fill: '' };
    case 'night':
      return {
        stroke: '',
        fill:
          'M24 8 a12 12 0 1 0 0 24 a9.5 9.5 0 1 1 0 -24 z ' +
          'M31 12 l1.4 2.8 2.8 1.4 -2.8 1.4 -1.4 2.8 -1.4 -2.8 -2.8 -1.4 2.8 -1.4 z',
      };
    case 'tram':
      return {
        stroke:
          'M14 10 l6 -5 l6 5 M13 10 h14 a3 3 0 0 1 3 3 v10 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 v-10 a3 3 0 0 1 3 -3 ' +
          'M13 14 h5 v5 h-5 z M22 14 h5 v5 h-5 z M17.5 29 a2.5 2.5 0 1 1 -5 0 a2.5 2.5 0 1 1 5 0 M27.5 29 a2.5 2.5 0 1 1 -5 0 a2.5 2.5 0 1 1 5 0',
        fill: '',
      };
    case 'cafe':
      return {
        stroke: 'M10 18 h16 v8 a8 8 0 0 1 -16 0 z M26 20 h3 a3 3 0 0 1 0 6 h-3 M15 8 q2 3 0 6 M21 8 q2 3 0 6',
        fill: '',
      };
    case 'bridge':
      return {
        stroke: 'M6 20 H34 M6 28 H34 M10 28 a10 10 0 0 1 20 0 M9 20 V12 M31 20 V12',
        fill: '',
      };
    case 'kiosk':
      return { stroke: 'M8 16 l4 -7 h16 l4 7 z M11 16 h18 v14 h-18 z M15 20 h10 v5 h-10 z', fill: '' };
    case 'case':
      return {
        stroke: 'M11 15 h18 a2 2 0 0 1 2 2 v11 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-11 a2 2 0 0 1 2 -2 M16 15 v-4 h8 v4 M9 22 H31',
        fill: '',
      };
    case 'newspaper':
      return {
        stroke: 'M9 11 h18 v19 h-18 z M27 13 h4 v17 h-4 M12 16 H24 M12 20 H24 M12 24 H24',
        fill: '',
      };
    case 'flowers':
      return {
        stroke:
          'M23.2 7.5 a3.2 3.2 0 1 1 -6.4 0 a3.2 3.2 0 1 1 6.4 0 M17.7 13 a3.2 3.2 0 1 1 -6.4 0 a3.2 3.2 0 1 1 6.4 0 ' +
          'M28.7 13 a3.2 3.2 0 1 1 -6.4 0 a3.2 3.2 0 1 1 6.4 0 M20 17 v15 M20 26 q-6 -2 -7 -7',
        fill: 'M22.4 13 a2.4 2.4 0 1 1 -4.8 0 a2.4 2.4 0 1 1 4.8 0',
      };
    case 'nothing':
      return { stroke: 'M30 20 a10 10 0 1 1 -20 0 a10 10 0 1 1 20 0 M15 20 H25', fill: '' };
    case 'alone':
      return { stroke: 'M25 13 a5 5 0 1 1 -10 0 a5 5 0 1 1 10 0 M10 32 a10 8 0 0 1 20 0', fill: '' };
    case 'companion':
      return {
        stroke:
          'M18 13 a4 4 0 1 1 -8 0 a4 4 0 1 1 8 0 M6 30 a8 7 0 0 1 16 0 M31 13 a4 4 0 1 1 -8 0 a4 4 0 1 1 8 0 M19 30 a8 7 0 0 1 16 0',
        fill: '',
      };
    case 'chalkYes':
      return { stroke: 'M7 10 h26 v20 h-26 z M14 15 L26 25 M26 15 L14 25', fill: '' };
    case 'chalkNo':
      return { stroke: 'M7 10 h26 v20 h-26 z M7 20 H33 M20 10 V20', fill: '' };
  }
}

function drawFactIcon(ctx: CanvasRenderingContext2D, icon: FactIcon, x: number, y: number, s: number, ink: string): void {
  const parts = factIconParts(icon);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  if (parts.stroke) ctx.stroke(new Path2D(parts.stroke));
  if (parts.fill) ctx.fill(new Path2D(parts.fill));
  ctx.restore();
}

function verdictIconParts(icon: VerdictIcon): { stroke: string; fill: string; strokeWidth?: number } {
  switch (icon) {
    case 'star':
      return {
        stroke: '',
        fill: 'M20 7 L23.7 15.3 32.8 16.2 26 22.3 27.9 31.2 20 26.6 12.1 31.2 14 22.3 7.2 16.2 16.3 15.3 Z',
      };
    case 'splitDiamond':
      return { stroke: 'M20 6 L6 20 L20 34 Z', fill: 'M20 6 L34 20 L20 34 Z' };
    case 'envelope':
      return {
        stroke: 'M9 12 h22 a2 2 0 0 1 2 2 v13 a2 2 0 0 1 -2 2 h-22 a2 2 0 0 1 -2 -2 v-13 a2 2 0 0 1 2 -2 M8 13 L20 23 L32 13',
        fill: '',
      };
    case 'ring':
      return { stroke: 'M31 20 a11 11 0 1 1 -22 0 a11 11 0 1 1 22 0', fill: '', strokeWidth: 3.4 };
    case 'flag':
      return { stroke: 'M12 7 V33', fill: 'M12 9 h16 l-4.5 5.5 4.5 5.5 h-16 z' };
    case 'eye':
      return { stroke: 'M7 20 q13 -13 26 0 q-13 13 -26 0 z', fill: 'M24 20 a4 4 0 1 1 -8 0 a4 4 0 1 1 8 0' };
  }
}

function drawVerdictIcon(ctx: CanvasRenderingContext2D, icon: VerdictIcon, x: number, y: number, s: number, ink: string): void {
  const parts = verdictIconParts(icon);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = parts.strokeWidth ?? 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  if (parts.stroke) ctx.stroke(new Path2D(parts.stroke));
  if (parts.fill) ctx.fill(new Path2D(parts.fill));
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* The face.                                                           */
/* ------------------------------------------------------------------ */

export const assetInterviewFace: ModuleFace<AssetInterviewState> = {
  canvasSize: SIZE,

  initUi(): AssetInterviewUi {
    return { selected: null, done: false, message: null };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as AssetInterviewUi;
    const { formId, facts } = instance.state;
    clearFace(ctx, size);
    drawTag(ctx, size, 'ASSET INTERVIEW');

    ctx.font = '500 24px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ANSWER ONLY WHAT IS ASKED', size / 2, 70);

    // witness statement panel
    const st = STATEMENT_RECT;
    roundRect(ctx, st.x, st.y, st.w, st.h, 16);
    ctx.fillStyle = FACE_PANEL;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = FACE_LINE;
    ctx.stroke();

    // form stamp
    roundRect(ctx, st.x + 24, st.y + 20, 210, 56, 8);
    ctx.strokeStyle = FACE_AMBER;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '700 34px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_AMBER;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FORM ${formId}`, st.x + 24 + 105, st.y + 20 + 30);

    // fact rows
    const rowY0 = st.y + 100;
    const rowH = 48;
    ctx.textAlign = 'left';
    FIELD_RULES.forEach((field, i) => {
      const value = field.values.find((v) => v.id === facts[field.id])!;
      const y = rowY0 + i * rowH;
      drawFactIcon(ctx, value.icon, st.x + 28, y - 2, 1.1, FACE_TEXT);
      ctx.font = '500 26px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textBaseline = 'middle';
      const label = `${field.label}:`;
      ctx.fillText(label, st.x + 90, y + 20);
      const labelW = ctx.measureText(label).width;
      ctx.font = '600 26px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT;
      ctx.fillText(` ${value.label}`, st.x + 90 + labelW, y + 20);
    });

    // verdict buttons
    for (const vr of VERDICT_RECTS) {
      const verdict = VERDICT_BY_ID[vr.id];
      const active = ui.selected === vr.id;
      const committed = ui.done && vr.id === solveAssetInterview(instance.state);
      roundRect(ctx, vr.x, vr.y, vr.w, vr.h, 14);
      ctx.fillStyle = active ? '#3a2f1c' : FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = committed ? FACE_GREEN : active ? FACE_AMBER : FACE_LINE;
      ctx.stroke();
      const ink = ui.done && !committed ? FACE_TEXT_DIM : FACE_TEXT;
      drawVerdictIcon(ctx, verdict.icon, vr.x + 24, vr.y + 26, 1.1, ink);
      ctx.font = '600 21px ui-monospace, Menlo, monospace';
      ctx.fillStyle = ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(verdict.label.toUpperCase(), vr.x + 82, vr.y + vr.h / 2 + 1);
    }

    if (!ui.done) {
      drawButton(ctx, COMMIT_RECT, {
        label: 'COMMIT VERDICT',
        active: ui.selected !== null,
        disabled: ui.selected === null,
      });
    }

    drawStatus(
      ctx,
      size,
      ui.done
        ? 'INTERVIEW CLOSED'
        : ui.message
          ? ui.message.toUpperCase()
          : ui.selected
            ? `${VERDICT_BY_ID[ui.selected].label.toUpperCase()} SELECTED`
            : 'READ THE FORM LETTER TO YOUR HANDLER',
      ui.done ? 'good' : ui.message ? 'bad' : 'dim',
    );
  },

  regions(instance, rawUi) {
    const ui = rawUi as AssetInterviewUi;
    if (ui.done) return [];
    const { formId, facts } = instance.state;
    const factLines = FIELD_RULES.map((field) => describeFact(field.id, facts)).join('. ');
    const regions: FaceRegion[] = [
      px(
        'statement',
        `Witness statement, interview form ${formId}. ${factLines}`,
        SIZE,
        STATEMENT_RECT.x,
        STATEMENT_RECT.y,
        STATEMENT_RECT.w,
        STATEMENT_RECT.h,
      ),
    ];
    for (const vr of VERDICT_RECTS) {
      const verdict = VERDICT_BY_ID[vr.id];
      regions.push(
        px(
          `verdict-${vr.id}`,
          `Verdict: ${verdict.label}${ui.selected === vr.id ? ', selected' : ''}`,
          SIZE,
          vr.x,
          vr.y,
          vr.w,
          vr.h,
        ),
      );
    }
    regions.push(
      px(
        'commit',
        ui.selected === null
          ? 'Commit verdict (select a verdict first)'
          : `Commit verdict: ${VERDICT_BY_ID[ui.selected].label}`,
        SIZE,
        COMMIT_RECT.x,
        COMMIT_RECT.y,
        COMMIT_RECT.w,
        COMMIT_RECT.h,
        ui.selected === null,
      ),
    );
    return regions;
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as AssetInterviewUi;
    if (ui.done) return;

    if (regionId === 'statement') {
      // re-read the statement aloud for the shell's live region
      cb.setStatus(statementReadout(instance.state));
      return;
    }

    if (regionId.startsWith('verdict-')) {
      const id = regionId.slice('verdict-'.length) as VerdictId;
      if (!VERDICTS.some((v) => v.id === id)) return;
      ui.selected = ui.selected === id ? null : id;
      cb.sfx('buttonPress');
      cb.setStatus(
        ui.selected === null
          ? 'Selection cleared. Read the form letter to your Handler, then answer their questions from the statement.'
          : `"${VERDICT_BY_ID[id].label}" selected. Press Commit verdict when your Handler dictates it.`,
      );
      cb.repaint();
      return;
    }

    if (regionId === 'commit') {
      if (ui.selected === null) return;
      const answer = ui.selected;
      const correct = answer === solveAssetInterview(instance.state);
      if (!correct) {
        ui.message = `Not "${VERDICT_BY_ID[answer].label}"`;
        ui.selected = null; // statement unchanged — soft failure, retry
        cb.setStatus(
          `"${VERDICT_BY_ID[answer].label}" is not the verdict — the statement is unchanged. Ask your Handler to re-walk the flow out loud from step 1.`,
        );
        cb.repaint();
        cb.onStrike();
        return;
      }
      ui.message = null;
      ui.done = true;
      cb.sfx('buttonPress');
      cb.setStatus(`Verdict committed: ${VERDICT_BY_ID[answer].label}. Interview closed.`);
      cb.repaint();
      cb.onSolved();
    }
  },

  initialStatus(instance) {
    return `Asset interview: witness statement, interview form ${instance.state.formId}, with five observed facts. Read the form letter to your Handler, then answer their questions from the statement. Tap the statement to hear the facts.`;
  },
};
