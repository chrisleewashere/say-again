import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import {
  solvePasswordIntercept,
  type PasswordInterceptAnswer,
  type PasswordInterceptState,
} from './logic';
import './passwordIntercept.css';

/** Decorative radio-signal motif for the intercept card frame. */
function SignalGlyph() {
  return (
    <svg className="password-intercept-signal" viewBox="0 0 40 24" aria-hidden="true">
      <circle cx="20" cy="16" r="3" fill="var(--amber)" />
      <path d="M12 12a11 11 0 0 1 16 0" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 7a18 18 0 0 1 26 0" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/**
 * Round progress dot. Never color-only: decoded rounds are filled circles
 * with a check mark, the current round is a ring with a center dot, and
 * upcoming rounds are dashed outlines.
 */
function ProgressDot({ kind }: { kind: 'done' | 'current' | 'upcoming' }) {
  return (
    <svg className="password-intercept-dot" viewBox="0 0 28 28" aria-hidden="true">
      {kind === 'done' && (
        <>
          <circle cx="14" cy="14" r="11" fill="var(--w-teal)" />
          <path d="M8.5 14.5l4 4 7-8" fill="none" stroke="#0f141a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'current' && (
        <>
          <circle cx="14" cy="14" r="11" fill="none" stroke="var(--amber)" strokeWidth="3" />
          <circle cx="14" cy="14" r="4.5" fill="var(--amber)" />
        </>
      )}
      {kind === 'upcoming' && (
        <circle cx="14" cy="14" r="11" fill="none" stroke="var(--line)" strokeWidth="2.5" strokeDasharray="4 4" />
      )}
    </svg>
  );
}

export function PasswordIntercept({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<PasswordInterceptState, PasswordInterceptAnswer>) {
  const { rounds } = instance.state;
  const [chosen, setChosen] = useState<string[]>([]);
  const [lastRejected, setLastRejected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const expected = solvePasswordIntercept(instance.state);
  const roundIdx = Math.min(chosen.length, rounds.length - 1);
  const round = rounds[roundIdx];

  function handlePick(word: string) {
    if (done || disabled) return;
    const correct = expected[roundIdx] === word;
    onAttempt?.(correct, [...chosen, word]);
    if (!correct) {
      setLastRejected(word);
      onStrike();
      return; // round stays open on a wrong pick — soft failure, retry
    }
    const nextChosen = [...chosen, word];
    setLastRejected(null);
    setChosen(nextChosen);
    if (nextChosen.length === rounds.length) {
      setDone(true);
      onSolved();
    }
  }

  const statusText = done
    ? 'Transmission decoded! All passwords recovered.'
    : lastRejected
      ? `"${lastRejected.toUpperCase()}" rejected. Still on card ${round.cardId}, round ${roundIdx + 1} of ${rounds.length} — try another word.`
      : `Round ${roundIdx + 1} of ${rounds.length}. Showing card ${round.cardId}.`;

  return (
    <div className="password-intercept card" data-testid="module-password-intercept">
      <header className="password-intercept-header">
        <h2>Password Intercept</h2>
        <p className="password-intercept-sub">
          Read the card number to your Handler. Only their manual holds the clue.
        </p>
      </header>

      <div
        className="password-intercept-card-frame"
        role="img"
        aria-label={
          done
            ? 'Intercept complete. No card displayed.'
            : `Intercept card number ${round.cardId}, round ${roundIdx + 1} of ${rounds.length}`
        }
      >
        <SignalGlyph />
        <span className="password-intercept-card-label" aria-hidden="true">
          {done ? 'DECODED' : `CARD ${round.cardId}`}
        </span>
        <SignalGlyph />
      </div>

      <div
        className="password-intercept-dots"
        role="img"
        aria-label={`Progress: ${chosen.length} of ${rounds.length} rounds decoded`}
      >
        {rounds.map((_, i) => (
          <ProgressDot key={i} kind={i < chosen.length ? 'done' : i === chosen.length ? 'current' : 'upcoming'} />
        ))}
      </div>

      <div className="password-intercept-bank" role="group" aria-label="Candidate password words">
        {round.candidates.map((word, i) => (
          <button
            key={word}
            className={`password-intercept-word${!done && lastRejected === word ? ' password-intercept-word-rejected' : ''}`}
            onClick={() => handlePick(word)}
            disabled={disabled || done}
            aria-label={`Candidate word ${i + 1} of ${round.candidates.length}: ${word}${!done && lastRejected === word ? ', rejected on last try' : ''}`}
          >
            {word}
          </button>
        ))}
      </div>

      <p className="password-intercept-status" role="status">
        {statusText}
      </p>
    </div>
  );
}
