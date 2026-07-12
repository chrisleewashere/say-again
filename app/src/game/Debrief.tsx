import { gradeCopy, gradeMission, moduleScore } from '../engine/grade';
import { getModule } from '../engine/registry';
import { DIFFICULTY_LABELS, type MissionResult } from '../engine/types';
import './game.css';

interface DebriefProps {
  result: MissionResult;
  onReplaySame: () => void;
  onNewMission: () => void;
  onHome: () => void;
}

export function Debrief({ result, onReplaySame, onNewMission, onHome }: DebriefProps) {
  const grade = gradeMission(result.outcome, result.modules);
  const copy = gradeCopy(grade);
  const minutes = Math.max(1, Math.round((result.endedAt - result.startedAt) / 60000));
  const timedOut = result.outcome === 'timeout';

  return (
    <main className="screen debrief-screen">
      <div
        className={`debrief-grade debrief-grade-${grade.letter === 'I' ? 'i' : grade.score >= 80 ? 'good' : grade.score >= 60 ? 'mid' : 'low'}`}
        role="img"
        aria-label={grade.letter === 'I' ? 'Grade: incomplete' : `Mission grade ${grade.letter}, score ${grade.score} out of 100`}
      >
        <span className="debrief-grade-letter" aria-hidden="true">{grade.letter}</span>
        {grade.letter !== 'I' && (
          <span className="debrief-grade-score" aria-hidden="true">{grade.score}/100</span>
        )}
      </div>

      <h1 className={grade.score >= 80 ? 'debrief-win' : 'debrief-soft'}>{copy.title}</h1>
      <p className="home-sub">{timedOut ? `Time ran out. ${copy.body}` : copy.body}</p>

      <section className="card debrief-card" aria-label="Mission summary">
        <p className="debrief-meta">
          Mission <span className="mission-code">{result.code}</span> · about {minutes} min
        </p>
        <ul className="debrief-modules">
          {result.modules.map((m, i) => {
            const def = getModule(m.moduleId);
            const state = m.solved ? 'passed' : m.failed ? 'failed' : 'not reached';
            return (
              <li key={i}>
                <span
                  className={`debrief-dot ${m.solved ? 'debrief-dot-win' : 'debrief-dot-miss'}`}
                  aria-hidden="true"
                />
                <span className="debrief-mod-name">{def.codename}</span>
                <span className="debrief-mod-detail">
                  {DIFFICULTY_LABELS[m.difficulty]} · {state}
                  {m.solved || m.failed
                    ? ` · ${m.strikes} wrong · ${moduleScore(m)} pts`
                    : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="home-actions">
        <button className="btn-primary" onClick={onReplaySame}>Replay same mission</button>
        <button onClick={onNewMission}>New mission</button>
        <button onClick={onHome}>Home</button>
      </div>
    </main>
  );
}
