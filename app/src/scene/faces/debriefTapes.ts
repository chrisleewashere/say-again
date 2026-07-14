/**
 * Debrief Tapes in-case face: shuffled surveillance stills drawn as film
 * frames on the plate; taps lock report positions, choose connectives, and
 * record the debrief. Mirrors DebriefTapes.tsx behavior exactly via the
 * same solver.
 */
import {
  describeScene,
  solveDebriefTapes,
  type DebriefTapesState,
  type TapeScene,
} from '../../modules/debriefTapes/logic';
import { CONNECTIVES, MARKER_BY_SLOT, OPERATIVES, SETTINGS, type Connective } from '../../modules/debriefTapes/rules';
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

interface DebriefTapesUi extends FaceUi {
  assigned: (number | null)[];
  links: Connective[];
  taped: boolean;
  message: string | null;
}

const SIZE = 1024;
const GRID_TOP = 128;
const GRID_H = 620;

function cardRects(count: number): { x: number; y: number; w: number; h: number }[] {
  const cols = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const gap = 20;
  const w = Math.min(300, (SIZE - 80 - gap * (cols - 1)) / cols);
  const h = Math.min((GRID_H - gap * (rows - 1)) / rows, w * 1.18);
  const gridW = cols * w + (cols - 1) * gap;
  const x0 = (SIZE - gridW) / 2;
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const inLastRow = r === rows - 1;
    const lastRowCount = count - (rows - 1) * cols;
    const rowX0 = inLastRow ? (SIZE - (lastRowCount * w + (lastRowCount - 1) * gap)) / 2 : x0;
    return { x: rowX0 + c * w + (inLastRow ? 0 : 0), y: GRID_TOP + r * (h + gap), w, h };
  });
}

/** Draw one still, mapping the 2D component's 120x150 art space into a rect. */
function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: TapeScene,
  r: { x: number; y: number; w: number; h: number },
  locked: number | null,
): void {
  // fit the 120x150 art space inside the card rect, centered horizontally
  const s = Math.min(r.w / 120, r.h / 150);
  const x0 = r.x + (r.w - 120 * s) / 2;
  const map = (px_: number, py: number): [number, number] => [x0 + px_ * s, r.y + py * s];
  const ink = locked !== null ? FACE_TEXT_DIM : FACE_TEXT;
  const dim = FACE_TEXT_DIM;

  roundRect(ctx, x0, r.y, 120 * s, 150 * s, 10);
  ctx.fillStyle = FACE_PANEL;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = locked !== null ? FACE_LINE : FACE_TEXT_DIM;
  if (locked !== null) ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // letter stamp
  const [lx, ly] = map(12, 8);
  roundRect(ctx, lx, ly, 22 * s, 22 * s, 4);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = `700 ${15 * s}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.letter, lx + 11 * s, ly + 12 * s);

  ctx.strokeStyle = dim;
  ctx.lineWidth = 2.5 * s;
  ctx.fillStyle = dim;
  const setting = SETTINGS.find((st) => st.id === scene.settingId)!;
  drawSettingGlyph(ctx, setting.glyph, map, s);

  // operative: head + torso
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  const [hx, hy] = map(60, 74);
  ctx.arc(hx, hy, 11 * s, 0, Math.PI * 2);
  ctx.stroke();
  const [tx, ty] = map(46, 128);
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx, ty - 24 * s);
  ctx.arc(hx, ty - 24 * s, 14 * s, Math.PI, 0);
  ctx.lineTo(hx + 14 * s, ty);
  ctx.closePath();
  ctx.stroke();

  const op = OPERATIVES.find((o) => o.id === scene.operativeId)!;
  drawAccessory(ctx, op.accessory, map, s, ink);
  drawMarker(ctx, scene, map, s, ink);

  // locked position badge
  if (locked !== null) {
    const [bx, by] = map(104, 132);
    ctx.beginPath();
    ctx.arc(bx, by, 15 * s, 0, Math.PI * 2);
    ctx.fillStyle = FACE_AMBER;
    ctx.fill();
    ctx.font = `700 ${17 * s}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = '#1a1408';
    ctx.fillText(String(locked), bx, by + s);
  }
}

type MapFn = (x: number, y: number) => [number, number];

