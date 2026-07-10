import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import { bandRect, coreDotRadius, gemShapePath } from './gemArt';
import { solveVaultDial, type VaultDialAnswer, type VaultDialState } from './logic';
import { markingWord, shapeWord } from './prose';
import { SIZE_TAGS, type Gem } from './rules';
import './vaultDial.css';

/** Large gems render at full radius; small at 60%. The printed S/L tag makes size unambiguous. */
const GEM_RADIUS: Record<Gem['size'], number> = { large: 40, small: 24 };

function GemView({ gem, pos, count }: { gem: Gem; pos: number; count: number }) {
  const r = GEM_RADIUS[gem.size];
  const path = gemShapePath(gem.shape, 50, 50, r);
  const clipId = `vault-dial-clip-${pos}`;
  const band = bandRect(50, 50, r);
  const label =
    `Gem ${pos} of ${count}: ${gem.size} ${shapeWord(gem.shape, 'standard')} with ` +
    `${markingWord(gem.marking, 'standard')}. Size tag ${SIZE_TAGS[gem.size]}.`;
  return (
    <div className="vault-dial-gem" role="img" aria-label={label}>
      <span className="vault-dial-gem-pos" aria-hidden="true">
        {pos}
      </span>
      <svg className="vault-dial-gem-svg" viewBox="0 0 100 100" aria-hidden="true">
        {gem.marking === 'band' && (
          <defs>
            <clipPath id={clipId}>
              <path d={path} clipRule="evenodd" />
            </clipPath>
          </defs>
        )}
        <path d={path} fill="var(--w-amber)" stroke="#0f141a" strokeWidth={2.5} fillRule="evenodd" />
        {gem.marking === 'band' && (
          <rect
            x={band.x}
            y={band.y}
            width={band.width}
            height={band.height}
            fill="#0f141a"
            clipPath={`url(#${clipId})`}
          />
        )}
        {gem.marking === 'core-dot' && (
          <circle cx={50} cy={50} r={coreDotRadius(r)} fill="#0f141a" stroke="var(--w-amber)" strokeWidth={2} />
        )}
      </svg>
      <span className="vault-dial-size-tag" aria-hidden="true">
        {SIZE_TAGS[gem.size]}
      </span>
    </div>
  );
}

const DIGIT_ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export function VaultDial({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<VaultDialState, VaultDialAnswer>) {
  const { gems } = instance.state;
  const [entry, setEntry] = useState('');
  const [done, setDone] = useState(false);

  const expected = solveVaultDial(instance.state);
  const codeLength = gems.length;
  const locked = disabled || done;

  function pressDigit(d: string) {
    if (locked || entry.length >= codeLength) return;
    setEntry(entry + d);
  }

  function backspace() {
    if (locked) return;
    setEntry(entry.slice(0, -1));
  }

  function commit() {
    if (locked || entry.length !== codeLength) return;
    const correct = entry === expected;
    onAttempt?.(correct, entry);
    if (!correct) {
      onStrike();
      setEntry(''); // keypad clears; the vault stays retryable — soft failure
      return;
    }
    setDone(true);
    onSolved();
  }

  const statusText = done
    ? 'Vault unlocked!'
    : entry.length === 0
      ? `Keypad empty. Enter the ${codeLength}-digit code.`
      : `Entered ${entry.split('').join(' ')} — ${entry.length} of ${codeLength} digits.`;

  return (
    <div className="vault-dial card" data-testid="module-vault-dial">
      <header className="vault-dial-header">
        <h2>Crack the Safe</h2>
        <p className="vault-dial-sub">
          Describe each gem to your Handler — shape, marking, and size tag. They will compute the{' '}
          {codeLength}-digit code.
        </p>
      </header>

      <div className="vault-dial-gems" role="group" aria-label={`Gem row: ${codeLength} gems above the keypad`}>
        {gems.map((gem, i) => (
          <GemView key={i} gem={gem} pos={i + 1} count={codeLength} />
        ))}
      </div>

      <div className="vault-dial-code" aria-hidden="true">
        {gems.map((_, i) => (
          <span key={i} className={`vault-dial-slot${i < entry.length ? ' vault-dial-slot-filled' : ''}`}>
            {entry[i] ?? ''}
          </span>
        ))}
      </div>

      <div className="vault-dial-keypad" role="group" aria-label="Vault keypad, digits 0 to 9">
        {DIGIT_ROWS.flat().map((d) => (
          <button
            key={d}
            className="vault-dial-key"
            onClick={() => pressDigit(d)}
            disabled={locked || entry.length >= codeLength}
            aria-label={`Key ${d}`}
          >
            {d}
          </button>
        ))}
        <button
          className="vault-dial-key vault-dial-key-aux"
          onClick={backspace}
          disabled={locked || entry.length === 0}
          aria-label="Delete the last entered digit"
        >
          DEL
        </button>
        <button
          className="vault-dial-key"
          onClick={() => pressDigit('0')}
          disabled={locked || entry.length >= codeLength}
          aria-label="Key 0"
        >
          0
        </button>
        <button
          className="vault-dial-key vault-dial-key-enter"
          onClick={commit}
          disabled={locked || entry.length !== codeLength}
          aria-label={`Enter: submit the ${codeLength}-digit code`}
        >
          ENTER
        </button>
      </div>

      <p className="vault-dial-status" role="status">
        {statusText}
      </p>
    </div>
  );
}
