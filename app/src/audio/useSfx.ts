/**
 * SFX playback singleton + React hook.
 *
 * - Lazy AudioContext: created on the first play() call, which the app makes
 *   from a user gesture (tap/click) — required for iOS/Safari autoplay rules.
 * - Master gain bus applies the user's volume; mute short-circuits play().
 * - Volume/mute persist to localStorage under 'ky-audio'.
 *
 * Components use the `useSfx()` hook; non-component callers (engine code,
 * event handlers outside React) use the plain `playSfx` / `setSfxVolume` /
 * `setSfxMuted` functions — they share the same singleton state.
 */

import { useSyncExternalStore } from 'react';
import { SFX_CUES, type SfxCueName } from './sfx';

export const AUDIO_STORAGE_KEY = 'ky-audio';

export interface AudioPrefs {
  /** Master SFX volume, 0..1. */
  volume: number;
  muted: boolean;
}

export const DEFAULT_AUDIO_PREFS: AudioPrefs = { volume: 0.8, muted: false };

/** Clamp to 0..1; non-finite input falls back to the default volume. */
export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return DEFAULT_AUDIO_PREFS.volume;
  return Math.min(1, Math.max(0, v));
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage disabled (some private modes throw on access)
  }
}

/** Load persisted prefs; tolerant of missing keys, bad JSON, wrong types. */
export function loadAudioPrefs(storage: StorageLike | null = defaultStorage()): AudioPrefs {
  if (!storage) return { ...DEFAULT_AUDIO_PREFS };
  try {
    const raw = storage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_PREFS };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_AUDIO_PREFS };
    const p = parsed as Partial<AudioPrefs>;
    return {
      volume: clampVolume(typeof p.volume === 'number' ? p.volume : DEFAULT_AUDIO_PREFS.volume),
      muted: typeof p.muted === 'boolean' ? p.muted : DEFAULT_AUDIO_PREFS.muted,
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

/** Persist prefs; silently no-ops if storage is unavailable. */
export function saveAudioPrefs(prefs: AudioPrefs, storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // private mode / quota — prefs still apply for this session
  }
}

/* ------------------------------------------------------------------ */
/* Module-level singleton.                                             */
/* ------------------------------------------------------------------ */

let prefs: AudioPrefs = loadAudioPrefs();
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function applyMasterGain(): void {
  if (!ctx || !masterGain) return;
  const target = prefs.muted ? 0 : prefs.volume;
  const t = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setTargetAtTime(target, t, 0.03); // short ramp: no zipper noise
}

/**
 * Create (or resume) the shared AudioContext. Must first be reached from a
 * user gesture on iOS; play() is only ever called from interactions, so the
 * lazy path satisfies that naturally.
 */
function ensureAudio(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    masterGain = ctx.createGain();
    masterGain.gain.value = prefs.muted ? 0 : prefs.volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return masterGain ? { ctx, master: masterGain } : null;
}

/** Play a named cue. No-op when muted or when audio is unavailable. */
export function playSfx(cue: SfxCueName): void {
  if (prefs.muted) return;
  const audio = ensureAudio();
  if (!audio || audio.ctx.state === 'closed') return;
  try {
    SFX_CUES[cue](audio.ctx, audio.master);
  } catch {
    // a synthesis failure must never break gameplay
  }
}

/** Set master SFX volume (clamped to 0..1) and persist it. */
export function setSfxVolume(volume: number): void {
  prefs = { ...prefs, volume: clampVolume(volume) };
  applyMasterGain();
  saveAudioPrefs(prefs);
  emit();
}

/** Set master mute and persist it. */
export function setSfxMuted(muted: boolean): void {
  prefs = { ...prefs, muted };
  applyMasterGain();
  saveAudioPrefs(prefs);
  emit();
}

/** Current prefs snapshot (immutable — replaced on every change). */
export function getAudioPrefs(): AudioPrefs {
  return prefs;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/* React hook.                                                         */
/* ------------------------------------------------------------------ */

export interface SfxApi {
  volume: number;
  muted: boolean;
  play: (cue: SfxCueName) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
}

/** Subscribe a component to the shared SFX state. */
export function useSfx(): SfxApi {
  const snapshot = useSyncExternalStore(subscribe, getAudioPrefs, getAudioPrefs);
  return {
    volume: snapshot.volume,
    muted: snapshot.muted,
    play: playSfx,
    setVolume: setSfxVolume,
    setMuted: setSfxMuted,
  };
}
