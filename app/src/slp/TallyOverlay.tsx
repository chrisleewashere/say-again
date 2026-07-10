import { useState } from 'react';
import type { TallyEvent, TallyResult } from './db';
import './slp.css';

/**
 * Discreet SLP data-collection overlay. Collapsed it is a small unobtrusive
 * dot in the corner; expanded it offers per-student correct/prompted/incorrect
 * taps. Students playing the game have no reason to touch it; it never
 * interrupts gameplay.
 */
export function TallyOverlay({ onTally }: { onTally: (e: TallyEvent) => void }) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  function tally(student: 'A' | 'B', result: TallyResult) {
    onTally({ at: Date.now(), student, result });
    setFlash(`${student}-${result}`);
    setTimeout(() => setFlash(null), 350);
  }

  if (!open) {
    return (
      <button
        className="tally-fab"
        aria-label="Open data tally (for the speech-language pathologist)"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 19 L4 12 M10 19 L10 7 M16 19 L16 10 M20 19 L20 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    );
  }

  const rows: { student: 'A' | 'B'; label: string }[] = [
    { student: 'A', label: 'Agent' },
    { student: 'B', label: 'Handler' },
  ];
  const cols: { result: TallyResult; label: string; cls: string }[] = [
    { result: 'correct', label: '+', cls: 'tally-good' },
    { result: 'prompted', label: 'P', cls: 'tally-mid' },
    { result: 'incorrect', label: '−', cls: 'tally-bad' },
  ];

  return (
    <div className="tally-panel" role="group" aria-label="SLP quick tally">
      <div className="tally-head">
        <span>Tally</span>
        <button className="tally-close" aria-label="Collapse tally panel" onClick={() => setOpen(false)}>×</button>
      </div>
      {rows.map((r) => (
        <div key={r.student} className="tally-row">
          <span className="tally-student">{r.label}</span>
          {cols.map((c) => (
            <button
              key={c.result}
              className={`tally-btn ${c.cls}${flash === `${r.student}-${c.result}` ? ' tally-flash' : ''}`}
              aria-label={`${r.label}: mark ${c.result}`}
              onClick={() => tally(r.student, c.result)}
            >
              {c.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
