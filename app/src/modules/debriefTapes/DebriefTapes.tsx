import { useState } from 'react';
import type { ModuleComponentProps } from '../../engine/types';
import {
  describeScene,
  solveDebriefTapes,
  type DebriefTapesAnswer,
  type DebriefTapesState,
} from './logic';
import { CONNECTIVES, type Connective } from './rules';
import { SceneArt } from './SceneArt';
import './debriefTapes.css';

/**
 * Debrief Tapes: arrange shuffled surveillance stills into the mission
 * report's story order, link them with the right connectives, then retell
 * the whole operation out loud (the retell is prompted, not machine-judged —
 * the Handler and SLP are the judges of a telling).
 */
export function DebriefTapes({
  instance,
  onSolved,
  onStrike,
  onAttempt,
  disabled,
}: ModuleComponentProps<DebriefTapesState, DebriefTapesAnswer>) {
  const { scenes, connectivesRequired } = instance.state;
  const expected = solveDebriefTapes(instance.state);
  const total = scenes.length;

  /** display-index -> assigned report position (1-based), or null */
  const [assigned, setAssigned] = useState<(number | null)[]>(() => scenes.map(() => null));
  const [links, setLinks] = useState<Connective[]>([]);
  const [taped, setTaped] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const step = assigned.filter((a) => a !== null).length;
  const orderDone = step === total;
  const linksDone = !connectivesRequired || links.length === total - 1;
  const phase: 'order' | 'links' | 'retell' = !orderDone ? 'order' : !linksDone ? 'links' : 'retell';

  function tapScene(i: number) {
    if (disabled || taped || phase !== 'order' || assigned[i] !== null) return;
    const correct = expected.order[step] === i;
    onAttempt?.(correct, { order: [...expected.order.slice(0, step), i], connectives: [] });
    if (!correct) {
      setMessage(`Still ${scenes[i].letter} is not entry ${step + 1} of the report. The tape is unchanged — talk it through and try again.`);
      onStrike();
      return;
    }
    setMessage(null);
    setAssigned((a) => a.map((v, idx) => (idx === i ? step + 1 : v)));
  }

  function tapConnective(c: Connective) {
    if (disabled || taped || phase !== 'links') return;
    const junction = links.length;
    const correct = expected.connectives[junction] === c;
    onAttempt?.(correct, { order: expected.order, connectives: [...links, c] });
    if (!correct) {
      setMessage(`Not "${c.toUpperCase()}" — check the linking rules with your Handler.`);
      onStrike();
      return;
    }
    setMessage(null);
    setLinks((l) => [...l, c]);
  }

  function recordTape() {
    if (disabled || taped) return;
    setTaped(true);
    onSolved();
  }

  const junction = links.length;
  const fromScene = orderDone && !linksDone ? scenes[expected.order[junction]] : null;
  const toScene = orderDone && !linksDone ? scenes[expected.order[junction + 1]] : null;

  return (
    <div className="debrief-tapes card" data-testid="module-debrief-tapes">
      <header className="module-header">
        <h2>Debrief Tapes</h2>
        <p className="module-sub">
          {total} surveillance stills, out of order. Your Handler holds the report template.
          Rebuild the operation{connectivesRequired ? ', link the entries' : ''} — then tell the story.
        </p>
      </header>

      <div className="dt-grid" role="group" aria-label="Surveillance stills">
        {scenes.map((scene, i) => (
          <button
            key={i}
            className={`dt-card${assigned[i] !== null ? ' dt-card-locked' : ''}`}
            onClick={() => tapScene(i)}
            disabled={disabled || taped || phase !== 'order' || assigned[i] !== null}
            aria-label={`${describeScene(scene)}${assigned[i] !== null ? `, locked as report entry ${assigned[i]}` : ''}`}
          >
            {assigned[i] !== null && (
              <span className="dt-pos" aria-hidden="true">
                {assigned[i]}
              </span>
            )}
            <SceneArt scene={scene} />
          </button>
        ))}
      </div>

      {phase === 'links' && fromScene && toScene && (
        <div className="dt-links" role="group" aria-label={`Link report entry ${junction + 1} to entry ${junction + 2}`}>
          <p className="dt-links-prompt">
            Entry {junction + 1} (Still {fromScene.letter}) <span className="dt-blank" aria-label="blank">____</span> entry{' '}
            {junction + 2} (Still {toScene.letter}) — which word joins them?
          </p>
          <div className="dt-links-row">
            {CONNECTIVES.map((c) => (
              <button key={c} className="dt-link-btn" onClick={() => tapConnective(c)} disabled={disabled || taped}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'retell' && !taped && (
        <div className="dt-retell">
          <p>
            <strong>Record the debrief.</strong> Agent: retell the whole operation to your Handler,
            start to finish — use the linking words. Handler: check every entry is there, in order.
          </p>
          <button className="btn-primary" onClick={recordTape} disabled={disabled}>
            Tape recorded — deliver the debrief
          </button>
        </div>
      )}

      <p className="module-status" role="status">
        {taped
          ? 'Debrief delivered!'
          : `${message ? `${message} ` : ''}${
              phase === 'order'
                ? `Report entries locked: ${step} / ${total}`
                : phase === 'links'
                  ? `Links chosen: ${links.length} / ${total - 1}`
                  : 'Order complete — record the debrief.'
            }`}
      </p>
    </div>
  );
}
