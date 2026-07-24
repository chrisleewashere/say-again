import type { SceneTheme } from './types';

/**
 * TRADECRAFT — the founding look, production pass: 1960s-70s analog
 * spycraft. Brushed aluminum field case, phenolic plates, brass fittings,
 * a hot tungsten desk-lamp key against a cool night fill, amber phosphor
 * readouts, field-used patina, dark walnut desk.
 *
 * Metalness is deliberately kept below ~0.8: on low-tier devices the env
 * map is disabled and fully-metallic surfaces would collapse to black
 * under directional light alone.
 */
export const tradecraft: SceneTheme = {
  id: 'tradecraft',
  label: 'Tradecraft',
  statement: 'Analog spycraft, 1968: brushed aluminum and brass under a hot desk lamp, cool night air beyond.',

  caseShell: { color: '#c3cbd3', metalness: 0.78, roughness: 0.4, clearcoat: 0.2, clearcoatRoughness: 0.5 },
  caseWorn: { color: '#99a2ab', metalness: 0.7, roughness: 0.48 },
  interior: { color: '#20242b', metalness: 0.05, roughness: 0.95 },
  plate: { color: '#241e18', metalness: 0.08, roughness: 0.46, clearcoat: 0.4, clearcoatRoughness: 0.35 },
  accentMetal: { color: '#cca267', metalness: 0.85, roughness: 0.3 },
  screw: { color: '#a3a9b0', metalness: 0.8, roughness: 0.38 },
  screwAccent: { color: '#bf9a66', metalness: 0.8, roughness: 0.32 },
  lampOff: { color: '#31363e', metalness: 0.2, roughness: 0.3 },

  lampAmber: '#ffb347',
  lampGreen: '#4cc38a',
  lampRed: '#f4544e',

  envIntensity: 0.85,
  ambient: { color: '#435264', intensity: 0.55 },
  key: { color: '#ffd096', intensity: 2.2, position: [3.5, 6, 4] },
  fill: { color: '#6d8fc7', intensity: 0.75, position: [-4, 3, -2] },

  backgroundInner: '#26313f',
  backgroundOuter: '#090c11',
  table: '#2b1f13',

  phosphorColor: '#84e6ac',
  phosphorGlow: 'rgba(132, 230, 172, 0.8)',
  etchColor: '#8a7048',

  patina: true,
};
