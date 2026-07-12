import { useEffect, useRef } from 'react';
import { playSfx } from '../audio/useSfx';
import type { MissionRunner } from './useMissionRunner';

/**
 * Shell-level sound cues driven by mission state changes — used by both the
 * classic and Field Case shells so audio behavior stays identical.
 */
export function useMissionSfx(runner: MissionRunner): void {
  const prevStrikes = useRef(runner.moduleStrikes);
  const prevSolved = useRef(runner.solvedCount);
  const prevFailed = useRef(runner.results.filter((r) => r.failed).length);

  useEffect(() => {
    // moduleStrikes resets to 0 when the mission advances — only an
    // increase is a wrong answer.
    if (runner.moduleStrikes > prevStrikes.current) {
      playSfx('strikeBuzz');
    }
    prevStrikes.current = runner.moduleStrikes;
  }, [runner.moduleStrikes]);

  useEffect(() => {
    if (runner.solvedCount > prevSolved.current) {
      playSfx('solveKachunk');
    }
    prevSolved.current = runner.solvedCount;
  }, [runner.solvedCount]);

  useEffect(() => {
    const failed = runner.results.filter((r) => r.failed).length;
    if (failed > prevFailed.current) {
      playSfx('lockdown');
    }
    prevFailed.current = failed;
  }, [runner.results]);
}