function drawSettingGlyph(ctx: CanvasRenderingContext2D, glyph: string, map: MapFn, s: number): void {
  ctx.beginPath();
  if (glyph === 'clock') {
    const [cx, cy] = map(30, 34);
    ctx.arc(cx, cy, 14 * s, 0, Math.PI * 2);
    ctx.moveTo(cx, cy);
    ctx.lineTo(...map(30, 25));
    ctx.moveTo(cx, cy);
    ctx.lineTo(...map(37, 37));
  } else if (glyph === 'arch') {
    ctx.moveTo(...map(16, 52));
    ctx.lineTo(...map(16, 36));
    const [ax, ay] = map(30, 36);
    ctx.arc(ax, ay, 14 * s, Math.PI, 0);
    ctx.lineTo(...map(44, 52));
  } else if (glyph === 'crane') {
    ctx.moveTo(...map(20, 52));
    ctx.lineTo(...map(20, 20));
    ctx.moveTo(...map(20, 22));
    ctx.lineTo(...map(48, 22));
    ctx.moveTo(...map(42, 22));
    ctx.lineTo(...map(42, 34));
    ctx.rect(...map(39, 34), 6 * s, 5 * s);
  } else if (glyph === 'lamp') {
    ctx.moveTo(...map(26, 52));
    ctx.lineTo(...map(26, 20));
    ctx.quadraticCurveTo(...map(36, 20), ...map(38, 28));
    ctx.moveTo(...map(42, 30));
    ctx.arc(...map(39, 30), 3.5 * s, 0, Math.PI * 2);
  } else if (glyph === 'stairs') {
    ctx.moveTo(...map(14, 52));
    ctx.lineTo(...map(22, 52));
    ctx.lineTo(...map(22, 44));
    ctx.lineTo(...map(30, 44));
    ctx.lineTo(...map(30, 36));
    ctx.lineTo(...map(38, 36));
    ctx.lineTo(...map(38, 28));
    ctx.lineTo(...map(46, 28));
  } else if (glyph === 'antenna') {
    ctx.moveTo(...map(30, 52));
    ctx.lineTo(...map(30, 22));
    ctx.moveTo(...map(20, 30));
    ctx.quadraticCurveTo(...map(30, 20), ...map(40, 30));
    ctx.moveTo(...map(23, 24));
    ctx.quadraticCurveTo(...map(30, 18), ...map(37, 24));
  }
  ctx.stroke();
}

