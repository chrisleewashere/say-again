import type { SceneTheme } from './types';

/** Atomic Age — competition slot (placeholder values until its agent lands). */
export const atomic: SceneTheme = {
  id: 'atomic',
  label: 'Atomic Age',
  statement: 'Placeholder — agent will replace with the retro-futurist lab look.',

  caseShell: { color: '#9aa3ab', metalness: 0.85, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.6 },
  caseWorn: { color: '#7e878f', metalness: 0.8, roughness: 0.55 },
  interior: { color: '#171a1f', metalness: 0.05, roughness: 0.95 },
  plate: { color: '#221d19', metalness: 0.08, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 },
  accentMetal: { color: '#b08d57', metalness: 1, roughness: 0.32 },
  screw: { color: '#8b9096', metalness: 0.95, roughness: 0.4 },
  screwAccent: { color: '#a8865a', metalness: 0.95, roughness: 0.35 },
  lampOff: { color: '#2a2f36', metalness: 0.2, roughness: 0.3 },

  lampAmber: '#ffb347',
  lampGreen: '#4cc38a',
  lampRed: '#ff6b6b',

  envIntensity: 0.55,
  ambient: { color: '#3a4250', intensity: 0.25 },
  key: { color: '#ffd9a0', intensity: 1.15, position: [3.5, 6, 4] },
  fill: { color: '#7f9ac2', intensity: 0.3, position: [-4, 3, -2] },

  backgroundInner: '#151b23',
  backgroundOuter: '#0a0d11',
  table: '#101418',

  phosphorColor: '#7ee2a8',
  phosphorGlow: 'rgba(126, 226, 168, 0.75)',
  etchColor: '#6e5836',

  patina: true,
};
