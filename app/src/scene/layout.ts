/**
 * Rack layout: where module bays sit on the opened case. ALL modules rack
 * into the BASE (bottom half) — front row first, then back row — per the
 * design direction: puzzles live in the case's bottom half; the open lid
 * is the mission status board. Pure math — unit-testable.
 */
import type { Difficulty } from '../engine/types';

export const CASE_W = 4.4; // world units, case exterior width
export const CASE_D = 3.0; // depth (base)
export const CASE_H = 0.55; // base height
export const LID_H = 0.45;
/** Lid opens past vertical so the status board faces the player at overview. */
export const LID_OPEN_ANGLE = -1.92; // radians (~110°)

/** Sized so a full 2x3 rack (plate + bezel + gaps) fits the base interior. */
export const PLATE_SIZE = 1.06;
const BASE_Y = CASE_H + 0.02;
const SLOT_X = [-1.32, 0, 1.32];
/** front row toward the player, back row toward the hinge */
const ROW_Z = [0.66, -0.66];

export interface BaySlot {
  /** transform local to its parent shell part (base = world, lid = hinged group) */
  position: [number, number, number];
  rotation: [number, number, number];
  parent: 'base' | 'lid';
}

const centered = (n: number): number[] =>
  n === 1 ? [0] : n === 2 ? [-0.72, 0.72] : SLOT_X;

/**
 * Slots for a mission of `count` modules (1..6), all lying flat in the base.
 * 1-3 modules: single centered front row. 4-6: front row of 3, then a
 * centered back row. (The 'lid' parent remains in the type for future
 * layouts; no current slot uses it.)
 */
export function baySlots(count: number): BaySlot[] {
  const clamped = Math.min(6, Math.max(1, count));
  const frontCount = Math.min(3, clamped);
  const backCount = clamped - frontCount;

  const slot = (x: number, z: number): BaySlot => ({
    position: [x, BASE_Y, z],
    rotation: [-Math.PI / 2, 0, 0],
    parent: 'base',
  });

  const slots = centered(frontCount).map((x) => slot(x, backCount > 0 ? ROW_Z[0] : 0.35));
  for (const x of centered(backCount)) {
    slots.push(slot(x, ROW_Z[1]));
  }
  return slots;
}

/** Camera pose for zooming to a plate, from its resolved WORLD transform. */
export function zoomPoseFromWorld(
  plateWorldPos: [number, number, number],
  plateWorldNormal: [number, number, number],
): { position: [number, number, number]; target: [number, number, number] } {
  // fits the full plate (PLATE_SIZE + bezel) inside a 42° fov with margin
  // for the chrome strips — the face reads whole, title to status line
  const dist = 1.78;
  return {
    position: [
      plateWorldPos[0] + plateWorldNormal[0] * dist,
      plateWorldPos[1] + plateWorldNormal[1] * dist,
      plateWorldPos[2] + plateWorldNormal[2] * dist,
    ],
    target: plateWorldPos,
  };
}

/** Steeper overview so both base rows AND the lid status board read. */
export const OVERVIEW_CAMERA: { position: [number, number, number]; target: [number, number, number] } = {
  position: [0, 4.5, 5.6],
  target: [0, 1.05, -0.35],
};

/** Rough time weighting so bigger missions read on the phosphor readout. */
export function difficultyGlyph(d: Difficulty): string {
  return d === 1 ? 'I' : d === 2 ? 'II' : 'III';
}
