import { useEffect, useRef } from 'react';
import { playSfx } from '../audio/useSfx';
import type { MissionRunner } from './useMissionRunner';

/**
 * Shell-level sound cues driven by mission state changes — used by both the
 * classic and Field Case shells so audio behavior stays identical.
 */
export function useMissionSfx(runner: MissionRunner): void {
  const prevStrikes = useRef(runner.strikes);
  const prevSolved = useRef(runner.solvedCount);

  useEffect(() => {
    if (runner.strikes > prevStrikes.current) {
      playSfx('strikeBuzz');
    }
    prevStrikes.current = runner.strikes;
  }, [runner.strikes]);

  useEffect(() => {
    if (runner.solvedCount > prevSolved.current) {
      playSfx('solveKachunk');
    }
    prevSolved.current = runner.solvedCount;
  }, [runner.solvedCount]);
}
