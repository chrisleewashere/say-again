import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import {
  describeControl,
  solveBadIntel,
  type BadIntelAnswer,
  type BadIntelState,
  type PanelControl,
} from './logic';
import { CONTROL_TYPE_BY_ID, FLAG_LABEL, modelById } from './rules';
import './badIntel.css';

/**
 * Bad Intel: the Handler reads the panel model's printed service sequence
 * step by step; the Agent taps the one control each step names. Exactly one
 * step names hardware the panel does not have — the correct move there is
 * FLAG BAD INTEL, not a tap. Soft failure: a wrong tap or a wrong flag
 * strikes and leaves the panel unchanged.
 */
export function BadIntel({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<BadIntelState, BadIntelAnswer>) {
  const { controls } = instance.state;
  const model = modelById(instance.state.model);
  const expected = solveBadIntel(instance.state);
  const total = expected.length;

  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const done = step >= total;

  /** control index -> 1-based step it was serviced at (correct taps only) */
  const servicedAt = new Map<number, number>();
  expected.slice(0, step).forEach((move, i) => {
    if (move.kind === 'tap') servicedAt.set(move.control, i + 1);
  });

  function advance(flagged: boolean) {
    setMessage(flagged ? `Bad intel flagged on step ${step + 1} — good catch. Skip it and move on.` : null);
    const next = step + 1;
    setStep(next);
    if (next === total) onSolved();
  }

  function tapControl(index: number) {
    if (disabled || done || servicedAt.has(index)) return;
    const want = expected[step];
    const correct = want.kind === 'tap' && want.control === index;
    onAttempt?.(correct, [...expected.slice(0, step), { kind: 'tap', control: index }]);
    if (!correct) {
      setMessage(
        `The ${describeControl(controls[index]).toLowerCase()} does not match step ${step + 1} as printed. ` +
          'The panel is unchanged — read the step again together.',
      );
      onStrike();
      return;
    }
    advance(false);
  }

  function flagStep() {
    if (disabled || done) return;
    const correct = expected[step].kind === 'flag';
    onAttempt?.(correct, [...expected.slice(0, step), { kind: 'flag' }]);
    if (!correct) {
      setMessage(
        `Step ${step + 1} is not bad intel — something on this panel does match it. ` +
          'Ask your Handler to read the step again: what do you see that matches?',
      );
      onStrike();
      return;
    }
    advance(true);
  }

  return (
    <div className="bad-intel card" data-testid="module-bad-intel">
      <header className="module-header">
        <h2>Bad Intel</h2>
        <p className="module-sub">
          {model.name} — {controls.length} controls. Your Handler holds the service sequence for
          this model. Trust the panel, not the paper.
        </p>
      </header>

      <ol className="bi-steps" aria-label="Service sequence progress">
        {expected.map((move, i) => (
          <li
            key={i}
            className={`bi-step${
              i < step ? (move.kind === 'flag' ? ' bi-step-flagged' : ' bi-step-done') : i === step && !done ? ' bi-step-now' : ''
            }`}
            aria-label={`Step ${i + 1}: ${
              i < step ? (move.kind === 'flag' ? 'flagged as bad intel' : 'serviced') : i === step ? 'current' : 'not started'
            }`}
          >
            <span aria-hidden="true">{i < step ? (move.kind === 'flag' ? '⚑' : '✓') : i + 1}</span>
          </li>
        ))}
      </ol>

      <div className="bi-grid" role="group" aria-label="Maintenance panel controls">
        {controls.map((control, i) => {
          const serviced = servicedAt.get(i);
          return (
            <button
              key={i}
              className={`bi-card${serviced !== undefined ? ' bi-card-serviced' : ''}`}
              onClick={() => tapControl(i)}
              disabled={disabled || done || serviced !== undefined}
              aria-label={`${describeControl(control)}${
                serviced !== undefined ? `, serviced at step ${serviced}` : ''
              }`}
            >
              {serviced !== undefined && (
                <span className="bi-done-badge" aria-hidden="true">
                  ✓
                </span>
              )}
              <ControlArt control={control} />
              <span className="bi-card-meta" aria-hidden="true">
                <span className="bi-tag">{control.tag}</span>
                <span className="bi-set">SET {control.setting}</span>
              </span>
              <span className="bi-type-name" aria-hidden="true">
                {CONTROL_TYPE_BY_ID[control.type].label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      <button
        className="bi-flag-btn"
        onClick={flagStep}
        disabled={disabled || done}
        aria-label="Flag bad intel — this step names hardware the panel does not have"
      >
        <svg className="bi-flag-glyph" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 L22 20 L2 20 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="17.2" r="1.3" fill="currentColor" />
        </svg>
        {FLAG_LABEL}
      </button>

      <p className="module-status" role="status">
        {done
          ? `${message ? `${message} ` : ''}Panel serviced — sequence complete.`
          : `${message ? `${message} ` : ''}Step ${step + 1} of ${total} — the Handler reads the steps.`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hardware art. Pure decoration — the button's aria-label carries the  */
/* same facts (type, tag, setting) in words.                            */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

/** Needle/tick angle for a 1-8 setting, degrees clockwise from 12 o'clock. */
function dialAngle(step8: number): number {
  return -135 + (step8 - 1) * (270 / 7);
}

function ControlArt({ control }: { control: PanelControl }) {
  const { type, setting } = control;
  return (
    <svg className="bi-art" viewBox="0 0 120 100" aria-hidden="true">
      {type === 'dial' && (
        <g stroke="currentColor" fill="none" strokeWidth="3">
          <circle cx="60" cy="52" r="36" />
          {Array.from({ length: 8 }, (_, i) => {
            const t = dialAngle(i + 1) * DEG;
            return (
              <line
                key={i}
                x1={60 + 27 * Math.sin(t)}
                y1={52 - 27 * Math.cos(t)}
                x2={60 + 33 * Math.sin(t)}
                y2={52 - 33 * Math.cos(t)}
                strokeWidth="2"
              />
            );
          })}
          <line
            x1="60"
            y1="52"
            x2={60 + 24 * Math.sin(dialAngle(setting) * DEG)}
            y2={52 - 24 * Math.cos(dialAngle(setting) * DEG)}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="60" cy="52" r="4" fill="currentColor" stroke="none" />
        </g>
      )}
      {type === 'toggle' && (
        <g stroke="currentColor" fill="none" strokeWidth="3">
          <rect x="46" y="12" width="28" height="78" rx="14" />
          <circle cx="60" cy={setting >= 5 ? 28 : 74} r="12" fill="currentColor" stroke="none" />
        </g>
      )}
      {type === 'lever' && (
        <g stroke="currentColor" fill="none" strokeWidth="4">
          <rect x="34" y="84" width="52" height="10" rx="3" fill="currentColor" stroke="none" />
          <line
            x1="60"
            y1="84"
            x2={60 + 50 * Math.sin((setting <= 4 ? -35 : 35) * DEG)}
            y2={84 - 50 * Math.cos((setting <= 4 ? -35 : 35) * DEG)}
            strokeLinecap="round"
          />
          <circle
            cx={60 + 50 * Math.sin((setting <= 4 ? -35 : 35) * DEG)}
            cy={84 - 50 * Math.cos((setting <= 4 ? -35 : 35) * DEG)}
            r="9"
            fill="currentColor"
            stroke="none"
          />
        </g>
      )}
      {type === 'valve' && (
        <g stroke="currentColor" fill="none" strokeWidth="3.5">
          <circle cx="60" cy="52" r="34" />
          {[0, 1, 2].map((k) => {
            const t = setting * 15 * DEG + (k * 2 * Math.PI) / 3;
            return <line key={k} x1="60" y1="52" x2={60 + 32 * Math.sin(t)} y2={52 - 32 * Math.cos(t)} />;
          })}
          <circle cx="60" cy="52" r="7" fill="currentColor" stroke="none" />
        </g>
      )}
    </svg>
  );
}
