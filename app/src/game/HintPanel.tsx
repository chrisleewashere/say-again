import { getModule } from '../engine/registry';
import type { MissionRunner } from './useMissionRunner';
import './game.css';

/**
 * Escalating hints, shared by both shells. The first hint always points the
 * pair back to the manual (the manual IS the help system); later hints come
 * from the module's own coaching list. Hints coach the communication — they
 * never reveal instance answers — and every use is logged in the module's
 * result (hintsUsed) for the SLP's data.
 */
export function HintPanel({ runner }: { runner: MissionRunner }) {
  const def = getModule(runner.instances[runner.moduleIndex].moduleId);
  const hints = [
    `Handler: find the “${def.codename}” pages in the manual and read the intro out loud together.`,
    ...(def.hints ?? []),
  ];
  const shown = Math.min(runner.hintsUsed, hints.length);
  const remaining = hints.length - shown;

  return (
    <div className="hint-panel">
      <button
        className="hint-btn"
        onClick={runner.takeHint}
        disabled={remaining === 0 || runner.finished}
        aria-label={remaining === 0 ? 'No hints left for this puzzle' : `Take a hint (${remaining} left; hints are logged)`}
      >
        Hint{remaining > 0 ? ` (${remaining})` : ''}
      </button>
      {shown > 0 && (
        <p className="hint-text" role="status">
          {hints[shown - 1]}
        </p>
      )}
    </div>
  );
}
