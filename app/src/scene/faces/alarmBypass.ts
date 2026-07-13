/**
 * Alarm Bypass in-case face: Simon-style signal playback and answer entry
 * drawn onto the plate's canvas texture. Mirrors AlarmBypass.tsx behavior
 * exactly — same solver (solveAlarmBypass), same soft-failure semantics (a
 * wrong press clears only this round's presses and strikes; the signal is
 * unchanged), same solve condition (all rounds answered in order).
 *
 * Playback timers are started in onShow / restarted on round advance and
 * replay, and cleared in onHide. draw() renders a correct static frame for
 * whatever the ui state says, so a non-animating face is always correct.
 */
import { solveAlarmBypass, type AlarmBypassState } from '../../modules/alarmBypass/logic';
import { GLYPHS, GLYPH_LETTERS, type Glyph } from '../../modules/alarmBypass/rules';
import {
  clearFace,
  drawButton,
  drawStatus,
  drawTag,
  FACE_AMBER,
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

/** On-screen display names (shape channel; letters are the second channel). */
// The easy-read manual calls the crescent "Moon" — say both names so any
// Handler edition matches what the Agent hears and reads.
const GLYPH_NAMES: Record<Glyph, string> = {
  crescent: 'Crescent (Moon)',
  key: 'Key',
  bolt: 'Bolt',
  eye: 'Eye',
};

/** Accent per glyph — decorative only; shape + printed letter carry the info. */
const GLYPH_HEX: Record<Glyph, string> = {
  crescent: '#a78bfa',
  key: '#ffb347',
  bolt: '#2dd4bf',
  eye: '#f4587a',
};

/** Per-flash dwell during playback. */
const FLASH_DWELL_MS = 600;

interface AlarmBypassUi extends FaceUi {
  round: number;
  answeredRounds: number;
  pressed: Glyph[];
  wrongFlash: boolean;
  done: boolean;
  /** Index of the sequence lamp currently flashing; null = playback off. */
  flashPos: number | null;
  timer: ReturnType<typeof setInterval> | null;
}

const SIZE = 1024;

/* ---- layout (canvas px) ------------------------------------------------ */
const SIGNAL_PANEL = { x: 60, y: 168, w: SIZE - 120, h: 252 };
const LAMP = 140;
const LAMP_GAP = 24;
const LAMP_Y = 236;
const REPLAY = { x: (SIZE - 440) / 2, y: 452, w: 440, h: 96 };
const BTN = 200;
const BTN_GAP = 34;
const BTN_X0 = 60;
const BTN_Y = 584;
const SLOT = 72;
const SLOT_GAP = 18;
const SLOT_Y = 816;

function btnRect(i: number): { x: number; y: number; w: number; h: number } {
  return { x: BTN_X0 + i * (BTN + BTN_GAP), y: BTN_Y, w: BTN, h: BTN };
}

/** Draw a glyph shape (ported from the module's inline SVG, viewBox 0 0 48 48). */
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: Glyph,
  cx: number,
  cy: number,
  s: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(cx - s / 2, cy - s / 2);
  ctx.scale(s / 48, s / 48);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glyph === 'crescent') {
    ctx.fill(new Path2D('M42 25.58 A18 18 0 1 1 22.42 6 A14 14 0 0 0 42 25.58 Z'));
  } else if (glyph === 'key') {
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(15, 24, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(23, 24);
    ctx.lineTo(42, 24);
    ctx.moveTo(34, 24);
    ctx.lineTo(34, 32);
    ctx.moveTo(41, 24);
    ctx.lineTo(41, 31);
    ctx.stroke();
  } else if (glyph === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(27, 3);
    ctx.lineTo(10, 28);
    ctx.lineTo(21, 28);
    ctx.lineTo(19, 45);
    ctx.lineTo(38, 19);
    ctx.lineTo(26, 19);
    ctx.closePath();
    ctx.fill();
  } else {
    // eye
    ctx.lineWidth = 4;
    ctx.stroke(new Path2D('M4 24 C 12 11, 36 11, 44 24 C 36 37, 12 37, 4 24 Z'));
    ctx.beginPath();
    ctx.arc(24, 24, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function stopPlayback(ui: AlarmBypassUi): void {
  if (ui.timer !== null) {
    clearInterval(ui.timer);
    ui.timer = null;
  }
  ui.flashPos = null;
}

/** Start (or restart) flashing the current round's signal, one lamp at a time. */
function startPlayback(
  instance: { state: AlarmBypassState },
  ui: AlarmBypassUi,
  cb: FaceCallbacks,
): void {
  stopPlayback(ui);
  if (ui.done) return;
  const sequence = instance.state.rounds[ui.round];
  ui.flashPos = 0;
  cb.repaint();
  ui.timer = setInterval(() => {
    if (ui.flashPos === null) return;
    const next = ui.flashPos + 1;
    if (next >= sequence.length) {
      stopPlayback(ui);
    } else {
      ui.flashPos = next;
    }
    cb.repaint();
  }, FLASH_DWELL_MS);
}

function glyphSpoken(glyph: Glyph): string {
  return `${GLYPH_NAMES[glyph]} (letter ${GLYPH_LETTERS[glyph]})`;
}

export const alarmBypassFace: ModuleFace<AlarmBypassState> = {
  canvasSize: SIZE,

  initUi(): AlarmBypassUi {
    return {
      round: 0,
      answeredRounds: 0,
      pressed: [],
      wrongFlash: false,
      done: false,
      flashPos: null,
      timer: null,
    };
  },

  draw(ctx, size, instance, rawUi) {
    const ui = rawUi as AlarmBypassUi;
    const { model, rounds } = instance.state;
    const totalRounds = rounds.length;
    const sequence = rounds[Math.min(ui.round, totalRounds - 1)];
    const playing = ui.flashPos !== null;

    clearFace(ctx, size);
    drawTag(ctx, size, 'ALARM BYPASS');

    ctx.font = '500 26px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('THE PANEL FLASHES A SIGNAL — YOUR HANDLER TRANSLATES IT', size / 2, 78);

    ctx.font = '600 30px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT;
    ctx.fillText(
      `MODEL ${model}   ·   ROUND ${Math.min(ui.round + 1, totalRounds)} / ${totalRounds}`,
      size / 2,
      118,
    );

    // signal display panel
    roundRect(ctx, SIGNAL_PANEL.x, SIGNAL_PANEL.y, SIGNAL_PANEL.w, SIGNAL_PANEL.h, 18);
    ctx.fillStyle = '#12100c';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = FACE_LINE;
    ctx.stroke();

    ctx.font = '600 24px ui-monospace, Menlo, monospace';
    ctx.fillStyle = FACE_TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(ui.done ? 'SIGNAL OFF' : 'FLASHED SIGNAL', SIGNAL_PANEL.x + 24, SIGNAL_PANEL.y + 18);

    // sequence lamps (glyph shape + printed letter — never color alone)
    const rowW = sequence.length * LAMP + (sequence.length - 1) * LAMP_GAP;
    const rowX = (size - rowW) / 2;
    sequence.forEach((glyph, i) => {
      const lx = rowX + i * (LAMP + LAMP_GAP);
      const flashing = playing && ui.flashPos === i;
      roundRect(ctx, lx, LAMP_Y, LAMP, LAMP, 16);
      ctx.fillStyle = flashing ? '#3a2f1c' : FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = flashing ? 6 : 3;
      ctx.strokeStyle = flashing ? FACE_AMBER : FACE_LINE;
      ctx.stroke();

      ctx.globalAlpha = ui.done ? 0.35 : playing && !flashing ? 0.4 : 1;
      drawGlyph(ctx, glyph, lx + LAMP / 2, LAMP_Y + LAMP / 2 - 12, 76, GLYPH_HEX[glyph]);
      ctx.font = '700 30px ui-monospace, Menlo, monospace';
      ctx.fillStyle = flashing ? FACE_TEXT : FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(GLYPH_LETTERS[glyph], lx + LAMP / 2, LAMP_Y + LAMP - 14);
      ctx.globalAlpha = 1;
    });

    // flash counter during playback (position channel, no color needed)
    if (playing && ui.flashPos !== null) {
      ctx.font = '600 24px ui-monospace, Menlo, monospace';
      ctx.fillStyle = FACE_AMBER;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(
        `FLASH ${ui.flashPos + 1}/${sequence.length}`,
        SIGNAL_PANEL.x + SIGNAL_PANEL.w - 24,
        SIGNAL_PANEL.y + 18,
      );
    }

    // replay button
    drawButton(ctx, REPLAY, {
      label: '▶ PLAY AGAIN',
      active: playing,
      disabled: ui.done,
    });

    // signal press buttons
    GLYPHS.forEach((glyph, i) => {
      const r = btnRect(i);
      roundRect(ctx, r.x, r.y, r.w, r.h, 16);
      ctx.fillStyle = FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = FACE_LINE;
      ctx.stroke();
      ctx.globalAlpha = ui.done ? 0.35 : 1;
      drawGlyph(ctx, glyph, r.x + r.w / 2, r.y + r.h / 2 - 24, 96, GLYPH_HEX[glyph]);
      ctx.font = '700 40px ui-monospace, Menlo, monospace';
      ctx.fillStyle = ui.done ? FACE_TEXT_DIM : FACE_TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(GLYPH_LETTERS[glyph], r.x + r.w / 2, r.y + r.h - 20);
      ctx.globalAlpha = 1;
    });

    // pressed slots for this round (letters, not colors)
    const slotsW = sequence.length * SLOT + (sequence.length - 1) * SLOT_GAP;
    const slotsX = (size - slotsW) / 2;
    sequence.forEach((_, i) => {
      const sx = slotsX + i * (SLOT + SLOT_GAP);
      const filled = i < ui.pressed.length;
      roundRect(ctx, sx, SLOT_Y, SLOT, SLOT, 12);
      ctx.fillStyle = filled ? '#241d12' : FACE_PANEL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = ui.wrongFlash ? FACE_RED : filled ? FACE_AMBER : FACE_LINE;
      ctx.stroke();
      ctx.font = '700 36px ui-monospace, Menlo, monospace';
      ctx.fillStyle = filled ? FACE_TEXT : FACE_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(filled ? GLYPH_LETTERS[ui.pressed[i]] : '·', sx + SLOT / 2, SLOT_Y + SLOT / 2 + 2);
    });

    const statusText = ui.done
      ? 'ALARM BYPASSED · ALL ROUNDS COMPLETE'
      : `ROUND ${ui.round + 1}/${totalRounds} · ` +
        (playing ? 'SIGNAL PLAYING' : `SIGNAL HAS ${sequence.length} FLASHES`) +
        ` · PRESSES ${ui.pressed.length}/${sequence.length}` +
        (ui.wrongFlash ? ' · WRONG — PRESSES CLEARED' : '');
    drawStatus(ctx, size, statusText, ui.done ? 'good' : ui.wrongFlash ? 'bad' : 'dim');
  },

  regions(instance, rawUi) {
    const ui = rawUi as AlarmBypassUi;
    const totalRounds = instance.state.rounds.length;
    const list: FaceRegion[] = [
      px(
        'replay',
        `Replay the flashed signal for round ${Math.min(ui.round + 1, totalRounds)}`,
        SIZE,
        REPLAY.x,
        REPLAY.y,
        REPLAY.w,
        REPLAY.h,
        ui.done,
      ),
    ];
    GLYPHS.forEach((glyph, i) => {
      const r = btnRect(i);
      list.push(
        px(
          `press-${glyph}`,
          `Press signal button ${GLYPH_NAMES[glyph]}, printed letter ${GLYPH_LETTERS[glyph]}`,
          SIZE,
          r.x,
          r.y,
          r.w,
          r.h,
          ui.done,
        ),
      );
    });
    return list;
  },

  onTap(regionId, instance, rawUi, cb: FaceCallbacks) {
    const ui = rawUi as AlarmBypassUi;
    if (ui.done) return;
    const { rounds } = instance.state;
    const totalRounds = rounds.length;
    const sequence = rounds[ui.round];

    if (regionId === 'replay') {
      cb.sfx('dialDetent');
      cb.setStatus(
        `Replaying signal for round ${ui.round + 1} of ${totalRounds}: ${sequence
          .map(glyphSpoken)
          .join(', ')}.`,
      );
      startPlayback(instance, ui, cb);
      return;
    }

    if (!regionId.startsWith('press-')) return;
    const glyph = regionId.slice('press-'.length) as Glyph;
    if (!GLYPHS.includes(glyph)) return;

    const expected = solveAlarmBypass(instance.state);
    const target = expected[ui.round];
    if (target[ui.pressed.length] !== glyph) {
      // wrong press clears only this round's input — soft failure, same as 2D
      ui.pressed = [];
      ui.wrongFlash = true;
      cb.setStatus('Wrong button — this round’s presses were cleared. The signal is unchanged.');
      cb.repaint();
      cb.onStrike();
      return;
    }

    ui.wrongFlash = false;
    cb.sfx('buttonPress');
    ui.pressed = [...ui.pressed, glyph];
    if (ui.pressed.length === target.length) {
      ui.answeredRounds += 1;
      ui.pressed = [];
      if (ui.answeredRounds === totalRounds) {
        ui.done = true;
        stopPlayback(ui);
        cb.setStatus('Alarm bypassed. All rounds complete.');
        cb.repaint();
        cb.onSolved();
      } else {
        ui.round += 1;
        const next = rounds[ui.round];
        cb.setStatus(
          `Round ${ui.round} complete. Round ${ui.round + 1} of ${totalRounds}. Signal has ${next.length} flashes.`,
        );
        startPlayback(instance, ui, cb);
      }
    } else {
      cb.setStatus(
        `Pressed ${glyphSpoken(glyph)}. Correct presses this round: ${ui.pressed.length} of ${target.length}.`,
      );
      cb.repaint();
    }
  },

  initialStatus(instance) {
    const { model, rounds } = instance.state;
    return `Alarm panel model ${model}. Round 1 of ${rounds.length}. Signal has ${rounds[0].length} flashes. Watch the signal, then press the translated sequence.`;
  },

  onShow(instance, rawUi, cb) {
    startPlayback(instance, rawUi as AlarmBypassUi, cb);
  },

  onHide(rawUi) {
    stopPlayback(rawUi as AlarmBypassUi);
  },
};
