/**
 * Named SFX cues for "The Field Case" — docs/DESIGN_DIRECTION.md · Sound.
 *
 * Every cue is a pure function of (ctx, destination): it synthesizes its
 * sound into a fresh per-cue gain bus (set from CUE_GAINS) connected to
 * `destination`, starting at ctx.currentTime. No audio files, no network.
 *
 * MIX DISCIPLINE (therapy setting — failure is never punished sonically):
 * `strikeBuzz` and `lockdown` are configured QUIETER than `solveKachunk`.
 * That invariant is asserted in audio.test.ts; if you retune CUE_GAINS,
 * keep the failure cues below the success cue.
 */

import { buzz, click, noiseBurst, ping, thunk } from './synth';

export type SfxCueName =
  | 'latchOpen'
  | 'lidCreak'
  | 'lampWarm'
  | 'buttonPress'
  | 'dialDetent'
  | 'wireSnip'
  | 'solveKachunk'
  | 'strikeBuzz'
  | 'needleSweep'
  | 'timerTick'
  | 'missionWin'
  | 'lockdown';

/** All cue names, for registry checks and tooling. */
export const SFX_CUE_NAMES: readonly SfxCueName[] = [
  'latchOpen',
  'lidCreak',
  'lampWarm',
  'buttonPress',
  'dialDetent',
  'wireSnip',
  'solveKachunk',
  'strikeBuzz',
  'needleSweep',
  'timerTick',
  'missionWin',
  'lockdown',
] as const;

/**
 * Per-cue bus gain (0..1]. This caps each cue's loudness relative to the
 * master bus. Ordering matters more than absolute values:
 *   failure (strikeBuzz, lockdown)  <  success (solveKachunk, missionWin).
 */
export const CUE_GAINS: Record<SfxCueName, number> = {
  latchOpen: 0.5,
  lidCreak: 0.22,
  lampWarm: 0.3,
  buttonPress: 0.4,
  dialDetent: 0.35,
  wireSnip: 0.45,
  solveKachunk: 0.6,
  strikeBuzz: 0.32, // MUST stay < solveKachunk (never punish failure)
  needleSweep: 0.28,
  timerTick: 0.24,
  missionWin: 0.55,
  lockdown: 0.38, // MUST stay < solveKachunk (soft fail — paused, not destroyed)
};

/** A cue schedules itself immediately (ctx.currentTime) into `destination`. */
export type SfxCue = (ctx: AudioContext, destination: AudioNode) => void;

/** Fresh per-cue bus so CUE_GAINS discipline is structural, not advisory. */
function bus(ctx: AudioContext, destination: AudioNode, name: SfxCueName): GainNode {
  const g = ctx.createGain();
  g.gain.value = CUE_GAINS[name];
  g.connect(destination);
  return g;
}

/* ------------------------------------------------------------------ */
/* Cue implementations.                                                */
/* ------------------------------------------------------------------ */

/** Case clasps flip, then the latch clunks free. */
function latchOpen(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'latchOpen');
  const t = ctx.currentTime;
  click(ctx, out, { when: t, gain: 0.8 });
  click(ctx, out, { when: t + 0.09, gain: 0.8 });
  thunk(ctx, out, { when: t + 0.2, gain: 0.9, freq: 145, duration: 0.15 });
}

/** Subtle hinge creak as the lid swings open. */
function lidCreak(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'lidCreak');
  const t = ctx.currentTime;
  noiseBurst(ctx, out, {
    when: t,
    duration: 0.45,
    gain: 0.6,
    attack: 0.12,
    filter: 'bandpass',
    frequency: 280,
    frequencyEnd: 620,
    q: 5,
  });
  noiseBurst(ctx, out, {
    when: t + 0.18,
    duration: 0.3,
    gain: 0.35,
    attack: 0.08,
    filter: 'bandpass',
    frequency: 520,
    frequencyEnd: 380,
    q: 6,
  });
}

/** Per-module soft bloom as an interior lamp warms up. */
function lampWarm(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'lampWarm');
  const t = ctx.currentTime;
  ping(ctx, out, {
    when: t,
    freq: 520,
    freqEnd: 660,
    type: 'triangle',
    gain: 0.7,
    duration: 0.38,
    attack: 0.12,
  });
  // faint filament shimmer under the bloom
  noiseBurst(ctx, out, {
    when: t,
    duration: 0.3,
    gain: 0.12,
    attack: 0.1,
    filter: 'highpass',
    frequency: 3200,
    q: 0.7,
  });
}

