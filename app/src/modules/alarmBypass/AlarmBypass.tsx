import { useEffect, useMemo, useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import { solveAlarmBypass, type AlarmBypassAnswer, type AlarmBypassState } from './logic';
import { GLYPHS, GLYPH_LETTERS, type Glyph } from './rules';
import './alarmBypass.css';

/** On-screen display names (shape channel; letters are the second channel). */
// The easy-read manual calls the crescent "Moon" — say both names so any
// Handler edition matches what the Agent hears and reads.
const GLYPH_NAMES: Record<Glyph, string> = {
  crescent: 'Crescent (Moon)',
  key: 'Key',
  bolt: 'Bolt',
  eye: 'Eye',
};

/** Accent per glyph — decorative only; shape + printed letter carry the info. */
const GLYPH_COLOR: Record<Glyph, string> = {
  crescent: 'var(--w-violet)',
  key: 'var(--w-amber)',
  bolt: 'var(--w-teal)',
  eye: 'var(--w-crimson)',
};

/** Inline SVG glyph art, drawn with currentColor. */
function GlyphIcon({ glyph }: { glyph: Glyph }) {
  return (
    <svg className="alarm-bypass-glyph" viewBox="0 0 48 48" aria-hidden="true">
      {glyph === 'crescent' && (
        <path d="M42 25.58 A18 18 0 1 1 22.42 6 A14 14 0 0 0 42 25.58 Z" fill="currentColor" />
      )}
      {glyph === 'key' && (
        <g stroke="currentColor" strokeWidth={4} strokeLinecap="round" fill="none">
          <circle cx={15} cy={24} r={8} />
          <line x1={23} y1={24} x2={42} y2={24} />
          <line x1={34} y1={24} x2={34} y2={32} />
          <line x1={41} y1={24} x2={41} y2={31} />
        </g>
      )}
      {glyph === 'bolt' && (
        <polygon points="27,3 10,28 21,28 19,45 38,19 26,19" fill="currentColor" />
      )}
      {glyph === 'eye' && (
        <g>
          <path
            d="M4 24 C 12 11, 36 11, 44 24 C 36 37, 12 37, 4 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
          />
          <circle cx={24} cy={24} r={5.5} fill="currentColor" />
        </g>
      )}
    </svg>
  );
}

function glyphSpoken(glyph: Glyph): string {
  return `${GLYPH_NAMES[glyph]} (letter ${GLYPH_LETTERS[glyph]})`;
}

/** Per-flash dwell during playback — generous, no timing pressure. */
const FLASH_DWELL_MS = 900;

export function AlarmBypass({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  a11y,
  disabled,
}: ModuleComponentProps<AlarmBypassState, AlarmBypassAnswer>) {
  const { model, rounds } = instance.state;
  const totalRounds = rounds.length;
  const expected = useMemo(() => solveAlarmBypass(instance.state), [instance.state]);

  const [round, setRound] = useState(0);
  const [answered, setAnswered] = useState<AlarmBypassAnswer>([]);
  const [pressed, setPressed] = useState<Glyph[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [done, setDone] = useState(false);
  /** Index of the glyph currently flashing; null = playback finished / off. */
  const [flashPos, setFlashPos] = useState<number | null>(null);
  const [playCount, setPlayCount] = useState(0);

  const reducedMotion =
    a11y.reducedMotion ||
    (typeof document !== 'undefined' &&
      document.documentElement.classList.contains('a11y-reduced-motion')) ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const sequence = rounds[Math.min(round, totalRounds - 1)];

  useEffect(() => {
    if (done || reducedMotion) {
      setFlashPos(null);
      return;
    }
    setFlashPos(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (i >= sequence.length) {
        clearInterval(timer);
        setFlashPos(null);
      } else {
        setFlashPos(i);
      }
    }, FLASH_DWELL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, playCount, reducedMotion, done]);

  function handlePress(glyph: Glyph) {
    if (done || disabled) return;
    const target = expected[round];
    const correct = target[pressed.length] === glyph;
    const attempt: AlarmBypassAnswer = [...answered, [...pressed, glyph]];
    onAttempt?.(correct, attempt);
    if (!correct) {
      onStrike();
      setPressed([]); // only this round's input resets; the signal is unchanged
      setWrongFlash(true);
      return;
    }
    setWrongFlash(false);
    const nextPressed = [...pressed, glyph];
    if (nextPressed.length === target.length) {
      const nextAnswered = [...answered, nextPressed];
      setAnswered(nextAnswered);
      setPressed([]);
      if (nextAnswered.length === totalRounds) {
        setDone(true);
        onSolved();
      } else {
        setRound(round + 1);
      }
    } else {
      setPressed(nextPressed);
    }
  }

  const playing = flashPos !== null;
  const signalSpoken = sequence.map(glyphSpoken).join(', ');

  const statusText = done
    ? 'Alarm bypassed. All rounds complete.'
    : `Round ${round + 1} of ${totalRounds}. ` +
      (playing ? 'Signal playing. ' : `Signal has ${sequence.length} flashes. `) +
      `Correct presses this round: ${pressed.length} of ${sequence.length}.` +
      (wrongFlash ? ' Wrong button — this round’s presses were cleared. The signal is unchanged.' : '');

  return (
    <div className="alarm-bypass card" data-testid="module-alarm-bypass">
      <header className="alarm-bypass-header">
        <h2>Alarm Bypass</h2>
        <p className="alarm-bypass-sub">
          The panel flashes a signal. Your Handler knows how to translate it.
        </p>
        <div className="alarm-bypass-meta">
          <span className="alarm-bypass-model" aria-label={`Panel model ${model}`}>
            MODEL {model}
          </span>
          <span className="alarm-bypass-round" aria-label={`Round ${Math.min(round + 1, totalRounds)} of ${totalRounds}`}>
            ROUND {Math.min(round + 1, totalRounds)} / {totalRounds}
          </span>
        </div>
      </header>

      <div className="alarm-bypass-signal" role="group" aria-label="Flashed signal display">
        {playing && flashPos !== null ? (
          <div
            className="alarm-bypass-stage"
            aria-label={`Now flashing: ${glyphSpoken(sequence[flashPos])}, flash ${flashPos + 1} of ${sequence.length}`}
            style={{ color: GLYPH_COLOR[sequence[flashPos]] }}
          >
            <GlyphIcon glyph={sequence[flashPos]} />
            <span className="alarm-bypass-stage-letter" aria-hidden="true">
              {GLYPH_LETTERS[sequence[flashPos]]}
            </span>
          </div>
        ) : (
          <ol
            className="alarm-bypass-last"
            aria-label={
              done
                ? 'Signal display off. Alarm bypassed.'
                : `Last signal for round ${round + 1}, in order: ${signalSpoken}`
            }
          >
            {sequence.map((glyph, i) => (
              <li key={i} className="alarm-bypass-last-item" style={{ color: GLYPH_COLOR[glyph] }}>
                <GlyphIcon glyph={glyph} />
                <span className="alarm-bypass-last-letter" aria-hidden="true">
                  {GLYPH_LETTERS[glyph]}
                </span>
              </li>
            ))}
          </ol>
        )}
        <button
          className="alarm-bypass-replay"
          onClick={() => setPlayCount((c) => c + 1)}
          disabled={disabled || done}
          aria-label={`Replay the flashed signal for round ${Math.min(round + 1, totalRounds)}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="alarm-bypass-replay-icon">
            <path
              d="M12 4 A8 8 0 1 0 20 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <polygon points="8,1 15,4 8,8" fill="currentColor" />
          </svg>
          Replay signal
        </button>
      </div>

      <div className="alarm-bypass-buttons" role="group" aria-label="Signal buttons">
        {GLYPHS.map((glyph) => (
          <button
            key={glyph}
            className="alarm-bypass-btn"
            style={{ color: GLYPH_COLOR[glyph] }}
            onClick={() => handlePress(glyph)}
            disabled={disabled || done}
            aria-label={`Press signal button ${GLYPH_NAMES[glyph]}, printed letter ${GLYPH_LETTERS[glyph]}`}
          >
            <GlyphIcon glyph={glyph} />
            <span className="alarm-bypass-btn-letter" aria-hidden="true">
              {GLYPH_LETTERS[glyph]}
            </span>
          </button>
        ))}
      </div>

      <div
        className="alarm-bypass-pressed"
        aria-label={
          pressed.length
            ? `Presses so far this round: ${pressed.map(glyphSpoken).join(', ')}`
            : 'No presses yet this round'
        }
      >
        {sequence.map((_, i) => (
          <span
            key={i}
            className={`alarm-bypass-slot${i < pressed.length ? ' alarm-bypass-slot-filled' : ''}`}
            aria-hidden="true"
          >
            {i < pressed.length ? GLYPH_LETTERS[pressed[i]] : '·'}
          </span>
        ))}
      </div>

      <p className="alarm-bypass-status" role="status">
        {statusText}
      </p>
    </div>
  );
}