function drawAccessory(ctx: CanvasRenderingContext2D, accessory: string, map: MapFn, s: number, ink: string): void {
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  if (accessory === 'satchel') {
    ctx.moveTo(...map(50, 92));
    ctx.lineTo(...map(74, 112));
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(...map(68, 108), 18 * s, 13 * s);
    ctx.stroke();
  } else if (accessory === 'umbrella') {
    const [ux, uy] = map(92, 86);
    ctx.arc(ux, uy, 14 * s, Math.PI, 0);
    ctx.moveTo(ux, uy);
    ctx.lineTo(...map(92, 118));
    ctx.stroke();
  } else if (accessory === 'camera') {
    ctx.rect(...map(52, 100), 16 * s, 11 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(...map(60, 105.5), 3 * s, 0, Math.PI * 2);
    ctx.stroke();
  } else if (accessory === 'flatcap') {
    const [cx, cy] = map(60, 66);
    ctx.ellipse(cx, cy, 14 * s, 8 * s, 0, Math.PI, 0);
    ctx.lineTo(...map(78, 69));
    ctx.lineTo(...map(42, 69));
    ctx.closePath();
    ctx.fill();
  } else if (accessory === 'scarf') {
    ctx.lineWidth = 5 * s;
    ctx.moveTo(...map(52, 90));
    ctx.lineTo(...map(68, 90));
    ctx.moveTo(...map(64, 90));
    ctx.lineTo(...map(66, 112));
    ctx.stroke();
  }
  ctx.stroke();
}

function drawMarker(ctx: CanvasRenderingContext2D, scene: TapeScene, map: MapFn, s: number, ink: string): void {
  const marker = MARKER_BY_SLOT[scene.slot].marker;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 3.5 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (marker === 'alert') {
    const pts: [number, number][] = [
      [100, 12], [92, 28], [99, 28], [94, 42], [108, 24], [100, 24], [106, 12],
    ];
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(...map(x, y)) : ctx.lineTo(...map(x, y))));
    ctx.closePath();
    ctx.fill();
  } else if (marker === 'thought') {
    ctx.lineWidth = 2.5 * s;
    const [ex, ey] = map(100, 20);
    ctx.ellipse(ex, ey, 12 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(...map(90, 32), 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(...map(86, 38), 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (marker === 'motion') {
    ctx.moveTo(...map(90, 14));
    ctx.lineTo(...map(100, 23));
    ctx.lineTo(...map(90, 32));
    ctx.moveTo(...map(100, 14));
    ctx.lineTo(...map(110, 23));
    ctx.lineTo(...map(100, 32));
    ctx.stroke();
  } else if (marker === 'break') {
    ctx.moveTo(...map(96, 10));
    ctx.lineTo(...map(102, 18));
    ctx.lineTo(...map(95, 22));
    ctx.lineTo(...map(104, 29));
    ctx.lineTo(...map(99, 38));
    ctx.stroke();
  } else if (marker === 'seal') {
    const [cx, cy] = map(100, 24);
    ctx.arc(cx, cy, 13 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    if (scene.outcomeGood) {
      ctx.moveTo(...map(93, 24));
      ctx.lineTo(...map(98, 29));
      ctx.lineTo(...map(107, 19));
    } else {
      ctx.moveTo(...map(93, 24));
      ctx.lineTo(...map(107, 24));
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
}

function phaseOf(state: DebriefTapesState, ui: DebriefTapesUi): 'order' | 'links' | 'retell' {
  const step = ui.assigned.filter((a) => a !== null).length;
  if (step < state.scenes.length) return 'order';
  if (state.connectivesRequired && ui.links.length < state.scenes.length - 1) return 'links';
  return 'retell';
}

const CONN_RECTS = CONNECTIVES.map((c, i) => ({
  c,
  x: 172 + i * 240,
  y: 830,
  w: 200,
  h: 84,
}));
const RECORD_RECT = { x: 262, y: 830, w: 500, h: 84 };

export const debriefTapesFace: ModuleFace<DebriefTapesState> = {
  canvasSize: SIZE,

  initUi(instance): DebriefTapesUi {
    return {
      assigned: instance.state.scenes.map(() => null),
      links: [],
      taped: false,
      message: null,
    };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as DebriefTapesUi;
    const { scenes, connectivesRequired } = instance.state;
    clearFace(ctx, size);
    drawTag(ctx, size, 'DEBRIEF TAPES');

    const phase = ui.taped ? 'retell' : phaseOf(instance.state, ui);
    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      phase === 'order'
        ? 'TAP THE STILLS IN REPORT ORDER'
        : phase === 'links'
          ? 'CHOOSE THE LINKING WORD'
          : 'RETELL THE OPERATION ALOUD',
      size / 2,
      78,
    );

    const rects = cardRects(scenes.length);
    scenes.forEach((scene, i) => drawScene(ctx, scene, rects[i], ui.assigned[i]));

    if (phase === 'links' && !ui.taped) {
      const expected = solveDebriefTapes(instance.state);
      const j = ui.links.length;
      const from = scenes[expected.order[j]];
      const to = scenes[expected.order[j + 1]];
      ctx.font = '600 30px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT;
      ctx.textAlign = 'center';
      ctx.fillText(`STILL ${from.letter}  ____  STILL ${to.letter}`, size / 2, 776);
      for (const cr of CONN_RECTS) {
        drawButton(ctx, cr, { label: cr.c.toUpperCase() });
      }
    } else if (phase === 'retell') {
      ctx.font = '500 26px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText('AGENT: TELL THE WHOLE STORY, START TO FINISH', size / 2, 780);
      if (!ui.taped) {
        drawButton(ctx, RECORD_RECT, { label: 'TAPE RECORDED' });
      }
    } else if (connectivesRequired) {
      ctx.font = '500 24px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText('LINKING WORDS COME AFTER THE ORDER', size / 2, 790);
    }

    const step = ui.assigned.filter((a) => a !== null).length;
    drawStatus(
      ctx,
      size,
      ui.taped
        ? 'DEBRIEF DELIVERED'
        : ui.message
          ? ui.message.toUpperCase()
          : phase === 'order'
            ? `ENTRIES LOCKED ${step}/${scenes.length}`
            : phase === 'links'
              ? `LINKS ${ui.links.length}/${scenes.length - 1}`
              : 'READY TO RECORD',
      ui.taped ? 'good' : ui.message ? 'bad' : 'dim',
    );
  },

  regions(instance, rawUi) {
    const ui = rawUi as DebriefTapesUi;
    const { scenes } = instance.state;
    if (ui.taped) return [];
    const phase = phaseOf(instance.state, ui);
    if (phase === 'order') {
      const rects = cardRects(scenes.length);
      return scenes.map((scene, i): FaceRegion => {
        const r = rects[i];
        return px(
          `card-${i}`,
          `${describeScene(scene)}${ui.assigned[i] !== null ? `, locked as report entry ${ui.assigned[i]}` : ''}`,
          SIZE,
          r.x,
          r.y,
          r.w,
          r.h,
          ui.assigned[i] !== null,
        );
      });
    }
    if (phase === 'links') {
      return CONN_RECTS.map((cr) =>
        px(`conn-${cr.c}`, `Link with ${cr.c.toUpperCase()}`, SIZE, cr.x, cr.y, cr.w, cr.h),
      );
    }
    return [
      px(
        'record',
        'Tape recorded — deliver the debrief (retell the operation aloud first)',
        SIZE,
        RECORD_RECT.x,
        RECORD_RECT.y,
        RECORD_RECT.w,
        RECORD_RECT.h,
      ),
    ];
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as DebriefTapesUi;
    if (ui.taped) return;
    const { scenes } = instance.state;
    const expected = solveDebriefTapes(instance.state);
    const phase = phaseOf(instance.state, ui);

    if (phase === 'order' && regionId.startsWith('card-')) {
      const i = Number(regionId.slice('card-'.length));
      if (!Number.isInteger(i) || ui.assigned[i] !== null) return;
      const step = ui.assigned.filter((a) => a !== null).length;
      if (expected.order[step] !== i) {
        ui.message = `Still ${scenes[i].letter} is not entry ${step + 1}`;
        cb.setStatus(
          `Still ${scenes[i].letter} is not entry ${step + 1} of the report. The tape is unchanged — talk it through and try again.`,
        );
        cb.repaint();
        cb.onStrike();
        return;
      }
      ui.message = null;
      ui.assigned = ui.assigned.map((v, idx) => (idx === i ? step + 1 : v));
      cb.sfx('buttonPress');
      cb.setStatus(`Locked Still ${scenes[i].letter} as report entry ${step + 1} of ${scenes.length}.`);
      cb.repaint();
      return;
    }

    if (phase === 'links' && regionId.startsWith('conn-')) {
      const c = regionId.slice('conn-'.length) as Connective;
      const j = ui.links.length;
      if (expected.connectives[j] !== c) {
        ui.message = `Not "${c}" here`;
        cb.setStatus(`Not "${c.toUpperCase()}" — check the linking rules with your Handler.`);
        cb.repaint();
        cb.onStrike();
        return;
      }
      ui.message = null;
      ui.links = [...ui.links, c];
      cb.sfx('buttonPress');
      cb.setStatus(
        ui.links.length === scenes.length - 1
          ? 'All links chosen. Agent: retell the whole operation, then record the tape.'
          : `Link ${ui.links.length} of ${scenes.length - 1} chosen.`,
      );
      cb.repaint();
      return;
    }

    if (phase === 'retell' && regionId === 'record') {
      ui.taped = true;
      cb.sfx('buttonPress');
      cb.setStatus('Debrief delivered!');
      cb.repaint();
      cb.onSolved();
    }
  },

  initialStatus(instance) {
    const { scenes, connectivesRequired } = instance.state;
    return `Debrief tape: ${scenes.length} stills, out of order. Describe each still to your Handler — its letter, who, where, and the corner marker. Lock them in report order${connectivesRequired ? ', then choose the linking words' : ''}.`;
  },
};
