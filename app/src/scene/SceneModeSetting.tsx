import type { SceneModePreference } from './useSceneMode';
import { webglAvailable } from './useSceneMode';
import '../game/game.css';

/**
 * Settings section for the mission presentation mode. Mounted from
 * Settings.tsx; kept in its own file so scene code stays out of the
 * game shell.
 */
export function SceneModeSetting({
  pref,
  onChange,
}: {
  pref: SceneModePreference;
  onChange: (p: SceneModePreference) => void;
}) {
  const options: { value: SceneModePreference; label: string; hint: string }[] = [
    { value: 'auto', label: 'Automatic', hint: 'Field Case on devices that support it.' },
    { value: '3d', label: 'Field Case (3D)', hint: 'The immersive briefcase.' },
    { value: '2d', label: 'Classic (2D)', hint: 'Flat panels — best with screen readers and switch access.' },
  ];
  return (
    <section className="card setup-section" aria-labelledby="settings-scene">
      <h2 id="settings-scene">Mission view</h2>
      <div className="filter-row" role="group" aria-label="Mission presentation mode">
        {options.map((o) => (
          <button
            key={o.value}
            className={`chip${pref === o.value ? ' chip-on' : ''}`}
            aria-pressed={pref === o.value}
            title={o.hint}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {!webglAvailable() && (
        <p className="setup-empty">This device doesn't support the 3D view, so missions use Classic mode.</p>
      )}
    </section>
  );
}
