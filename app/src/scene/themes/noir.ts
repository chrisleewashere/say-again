import type { SceneTheme } from './types';

/**
 * SIGNAL NOIR — cinematic one-lamp noir. The room is gone; a single hot
 * tungsten practical rakes across a gunmetal case and falls off to black.
 * Materials stay desaturated graphite and nickel so the only color in
 * frame is the status lamps burning like jewels, and a pale CRT phosphor.
 *
 * The drama lives in the lighting rig: strong warm key, a whisper of cold
 * fill, minimal environment. Plates stay dark-but-lifted so the ink-and-
 * amber puzzle faces still pop under software GL.
 */
export const noir: SceneTheme = {
  id: 'noir',
  label: 'Signal Noir',
  statement: 'One hot lamp in a black room: gunmetal and graphite in hard light, the status jewels the only color left alive.',

  caseShell: { color: '#8d959e', metalness: 0.72, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.35 },
  caseWorn: { color: '#6a717a', metalness: 0.68, roughness: 0.44 },
  interior: { color: '#262b33', metalness: 0.04, roughness: 0.94 },
  plate: { color: '#2b2a2e', metalness: 0.1, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 },
  accentMetal: { color: '#b4bac1', metalness: 0.85, roughness: 0.26 },
  screw: { color: '#959ba2', metalness: 0.8, roughness: 0.36 },
  screwAccent: { color: '#a6adb4', metalness: 0.8, roughness: 0.3 },
  lampOff: { color: '#434b57', metalness: 0.3, roughness: 0.26 },

  lampAmber: '#ffbe4a',
  lampGreen: '#3ed489',
  lampRed: '#f0413a',

  envIntensity: 0.7,
  ambient: { color: '#48566b', intensity: 0.55 },
  key: { color: '#ffdcae', intensity: 3.2, position: [4.2, 5.5, 3.4] },
  fill: { color: '#8fb3e0', intensity: 0.65, position: [-4.5, 3, -2] },

  backgroundInner: '#141a22',
  backgroundOuter: '#04060a',
  table: '#15171b',

  phosphorColor: '#cdeeda',
  phosphorGlow: 'rgba(205, 238, 218, 0.7)',
  etchColor: '#272c33',

  patina: true,
};
