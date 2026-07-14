import { getModule } from '../engine/registry';
import type { A11ySettings, MissionConfig, MissionResult } from '../engine/types';
import { TallyOverlay } from '../slp/TallyOverlay';
import type { TallyEvent } from '../slp/db';
import { ModuleLamp, type LampState } from './ModuleLamp';
import { StaticBadge } from './StaticBadge';
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
  const { moduleIndex, instances, moduleStrikes, results, secondsLeft, timed, endConfirm, endEarly } = runner;
  const failedCount = results.filter((r) => r.failed).length;
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
        {moduleStrikes > 0 ? ` · Wrong: ${moduleStrikes} of ${config.maxStrikes}` : ''}
        {failedCount > 0 ? ` · Failed modules: ${failedCount}` : ''}
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
  const lampState: LampState = runner.moduleFailedFlash
    ? 'failed'
    : runner.alarmFlash
      ? 'wrong'
      : 'active';

  return (
    <main className={`screen run-screen${runner.alarmFlash ? ' run-alarm-flash' : ''}`}>
      <MissionHeader config={config} runner={runner} />

      <div className="run-module-area">
        <div className="run-module-frame">
          <div className="run-module-lamp">
            {runner.isStatic && <StaticBadge depth={runner.repairDrills} />}
            <ModuleLamp state={lampState} wrongs={runner.moduleStrikes} limit={config.maxStrikes} />
          </div>
          <def.Component
            key={runner.moduleIndex}
            instance={instance}
            onSolved={runner.handleSolved}
            onStrike={runner.handleStrike}
            a11y={a11y}
            disabled={runner.finished}
          />
        </div>
      </div>

      <TallyOverlay onTally={runner.handleTally} />
    </main>
  );
}
