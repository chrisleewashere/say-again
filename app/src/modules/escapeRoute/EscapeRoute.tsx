import { useState, type ReactElement } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import {
  canStep,
  isSensorCell,
  type EscapeRouteAnswer,
  type EscapeRouteState,
} from './logic';
import {
  cellId,
  colLetter,
  LANDMARK_SHAPES,
  LANDMARK_TAGS,
  MOVES,
  parseCell,
  type LandmarkKind,
  type Move,
} from './rules';
import './escapeRoute.css';

const CELL = 52;
const PAD = 26;

/** On-screen landmark colors — always paired with shape + letter tag. */
const LANDMARK_COLOR: Record<LandmarkKind, string> = {
  desk: 'var(--w-teal)',
  plant: 'var(--success)',
  camera: 'var(--w-violet)',
  crate: 'var(--w-amber)',
  fountain: 'var(--info)',
};

const MOVE_NAMES: Record<Move, string> = { N: 'north', S: 'south', E: 'east', W: 'west' };

function cx(c: number): number {
  return PAD + c * CELL + CELL / 2;
}
function cy(r: number): number {
  return PAD + r * CELL + CELL / 2;
}

function LandmarkIcon({ kind, x, y }: { kind: LandmarkKind; x: number; y: number }) {
  const color = LANDMARK_COLOR[kind];
  const s = 13;
  let shape: ReactElement;
  switch (LANDMARK_SHAPES[kind]) {
    case 'square':
      shape = <rect x={x - s} y={y - s} width={s * 2} height={s * 2} fill={color} stroke="var(--bg-0)" strokeWidth={2} />;
      break;
    case 'triangle':
      shape = <polygon points={`${x},${y - s - 3} ${x - s - 2},${y + s} ${x + s + 2},${y + s}`} fill={color} stroke="var(--bg-0)" strokeWidth={2} />;
      break;
    case 'circle':
      shape = <circle cx={x} cy={y} r={s + 1} fill={color} stroke="var(--bg-0)" strokeWidth={2} />;
      break;
    case 'diamond':
      shape = <polygon points={`${x},${y - s - 3} ${x + s + 3},${y} ${x},${y + s + 3} ${x - s - 3},${y}`} fill={color} stroke="var(--bg-0)" strokeWidth={2} />;
      break;
    case 'hexagon': {
      const h = s + 2;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${(x + h * Math.cos(a)).toFixed(1)},${(y + h * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      shape = <polygon points={pts} fill={color} stroke="var(--bg-0)" strokeWidth={2} />;
      break;
    }
  }
  const dy = LANDMARK_SHAPES[kind] === 'triangle' ? 6 : 5;
  return (
    <g>
      {shape}
      <text x={x} y={y + dy} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--bg-0)">
        {LANDMARK_TAGS[kind]}
      </text>
    </g>
  );
}

/** Arrow glyph for a d-pad button. */
function ArrowGlyph({ move }: { move: Move }) {
  const rot: Record<Move, number> = { N: 0, E: 90, S: 180, W: 270 };
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
      <polygon points="12,3 20,15 12,11 4,15" fill="currentColor" transform={`rotate(${rot[move]} 12 12)`} />
    </svg>
  );
}

