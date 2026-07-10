import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import { solveIdCheck, type IdCheckAnswer, type IdCheckState } from './logic';
import { suspectDescription } from './prose';
import type { Suspect } from './rules';
import './idCheck.css';

/**
 * Portrait art. Every attribute is a distinct SHAPE (never color alone):
 * hats have different silhouettes, glasses different frame shapes, hair
 * different outlines, accessories different objects, shirts different
 * printed patterns. Colors are decorative.
 */
const INK = '#1c2733';
const SKIN = '#e9c49a';
const SKIN_EDGE = '#8a6b4a';
const HAIR_FILL = '#4a3626';
const SHIRT_FILL = '#5b6b7c';

function HairArt({ hair }: { hair: Suspect['hair'] }) {
  switch (hair) {
    case 'short':
      return <path d="M31 56 A29 29 0 0 1 89 56" fill="none" stroke={HAIR_FILL} strokeWidth={14} strokeLinecap="round" />;
    case 'long':
      return (
        <g>
          <path d="M31 56 A29 29 0 0 1 89 56" fill="none" stroke={HAIR_FILL} strokeWidth={14} strokeLinecap="round" />
          <rect x={23} y={52} width={14} height={52} rx={7} fill={HAIR_FILL} />
          <rect x={83} y={52} width={14} height={52} rx={7} fill={HAIR_FILL} />
        </g>
      );
    case 'curly':
      return (
        <g fill={HAIR_FILL}>
          <circle cx={34} cy={46} r={9} />
          <circle cx={46} cy={37} r={9} />
          <circle cx={60} cy={33} r={9} />
          <circle cx={74} cy={37} r={9} />
          <circle cx={86} cy={46} r={9} />
        </g>
      );
  }
}

function GlassesArt({ glasses }: { glasses: Suspect['glasses'] }) {
  switch (glasses) {
    case 'none':
      return null;
    case 'round':
      return (
        <g stroke={INK} strokeWidth={3} fill="none">
          <circle cx={48} cy={60} r={9} />
          <circle cx={72} cy={60} r={9} />
          <line x1={57} y1={60} x2={63} y2={60} />
        </g>
      );
    case 'square':
      return (
        <g stroke={INK} strokeWidth={3} fill="none">
          <rect x={39} y={51} width={18} height={17} rx={2} />
          <rect x={63} y={51} width={18} height={17} rx={2} />
          <line x1={57} y1={58} x2={63} y2={58} />
        </g>
      );
  }
}

function HeadwearArt({ headwear }: { headwear: Suspect['headwear'] }) {
  switch (headwear) {
    case 'none':
      return null;
    case 'beanie':
      return (
        <g>
          <path d="M32 50 A28 24 0 0 1 88 50 Z" fill="#37536e" />
          <rect x={30} y={46} width={60} height={10} rx={5} fill="#24384d" />
          <circle cx={60} cy={26} r={6} fill="#24384d" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M34 50 A26 22 0 0 1 86 50 Z" fill="#6e3745" />
          <rect x={56} y={46} width={46} height={9} rx={4.5} fill="#52242f" />
        </g>
      );
  }
}

function AccessoryArt({ accessory }: { accessory: Suspect['accessory'] }) {
  switch (accessory) {
    case 'none':
      return null;
    case 'scarf':
      return (
        <g fill="#c2703f">
          <rect x={40} y={88} width={40} height={11} rx={5.5} />
          <rect x={52} y={94} width={13} height={28} rx={6} />
        </g>
      );
    case 'badge':
      return (
        <polygon
          points="78,103 80.4,108.8 86.6,109.2 81.8,113.2 83.3,119.3 78,116 72.7,119.3 74.2,113.2 69.4,109.2 75.6,108.8"
          fill="#d9b23c"
          stroke="#7c621a"
          strokeWidth={1.5}
        />
      );
    case 'bowtie':
      return (
        <g fill="#7c4a8f">
          <path d="M58 96 L40 88 L40 104 Z" />
          <path d="M62 96 L80 88 L80 104 Z" />
          <circle cx={60} cy={96} r={4.5} />
        </g>
      );
  }
}

