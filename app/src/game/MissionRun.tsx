import { getModule } from '../engine/registry';
import type { A11ySettings, MissionConfig, MissionResult } from '../engine/types';
import { TallyOverlay } from '../slp/TallyOverlay';
import type { TallyEvent } from '../slp/db';
import { formatClock, useMissionRunner, type MissionRunner } from './useMissionRunner';
import { useMissionSfx } from './useMissionSfx';
import './game.css';

interface MissionRunProps {
  config: MissionConfig;
  a11y: A11ySettings;
  onFinish: (result: MissionResult, tallies: TallyEvent[]) => void;
}

/** Shared header used by both shells (End button, code, progress, alarms, clock). */
export function MissionHeader({ config, runner }: { config: MissionConfig; runner: MissionRunner }) {
  const { moduleIndex, instances, strikes, secondsLeft, timed, endConfirm, endEarly } = runner;
  return (
    <header className="run-header">
      <button
        onClick={endEarly}
        className={endConfirm ? 'btn-primary' : ''}
        aria-label={endConfirm ? 'Tap again to end the mission; progress and tallies will be saved' : 'End mission early'}
      >
        {endConfirm ? 'End now? Tap again' : 'End'}
      </button>
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
  );
}

/** Classic 2D shell — one module at a time, no scene. */
export function MissionRun({ config, a11y, onFinish }: MissionRunProps) {
  const runner = useMissionRunner(config, onFinish);
  useMissionSfx(runner);
  const instance = runner.instances[runner.moduleIndex];
  const def = getModule(instance.moduleId);

  return (
    <main className={`screen run-screen${runner.alarmFlash ? ' run-alarm-flash' : ''}`}>
      <MissionHeader config={config} runner={runner} />

      <div className="run-module-area">
        <def.Component
          key={runner.moduleIndex}
          instance={instance}
          onSolved={runner.handleSolved}
          onStrike={runner.handleStrike}
          a11y={a11y}
          disabled={runner.finished}
        />
      </div>

      <TallyOverlay onTally={runner.handleTally} />
    </main>
  );
}
