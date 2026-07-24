import { useEffect, useRef } from 'react';
import { playSfx, setTickLoop, useSfx } from '../audio/useSfx';
import { haptic } from './haptics';
import type { MissionRunner } from './useMissionRunner';

/**
 * Shell-level sound cues driven by mission state changes — used by both the
 * classic and Field Case shells so audio behavior stays identical.
 */
export function useMissionSfx(runner: MissionRunner): void {
  const { ticking } = useSfx();
  const prevStrikes = useRef(runner.moduleStrikes);

  // Ambient clockwork: ticks through the whole mission (toggleable in
  // Settings), accelerating when a real timer runs low.
  const timerLow = runner.timed && runner.secondsLeft <= 30 && runner.secondsLeft > 0;
  useEffect(() => {
    setTickLoop(!runner.finished && ticking, timerLow);
    return () => setTickLoop(false);
  }, [runner.finished, timerLow, ticking]);

  const prevSolved = useRef(runner.solvedCount);
  const prevFailed = useRef(runner.results.filter((r) => r.failed).length);

  useEffect(() => {
    // moduleStrikes resets to 0 when the mission advances — only an
    // increase is a wrong answer.
    if (runner.moduleStrikes > prevStrikes.current) {
      playSfx('strikeBuzz');
      haptic('wrong');
    }
    prevStrikes.current = runner.moduleStrikes;
  }, [runner.moduleStrikes]);

  useEffect(() => {
    if (runner.solvedCount > prevSolved.current) {
      playSfx('solveKachunk');
      haptic('solve');
    }
    prevSolved.current = runner.solvedCount;
  }, [runner.solvedCount]);

  useEffect(() => {
    const failed = runner.results.filter((r) => r.failed).length;
    if (failed > prevFailed.current) {
      playSfx('lockdown');
      haptic('fail');
    }
    prevFailed.current = failed;
  }, [runner.results]);
}
