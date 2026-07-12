/**
 * Rack layout: where module bays sit on the opened case. Base holds the
 * first three modules (lying flat, facing up); the open lid holds the next
 * three (tilted toward the player). Pure math — unit-testable.
 */
import type { Difficulty } from '../engine/types';

export const CASE_W = 4.4; // world units, case exterior width
export const CASE_D = 3.0; // depth (base)
export const CASE_H = 0.55; // base height
export const LID_H = 0.45;
/** Lid opens past vertical so lid plates face the player at overview. */
export const LID_OPEN_ANGLE = -1.92; // radians (~110°)

export const PLATE_SIZE = 1.18; // square faceplate side
const BASE_Y = CASE_H + 0.02;
const SLOT_X = [-1.42, 0, 1.42];

export interface BaySlot {
  /** transform local to its parent shell part (base = world, lid = hinged group) */
  position: [number, number, number];
  rotation: [number, number, number];
  parent: 'base' | 'lid';
}

const centered = (n: number): number[] =>
  n === 1 ? [0] : n === 2 ? [-0.78, 0.78] : SLOT_X;

/**
 * Slots for a mission of `count` modules (1..6). Fills the base first, then
 * the open lid. Lid slots are LOCAL to the hinged lid group so they inherit
 * the hinge rotation and are correct at every lid angle by construction.
 */
export function baySlots(count: number): BaySlot[] {
  const clamped = Math.min(6, Math.max(1, count));
  const baseCount = Math.min(3, clamped);
  const lidCount = clamped - baseCount;

  const slots: BaySlot[] = centered(baseCount).map((x) => ({
    position: [x, BASE_Y, 0.35] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    parent: 'base' as const,
  }));

  // Lid-local: the lid box is centered at (0, LID_H/2, CASE_D/2) inside the
  // hinged group; its interior surface faces -Y (down, toward the base when
  // closed). Plates sit slightly proud of that surface.
  for (const x of centered(lidCount)) {
    slots.push({
      position: [x, -0.05, 0.9],
      rotation: [Math.PI / 2, 0, 0],
      parent: 'lid',
    });
  }
  return slots;
}

/** Camera pose for zooming to a plate, from its resolved WORLD transform. */
export function zoomPoseFromWorld(
  plateWorldPos: [number, number, number],
  plateWorldNormal: [number, number, number],
): { position: [number, number, number]; target: [number, number, number] } {
  const dist = 1.62;
  return {
    position: [
      plateWorldPos[0] + plateWorldNormal[0] * dist,
      plateWorldPos[1] + plateWorldNormal[1] * dist,
      plateWorldPos[2] + plateWorldNormal[2] * dist,
    ],
    target: plateWorldPos,
  };
}

export const OVERVIEW_CAMERA: { position: [number, number, number]; target: [number, number, number] } = {
  position: [0, 3.4, 5.0],
  target: [0, 0.9, -0.2],
};

/** Rough time weighting so bigger missions read on the phosphor readout. */
export function difficultyGlyph(d: Difficulty): string {
  return d === 1 ? 'I' : d === 2 ? 'II' : 'III';
}
