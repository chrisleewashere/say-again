/**
 * Shared material recipes for the Field Case — DESIGN_DIRECTION.md's analog
 * spycraft world: brushed aluminum shell, phenolic faceplates, brass labels.
 * Night-one uses parameterized physical materials; texture-level patina lands
 * in the polish pass.
 */
import * as THREE from 'three';
import { aluminumRoughnessTexture, phenolicColorTexture } from './textures';
import type { MaterialSpec, SceneTheme } from './themes/types';

export const CASE_ALUMINUM = new THREE.MeshPhysicalMaterial({
  color: '#9aa3ab',
  metalness: 0.85,
  roughness: 0.5,
  clearcoat: 0.15,
  clearcoatRoughness: 0.6,
});

/** Slightly darker, more worn aluminum for edges/corners. */
export const CASE_ALUMINUM_WORN = new THREE.MeshPhysicalMaterial({
  color: '#7e878f',
  metalness: 0.8,
  roughness: 0.55,
});

/** Dark felt-lined interior. */
export const CASE_INTERIOR = new THREE.MeshStandardMaterial({
  color: '#171a1f',
  roughness: 0.95,
  metalness: 0.05,
});

/** Phenolic (bakelite-style) module faceplate. */
export const FACEPLATE_PHENOLIC = new THREE.MeshPhysicalMaterial({
  color: '#221d19',
  metalness: 0.08,
  roughness: 0.5,
  clearcoat: 0.35,
  clearcoatRoughness: 0.4,
});

export const BRASS = new THREE.MeshPhysicalMaterial({
  color: '#b08d57',
  metalness: 1,
  roughness: 0.32,
});

export const SCREW_STEEL = new THREE.MeshStandardMaterial({
  color: '#8b9096',
  metalness: 0.95,
  roughness: 0.4,
});

/** The one non-matching replacement screw (field-used detail). */
export const SCREW_BRASS = new THREE.MeshStandardMaterial({
  color: '#a8865a',
  metalness: 0.95,
  roughness: 0.35,
});

export const LAMP_OFF = new THREE.MeshStandardMaterial({
  color: '#2a2f36',
  roughness: 0.3,
  metalness: 0.2,
});

export function lampMaterial(color: string, intensity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.25,
  });
}

export const LAMP_GREEN = lampMaterial('#4cc38a', 1.6);
export const LAMP_AMBER = lampMaterial('#ffb347', 1.4);
export const LAMP_RED = lampMaterial('#ff6b6b', 1.6);


/**
 * Field-used patina: procedural canvas maps (needs a DOM, so applied lazily
 * from the scene rather than at module load — safe for tests/SSR).
 */
let patinaApplied = false;

export function applyPatina(): void {
  if (patinaApplied || typeof document === 'undefined') return;
  patinaApplied = true;
  const brushed = aluminumRoughnessTexture();
  brushed.repeat.set(2, 2);
  CASE_ALUMINUM.roughnessMap = brushed;
  CASE_ALUMINUM.needsUpdate = true;
  CASE_ALUMINUM_WORN.roughnessMap = brushed;
  CASE_ALUMINUM_WORN.needsUpdate = true;
  FACEPLATE_PHENOLIC.map = phenolicColorTexture();
  FACEPLATE_PHENOLIC.needsUpdate = true;
}

function clearPatina(): void {
  if (!patinaApplied) return;
  patinaApplied = false;
  CASE_ALUMINUM.roughnessMap = null;
  CASE_ALUMINUM.needsUpdate = true;
  CASE_ALUMINUM_WORN.roughnessMap = null;
  CASE_ALUMINUM_WORN.needsUpdate = true;
  FACEPLATE_PHENOLIC.map = null;
  FACEPLATE_PHENOLIC.needsUpdate = true;
}

/* ------------------------------------------------------------------ */
/* Theme application: mutate the shared singletons so every mounted    */
/* mesh picks the look up without re-mounting.                         */
/* ------------------------------------------------------------------ */

function applySpec(mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, spec: MaterialSpec): void {
  mat.color.set(spec.color);
  mat.metalness = spec.metalness;
  mat.roughness = spec.roughness;
  if (mat instanceof THREE.MeshPhysicalMaterial) {
    mat.clearcoat = spec.clearcoat ?? 0;
    mat.clearcoatRoughness = spec.clearcoatRoughness ?? 0.5;
  }
  mat.needsUpdate = true;
}

function applyLamp(mat: THREE.MeshStandardMaterial, color: string): void {
  mat.color.set(color);
  mat.emissive.set(color);
  mat.needsUpdate = true;
}

export function applyTheme(theme: SceneTheme): void {
  applySpec(CASE_ALUMINUM, theme.caseShell);
  applySpec(CASE_ALUMINUM_WORN, theme.caseWorn);
  applySpec(CASE_INTERIOR, theme.interior);
  applySpec(FACEPLATE_PHENOLIC, theme.plate);
  applySpec(BRASS, theme.accentMetal);
  applySpec(SCREW_STEEL, theme.screw);
  applySpec(SCREW_BRASS, theme.screwAccent);
  applySpec(LAMP_OFF, theme.lampOff);
  applyLamp(LAMP_AMBER, theme.lampAmber);
  applyLamp(LAMP_GREEN, theme.lampGreen);
  applyLamp(LAMP_RED, theme.lampRed);
  if (theme.patina) applyPatina();
  else clearPatina();
}
