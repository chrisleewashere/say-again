import { hashSeed } from './rng';

/**
 * The Static Protocol — scripted repair drills.
 *
 * Evidence base: the "stacked clarification request" paradigm (Brinton &
 * Fujiki et al., 1986) — a listener behind a visual barrier answers the
 * speaker's description with escalating NEUTRAL requests for clarification,
 * forcing multi-turn conversational repair. The Handler's printed manual
 * carries the protocol; the app only marks WHICH modules are static and how
 * deep the stack goes (SLP-set, 1-3). Phrases live here so the manual
 * generator and any in-app copy can never drift apart.
 */
export const REPAIR_REQUESTS: readonly string[] = [
  'Say again?',
  'What do you mean?',
  'I didn’t understand that.',
];

export const MAX_REPAIR_DEPTH = REPAIR_REQUESTS.length;

/** Clamp an SLP-chosen (or stored) drills value to the supported range. */
export function clampRepairDrills(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_REPAIR_DEPTH, Math.max(0, Math.round(value as number)));
}

/**
 * Which modules in a mission run the protocol. Seeded from the mission code
 * so replayed missions mark the same modules. Roughly every other module is
 * static, and at least one always is (a drills setting that marked nothing
 * would silently do nothing).
 */
export function staticModuleFlags(code: string, moduleCount: number, repairDrills: number): boolean[] {
  const drills = clampRepairDrills(repairDrills);
  if (drills === 0 || moduleCount <= 0) return Array.from({ length: Math.max(0, moduleCount) }, () => false);
  const flags = Array.from({ length: moduleCount }, (_, i) => hashSeed(`${code}:static:${i}`) % 2 === 0);
  if (!flags.some(Boolean)) {
    flags[hashSeed(`${code}:static-fallback`) % moduleCount] = true;
  }
  return flags;
}