/** Tape-deck style button thunk. */
function buttonPress(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'buttonPress');
  const t = ctx.currentTime;
  click(ctx, out, { when: t, gain: 0.45 });
  thunk(ctx, out, { when: t, gain: 0.85, freq: 175, duration: 0.08 });
}

/** Single crisp dial detent. */
function dialDetent(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'dialDetent');
  const t = ctx.currentTime;
  click(ctx, out, { when: t, gain: 0.9, bright: true });
  noiseBurst(ctx, out, {
    when: t,
    duration: 0.012,
    gain: 0.4,
    attack: 0.001,
    filter: 'bandpass',
    frequency: 1900,
    q: 4,
  });
}

/** Wire cutter snap: bright snip plus a short falling twang. */
function wireSnip(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'wireSnip');
  const t = ctx.currentTime;
  noiseBurst(ctx, out, {
    when: t,
    duration: 0.03,
    gain: 0.9,
    attack: 0.001,
    filter: 'highpass',
    frequency: 2800,
    q: 0.9,
  });
  ping(ctx, out, {
    when: t + 0.005,
    freq: 900,
    freqEnd: 260,
    type: 'triangle',
    gain: 0.4,
    duration: 0.07,
    attack: 0.001,
  });
}

/** Module solved: mechanical kachunk, then a small warm lamp ping. */
function solveKachunk(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'solveKachunk');
  const t = ctx.currentTime;
  thunk(ctx, out, { when: t, gain: 1, freq: 150, duration: 0.18 });
  click(ctx, out, { when: t + 0.03, gain: 0.5 });
  ping(ctx, out, {
    when: t + 0.14,
    freq: 880,
    type: 'sine',
    gain: 0.5,
    duration: 0.3,
    attack: 0.01,
  });
}

/** Strike: a single low relay buzz. Deliberately soft — never a shriek. */
function strikeBuzz(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'strikeBuzz');
  const t = ctx.currentTime;
  buzz(ctx, out, { when: t, freq: 56, gain: 0.8, duration: 0.28 });
  click(ctx, out, { when: t, gain: 0.3 });
}

/** Alarm needle sweeping across the meter. */
function needleSweep(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'needleSweep');
  const t = ctx.currentTime;
  noiseBurst(ctx, out, {
    when: t,
    duration: 0.35,
    gain: 0.7,
    attack: 0.04,
    filter: 'bandpass',
    frequency: 320,
    frequencyEnd: 1100,
    q: 7,
  });
  click(ctx, out, { when: t + 0.35, gain: 0.35 });
}

/** Soft metronome tick for the low-timer state. */
function timerTick(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'timerTick');
  const t = ctx.currentTime;
  ping(ctx, out, { when: t, freq: 950, type: 'sine', gain: 0.7, duration: 0.045, attack: 0.001 });
}

/** Mission win: ascending multi-lamp ping sequence over a soft settle. */
function missionWin(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'missionWin');
  const t = ctx.currentTime;
  thunk(ctx, out, { when: t, gain: 0.6, freq: 130, duration: 0.14 });
  const lamps = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 — warm, resolved
  lamps.forEach((freq, i) => {
    ping(ctx, out, {
      when: t + 0.12 + i * 0.14,
      freq,
      type: 'sine',
      gain: 0.55,
      duration: 0.32,
      attack: 0.008,
    });
  });
}

/** Lockdown bars sliding over the modules — low and deliberate, not scary. */
function lockdown(ctx: AudioContext, destination: AudioNode): void {
  const out = bus(ctx, destination, 'lockdown');
  const t = ctx.currentTime;
  noiseBurst(ctx, out, {
    when: t,
    duration: 0.65,
    gain: 0.75,
    attack: 0.06,
    filter: 'lowpass',
    frequency: 480,
    frequencyEnd: 95,
    q: 1.4,
  });
  thunk(ctx, out, { when: t + 0.55, gain: 0.6, freq: 95, duration: 0.16 });
}

/* ------------------------------------------------------------------ */
/* Registry.                                                           */
/* ------------------------------------------------------------------ */

export const SFX_CUES: Record<SfxCueName, SfxCue> = {
  latchOpen,
  lidCreak,
  lampWarm,
  buttonPress,
  dialDetent,
  wireSnip,
  solveKachunk,
  strikeBuzz,
  needleSweep,
  timerTick,
  missionWin,
  lockdown,
};
