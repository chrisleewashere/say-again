import type { SceneTheme } from './types';

/**
 * TRADECRAFT — the founding look, production pass: 1960s-70s analog
 * spycraft. Brushed aluminum field case, phenolic plates, brass fittings,
 * ONE hot tungsten desk lamp doing all the work against the night — per
 * Chris: the case looks best in the dark. envIntensity stays 0: the
 * RoomEnvironment bake is hot enough that even 0.05 silvers the metals
 * and kills the lamp-lit mood (verified by screenshot A/B).
 *
 * Metalness is deliberately kept below ~0.8 so metals read under
 * directional light alone (no env on any tier for this theme).
 */
export const tradecraft: SceneTheme = {
  id: 'tradecraft',
  label: 'Tradecraft',
  statement: 'Analog spycraft, 1968: one hot desk lamp over the case, the rest of the room stays night.',

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

  envIntensity: 0,
  ambient: { color: '#39445a', intensity: 0.26 },
  key: { color: '#ffd096', intensity: 2.4, position: [3.5, 6, 4] },
  fill: { color: '#6d8fc7', intensity: 0.45, position: [-4, 3, -2] },

  backgroundInner: '#141b26',
  backgroundOuter: '#06080c',
  table: '#2b1f13',

  phosphorColor: '#84e6ac',
  phosphorGlow: 'rgba(132, 230, 172, 0.8)',
  etchColor: '#8a7048',

  patina: true,
};
