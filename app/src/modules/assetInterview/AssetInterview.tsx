import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import {
  describeFact,
  solveAssetInterview,
  type AssetInterviewAnswer,
  type AssetInterviewState,
} from './logic';
import {
  FIELD_RULES,
  VERDICT_BY_ID,
  VERDICTS,
  type FactIcon,
  type VerdictIcon,
  type VerdictId,
} from './rules';
import './assetInterview.css';

/**
 * Fact icons. Every value is a distinct SHAPE (never color alone) and every
 * row also carries its text, so the icons are supportive, not load-bearing.
 * The manual's legend figure and the 3D face draw the same shapes.
 */
function FactIconArt({ icon }: { icon: FactIcon }) {
  switch (icon) {
    case 'dawn':
      return (
        <g>
          <line x1={6} y1={28} x2={34} y2={28} />
          <path d="M12 28 a8 8 0 0 1 16 0" />
          <line x1={20} y1={16} x2={20} y2={8} />
          <path d="M16 12 l4 -4 l4 4" fill="none" />
        </g>
      );
    case 'noon':
      return (
        <g>
          <circle cx={20} cy={20} r={7} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={20 + Math.cos(rad) * 10}
                y1={20 + Math.sin(rad) * 10}
                x2={20 + Math.cos(rad) * 14}
                y2={20 + Math.sin(rad) * 14}
              />
            );
          })}
        </g>
      );
    case 'dusk':
      return (
        <g>
          <line x1={6} y1={28} x2={34} y2={28} />
          <path d="M12 28 a8 8 0 0 1 16 0" />
          <line x1={20} y1={8} x2={20} y2={16} />
          <path d="M16 12 l4 4 l4 -4" fill="none" />
        </g>
      );
    case 'night':
      return (
        <g>
          <path d="M24 8 a12 12 0 1 0 0 24 a9.5 9.5 0 1 1 0 -24 z" fill="currentColor" stroke="none" />
          <path d="M31 12 l1.4 2.8 2.8 1.4 -2.8 1.4 -1.4 2.8 -1.4 -2.8 -2.8 -1.4 2.8 -1.4 z" fill="currentColor" stroke="none" />
        </g>
      );
    case 'tram':
      return (
        <g>
          <path d="M14 10 l6 -5 l6 5" fill="none" />
          <rect x={10} y={10} width={20} height={16} rx={3} />
          <rect x={13} y={14} width={5} height={5} />
          <rect x={22} y={14} width={5} height={5} />
          <circle cx={15} cy={29} r={2.5} />
          <circle cx={25} cy={29} r={2.5} />
        </g>
      );
    case 'cafe':
      return (
        <g>
          <path d="M10 18 h16 v8 a8 8 0 0 1 -16 0 z" />
          <path d="M26 20 h3 a3 3 0 0 1 0 6 h-3" fill="none" />
          <path d="M15 8 q2 3 0 6" fill="none" />
          <path d="M21 8 q2 3 0 6" fill="none" />
        </g>
      );
    case 'bridge':
      return (
        <g>
          <line x1={6} y1={20} x2={34} y2={20} />
          <line x1={6} y1={28} x2={34} y2={28} />
          <path d="M10 28 a10 10 0 0 1 20 0" fill="none" />
          <line x1={9} y1={20} x2={9} y2={12} />
          <line x1={31} y1={20} x2={31} y2={12} />
        </g>
      );
    case 'kiosk':
      return (
        <g>
          <path d="M8 16 l4 -7 h16 l4 7 z" />
          <rect x={11} y={16} width={18} height={14} />
          <rect x={15} y={20} width={10} height={5} />
        </g>
      );
    case 'case':
      return (
        <g>
          <rect x={9} y={15} width={22} height={15} rx={2} />
          <path d="M16 15 v-4 h8 v4" fill="none" />
          <line x1={9} y1={22} x2={31} y2={22} />
        </g>
      );
    case 'newspaper':
      return (
        <g>
          <rect x={9} y={11} width={18} height={19} />
          <path d="M27 13 h4 v17 h-4" fill="none" />
          <line x1={12} y1={16} x2={24} y2={16} />
          <line x1={12} y1={20} x2={24} y2={20} />
          <line x1={12} y1={24} x2={24} y2={24} />
        </g>
      );
    case 'flowers':
      return (
        <g>
          <circle cx={20} cy={7.5} r={3.2} />
          <circle cx={14.5} cy={13} r={3.2} />
          <circle cx={25.5} cy={13} r={3.2} />
          <circle cx={20} cy={13} r={2.4} fill="currentColor" stroke="none" />
          <path d="M20 17 v15" fill="none" />
          <path d="M20 26 q-6 -2 -7 -7" fill="none" />
        </g>
      );
    case 'nothing':
      return (
        <g>
          <circle cx={20} cy={20} r={10} />
          <line x1={15} y1={20} x2={25} y2={20} />
        </g>
      );
    case 'alone':
      return (
        <g>
          <circle cx={20} cy={13} r={5} />
          <path d="M10 32 a10 8 0 0 1 20 0" fill="none" />
        </g>
      );
    case 'companion':
      return (
        <g>
          <circle cx={14} cy={13} r={4} />
          <path d="M6 30 a8 7 0 0 1 16 0" fill="none" />
          <circle cx={27} cy={13} r={4} />
          <path d="M19 30 a8 7 0 0 1 16 0" fill="none" />
        </g>
      );
    case 'chalkYes':
      return (
        <g>
          <rect x={7} y={10} width={26} height={20} />
          <line x1={14} y1={15} x2={26} y2={25} />
          <line x1={26} y1={15} x2={14} y2={25} />
        </g>
      );
    case 'chalkNo':
      return (
        <g>
          <rect x={7} y={10} width={26} height={20} />
          <line x1={7} y1={20} x2={33} y2={20} />
          <line x1={20} y1={10} x2={20} y2={20} />
        </g>
      );
  }
}

