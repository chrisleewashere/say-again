/**
 * Shared material recipes for the Field Case — DESIGN_DIRECTION.md's analog
 * spycraft world: brushed aluminum shell, phenolic faceplates, brass labels.
 * Night-one uses parameterized physical materials; texture-level patina lands
 * in the polish pass.
 */
import * as THREE from 'three';

export const CASE_ALUMINUM = new THREE.MeshPhysicalMaterial({
  color: '#9aa3ab',
  metalness: 0.85,
  roughness: 0.38,
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
