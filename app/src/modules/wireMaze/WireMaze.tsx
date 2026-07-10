import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import { solveWireMaze, type WireMazeAnswer, type WireMazeState } from './logic';
import type { Wire, WirePattern } from './rules';
import './wireMaze.css';

const COLOR_VAR: Record<string, string> = {
  amber: 'var(--w-amber)',
  teal: 'var(--w-teal)',
  crimson: 'var(--w-crimson)',
  violet: 'var(--w-violet)',
  silver: 'var(--w-silver)',
};

/** SVG pattern overlay so pattern is visible independent of color. */
function PatternOverlay({ pattern, id }: { pattern: WirePattern; id: string }) {
  switch (pattern) {
    case 'solid':
      return null;
    case 'striped':
      return (
        <g clipPath={`url(#clip-${id})`}>
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1={i * 26 - 10} y1={-4} x2={i * 26 + 12} y2={28} stroke="#0f141a" strokeWidth={5} />
          ))}
        </g>
      );
    case 'dotted':
      return (
        <g clipPath={`url(#clip-${id})`}>
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={i * 28 + 16} cy={12} r={3.5} fill="#0f141a" />
          ))}
        </g>
      );
    case 'zigzag':
      return (
        <g clipPath={`url(#clip-${id})`}>
          <polyline
            points={Array.from({ length: 18 }, (_, i) => `${i * 20},${i % 2 === 0 ? 4 : 20}`).join(' ')}
            fill="none"
            stroke="#0f141a"
            strokeWidth={4}
          />
        </g>
      );
  }
}

function WireRow({
  wire,
  pos,
  cut,
  disabled,
  onCut,
}: {
  wire: Wire;
  pos: number;
  cut: boolean;
  disabled: boolean;
  onCut: () => void;
}) {
  const id = `w${pos}`;
  const label = `Wire ${pos}: ${wire.color}, ${wire.pattern}, tag ${wire.label}${cut ? ', already cut' : ''}`;
  return (
    <button
      className={`wire-row${cut ? ' wire-cut' : ''}`}
      onClick={onCut}
      disabled={disabled || cut}
      aria-label={label}
    >
      <span className="wire-pos" aria-hidden="true">{pos}</span>
      <svg className="wire-svg" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${id}`}>
            <rect x={0} y={2} width={320} height={20} rx={10} />
          </clipPath>
        </defs>
        {cut ? (
          <>
            <rect x={0} y={2} width={130} height={20} rx={10} fill={COLOR_VAR[wire.color]} opacity={0.4} />
            <rect x={190} y={2} width={130} height={20} rx={10} fill={COLOR_VAR[wire.color]} opacity={0.4} />
          </>
        ) : (
          <>
            <rect x={0} y={2} width={320} height={20} rx={10} fill={COLOR_VAR[wire.color]} />
            <PatternOverlay pattern={wire.pattern} id={id} />
          </>
        )}
      </svg>
      <span className="wire-tag" aria-hidden="true">{wire.label}</span>
    </button>
  );
}

export function WireMaze({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<WireMazeState, WireMazeAnswer>) {
  const { wires, cutsRequired } = instance.state;
  const [cuts, setCuts] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const expected = solveWireMaze(instance.state);

  function handleCut(index: number) {
    if (done || cuts.includes(index)) return;
    const nextCuts = [...cuts, index];
    const step = cuts.length;
    const correct = expected[step] === index;
    onAttempt?.(correct, nextCuts);
    if (!correct) {
      onStrike();
      return; // wire stays intact on a wrong attempt — soft failure, retry
    }
    setCuts(nextCuts);
    if (nextCuts.length === cutsRequired) {
      setDone(true);
      onSolved();
    }
  }

  return (
    <div className="wire-maze card" data-testid="module-wire-maze">
      <header className="module-header">
        <h2>Laser Grid Bypass</h2>
        <p className="module-sub">
          {cutsRequired === 1
            ? 'One wire disarms the grid. Your Handler knows which.'
            : `Cut ${cutsRequired} wires in the right order. Your Handler knows which.`}
        </p>
      </header>
      <div className="wire-list" role="group" aria-label="Wire panel">
        {wires.map((wire, i) => (
          <WireRow
            key={i}
            wire={wire}
            pos={i + 1}
            cut={cuts.includes(i)}
            disabled={disabled || done}
            onCut={() => handleCut(i)}
          />
        ))}
      </div>
      <p className="module-status" role="status">
        {done ? 'Grid disarmed!' : `Cuts made: ${cuts.length} / ${cutsRequired}`}
      </p>
    </div>
  );
}