function FactIconSvg({ icon }: { icon: FactIcon }) {
  return (
    <svg viewBox="0 0 40 40" className="ai-fact-svg" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <FactIconArt icon={icon} />
    </svg>
  );
}

/** Verdict badge shapes — one distinct silhouette per verdict. */
function VerdictIconArt({ icon }: { icon: VerdictIcon }) {
  switch (icon) {
    case 'star':
      return (
        <polygon
          points="20,7 23.7,15.3 32.8,16.2 26,22.3 27.9,31.2 20,26.6 12.1,31.2 14,22.3 7.2,16.2 16.3,15.3"
          fill="currentColor"
          stroke="none"
        />
      );
    case 'splitDiamond':
      return (
        <g>
          <path d="M20 6 L34 20 L20 34 Z" fill="currentColor" stroke="none" />
          <path d="M20 6 L6 20 L20 34 Z" fill="none" />
        </g>
      );
    case 'envelope':
      return (
        <g fill="none">
          <rect x={7} y={12} width={26} height={17} rx={2} />
          <path d="M8 13 L20 23 L32 13" />
        </g>
      );
    case 'ring':
      return <circle cx={20} cy={20} r={11} fill="none" strokeWidth={3.4} />;
    case 'flag':
      return (
        <g>
          <line x1={12} y1={7} x2={12} y2={33} />
          <path d="M12 9 h16 l-4.5 5.5 4.5 5.5 h-16 z" fill="currentColor" stroke="none" />
        </g>
      );
    case 'eye':
      return (
        <g>
          <path d="M7 20 q13 -13 26 0 q-13 13 -26 0 z" fill="none" />
          <circle cx={20} cy={20} r={4} fill="currentColor" stroke="none" />
        </g>
      );
  }
}

function VerdictIconSvg({ icon }: { icon: VerdictIcon }) {
  return (
    <svg viewBox="0 0 40 40" className="ai-verdict-svg" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <VerdictIconArt icon={icon} />
    </svg>
  );
}

