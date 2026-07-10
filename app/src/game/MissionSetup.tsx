import { useEffect, useMemo, useRef, useState } from 'react';
import { allModules } from '../engine/registry';
import { findSessionByCode } from '../slp/db';
import { estimateMinutes, makeTimer, newMissionCode } from '../engine/mission';
import {
  DIFFICULTY_LABELS,
  THERAPY_TARGET_LABELS,
  type Difficulty,
  type MissionConfig,
  type MissionModuleSpec,
  type TherapyTarget,
  type TimerMode,
} from '../engine/types';
import './game.css';

interface MissionSetupProps {
  /** Pre-filled mission code when replaying; otherwise a fresh one is generated. */
  replayCode?: string;
  onStart: (config: MissionConfig, students: { a: string; b: string }) => void;
  onBack: () => void;
}

const TARGET_FILTERS: (TherapyTarget | 'all')[] = ['all', 'receptive', 'expressive', 'pragmatics', 'vocabulary'];

export function MissionSetup({ replayCode, onStart, onBack }: MissionSetupProps) {
  const modules = allModules();
  const [filter, setFilter] = useState<TherapyTarget | 'all'>('all');
  const [picked, setPicked] = useState<MissionModuleSpec[]>([]);
  const [timerMode, setTimerMode] = useState<TimerMode>('relaxed');
  const [maxStrikes, setMaxStrikes] = useState(3);
  const [studentA, setStudentA] = useState('');
  const [studentB, setStudentB] = useState('');
  const [replayNotice, setReplayNotice] = useState<string | null>(null);
  // Once the user touches the form, a late-arriving replay restore must not
  // overwrite their edits (IndexedDB reads can lag on iOS).
  const dirtyRef = useRef(false);

  const code = useMemo(() => replayCode ?? newMissionCode(), [replayCode]);

  // A mission code only rebuilds the same puzzles if the module list and
  // difficulties match too — restore them from the logbook when replaying.
  useEffect(() => {
    if (!replayCode) return;
    let cancelled = false;
    void findSessionByCode(replayCode).then((session) => {
      if (cancelled) return;
      if (!session) {
        setReplayNotice(
          `No saved session found for ${replayCode} on this device — rebuild the same puzzle list to get the same mission.`,
        );
        return;
      }
      if (dirtyRef.current) {
        setReplayNotice(
          `Found a saved ${replayCode} session, but you already started building — keeping your choices.`,
        );
        return;
      }
      setPicked(session.modules.map((m) => ({ moduleId: m.moduleId, difficulty: m.difficulty })));
      setTimerMode(session.timerMode);
      setMaxStrikes(session.maxStrikes ?? 3);
      setStudentA(session.studentA);
      setStudentB(session.studentB);
      setReplayNotice(`Restored the puzzle list from the last ${replayCode} session.`);
    });
    return () => {
      cancelled = true;
    };
  }, [replayCode]);
  const visible = filter === 'all'
    ? modules
    : modules.filter((m) => m.targets.primary === filter || m.targets.secondary.includes(filter));
  const minutes = estimateMinutes(picked);

  function addModule(moduleId: string, difficulty: Difficulty) {
    dirtyRef.current = true;
    setPicked((p) => [...p, { moduleId, difficulty }]);
  }

  function removeAt(i: number) {
    dirtyRef.current = true;
    setPicked((p) => p.filter((_, idx) => idx !== i));
  }

  function start() {
    onStart(
      {
        code,
        modules: picked,
        timer: makeTimer(timerMode, picked),
        maxStrikes,
        hintsAllowed: true,
      },
      { a: studentA.trim(), b: studentB.trim() },
    );
  }

  return (
    <main className="screen setup-screen">
      <header className="screen-header">
        <button onClick={onBack} aria-label="Back to home">&larr; Back</button>
        <h1>Mission Setup</h1>
        <span className="mission-code" aria-label={`Mission code ${code}`}>{code}</span>
      </header>

      {replayNotice && (
        <p className="setup-replay-notice" role="status">{replayNotice}</p>
      )}

      <section className="card setup-section" aria-labelledby="setup-students">
        <h2 id="setup-students">Team (optional — initials only)</h2>
        <div className="setup-students-row">
          <label>
            Field Agent
            <input value={studentA} onChange={(e) => { dirtyRef.current = true; setStudentA(e.target.value); }} maxLength={12} placeholder="e.g. JD" />
          </label>
          <label>
            Handler
            <input value={studentB} onChange={(e) => { dirtyRef.current = true; setStudentB(e.target.value); }} maxLength={12} placeholder="e.g. MK" />
          </label>
        </div>
      </section>

      <section className="card setup-section" aria-labelledby="setup-modules">
        <h2 id="setup-modules">Puzzles</h2>
        <div className="filter-row" role="group" aria-label="Filter puzzles by communication goal">
          {TARGET_FILTERS.map((t) => (
            <button
              key={t}
              className={`chip${filter === t ? ' chip-on' : ''}`}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t === 'all' ? 'All goals' : THERAPY_TARGET_LABELS[t]}
            </button>
          ))}
        </div>

        <ul className="module-list">
          {visible.map((m) => (
            <li key={m.id} className="module-card">
              <div className="module-card-info">
                <strong>{m.codename}</strong>
                <p>{m.tagline}</p>
                <p className="module-card-targets">
                  {THERAPY_TARGET_LABELS[m.targets.primary]}
                  {m.targets.secondary.length > 0 && (
                    <span className="module-card-secondary"> · {m.targets.secondary.map((t) => THERAPY_TARGET_LABELS[t]).join(' · ')}</span>
                  )}
                </p>
              </div>
              <div className="module-card-add" role="group" aria-label={`Add ${m.codename} at a difficulty`}>
                {([1, 2, 3] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => addModule(m.id, d)} aria-label={`Add ${m.codename}, ${DIFFICULTY_LABELS[d]} difficulty, about ${m.minutes[d]} minutes`}>
                    + {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card setup-section" aria-labelledby="setup-picked">
        <h2 id="setup-picked">This mission ({picked.length} puzzle{picked.length === 1 ? '' : 's'}, ~{minutes} min)</h2>
        {picked.length === 0 ? (
          <p className="setup-empty">Add puzzles above. For a ~20 minute session, 2–3 puzzles works well.</p>
        ) : (
          <ol className="picked-list">
            {picked.map((p, i) => {
              const def = modules.find((m) => m.id === p.moduleId)!;
              return (
                <li key={i}>
                  <span>{def.codename} — {DIFFICULTY_LABELS[p.difficulty]}</span>
                  <button onClick={() => removeAt(i)} aria-label={`Remove ${def.codename} from mission`}>Remove</button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="card setup-section" aria-labelledby="setup-pace">
        <h2 id="setup-pace">Pace</h2>
        <div className="filter-row" role="group" aria-label="Timer mode">
          {(['relaxed', 'gentle', 'challenge'] as TimerMode[]).map((m) => (
            <button key={m} className={`chip${timerMode === m ? ' chip-on' : ''}`} aria-pressed={timerMode === m} onClick={() => { dirtyRef.current = true; setTimerMode(m); }}>
              {m === 'relaxed' ? 'Relaxed — no timer' : m === 'gentle' ? 'Gentle timer' : 'Challenge timer'}
            </button>
          ))}
        </div>
        <div className="filter-row" role="group" aria-label="Alarm tolerance">
          {[2, 3, 5].map((n) => (
            <button key={n} className={`chip${maxStrikes === n ? ' chip-on' : ''}`} aria-pressed={maxStrikes === n} onClick={() => { dirtyRef.current = true; setMaxStrikes(n); }}>
              {n} alarms allowed
            </button>
          ))}
        </div>
      </section>

      <button className="btn-primary home-big-btn" disabled={picked.length === 0} onClick={start}>
        Start Mission
      </button>
    </main>
  );
}
