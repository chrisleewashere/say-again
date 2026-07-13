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

export function clearFace(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = FACE_BG;
  ctx.fillRect(0, 0, size, size);
}

export function drawTag(ctx: CanvasRenderingContext2D, size: number, text: string): void {
  ctx.font = '600 30px ui-monospace, Menlo, monospace';
  ctx.fillStyle = FACE_TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // manual letterspacing (canvas has no letter-spacing)
  const spaced = text.split('').join('  ');
  ctx.fillText(spaced, size / 2, 26);
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
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = opts.active ? '#3a2f1c' : FACE_PANEL;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = opts.active ? FACE_AMBER : FACE_LINE;
  ctx.stroke();
  ctx.font = opts.font ?? MONO;
  ctx.fillStyle = opts.disabled ? FACE_TEXT_DIM : FACE_TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.label, r.x + r.w / 2, r.y + r.h / 2 + 2);
}

export function drawStatus(ctx: CanvasRenderingContext2D, size: number, text: string, tone: 'dim' | 'good' | 'bad' = 'dim'): void {
  ctx.font = '500 26px ui-monospace, Menlo, monospace';
  ctx.fillStyle = tone === 'good' ? FACE_GREEN : tone === 'bad' ? FACE_RED : FACE_TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, size / 2, size - 22);
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
