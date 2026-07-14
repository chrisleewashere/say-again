import { useEffect, useMemo, useRef, useState } from 'react';
import { instantiateMission } from '../engine/mission';
import { clampRepairDrills, staticModuleFlags } from '../engine/staticProtocol';
import type { MissionConfig, MissionResult, ModuleResult, PuzzleInstance } from '../engine/types';
import type { TallyEvent } from '../slp/db';

/**
 * All mission-running state and rules, shared verbatim by the classic 2D
 * shell and the 3D Field Case shell so the two can never diverge on game
 * behavior. Presentation-only concerns (alarm flash, camera, sounds) stay
 * in the shells.
 */
export interface MissionRunner {
  instances: PuzzleInstance[];
  moduleIndex: number;
  /** wrong answers on the CURRENT module (resets when the mission advances) */
  moduleStrikes: number;
  /** results recorded so far (passed and failed modules) */
  results: ModuleResult[];
  /** true for ~700ms after the current module fails (shell feedback) */
  moduleFailedFlash: boolean;
  secondsLeft: number;
  timed: boolean;
  finished: boolean;
  endConfirm: boolean;
  /** true for ~700ms after each strike, for shell-level feedback effects */
  alarmFlash: boolean;
  /** module indices already solved (always 0..moduleIndex-1; sequential) */
  solvedCount: number;
  /** Static Protocol: true when the CURRENT module runs repair drills */
  isStatic: boolean;
  /** Static Protocol stack depth for this mission (0 = off) */
  repairDrills: number;
  handleSolved: () => void;
  handleStrike: () => void;
  handleTally: (event: TallyEvent) => void;
  endEarly: () => void;
}

export function useMissionRunner(
  config: MissionConfig,
  onFinish: (result: MissionResult, tallies: TallyEvent[]) => void,
): MissionRunner {
  const instances = useMemo(() => instantiateMission(config), [config]);
  const repairDrills = clampRepairDrills(config.repairDrills);
  const staticFlags = useMemo(
    () => staticModuleFlags(config.code, instances.length, repairDrills),
    [config.code, instances.length, repairDrills],
  );
  const startedAt = useMemo(() => Date.now(), []);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [moduleStrikes, setModuleStrikes] = useState(0);
  const [moduleFailedFlash, setModuleFailedFlash] = useState(false);
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(config.timer.seconds);
  const [alarmFlash, setAlarmFlash] = useState(false);
  const [finished, setFinished] = useState(false);
  const [endConfirm, setEndConfirm] = useState(false);
  const endConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Two-tap confirm (native confirm dialogs are unreliable in sandboxed
  // webviews, and an in-app confirm reads better anyway).
  function endEarly() {
    if (!endConfirm) {
      setEndConfirm(true);
      if (endConfirmTimer.current) clearTimeout(endConfirmTimer.current);
      endConfirmTimer.current = setTimeout(() => setEndConfirm(false), 3500);
      return;
    }
    if (endConfirmTimer.current) clearTimeout(endConfirmTimer.current);
    finish('abandoned', padResults(results));
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

  /** Record the current module (passed or failed) and move on / finish. */
  function advance(moduleResult: ModuleResult) {
    const nextResults = [...results, moduleResult];
    setResults(nextResults);
    if (moduleIndex + 1 >= instances.length) {
      finish('complete', nextResults);
    } else {
      moduleStartRef.current = Date.now();
      moduleStrikesRef.current = 0;
      setModuleStrikes(0);
      setModuleIndex(moduleIndex + 1);
    }
  }

  function handleSolved() {
    const instance = instances[moduleIndex];
    advance({
      moduleId: instance.moduleId,
      difficulty: instance.difficulty,
      solved: true,
      strikes: moduleStrikesRef.current,
      hintsUsed: 0,
      elapsedMs: Date.now() - moduleStartRef.current,
    });
  }

  function handleStrike() {
    moduleStrikesRef.current += 1;
    setModuleStrikes(moduleStrikesRef.current);
    setAlarmFlash(true);
    setTimeout(() => setAlarmFlash(false), 700);
    // Too many wrong answers: THIS module fails and seals; the mission
    // continues — the end-of-mission grade carries the stakes.
    if (moduleStrikesRef.current >= config.maxStrikes) {
      const instance = instances[moduleIndex];
      setModuleFailedFlash(true);
      setTimeout(() => setModuleFailedFlash(false), 700);
      advance({
        moduleId: instance.moduleId,
        difficulty: instance.difficulty,
        solved: false,
        failed: true,
        strikes: moduleStrikesRef.current,
        hintsUsed: 0,
        elapsedMs: Date.now() - moduleStartRef.current,
      });
    }
  }

  function handleTally(event: TallyEvent) {
    tallies.current.push(event);
  }

  return {
    instances,
    moduleIndex,
    moduleStrikes,
    results,
    moduleFailedFlash,
    secondsLeft,
    timed,
    finished,
    endConfirm,
    alarmFlash,
    solvedCount: results.filter((r) => r.solved).length,
    isStatic: staticFlags[moduleIndex] ?? false,
    repairDrills,
    handleSolved,
    handleStrike,
    handleTally,
    endEarly,
  };
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
