/**
 * Scene themes: a complete visual identity for the Field Case as DATA —
 * material parameters, lighting rig, backdrop, and hardware accent colors.
 * The scene consumes whichever theme is active; competing looks are theme
 * files, never forks of the scene code. Selection persists in localStorage
 * under 'ky-scene-theme'.
 */

export interface MaterialSpec {
  color: string;
  metalness: number;
  roughness: number;
  /** optional clearcoat layer (0 disables) */
  clearcoat?: number;
  clearcoatRoughness?: number;
}

export interface LightSpec {
  color: string;
  intensity: number;
}

export interface SceneTheme {
  id: string;
  label: string;
  /** one-line design statement shown wherever themes are compared */
  statement: string;

  /* case hardware materials */
  caseShell: MaterialSpec;
  caseWorn: MaterialSpec;
  interior: MaterialSpec;
  plate: MaterialSpec;
  accentMetal: MaterialSpec;
  screw: MaterialSpec;
  screwAccent: MaterialSpec;
  lampOff: MaterialSpec;

  /* status lamp colors (emissive) */
  lampAmber: string;
  lampGreen: string;
  lampRed: string;

  /* lighting rig */
  envIntensity: number;
  ambient: LightSpec;
  key: LightSpec & { position: [number, number, number] };
  fill: LightSpec & { position: [number, number, number] };

  /* backdrop + table */
  backgroundInner: string;
  backgroundOuter: string;
  table: string;

  /* readouts (CSS-driven decorative Html) */
  phosphorColor: string;
  phosphorGlow: string;
  etchColor: string;

  /** apply the procedural wear/patina texture maps */
  patina: boolean;
}
