/**
 * Deterministic seeded PRNG (mulberry32). Every puzzle instance is fully
 * determined by (moduleId, difficulty, seed) so missions are reproducible
 * and shareable as seed codes.
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a 32-bit seed (used to derive per-module seeds from a mission code). */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick from empty array');
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick n distinct items. */
export function sample<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  if (n > arr.length) throw new Error('sample larger than population');
  return shuffle(rng, arr).slice(0, n);
}

/** Human-friendly mission code, e.g. "FOX-492". Unambiguous letters only. */
const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export function generateMissionCode(rng: Rng): string {
  const letters = Array.from({ length: 3 }, () => pick(rng, [...CODE_LETTERS])).join('');
  const digits = randInt(rng, 100, 999);
  return `${letters}-${digits}`;
}
