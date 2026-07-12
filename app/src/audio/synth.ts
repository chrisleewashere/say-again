/**
 * Analog/mechanical synthesis toolkit for "The Field Case".
 *
 * Everything is synthesized with the Web Audio API at call time — no audio
 * files, no network fetches, nothing decoded from assets. Each helper is a
 * pure function of (ctx, destination, opts): it builds its own node graph,
 * schedules it, and tears it down when playback ends.
 *
 * Design brief (docs/DESIGN_DIRECTION.md · Sound): warm, mechanical, never
 * harsh. Noise is always filtered, envelopes are short, and nothing clips.
 */

/* ------------------------------------------------------------------ */
/* Shared noise buffer (one second of white noise per context).        */
/* ------------------------------------------------------------------ */

const NOISE_SECONDS = 1;
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Lazily create (and cache) a 1s white-noise buffer for this context. */
export function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

/* ------------------------------------------------------------------ */
/* Envelope helper.                                                    */
/* ------------------------------------------------------------------ */

export interface EnvelopeOpts {
  /** Absolute schedule time (ctx.currentTime-based). */
  when: number;
  /** Linear attack in seconds. Clamped to half the duration. */
  attack?: number;
  /** Peak linear gain. */
  peak: number;
  /** Total sound length in seconds (attack + release). */
  duration: number;
}

/**
 * Create a gain node with a linear attack and an exponential-style release.
 * The node is connected to `destination`; callers connect sources into it.
 */
export function envelope(ctx: BaseAudioContext, destination: AudioNode, opts: EnvelopeOpts): GainNode {
  const { when, duration } = opts;
  const peak = Math.max(opts.peak, 0.0001);
  const attack = Math.min(opts.attack ?? 0.002, duration * 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  g.connect(destination);
  return g;
}

/* ------------------------------------------------------------------ */
/* Filtered noise burst.                                               */
/* ------------------------------------------------------------------ */

export interface NoiseBurstOpts {
  when?: number;
  /** Seconds. Default 0.08. */
  duration?: number;
  /** Peak gain 0..1. Default 0.5. */
  gain?: number;
  /** Attack seconds. Default 2ms. */
  attack?: number;
  /** Biquad filter type; omit for raw (rarely wanted). */
  filter?: BiquadFilterType;
  /** Filter start frequency in Hz. Default 1000. */
  frequency?: number;
  /** Optional filter frequency glide target (exponential ramp over duration). */
  frequencyEnd?: number;
  /** Filter resonance. Default 1. */
  q?: number;
}

/** A short burst of (optionally filtered, optionally swept) white noise. */
export function noiseBurst(ctx: BaseAudioContext, destination: AudioNode, opts: NoiseBurstOpts = {}): void {
  const when = opts.when ?? ctx.currentTime;
  const duration = opts.duration ?? 0.08;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  src.loop = true;

  let head: AudioNode = src;
  if (opts.filter) {
    const f = ctx.createBiquadFilter();
    f.type = opts.filter;
    f.frequency.setValueAtTime(Math.max(opts.frequency ?? 1000, 1), when);
    if (opts.frequencyEnd !== undefined) {
      f.frequency.exponentialRampToValueAtTime(Math.max(opts.frequencyEnd, 1), when + duration);
    }
    f.Q.value = opts.q ?? 1;
    head.connect(f);
    head = f;
  }

  const env = envelope(ctx, destination, {
    when,
    attack: opts.attack,
    peak: opts.gain ?? 0.5,
    duration,
  });
  head.connect(env);
  src.start(when);
  src.stop(when + duration + 0.05);
  src.onended = () => {
    src.disconnect();
    env.disconnect();
  };
}

/* ------------------------------------------------------------------ */
/* Tonal ping (sine/triangle with envelope, optional pitch glide).     */
/* ------------------------------------------------------------------ */

export interface PingOpts {
  when?: number;
  /** Start frequency in Hz. */
  freq: number;
  /** Optional glide target (exponential ramp over duration). */
  freqEnd?: number;
  /** 'sine' (lamp/glass) or 'triangle' (warmer, reedier). Default 'sine'. */
  type?: OscillatorType;
  /** Peak gain 0..1. Default 0.5. */
  gain?: number;
  /** Seconds. Default 0.15. */
  duration?: number;
  /** Attack seconds. Default 2ms; raise for soft blooms. */
  attack?: number;
}

/** A single enveloped oscillator ping. */
export function ping(ctx: BaseAudioContext, destination: AudioNode, opts: PingOpts): void {
  const when = opts.when ?? ctx.currentTime;
  const duration = opts.duration ?? 0.15;
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(Math.max(opts.freq, 1), when);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), when + duration);
  }
  const env = envelope(ctx, destination, {
    when,
    attack: opts.attack,
    peak: opts.gain ?? 0.5,
    duration,
  });
  osc.connect(env);
  osc.start(when);
  osc.stop(when + duration + 0.05);
  osc.onended = () => {
    osc.disconnect();
    env.disconnect();
  };
}

/* ------------------------------------------------------------------ */
/* Resonant mechanical 'thunk'.                                        */
/* ------------------------------------------------------------------ */

