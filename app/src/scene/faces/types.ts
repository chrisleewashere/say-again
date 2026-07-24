import type { PuzzleInstance } from '../../engine/types';

/**
 * In-case puzzle faces: each module draws its playable surface onto a canvas
 * that is textured onto the 3D plate, and declares tap regions in UV space.
 * Input arrives via the scene's raycaster (mesh intersection UV) — the same
 * input path as tap-to-zoom, which is reliable on iOS where CSS-3D-projected
 * DOM is not.
 *
 * Faces re-implement only the module's VIEW; all game rules stay in the
 * module's logic.ts (generate/solve/validate), so correctness is shared with
 * the classic 2D components and the printed manual.
 */

/** Rect in face UV space: origin top-left, 0..1 on both axes. */
export interface FaceRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** short description for the shell's live region (screen-reader breadcrumb) */
  label: string;
  disabled?: boolean;
}

/** Per-face mutable view state (selection, typed digits, cuts made, ...). */
export type FaceUi = Record<string, unknown>;

export interface FaceCallbacks {
  onSolved: () => void;
  onStrike: () => void;
  /** update the shell's polite live region / status line */
  setStatus: (text: string) => void;
  /** ask the scene to repaint this face */
  repaint: () => void;
  /** play a UI sound cue name from the sfx registry */
  sfx: (cue: 'buttonPress' | 'dialDetent' | 'wireSnip') => void;
}

export interface ModuleFace<S = unknown> {
  /** canvas pixel size (square). 1024 suits plate-filling zoom on retina. */
  canvasSize: number;
  initUi(instance: PuzzleInstance<S>): FaceUi;
  /** full repaint of the face for the given instance + view state */
  draw(ctx: CanvasRenderingContext2D, size: number, instance: PuzzleInstance<S>, ui: FaceUi): void;
  /** current tap regions (recomputed after every tap) */
  regions(instance: PuzzleInstance<S>, ui: FaceUi): FaceRegion[];
  /** a region was tapped */
  onTap(regionId: string, instance: PuzzleInstance<S>, ui: FaceUi, cb: FaceCallbacks): void;
  /** initial status line when the face becomes active */
  initialStatus(instance: PuzzleInstance<S>): string;
  /** optional: face became the active zoomed surface (start playback etc.) */
  onShow?(instance: PuzzleInstance<S>, ui: FaceUi, cb: FaceCallbacks): void;
  /** optional: face left the active surface — clear any timers started in onShow */
  onHide?(ui: FaceUi): void;
}

/* ------------------------------------------------------------------ */
/* Shared canvas drawing helpers — keep the faces visually consistent  */
/* with the analog-hardware brief (engraved tags, phenolic ground).    */
/* ------------------------------------------------------------------ */

export const FACE_BG = '#16130f';
export const FACE_PANEL = '#1b1712';
export const FACE_LINE = '#3a332b';
export const FACE_TEXT = '#e8e0d2';
export const FACE_TEXT_DIM = '#8a7a5c';
export const FACE_AMBER = '#ffb347';
export const FACE_GREEN = '#4cc38a';
export const FACE_RED = '#ff6b6b';
export const MONO = '600 28px "SF Mono", "Cascadia Code", ui-monospace, Menlo, monospace';

const wearCache = new Map<number, HTMLCanvasElement>();

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic wear layer, cached per size: phenolic mottle, faint
    scratches, and an edge vignette — field-used hardware, not a flat fill. */
function wearLayer(size: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const hit = wearCache.get(size);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = mulberry(0x5a19);
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 1 + rnd() * 3;
    g.fillStyle = rnd() < 0.5 ? 'rgba(255, 235, 200, 0.016)' : 'rgba(0, 0, 0, 0.05)';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(255, 240, 210, 0.028)';
  g.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const len = 40 + rnd() * 200;
    const a = rnd() * Math.PI;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  const v = g.createRadialGradient(size / 2, size / 2, size * 0.32, size / 2, size / 2, size * 0.74);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
  g.fillStyle = v;
  g.fillRect(0, 0, size, size);
  wearCache.set(size, c);
  return c;
}

function rivet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 11);
  g.addColorStop(0, '#b9ac91');
  g.addColorStop(0.55, '#6d6350');
  g.addColorStop(1, '#2c261d');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((x * 7 + y * 13) % 90) * (Math.PI / 180));
  ctx.strokeStyle = 'rgba(15, 12, 8, 0.8)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();
  ctx.restore();
}

