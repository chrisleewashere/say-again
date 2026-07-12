/**
 * "Graphics quality" Settings section — Auto/High/Medium/Low chips following
 * the existing chip pattern (see MissionSetup's Pace section).
 *
 * Self-contained: owns its own state via useQuality (persisted override in
 * localStorage), so it can be mounted anywhere inside Settings. State is
 * conveyed by aria-pressed + the bold chip-on treatment, never color alone.
 */

import { useSfx } from '../audio/useSfx';
import { useQuality } from './useQuality';
import type { QualityOverride, QualityTier } from './qualityManager';

const CHOICES: { value: QualityOverride; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const TIER_BLURBS: Record<QualityTier, string> = {
  high: 'full look — shadows, glow, and metal reflections',
  medium: 'glow and reflections, no shadows',
  low: 'flat lighting, best for older devices',
};

export function QualitySetting() {
  const quality = useQuality();
  const sfx = useSfx();
  const effective = quality.tier;

  return (
    <section className="card setup-section" aria-labelledby="settings-quality">
      <h2 id="settings-quality">Graphics quality</h2>
      <p className="home-sub" style={{ maxWidth: 'none' }}>
        How detailed the 3D briefcase looks. Auto picks the best look this device can keep
        smooth and quietly steps down if things get choppy. Puzzles play the same at every
        setting.
      </p>
      <div className="filter-row" role="group" aria-label="Graphics quality">
        {CHOICES.map((choice) => {
          const selected = quality.override === choice.value;
          return (
            <button
              key={choice.value}
              className={`chip${selected ? ' chip-on' : ''}`}
              aria-pressed={selected}
              onClick={() => {
                quality.setOverride(choice.value);
                sfx.play('buttonPress');
              }}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      <p className="home-sub" style={{ maxWidth: 'none' }} aria-live="polite">
        {quality.override === 'auto'
          ? `Auto is currently using ${effective}: ${TIER_BLURBS[effective]}.`
          : `${effective[0].toUpperCase()}${effective.slice(1)}: ${TIER_BLURBS[effective]}.`}
      </p>
    </section>
  );
}
