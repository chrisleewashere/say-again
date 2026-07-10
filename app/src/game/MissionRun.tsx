import { useEffect, useMemo, useRef, useState } from 'react';
import { instantiateMission } from '../engine/mission';
import { getModule } from '../engine/registry';
import type {
  A11ySettings,
  MissionConfig,
  MissionResult,
  ModuleResult,
} from '../engine/types';
import { TallyOverlay } from '../slp/TallyOverlay';
import type { TallyEvent } from '../slp/db';
import './game.css';

interface MissionRunProps {
  config: MissionConfig;
  a11y: A11ySettings;
  onFinish: (result: MissionResult, tallies: TallyEvent[]) => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MissionRun({ config, a11y, onFinish }: MissionRunProps) {
  const instances = useMemo(() => instantiateMission(config), [config]);
  const startedAt = useMemo(() => Date.now(), []);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(config.timer.seconds);
  const [alarmFlash, setAlarmFlash] = useState(false);
  const [finished, setFinished] = useState(false);
  const tallies = useRef<TallyEvent[]>([]);
  const moduleStartRef = useRef(Date.now());
  const moduleStrikesRef = useRef(0);
  const finishedRef = useRef(false);

  const timed = config.timer.mode !== 'relaxed';

  function buildResult(outcome: MissionResult['outcome'], extraResults: ModuleResult[]): MissionResult {
    return {
      code: config.code,
      startedAt,
      endedAt: Date.now(),
      outcome,
      timerMode: config.timer.mode,
      modules: extraResults,
    };
  }

  function finish(outcome: MissionResult['outcome'], finalResults: ModuleResult[]) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    onFinish(buildResult(outcome, finalResults), tallies.current);
  }

  function endEarly() {
    if (window.confirm('End this mission early? Progress and tallies will be saved.')) {
      finish('abandoned', padResults(results));
    }
  }

  /** Mark any unplayed/unfinished modules as unsolved for the record. */
  function padResults(done: ModuleResult[]): ModuleResult[] {
    const padded = [...done];
    for (let i = padded.length; i < instances.length; i++) {
      const inst = instances[i];
      padded.push({
        moduleId: inst.moduleId,
        difficulty: inst.difficulty,
        solved: false,
        strikes: i === moduleIndex ? moduleStrikesRef.current : 0,
        hintsUsed: 0,
        elapsedMs: i === moduleIndex ? Date.now() - moduleStartRef.current : 0,
      });
    }
    return padded;
  }

  useEffect(() => {
    if (!timed) return;
    // Deadline-based so the clock stays honest across backgrounding, screen
    // lock, and interval throttling (setInterval alone freezes on iOS).
    const deadline = startedAt + config.timer.seconds * 1000;
    const update = () =>
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 500);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed]);

  useEffect(() => {
    if (timed && secondsLeft === 0) {
      finish('timeout', padResults(results));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, timed]);

  const instance = instances[moduleIndex];
  const def = getModule(instance.moduleId);

  function handleSolved() {
    const moduleResult: ModuleResult = {
      moduleId: instance.moduleId,
      difficulty: instance.difficulty,
      solved: true,
      strikes: moduleStrikesRef.current,
      hintsUsed: 0,
      elapsedMs: Date.now() - moduleStartRef.current,
    };
    const nextResults = [...results, moduleResult];
    setResults(nextResults);
    if (moduleIndex + 1 >= instances.length) {
      finish('escaped', nextResults);
    } else {
      moduleStartRef.current = Date.now();
      moduleStrikesRef.current = 0;
      setModuleIndex(moduleIndex + 1);
    }
  }

  function handleStrike() {
    moduleStrikesRef.current += 1;
    setAlarmFlash(true);
    setTimeout(() => setAlarmFlash(false), 700);
    setStrikes((s) => {
      const next = s + 1;
      if (next >= config.maxStrikes) {
        finish('alarm', padResults(results));
      }
      return next;
    });
  }

  function handleTally(event: TallyEvent) {
    tallies.current.push(event);
  }

  return (
    <main className={`screen run-screen${alarmFlash ? ' run-alarm-flash' : ''}`}>
      <header className="run-header">
        <button onClick={endEarly} aria-label="End mission early">End</button>
        <span className="mission-code">{config.code}</span>
        <span className="run-progress" role="status">
          Puzzle {moduleIndex + 1} of {instances.length}
          {strikes > 0 ? ` · Alarms: ${strikes} of ${config.maxStrikes}` : ''}
        </span>
        <span className="run-alarms" role="img" aria-label={`${strikes} of ${config.maxStrikes} alarms used`}>
          {Array.from({ length: config.maxStrikes }, (_, i) => (
            <svg key={i} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
              <circle cx="10" cy="10" r="8" fill={i < strikes ? 'var(--danger)' : 'none'} stroke="var(--line)" strokeWidth="2" />
              {i < strikes && <text x="10" y="14" textAnchor="middle" fontSize="11" fill="#1a1205" fontWeight="bold">!</text>}
            </svg>
          ))}
        </span>
        {timed && (
          <span className={`run-clock${secondsLeft <= 30 ? ' run-clock-low' : ''}`} aria-label={`Time remaining ${formatClock(secondsLeft)}`}>
            {formatClock(secondsLeft)}
          </span>
        )}
      </header>

      <div className="run-module-area">
        <def.Component
          key={moduleIndex}
          instance={instance}
          onSolved={handleSolved}
          onStrike={handleStrike}
          a11y={a11y}
          disabled={finished}
        />
      </div>

      <TallyOverlay onTally={handleTally} />
    </main>
  );
}
