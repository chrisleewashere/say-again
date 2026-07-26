import type { A11ySettings } from '../engine/types';
import { QualitySetting } from '../quality/QualitySetting';
import { SceneModeSetting } from '../scene/SceneModeSetting';
import type { SceneModePreference } from '../scene/useSceneMode';
import { useSfx } from '../audio/useSfx';
import './game.css';
import './crt.css';

interface SettingsProps {
  a11y: A11ySettings;
  onChange: (patch: Partial<A11ySettings>) => void;
  scenePref: SceneModePreference;
  onSceneChange: (p: SceneModePreference) => void;
  onBack: () => void;
}

const OPTIONS: { key: keyof A11ySettings; label: string; hint: string }[] = [
  { key: 'largeText', label: 'Large text', hint: 'Bigger type everywhere in the app.' },
  { key: 'dyslexiaFont', label: 'Easier-reading text', hint: 'A plainer font with extra letter and line spacing.' },
  { key: 'highContrast', label: 'High contrast', hint: 'Darker backgrounds, brighter text.' },
  { key: 'reducedMotion', label: 'Reduce motion', hint: 'Skips flashing and movement effects.' },
];

export function Settings({ a11y, onChange, scenePref, onSceneChange, onBack }: SettingsProps) {
  const sfx = useSfx();
  const volumePercent = Math.round(sfx.volume * 100);

  return (
    <main className="screen crt">
      <div className="fi-frame">
        <header className="screen-header">
          <button onClick={onBack} aria-label="Back to home">&larr; Back</button>
          <h1>Settings</h1>
        </header>

        <section className="card setup-section" aria-labelledby="settings-a11y">
          <h2 id="settings-a11y">Reading &amp; display</h2>
          <ul className="module-list">
            {OPTIONS.map((opt) => (
              <li key={opt.key} className="module-card">
                <div className="module-card-info">
                  <strong>{opt.label}</strong>
                  <p>{opt.hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={a11y[opt.key]}
                  aria-label={opt.label}
                  className={`fi-switch${a11y[opt.key] ? ' btn-primary' : ''}`}
                  onClick={() => onChange({ [opt.key]: !a11y[opt.key] })}
                >
                  {a11y[opt.key] ? 'On' : 'Off'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card setup-section" aria-labelledby="settings-sound">
          <h2 id="settings-sound">Sound</h2>
          <ul className="module-list">
            <li className="module-card">
              <div className="module-card-info">
                <strong>Sound effects</strong>
                <p>Latches, dials, and lamp pings. Failure sounds always stay soft.</p>
              </div>
              <button
                role="switch"
                aria-checked={!sfx.muted}
                aria-label="Sound effects"
                className={`fi-switch${!sfx.muted ? ' btn-primary' : ''}`}
                onClick={() => {
                  const nowMuted = !sfx.muted;
                  sfx.setMuted(nowMuted);
                  if (!nowMuted) sfx.play('buttonPress');
                }}
              >
                {sfx.muted ? 'Off' : 'On'}
              </button>
            </li>
            <li className="module-card">
              <div className="module-card-info">
                <strong>
                  <label htmlFor="settings-sfx-volume">Volume</label>
                </strong>
                <p>How loud sound effects play.</p>
              </div>
              <input
                id="settings-sfx-volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={volumePercent}
                disabled={sfx.muted}
                aria-valuetext={`${volumePercent}%`}
                onChange={(e) => sfx.setVolume(Number(e.currentTarget.value) / 100)}
                onPointerUp={() => sfx.play('dialDetent')}
                onKeyUp={() => sfx.play('dialDetent')}
              />
              <span className="fi-meter" aria-hidden="true">{volumePercent}%</span>
            </li>
            <li className="module-card">
              <div className="module-card-info">
                <strong>Mission clock ticking</strong>
                <p>A quiet clockwork tick during missions for a little pressure. Speeds up when a timer runs low.</p>
              </div>
              <button
                role="switch"
                aria-checked={sfx.ticking}
                aria-label="Mission clock ticking"
                className={`fi-switch${sfx.ticking ? ' btn-primary' : ''}`}
                onClick={() => {
                  sfx.setTicking(!sfx.ticking);
                  if (!sfx.ticking) sfx.play('timerTick');
                }}
                disabled={sfx.muted}
              >
                {sfx.ticking ? 'On' : 'Off'}
              </button>
            </li>
          </ul>
        </section>

        <SceneModeSetting pref={scenePref} onChange={onSceneChange} />

        <QualitySetting />

        <section className="card setup-section">
          <h2>Privacy</h2>
          <p className="fi-prose">
            This app collects nothing and sends nothing. Mission history and tallies live only on
            this device and can be deleted any time in the Logbook.
          </p>
        </section>
      </div>
    </main>
  );
}
