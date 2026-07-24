import type { SceneTheme } from './types';

/**
 * ATOMIC AGE — retro-futurist secret laboratory instrument, 1957.
 * Cream porcelain-enamel shell with chrome trim, oxblood phenolic
 * instrument plates, anodized-teal detail screws, warm tungsten key
 * against a soft daylight-sky fill, and a nixie-orange readout glow.
 * Optimistic push-button-future energy: clean, no decay (patina off).
 *
 * Enamel is kept non-metallic with a strong clearcoat so the cream
 * shell reads as glossy porcelain rather than blowing out under the
 * key light; plates stay near-black oxblood so the fixed ink-and-amber
 * puzzle faces keep full contrast.
 */
export const atomic: SceneTheme = {
  id: 'atomic',
  label: 'Atomic Age',
  statement: 'A 1957 laboratory instrument: cream enamel and chrome, oxblood dials, and nixie-orange glow — the future as promised.',

  caseShell: { color: '#eadcba', metalness: 0.0, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.22 },
  caseWorn: { color: '#cbbd9c', metalness: 0.1, roughness: 0.4 },
  interior: { color: '#233437', metalness: 0.05, roughness: 0.92 },
  plate: { color: '#251418', metalness: 0.05, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 },
  accentMetal: { color: '#aec0d0', metalness: 0.9, roughness: 0.12, clearcoat: 0.3, clearcoatRoughness: 0.15 },
  screw: { color: '#bcc6cf', metalness: 0.84, roughness: 0.22 },
  screwAccent: { color: '#4fd0c6', metalness: 0.6, roughness: 0.28 },
  lampOff: { color: '#495257', metalness: 0.35, roughness: 0.18 },

  lampAmber: '#ffb054',
  lampGreen: '#43d492',
  lampRed: '#f2483c',

  envIntensity: 1.0,
  ambient: { color: '#50626b', intensity: 0.68 },
  key: { color: '#ffd9a2', intensity: 2.35, position: [3.5, 6, 4] },
  fill: { color: '#a7cbe8', intensity: 0.95, position: [-4, 3, -2] },

  backgroundInner: '#2e7076',
  backgroundOuter: '#0c181a',
  table: '#49706a',

  phosphorColor: '#ffa14f',
  phosphorGlow: 'rgba(255, 150, 60, 0.85)',
  etchColor: '#a88d58',

  patina: false,
};
