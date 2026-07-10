import { getModule } from '../engine/registry';
import { DIFFICULTY_LABELS, type MissionResult } from '../engine/types';
import './game.css';

interface DebriefProps {
  result: MissionResult;
  onReplaySame: () => void;
  onNewMission: () => void;
  onHome: () => void;
}

const OUTCOME_COPY: Record<MissionResult['outcome'], { title: string; body: string }> = {
  escaped: {
    title: 'Mission accomplished!',
    body: 'Great teamwork — clear descriptions, good questions, everyone escaped.',
  },
  alarm: {
    title: 'The alarm tripped — regroup!',
    body: 'The security system spotted you this time. Talk about what to ask each other next round, then try again.',
  },
  timeout: {
    title: 'Time ran out — so close!',
    body: 'The janitor locked the wing. Same mission code, same puzzles — plan your questions and go again.',
  },
  abandoned: {
    title: 'Mission paused',
    body: 'No problem — the mission code will bring these exact puzzles back any time.',
  },
};

export function Debrief({ result, onReplaySame, onNewMission, onHome }: DebriefProps) {
  const copy = OUTCOME_COPY[result.outcome];
  const minutes = Math.max(1, Math.round((result.endedAt - result.startedAt) / 60000));

  return (
    <main className="screen debrief-screen">
      <h1 className={result.outcome === 'escaped' ? 'debrief-win' : 'debrief-soft'}>{copy.title}</h1>
      <p className="home-sub">{copy.body}</p>

      <section className="card debrief-card" aria-label="Mission summary">
        <p className="debrief-meta">
          Mission <span className="mission-code">{result.code}</span> · about {minutes} min
        </p>
        <ul className="debrief-modules">
          {result.modules.map((m, i) => {
            const def = getModule(m.moduleId);
            return (
              <li key={i}>
                <span className={`debrief-dot ${m.solved ? 'debrief-dot-win' : 'debrief-dot-miss'}`} aria-hidden="true" />
                <span className="debrief-mod-name">{def.codename}</span>
                <span className="debrief-mod-detail">
                  {DIFFICULTY_LABELS[m.difficulty]} · {m.solved ? 'solved' : 'not solved'} · {m.strikes} alarm{m.strikes === 1 ? '' : 's'}
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
