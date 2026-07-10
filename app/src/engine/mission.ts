import { hashSeed, mulberry32, generateMissionCode } from './rng';
import { getModule } from './registry';
import type {
  Difficulty,
  MissionConfig,
  MissionModuleSpec,
  PuzzleInstance,
  TimerConfig,
  TimerMode,
} from './types';

/** Default (generous) timer lengths per mode, scaled by module count. */
export function defaultTimerSeconds(mode: TimerMode, moduleCount: number): number {
  switch (mode) {
    case 'relaxed':
      return 0;
    case 'gentle':
      return 240 * moduleCount;
    case 'challenge':
      return 120 * moduleCount;
  }
}

export function makeTimer(mode: TimerMode, moduleCount: number): TimerConfig {
  return { mode, seconds: defaultTimerSeconds(mode, moduleCount) };
}

export function newMissionCode(): string {
  // Non-deterministic entry point is fine here; everything downstream of the
  // code is deterministic.
  const rng = mulberry32((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
  return generateMissionCode(rng);
}

/**
 * Derive the deterministic puzzle instance for slot `index` of a mission.
 * Same mission code + same module list -> identical puzzles, so an SLP can
 * replay or share a mission by its code.
 */
export function instantiateModule(
  code: string,
  index: number,
  spec: MissionModuleSpec,
): PuzzleInstance {
  const def = getModule(spec.moduleId);
  const seed = hashSeed(`${code}:${index}:${spec.moduleId}:${spec.difficulty}`);
  return def.generate(seed, spec.difficulty);
}

export function instantiateMission(config: MissionConfig): PuzzleInstance[] {
  return config.modules.map((spec, i) => instantiateModule(config.code, i, spec));
}

/** Estimated mission length in minutes, for the ~20-minute-session workflow. */
export function estimateMinutes(specs: MissionModuleSpec[]): number {
  return specs.reduce((sum, s) => sum + getModule(s.moduleId).minutes[s.difficulty as Difficulty], 0);
}
