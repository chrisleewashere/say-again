import type { A11ySettings } from '../engine/types';
import './game.css';

interface SettingsProps {
  a11y: A11ySettings;
  onChange: (patch: Partial<A11ySettings>) => void;
  onBack: () => void;
}

const OPTIONS: { key: keyof A11ySettings; label: string; hint: string }[] = [
  { key: 'largeText', label: 'Large text', hint: 'Bigger type everywhere in the app.' },
  { key: 'dyslexiaFont', label: 'Easier-reading text', hint: 'A plainer font with extra letter and line spacing.' },
  { key: 'highContrast', label: 'High contrast', hint: 'Darker backgrounds, brighter text.' },
  { key: 'reducedMotion', label: 'Reduce motion', hint: 'Skips flashing and movement effects.' },
];

export function Settings({ a11y, onChange, onBack }: SettingsProps) {
  return (
    <main className="screen">
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
                className={a11y[opt.key] ? 'btn-primary' : ''}
                onClick={() => onChange({ [opt.key]: !a11y[opt.key] })}
              >
                {a11y[opt.key] ? 'On' : 'Off'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card setup-section">
        <h2>Privacy</h2>
        <p className="home-sub" style={{ maxWidth: 'none' }}>
          This app collects nothing and sends nothing. Mission history and tallies live only on
          this device and can be deleted any time in the Logbook.
        </p>
      </section>
    </main>
  );
}