/**
 * Asset Interview: the Agent holds the answers (the witness statement), the
 * Handler holds the questions (the printed question flow for this form).
 * The Handler walks the flow one question at a time; when it reaches a leaf,
 * they dictate the verdict and the Agent commits it.
 */
export function AssetInterview({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<AssetInterviewState, AssetInterviewAnswer>) {
  const { formId, facts } = instance.state;
  const [selected, setSelected] = useState<VerdictId | null>(null);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const correctVerdict = solveAssetInterview(instance.state);

  function toggleVerdict(id: VerdictId) {
    if (disabled || done) return;
    setSelected((prev) => (prev === id ? null : id));
  }

  function commit() {
    if (disabled || done || selected === null) return;
    const correct = selected === correctVerdict;
    onAttempt?.(correct, selected);
    if (!correct) {
      setMessage(
        `"${VERDICT_BY_ID[selected].label}" is not the verdict — the statement is unchanged. Ask your Handler to re-walk the flow out loud from step 1.`,
      );
      setSelected(null); // statement unchanged — soft failure, retry
      onStrike();
      return;
    }
    setMessage(null);
    setDone(true);
    onSolved();
  }

  const statusText = done
    ? `Verdict committed: ${VERDICT_BY_ID[correctVerdict].label}. Interview closed.`
    : message !== null
      ? message
      : selected !== null
        ? `"${VERDICT_BY_ID[selected].label}" selected. Press Commit verdict when your Handler dictates it.`
        : 'Read the form letter to your Handler, then answer their questions from the statement.';

  return (
    <div className="asset-interview card" data-testid="module-asset-interview">
      <header className="module-header">
        <h2>Asset Interview</h2>
        <p className="module-sub">
          A witness statement and six possible verdicts. Your Handler holds the questions — answer
          only what they ask.
        </p>
      </header>

      <section className="ai-statement" aria-label={`Witness statement, interview form ${formId}`}>
        <span className="ai-stamp" aria-label={`Interview form ${formId}`}>
          FORM {formId}
        </span>
        <ul className="ai-facts">
          {FIELD_RULES.map((field) => {
            const value = field.values.find((v) => v.id === facts[field.id])!;
            return (
              <li key={field.id} className="ai-fact" aria-label={describeFact(field.id, facts)}>
                <span className="ai-fact-icon" aria-hidden="true">
                  <FactIconSvg icon={value.icon} />
                </span>
                <span className="ai-fact-field" aria-hidden="true">
                  {field.label}:
                </span>
                <span className="ai-fact-value" aria-hidden="true">
                  {value.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="ai-verdicts" role="group" aria-label="Verdict buttons">
        {VERDICTS.map((v) => {
          const isSelected = selected === v.id;
          const isCommitted = done && v.id === correctVerdict;
          return (
            <button
              key={v.id}
              className={
                'ai-verdict' +
                (isSelected ? ' ai-verdict-selected' : '') +
                (isCommitted ? ' ai-verdict-committed' : '')
              }
              onClick={() => toggleVerdict(v.id)}
              disabled={disabled || done}
              aria-pressed={isSelected}
              aria-label={`Verdict: ${v.label}${isCommitted ? ', committed' : isSelected ? ', selected' : ''}`}
            >
              <span className="ai-verdict-icon" aria-hidden="true">
                <VerdictIconSvg icon={v.icon} />
              </span>
              <span className="ai-verdict-label">{v.label}</span>
            </button>
          );
        })}
      </div>

      <button
        className="btn-primary ai-commit"
        onClick={commit}
        disabled={disabled || done || selected === null}
        aria-label={
          selected === null
            ? 'Commit verdict (select a verdict first)'
            : `Commit verdict: ${VERDICT_BY_ID[selected].label}`
        }
      >
        Commit verdict
      </button>

      <p className="module-status" role="status">
        {statusText}
      </p>
    </div>
  );
}
