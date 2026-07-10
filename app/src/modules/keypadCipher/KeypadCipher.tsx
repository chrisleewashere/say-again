import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import {
  solveKeypadCipher,
  type KeypadCipherAnswer,
  type KeypadCipherState,
} from './logic';
import './keypadCipher.css';

/** Check mark drawn inline — locked state is shown by number + shape, never color alone. */
function CheckIcon() {
  return (
    <svg className="keypad-cipher-check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 8.5 6.5 12.5 13.5 3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small vault-door glyph for the header — decoration only. */
function VaultGlyph({ open }: { open: boolean }) {
  return (
    <svg className="keypad-cipher-vault" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth={2.5} />
      <circle cx="16" cy="16" r="5.5" fill="none" stroke="currentColor" strokeWidth={2} />
      {open ? (
        <path d="M16 10.5 V4 M16 21.5 V28 M10.5 16 H4 M21.5 16 H28" stroke="currentColor" strokeWidth={2} transform="rotate(45 16 16)" />
      ) : (
        <path d="M16 10.5 V4 M16 21.5 V28 M10.5 16 H4 M21.5 16 H28" stroke="currentColor" strokeWidth={2} />
      )}
    </svg>
  );
}

export function KeypadCipher({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<KeypadCipherState, KeypadCipherAnswer>) {
  const { keys } = instance.state;
  const [locked, setLocked] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const expected = solveKeypadCipher(instance.state);

  function handlePress(index: number) {
    if (done || locked.includes(index)) return;
    const attempt = [...locked, index];
    const correct = expected[locked.length] === index;
    onAttempt?.(correct, attempt);
    if (!correct) {
      onStrike();
      setLocked([]); // wrong order: sequence resets, keys stay — soft failure, retry
      setJustReset(true);
      return;
    }
    setJustReset(false);
    setLocked(attempt);
    if (attempt.length === keys.length) {
      setDone(true);
      onSolved();
    }
  }

  const status = done
    ? 'Code accepted — the vault is open!'
    : justReset
      ? `Wrong order — the keypad reset. Keys locked in: 0 of ${keys.length}.`
      : `Keys locked in: ${locked.length} of ${keys.length}.`;

  return (
    <div className="keypad-cipher card" data-testid="module-keypad-cipher">
      <header className="keypad-cipher-header">
        <VaultGlyph open={done} />
        <div>
          <h2>Code Room</h2>
          <p className="keypad-cipher-sub">
            Read the word keys to your Handler. Press them in the order the Handler works out.
          </p>
        </div>
      </header>

      <div className="keypad-cipher-grid" role="group" aria-label="Keypad of word keys">
        {keys.map((key, i) => {
          const rank = locked.indexOf(i);
          const isLocked = rank !== -1;
          const label = isLocked
            ? `Word key "${key.word}", locked in as press ${rank + 1} of ${keys.length}`
            : `Word key "${key.word}", not yet pressed`;
          return (
            <button
              key={i}
              className={`keypad-cipher-key${isLocked ? ' keypad-cipher-key-locked' : ''}`}
              onClick={() => handlePress(i)}
              disabled={disabled || done || isLocked}
              aria-label={label}
            >
              <span className="keypad-cipher-word">{key.word}</span>
              {isLocked && (
                <span className="keypad-cipher-rank" aria-hidden="true">
                  {rank + 1}
                  <CheckIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="keypad-cipher-status" role="status">
        {status}
      </p>
    </div>
  );
}
