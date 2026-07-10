import { useMemo, useState } from 'react';
import { getModule } from './engine/registry';
import { hashSeed } from './engine/rng';
import type { A11ySettings, Difficulty } from './engine/types';

const a11y: A11ySettings = {
  dyslexiaFont: false,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
};

/**
 * Temporary dev playground — replaced by the real gameplay shell.
 * Renders any registered module at any difficulty with a reroll button.
 */
function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [nonce, setNonce] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [solved, setSolved] = useState(false);

  const def = getModule('wire-maze');
  const instance = useMemo(
    () => def.generate(hashSeed(`dev:${nonce}:${difficulty}`), difficulty),
    [def, nonce, difficulty],
  );

  return (
    <main style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {([1, 2, 3] as Difficulty[]).map((d) => (
          <button key={d} className={d === difficulty ? 'btn-primary' : ''} onClick={() => { setDifficulty(d); setSolved(false); setStrikes(0); }}>
            Tier {d}
          </button>
        ))}
        <button onClick={() => { setNonce((n) => n + 1); setSolved(false); setStrikes(0); }}>Reroll</button>
      </div>
      <def.Component
        key={`${nonce}:${difficulty}`}
        instance={instance}
        onSolved={() => setSolved(true)}
        onStrike={() => setStrikes((s) => s + 1)}
        a11y={a11y}
        disabled={false}
      />
      <p>Strikes: {strikes} {solved ? '— SOLVED' : ''}</p>
    </main>
  );
}

export default App;
