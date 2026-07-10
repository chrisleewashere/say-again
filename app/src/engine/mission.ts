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

/**
 * Timer lengths derive from the same per-module minute estimates the setup
 * screen shows, so a "~16 min" mission never starts with a 6-minute clock.
 * Gentle = 1.5x the estimate; challenge = 0.9x.
 */
export function defaultTimerSeconds(mode: TimerMode, estimatedMinutes: number): number {
  switch (mode) {
    case 'relaxed':
      return 0;
    case 'gentle':
      return Math.ceil(estimatedMinutes * 60 * 1.5);
    case 'challenge':
      return Math.ceil(estimatedMinutes * 60 * 0.9);
  }
}

export function makeTimer(mode: TimerMode, specs: MissionModuleSpec[]): TimerConfig {
  return { mode, seconds: defaultTimerSeconds(mode, estimateMinutes(specs)) };
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