export interface ThunkOpts {
  when?: number;
  /** Overall peak gain 0..1. Default 0.8. */
  gain?: number;
  /** Seconds. Default 0.12. */
  duration?: number;
  /** Body start pitch in Hz (drops to ~a third of this). Default 150. */
  freq?: number;
}

/**
 * A latch/tape-deck thunk: short lowpassed noise (the mechanism) layered
 * with a fast sine pitch drop (the resonant body).
 */
export function thunk(ctx: BaseAudioContext, destination: AudioNode, opts: ThunkOpts = {}): void {
  const when = opts.when ?? ctx.currentTime;
  const duration = opts.duration ?? 0.12;
  const gain = opts.gain ?? 0.8;
  const freq = opts.freq ?? 150;
  noiseBurst(ctx, destination, {
    when,
    duration: duration * 0.6,
    gain: gain * 0.6,
    attack: 0.001,
    filter: 'lowpass',
    frequency: 340,
    frequencyEnd: 110,
    q: 1.2,
  });
  ping(ctx, destination, {
    when,
    freq,
    freqEnd: Math.max(freq * 0.33, 30),
    type: 'sine',
    gain,
    duration,
    attack: 0.001,
  });
}

/* ------------------------------------------------------------------ */
/* Relay click.                                                        */
/* ------------------------------------------------------------------ */

export interface ClickOpts {
  when?: number;
  /** Peak gain 0..1. Default 0.6. */
  gain?: number;
  /** Brighter (dial detent) vs duller (relay armature). Default false. */
  bright?: boolean;
}

/** A 2–4ms filtered noise tick — a relay armature or detent click. */
export function click(ctx: BaseAudioContext, destination: AudioNode, opts: ClickOpts = {}): void {
  noiseBurst(ctx, destination, {
    when: opts.when,
    duration: opts.bright ? 0.002 : 0.004,
    gain: opts.gain ?? 0.6,
    attack: 0.0005,
    filter: 'highpass',
    frequency: opts.bright ? 2600 : 1200,
    q: 0.7,
  });
}

/* ------------------------------------------------------------------ */
/* Low relay buzz (soft — used for the strike cue).                    */
/* ------------------------------------------------------------------ */

export interface BuzzOpts {
  when?: number;
  /** Buzz fundamental in Hz. Default 56 (mains-relay territory). */
  freq?: number;
  /** Peak gain 0..1. Default 0.7. */
  gain?: number;
  /** Seconds. Default 0.3. */
  duration?: number;
}

/**
 * A single low relay buzz: a sawtooth muffled through a gentle lowpass so it
 * reads as mechanical vibration, never a harsh alarm.
 */
export function buzz(ctx: BaseAudioContext, destination: AudioNode, opts: BuzzOpts = {}): void {
  const when = opts.when ?? ctx.currentTime;
  const duration = opts.duration ?? 0.3;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(opts.freq ?? 56, when);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(260, when);
  lp.Q.value = 0.8;
  const env = envelope(ctx, destination, {
    when,
    attack: 0.025,
    peak: opts.gain ?? 0.7,
    duration,
  });
  osc.connect(lp);
  lp.connect(env);
  osc.start(when);
  osc.stop(when + duration + 0.05);
  osc.onended = () => {
    osc.disconnect();
    lp.disconnect();
    env.disconnect();
  };
}

/* ------------------------------------------------------------------ */
/* Soft phosphor hum (continuous; caller stops it).                    */
/* ------------------------------------------------------------------ */

export interface HumOpts {
  /** Base frequency in Hz. Default 110. */
  freq?: number;
  /** Detune between the two sines in cents. Default 7. */
  detuneCents?: number;
  /** Steady-state gain — keep VERY low. Default 0.02. */
  gain?: number;
  /** Fade-in seconds. Default 0.6. */
  fadeIn?: number;
}

export interface HumHandle {
  /** Fade out (default 0.4s) and release all nodes. Safe to call twice. */
  stop(fadeSeconds?: number): void;
}

/**
 * A soft phosphor/electronics hum: two detuned low sines at very low gain.
 * Returns a handle; the caller owns the lifetime.
 */
export function hum(ctx: BaseAudioContext, destination: AudioNode, opts: HumOpts = {}): HumHandle {
  const now = ctx.currentTime;
  const freq = opts.freq ?? 110;
  const detune = opts.detuneCents ?? 7;
  const gain = opts.gain ?? 0.02;
  const fadeIn = opts.fadeIn ?? 0.6;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(Math.max(gain, 0.0001), now + fadeIn);
  g.connect(destination);

  const oscs = [-detune / 2, detune / 2].map((cents) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(cents, now);
    osc.connect(g);
    osc.start(now);
    return osc;
  });

  let stopped = false;
  return {
    stop(fadeSeconds = 0.4) {
      if (stopped) return;
      stopped = true;
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + fadeSeconds);
      for (const osc of oscs) {
        osc.stop(t + fadeSeconds + 0.05);
        osc.onended = () => osc.disconnect();
      }
      setTimeout(() => g.disconnect(), (fadeSeconds + 0.2) * 1000);
    },
  };
}