export function EscapeRoute({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  a11y,
  disabled,
}: ModuleComponentProps<EscapeRouteState, EscapeRouteAnswer>) {
  const state = instance.state;
  const [pos, setPos] = useState(state.start);
  const [moves, setMoves] = useState<Move[]>([]);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('Read the floor code to your Handler, then wait for directions.');
  const [tripped, setTripped] = useState(false);

  const w = PAD + state.cols * CELL + 8;
  const h = PAD + state.rows * CELL + 8;

  function landmarkAt(cell: string): LandmarkKind | null {
    const hit = state.landmarks.find((l) => l.cell === cell);
    return hit ? hit.kind : null;
  }

  /** Spoken-friendly description of the current cell and its surroundings. */
  function describe(cell: string): string {
    const parts: string[] = [`You are in cell ${cell}.`];
    const here = landmarkAt(cell);
    if (here) parts.push(`Landmark here: ${here} (${LANDMARK_TAGS[here]}).`);
    for (const m of MOVES) {
      const next = canStep(state, cell, m);
      if (next === null) {
        parts.push(`${MOVE_NAMES[m]}: blocked by a wall.`);
      } else {
        const lm = landmarkAt(next);
        if (lm) parts.push(`${MOVE_NAMES[m]}: ${lm} (${LANDMARK_TAGS[lm]}) in ${next}.`);
        if (next === state.exit) parts.push(`${MOVE_NAMES[m]}: the exit door!`);
      }
    }
    return parts.join(' ');
  }

  function handleMove(move: Move) {
    if (done || disabled) return;
    const next = canStep(state, pos, move);
    if (next === null) {
      setMessage(`Bump! A wall blocks you to the ${MOVE_NAMES[move]}. ${describe(pos)}`);
      return; // walls are visible — no strike, nothing committed
    }
    const path: Move[] = [...moves, move];
    if (isSensorCell(state.floorId, next)) {
      // Hidden sensor: soft failure — strike, then back to START to retry.
      onAttempt?.(false, path);
      onStrike();
      setTripped(true);
      setPos(state.start);
      setMoves([]);
      setMessage(
        `A hidden floor sensor tripped in ${next}! You are back at START (${state.start}). Tell your Handler exactly where the alarm went off.`,
      );
      return;
    }
    setTripped(false);
    setPos(next);
    setMoves(path);
    if (next === state.exit) {
      setDone(true);
      onAttempt?.(true, path);
      setMessage(`You reached the EXIT in ${next}. Route clear — ${path.length} moves.`);
      onSolved();
      return;
    }
    setMessage(describe(next));
  }

  const pc = parseCell(pos);

  return (
    <div className="escape-route card" data-testid="module-escape-route">
      <header className="escape-route-header">
        <h2>Escape Route</h2>
        <p className="escape-route-sub">
          Your Handler's manual shows this floor's hidden sensors and the safe route. Read them the floor code:
        </p>
        <p className="escape-route-floorcode" aria-label={`Floor code: floor ${state.floorId}`}>
          FLOOR {state.floorId}
        </p>
      </header>

      <div className="escape-route-maparea">
        <svg
          className="escape-route-map"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`Floor map, ${state.cols} columns (A to ${colLetter(state.cols - 1)}) by ${state.rows} rows (1 to ${state.rows}). ${describe(pos)}`}
        >
          {/* floor */}
          <rect
            x={PAD}
            y={PAD}
            width={state.cols * CELL}
            height={state.rows * CELL}
            className={`escape-route-floor${tripped && !a11y.reducedMotion ? ' escape-route-floor-tripped' : ''}`}
          />
          {/* axis labels */}
          {Array.from({ length: state.cols }, (_, c) => (
            <text key={`col${c}`} x={cx(c)} y={PAD - 8} textAnchor="middle" className="escape-route-axis">
              {colLetter(c)}
            </text>
          ))}
          {Array.from({ length: state.rows }, (_, r) => (
            <text key={`row${r}`} x={PAD - 10} y={cy(r) + 5} textAnchor="middle" className="escape-route-axis">
              {r + 1}
            </text>
          ))}
          {/* grid lines */}
          {Array.from({ length: state.cols - 1 }, (_, i) => (
            <line
              key={`gv${i}`}
              x1={PAD + (i + 1) * CELL}
              y1={PAD}
              x2={PAD + (i + 1) * CELL}
              y2={PAD + state.rows * CELL}
              className="escape-route-grid"
            />
          ))}
          {Array.from({ length: state.rows - 1 }, (_, i) => (
            <line
              key={`gh${i}`}
              x1={PAD}
              y1={PAD + (i + 1) * CELL}
              x2={PAD + state.cols * CELL}
              y2={PAD + (i + 1) * CELL}
              className="escape-route-grid"
            />
          ))}
          {/* start pad */}
          <circle cx={cx(parseCell(state.start).c)} cy={cy(parseCell(state.start).r)} r={7} className="escape-route-startpad" />
          <text
            x={cx(parseCell(state.start).c)}
            y={cy(parseCell(state.start).r) + 20}
            textAnchor="middle"
            className="escape-route-marklabel"
          >
            START
          </text>
          {/* exit */}
          <g>
            <rect
              x={cx(parseCell(state.exit).c) - 12}
              y={cy(parseCell(state.exit).r) - 14}
              width={24}
              height={24}
              className="escape-route-exit"
            />
            <line
              x1={cx(parseCell(state.exit).c) - 12}
              y1={cy(parseCell(state.exit).r) - 14}
              x2={cx(parseCell(state.exit).c) + 12}
              y2={cy(parseCell(state.exit).r) + 10}
              className="escape-route-exitline"
            />
            <text
              x={cx(parseCell(state.exit).c)}
              y={cy(parseCell(state.exit).r) + 22}
              textAnchor="middle"
              className="escape-route-marklabel"
            >
              EXIT
            </text>
          </g>
          {/* landmarks */}
          {state.landmarks.map((lm) => {
            const p = parseCell(lm.cell);
            return <LandmarkIcon key={lm.cell} kind={lm.kind} x={cx(p.c)} y={cy(p.r)} />;
          })}
          {/* interior walls */}
          {state.walls.map((wall) => {
            const [a, b] = wall.split('|');
            const pa = parseCell(a);
            const pb = parseCell(b);
            if (pa.r === pb.r) {
              const x = PAD + Math.max(pa.c, pb.c) * CELL;
              const y = PAD + pa.r * CELL;
              return <line key={wall} x1={x} y1={y} x2={x} y2={y + CELL} className="escape-route-wall" />;
            }
            const x = PAD + pa.c * CELL;
            const y = PAD + Math.max(pa.r, pb.r) * CELL;
            return <line key={wall} x1={x} y1={y} x2={x + CELL} y2={y} className="escape-route-wall" />;
          })}
          {/* outer border */}
          <rect x={PAD} y={PAD} width={state.cols * CELL} height={state.rows * CELL} className="escape-route-border" />
          {/* avatar */}
          <g
            className={`escape-route-avatar${a11y.reducedMotion ? ' escape-route-avatar-static' : ''}`}
            style={{ transform: `translate(${cx(pc.c)}px, ${cy(pc.r)}px)` }}
          >
            <circle r={15} className="escape-route-avatar-ring" />
            <circle r={8} className="escape-route-avatar-dot" />
          </g>
        </svg>

        <svg className="escape-route-compass" viewBox="0 0 72 72" role="img" aria-label="Compass rose: north is the top of the map.">
          <circle cx={36} cy={36} r={24} className="escape-route-compass-face" />
          <polygon points="36,16 31,40 36,35 41,40" className="escape-route-compass-needle" />
          <text x={36} y={11} textAnchor="middle" className="escape-route-compass-n">N</text>
          <text x={36} y={69} textAnchor="middle" className="escape-route-compass-s">S</text>
          <text x={66} y={40} textAnchor="middle" className="escape-route-compass-s">E</text>
          <text x={6} y={40} textAnchor="middle" className="escape-route-compass-s">W</text>
        </svg>
      </div>

      <div className="escape-route-dpad" role="group" aria-label="Movement controls">
        <button
          className="escape-route-btn escape-route-btn-n"
          onClick={() => handleMove('N')}
          disabled={disabled || done}
          aria-label={`Move north, one cell up. You are in cell ${pos}.`}
        >
          <ArrowGlyph move="N" /> N
        </button>
        <button
          className="escape-route-btn escape-route-btn-w"
          onClick={() => handleMove('W')}
          disabled={disabled || done}
          aria-label={`Move west, one cell left. You are in cell ${pos}.`}
        >
          <ArrowGlyph move="W" /> W
        </button>
        <button
          className="escape-route-btn escape-route-btn-e"
          onClick={() => handleMove('E')}
          disabled={disabled || done}
          aria-label={`Move east, one cell right. You are in cell ${pos}.`}
        >
          <ArrowGlyph move="E" /> E
        </button>
        <button
          className="escape-route-btn escape-route-btn-s"
          onClick={() => handleMove('S')}
          disabled={disabled || done}
          aria-label={`Move south, one cell down. You are in cell ${pos}.`}
        >
          <ArrowGlyph move="S" /> S
        </button>
      </div>

      <p className="escape-route-status" role="status">
        {done ? message : `${message} Moves so far: ${moves.length}.`}
      </p>
    </div>
  );
}
