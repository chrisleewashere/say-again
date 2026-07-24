import type { SceneTheme } from './types';

/**
 * BLACKLINE — modern tactical field kit. Matte near-black polymer shell,
 * machined gunmetal hardware, one hazard-orange signal line, cold neutral
 * key light, teal OLED phosphor. Factory-fresh: no patina, zero nostalgia.
 */
export const blackline: SceneTheme = {
  id: 'blackline',
  label: 'Blackline',
  statement: 'Modern covert field kit: matte polymer and gunmetal, one hazard-orange signal line, cold light, teal OLED glow.',

  caseShell: { color: '#434a53', metalness: 0.25, roughness: 0.72, clearcoat: 0.1, clearcoatRoughness: 0.75 },
  caseWorn: { color: '#363d45', metalness: 0.3, roughness: 0.65 },
  interior: { color: '#292e36', metalness: 0.05, roughness: 0.92 },
  plate: { color: '#181c21', metalness: 0.25, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  accentMetal: { color: '#e06222', metalness: 0.65, roughness: 0.48 },
  screw: { color: '#6b737d', metalness: 0.95, roughness: 0.32 },
  screwAccent: { color: '#e8712e', metalness: 0.9, roughness: 0.35 },
  lampOff: { color: '#2c323a', metalness: 0.35, roughness: 0.28 },

  lampAmber: '#ffae33',
  lampGreen: '#3fd9a0',
  lampRed: '#ff5a52',

  envIntensity: 1.05,
  ambient: { color: '#4d5764', intensity: 0.55 },
  key: { color: '#eef4fb', intensity: 2.0, position: [3.5, 6, 4] },
  fill: { color: '#6484ad', intensity: 0.55, position: [-4, 3, -2] },

  backgroundInner: '#242a32',
  backgroundOuter: '#0b0d10',
  table: '#15181c',

  phosphorColor: '#4de8cf',
  phosphorGlow: 'rgba(77, 232, 207, 0.7)',
  etchColor: '#241b12',

  patina: false,
};
