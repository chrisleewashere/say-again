/**
 * Surveillance-still artwork, drawn from the same semantic fields the rule
 * tables use (operative accessory, setting glyph, slot marker) so what the
 * Agent describes is exactly what the manual's rules talk about. SVG here;
 * the 3D face draws the same features with canvas primitives.
 */
import { MARKER_BY_SLOT, OPERATIVES, SETTINGS } from './rules';
import type { TapeScene } from './logic';

const INK = 'var(--dt-ink, #d8d2c4)';
const DIM = 'var(--dt-dim, #8a7a5c)';

function AccessoryArt({ accessory }: { accessory: string }) {
  switch (accessory) {
    case 'satchel':
      return (
        <g>
          <line x1="50" y1="92" x2="74" y2="112" stroke={INK} strokeWidth="3" />
          <rect x="68" y="108" width="18" height="13" rx="2" fill="none" stroke={INK} strokeWidth="3" />
        </g>
      );
    case 'umbrella':
      return (
        <g>
          <path d="M78 86 a14 14 0 0 1 28 0 z" fill="none" stroke={INK} strokeWidth="3" />
          <line x1="92" y1="86" x2="92" y2="118" stroke={INK} strokeWidth="3" />
        </g>
      );
    case 'camera':
      return (
        <g>
          <path d="M50 92 q10 10 20 12" fill="none" stroke={INK} strokeWidth="2.5" />
          <rect x="52" y="100" width="16" height="11" rx="2" fill="none" stroke={INK} strokeWidth="3" />
          <circle cx="60" cy="105.5" r="3" fill="none" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'flatcap':
      return <path d="M46 66 a14 9 0 0 1 28 0 l4 3 h-36 z" fill={INK} />;
    case 'scarf':
      return (
        <g>
          <line x1="52" y1="90" x2="68" y2="90" stroke={INK} strokeWidth="6" />
          <line x1="64" y1="90" x2="66" y2="112" stroke={INK} strokeWidth="5" />
        </g>
      );
    default:
      return null;
  }
}

function SettingArt({ glyph }: { glyph: string }) {
  switch (glyph) {
    case 'clock':
      return (
        <g>
          <circle cx="30" cy="34" r="14" fill="none" stroke={DIM} strokeWidth="2.5" />
          <line x1="30" y1="34" x2="30" y2="25" stroke={DIM} strokeWidth="2.5" />
          <line x1="30" y1="34" x2="37" y2="37" stroke={DIM} strokeWidth="2.5" />
        </g>
      );
    case 'arch':
      return <path d="M16 52 v-16 a14 14 0 0 1 28 0 v16" fill="none" stroke={DIM} strokeWidth="2.5" />;
    case 'crane':
      return (
        <g>
          <line x1="20" y1="52" x2="20" y2="20" stroke={DIM} strokeWidth="2.5" />
          <line x1="20" y1="22" x2="48" y2="22" stroke={DIM} strokeWidth="2.5" />
          <line x1="42" y1="22" x2="42" y2="34" stroke={DIM} strokeWidth="2" />
          <path d="M39 34 h6 v5 h-6 z" fill="none" stroke={DIM} strokeWidth="2" />
        </g>
      );
    case 'lamp':
      return (
        <g>
          <line x1="26" y1="52" x2="26" y2="20" stroke={DIM} strokeWidth="2.5" />
          <path d="M26 20 q10 0 12 8" fill="none" stroke={DIM} strokeWidth="2.5" />
          <circle cx="39" cy="30" r="3.5" fill={DIM} />
        </g>
      );
    case 'stairs':
      return <path d="M14 52 h8 v-8 h8 v-8 h8 v-8 h8" fill="none" stroke={DIM} strokeWidth="2.5" />;
    case 'antenna':
      return (
        <g fill="none" stroke={DIM} strokeWidth="2.5">
          <line x1="30" y1="52" x2="30" y2="22" />
          <path d="M20 30 a14 14 0 0 1 20 0" />
          <path d="M23 24 a20 20 0 0 1 14 0" />
        </g>
      );
    default:
      return null;
  }
}

function MarkerArt({ scene }: { scene: TapeScene }) {
  const marker = MARKER_BY_SLOT[scene.slot].marker;
  switch (marker) {
    case 'alert':
      return <polygon points="100,12 92,28 99,28 94,42 108,24 100,24 106,12" fill={INK} />;
    case 'thought':
      return (
        <g fill="none" stroke={INK} strokeWidth="2.5">
          <ellipse cx="100" cy="20" rx="12" ry="9" />
          <circle cx="90" cy="32" r="2.5" fill={INK} stroke="none" />
          <circle cx="86" cy="38" r="1.5" fill={INK} stroke="none" />
        </g>
      );
    case 'motion':
      return (
        <g fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M90 14 l10 9 l-10 9" />
          <path d="M100 14 l10 9 l-10 9" />
        </g>
      );
    case 'break':
      return <path d="M96 10 l6 8 l-7 4 l9 7 l-5 9" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
    case 'seal':
      return (
        <g>
          <circle cx="100" cy="24" r="13" fill="none" stroke={INK} strokeWidth="3" />
          {scene.outcomeGood ? (
            <path d="M93 24 l5 5 l9 -10" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <line x1="93" y1="24" x2="107" y2="24" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          )}
        </g>
      );
    default:
      return null;
  }
}

export function SceneArt({ scene }: { scene: TapeScene }) {
  const op = OPERATIVES.find((o) => o.id === scene.operativeId)!;
  const setting = SETTINGS.find((s) => s.id === scene.settingId)!;
  return (
    <svg viewBox="0 0 120 150" className="dt-scene-svg" aria-hidden="true">
      {/* film-frame border with sprocket notches */}
      <rect x="2" y="2" width="116" height="146" rx="6" fill="none" stroke={DIM} strokeWidth="2" />
      {[20, 50, 80, 110, 140].map((y) => (
        <rect key={y} x="4.5" y={y - 3} width="4" height="6" rx="1" fill={DIM} />
      ))}
      {/* reference letter stamp (a name, never an order cue) */}
      <rect x="12" y="8" width="22" height="22" rx="3" fill="none" stroke={INK} strokeWidth="2.5" />
      <text x="23" y="24" textAnchor="middle" fontSize="15" fontWeight="700" fill={INK} fontFamily="inherit">
        {scene.letter}
      </text>
      <SettingArt glyph={setting.glyph} />
      {/* operative */}
      <circle cx="60" cy="74" r="11" fill="none" stroke={INK} strokeWidth="3" />
      <path d="M46 128 v-24 a14 12 0 0 1 28 0 v24 z" fill="none" stroke={INK} strokeWidth="3" />
      <AccessoryArt accessory={op.accessory} />
      <MarkerArt scene={scene} />
    </svg>
  );
}