export function clearFace(ctx: CanvasRenderingContext2D, size: number): void {
  // warm phenolic ground with a soft top light
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#1c1813');
  base.addColorStop(0.5, FACE_BG);
  base.addColorStop(1, '#120f0b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const wear = wearLayer(size);
  if (wear) ctx.drawImage(wear, 0, 0);
  // machined edge chamfer
  ctx.strokeStyle = 'rgba(255, 240, 210, 0.07)';
  ctx.lineWidth = 2;
  ctx.strokeRect(7, 7, size - 14, size - 14);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.strokeRect(10, 10, size - 20, size - 20);
  // corner rivets — the plate is bolted into the case
  rivet(ctx, 30, 30);
  rivet(ctx, size - 30, 30);
  rivet(ctx, 30, size - 30);
  rivet(ctx, size - 30, size - 30);
}

export function drawTag(ctx: CanvasRenderingContext2D, size: number, text: string): void {
  ctx.font = '600 30px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // manual letterspacing (canvas has no letter-spacing)
  const spaced = text.split('').join('\u200a\u200a');
  // engraved into the plate: dark cut with a light catch below
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillText(spaced, size / 2, 25);
  ctx.fillStyle = 'rgba(255, 240, 210, 0.16)';
  ctx.fillText(spaced, size / 2, 28);
  ctx.fillStyle = FACE_TEXT_DIM;
  ctx.fillText(spaced, size / 2, 26);
  // engraved underline rule
  const w = ctx.measureText(spaced).width;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2 - w / 2 - 14, 66);
  ctx.lineTo(size / 2 + w / 2 + 14, 66);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 240, 210, 0.1)';
  ctx.beginPath();
  ctx.moveTo(size / 2 - w / 2 - 14, 68);
  ctx.lineTo(size / 2 + w / 2 + 14, 68);
  ctx.stroke();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number },
  opts: { label: string; active?: boolean; disabled?: boolean; font?: string } ,
): void {
  // drop shadow: the key light lands from the upper left
  roundRect(ctx, r.x + 3, r.y + 5, r.w, r.h, 14);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();
  // machined keycap: vertical bevel gradient
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  if (opts.active) {
    g.addColorStop(0, '#4a3c22');
    g.addColorStop(0.12, '#3a2f1c');
    g.addColorStop(0.9, '#2c2415');
    g.addColorStop(1, '#1c170d');
  } else {
    g.addColorStop(0, '#2e2820');
    g.addColorStop(0.12, '#231e17');
    g.addColorStop(0.9, '#191510');
    g.addColorStop(1, '#0e0b08');
  }
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = g;
  ctx.fill();
  // top-edge light catch
  ctx.save();
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 240, 210, 0.22)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(r.x + 10, r.y + 2);
  ctx.lineTo(r.x + r.w - 10, r.y + 2);
  ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = opts.active ? FACE_AMBER : FACE_LINE;
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.stroke();
  ctx.font = opts.font ?? MONO;
  ctx.fillStyle = opts.disabled ? FACE_TEXT_DIM : FACE_TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.label, r.x + r.w / 2, r.y + r.h / 2 + 2);
}

export function drawStatus(ctx: CanvasRenderingContext2D, size: number, text: string, tone: 'dim' | 'good' | 'bad' = 'dim'): void {
  // recessed phosphor strip: the plate's readout window
  const stripW = size * 0.66;
  const x0 = (size - stripW) / 2;
  roundRect(ctx, x0, size - 60, stripW, 46, 8);
  ctx.fillStyle = '#0b0d0a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 240, 210, 0.08)';
  ctx.strokeRect(x0 - 3, size - 63, stripW + 6, 52);
  const color = tone === 'good' ? FACE_GREEN : tone === 'bad' ? FACE_RED : '#9fdcb4';
  ctx.font = '500 25px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  // clip long status lines to the strip window
  const maxW = stripW - 28;
  let shown = text;
  while (shown.length > 4 && ctx.measureText(shown).width > maxW) {
    shown = shown.slice(0, -4) + '\u2026';
  }
  ctx.fillText(shown, size / 2, size - 37);
  ctx.restore();
}

/** UV-space helper: convert a pixel rect on the canvas to a FaceRegion. */
export function px(
  id: string,
  label: string,
  size: number,
  x: number,
  y: number,
  w: number,
  h: number,
  disabled = false,
): FaceRegion {
  return { id, label, x: x / size, y: y / size, w: w / size, h: h / size, disabled };
}