function ShirtPatternArt({ shirt, clipId }: { shirt: Suspect['shirt']; clipId: string }) {
  if (shirt === 'plain') return null;
  return (
    <g clipPath={`url(#${clipId})`}>
      {shirt === 'striped'
        ? Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1={26 + i * 10} y1={92} x2={26 + i * 10} y2={150} stroke={INK} strokeWidth={4} />
          ))
        : Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={30 + col * 15 + (row % 2 === 0 ? 0 : 7)}
                cy={108 + row * 14}
                r={3.5}
                fill={INK}
              />
            )),
          )}
    </g>
  );
}

function Portrait({ suspect, clipId }: { suspect: Suspect; clipId: string }) {
  return (
    <svg className="idcheck-portrait" viewBox="0 0 120 150" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M20 150 L24 116 Q28 100 46 96 L60 92 L74 96 Q92 100 96 116 L100 150 Z" />
        </clipPath>
      </defs>
      {/* torso + shirt pattern */}
      <path
        d="M20 150 L24 116 Q28 100 46 96 L60 92 L74 96 Q92 100 96 116 L100 150 Z"
        fill={SHIRT_FILL}
        stroke={INK}
        strokeWidth={2}
      />
      <ShirtPatternArt shirt={suspect.shirt} clipId={clipId} />
      {/* neck + head */}
      <rect x={52} y={80} width={16} height={16} fill={SKIN} />
      <circle cx={60} cy={62} r={30} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={2} />
      <HairArt hair={suspect.hair} />
      {/* face */}
      <circle cx={48} cy={60} r={3} fill={INK} />
      <circle cx={72} cy={60} r={3} fill={INK} />
      <path d="M48 74 Q60 84 72 74" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <GlassesArt glasses={suspect.glasses} />
      <HeadwearArt headwear={suspect.headwear} />
      <AccessoryArt accessory={suspect.accessory} />
    </svg>
  );
}

export function IdCheck({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<IdCheckState, IdCheckAnswer>) {
  const { suspects } = instance.state;
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const contact = solveIdCheck(instance.state);

  function handleSelect(index: number) {
    if (done || disabled) return;
    setSelected((prev) => (prev === index ? null : index));
  }

  function handleConfirm() {
    if (done || disabled || selected === null) return;
    const correct = selected === contact;
    onAttempt?.(correct, selected);
    if (!correct) {
      onStrike();
      setSelected(null); // lineup unchanged — soft failure, describe and retry
      return;
    }
    setDone(true);
    onSolved();
  }

  const statusText = done
    ? `Contact confirmed: suspect ${contact + 1}. Rendezvous secured.`
    : selected !== null
      ? `Suspect ${selected + 1} selected. Press Confirm Contact to commit.`
      : 'No suspect selected. Describe the lineup to your Handler.';

  return (
    <div className="idcheck card" data-testid="module-id-check">
      <header className="idcheck-header">
        <h2>Spot the Contact</h2>
        <p className="idcheck-sub">
          One of these {suspects.length} people is your contact. Your Handler's checklist knows who.
        </p>
      </header>
      <div className="idcheck-lineup" role="group" aria-label={`Suspect lineup of ${suspects.length} portraits`}>
        {suspects.map((suspect, i) => {
          const isSelected = selected === i;
          const isContactDone = done && i === contact;
          const label =
            `Suspect ${i + 1}: ${suspectDescription(suspect)}` +
            (isContactDone ? '. Confirmed as the contact' : isSelected ? '. Currently selected' : '');
          return (
            <button
              key={i}
              className={
                'idcheck-suspect' +
                (isSelected ? ' idcheck-selected' : '') +
                (isContactDone ? ' idcheck-contact' : '')
              }
              onClick={() => handleSelect(i)}
              disabled={disabled || done}
              aria-label={label}
              aria-pressed={isSelected}
            >
              <span className="idcheck-pos" aria-hidden="true">
                {i + 1}
              </span>
              <Portrait suspect={suspect} clipId={`idcheck-shirt-${instance.seed}-${i}`} />
              {(isSelected || isContactDone) && (
                <span className="idcheck-chip" aria-hidden="true">
                  {isContactDone ? 'CONTACT' : 'SELECTED'}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        className="idcheck-confirm"
        onClick={handleConfirm}
        disabled={disabled || done || selected === null}
        aria-label={
          selected === null
            ? 'Confirm contact (select a suspect first)'
            : `Confirm suspect ${selected + 1} as the contact`
        }
      >
        Confirm Contact
      </button>
      <p className="idcheck-status" role="status">
        {statusText}
      </p>
    </div>
  );
}
