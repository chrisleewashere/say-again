import type * as React from 'react';

/** Communication targets an SLP can filter modules by. */
export type TherapyTarget = 'receptive' | 'expressive' | 'pragmatics' | 'vocabulary' | 'narrative';

export const THERAPY_TARGET_LABELS: Record<TherapyTarget, string> = {
  receptive: 'Following directions',
  expressive: 'Describing & directing',
  pragmatics: 'Clarifying & repair',
  vocabulary: 'Vocabulary & categories',
  narrative: 'Storytelling & sequencing',
};

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Rookie',
  2: 'Agent',
  3: 'Mastermind',
};

/** Timer behavior for a mission. Failure is always soft — nothing explodes. */
export type TimerMode = 'relaxed' | 'gentle' | 'challenge';

export interface TimerConfig {
  mode: TimerMode;
  /** seconds; ignored in relaxed mode */
  seconds: number;
}

/**
 * A concrete, fully-determined puzzle. `state` is everything the Field Agent
 * sees on screen; the solution is derivable from `state` plus the module's
 * published rule tables (which is exactly what the Handler's printed manual
 * contains). Modules must NOT hide extra solution data in `state`.
 */
export interface PuzzleInstance<S = unknown> {
  moduleId: string;
  difficulty: Difficulty;
  seed: number;
  state: S;
}

/** Accessibility settings threaded to every module component. */
export interface A11ySettings {
  dyslexiaFont: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
}

export interface ModuleComponentProps<S, A> {
  instance: PuzzleInstance<S>;
  /** Call exactly once when the puzzle is solved. */
  onSolved: () => void;
  /** Call on each incorrect committed answer (a "strike" = alarm level up). */
  onStrike: () => void;
  /** Attempt-level detail for session logging (optional granularity). */
  onAttempt?: (correct: boolean, answer: A) => void;
  a11y: A11ySettings;
  disabled: boolean;
}

/* ------------------------------------------------------------------ */
/* Manual content model.                                               */
/*                                                                     */
/* Manual sections are STRUCTURED DATA rendered by the manual          */
/* generator into printable HTML/PDF. Rule prose must be produced      */
/* from the same rule-table data the engine evaluates, so the printed  */
/* manual can never drift from app behavior.                           */
/* ------------------------------------------------------------------ */

export type ManualBlock =
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'callout'; tone: 'tip' | 'warning'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'table'; caption?: string; header: string[]; rows: string[][] }
  | {
      kind: 'ruleList';
      caption?: string;
      /** Ordered — first matching rule wins. Rendered with explicit ordering language. */
      rules: string[];
    }
  | { kind: 'figure'; svg: string; caption: string; alt: string };

export interface ManualEdition {
  /** Reading-level appropriate intro: what the Agent sees, what the Handler does. */
  intro: string;
  blocks: ManualBlock[];
}

export interface ManualSection {
  /** ~7th–9th grade reading level. */
  standard: ManualEdition;
  /** ~3rd–5th grade reading level, shorter sentences, more visual support. */
  simplified: ManualEdition;
}

/* ------------------------------------------------------------------ */
/* The module contract. Every puzzle module exports one of these.      */
/* ------------------------------------------------------------------ */

export interface ModuleDefinition<S = unknown, A = unknown> {
  id: string;
  /** Spy-flavored display name, e.g. "Laser Grid Bypass". */
  codename: string;
  /** One-line description shown in the mission builder. */
  tagline: string;
  targets: { primary: TherapyTarget; secondary: TherapyTarget[] };
  /** Rough solve time in minutes per difficulty, for mission sizing. */
  minutes: Record<Difficulty, number>;
  generate(seed: number, difficulty: Difficulty): PuzzleInstance<S>;
  /**
   * Robot Handler: derive the correct answer using ONLY the module's exported
   * rule tables — the same data the printed manual is generated from. Tests
   * assert validate(state, solve(state)) for thousands of seeds.
   */
  solve(state: S): A;
  validate(state: S, answer: A): boolean;
  Component: React.ComponentType<ModuleComponentProps<S, A>>;
  manual: ManualSection;
  /**
   * Escalating hints, revealed one per press of the shell's Hint button
   * (after the generic manual-pointer hint the shell always provides).
   * Hints coach the COMMUNICATION (what to describe, what to ask) — they
   * never reveal instance answers. Uses are logged per module.
   */
  hints?: string[];
  /**
   * Optional descriptor for how the module mounts into the 3D Field Case rack.
   * Omit it (or omit any field) and the module gets the standard mount:
   * `slots: 1` (single rack slot) and `bezel: 'standard'`. `slots: 2` requests
   * a double-wide slot; `bezel` picks the panel profile ('deep' = recessed,
   * 'flush' = level with the rack). This is purely declarative — the shell
   * renders every module from it automatically, so adding a module never
   * requires 3D work. Custom in-scene 3D presentation is a separate opt-in
   * that may be added later; no 3D types belong here.
   */
  faceplate?: { slots?: 1 | 2; bezel?: 'standard' | 'deep' | 'flush' };
}

/* ------------------------------------------------------------------ */
/* Missions.                                                           */
/* ------------------------------------------------------------------ */

export interface MissionModuleSpec {
  moduleId: string;
  difficulty: Difficulty;
}

export interface MissionConfig {
  /** Human-friendly code; also seeds every puzzle in the mission. */
  code: string;
  modules: MissionModuleSpec[];
  timer: TimerConfig;
  /**
   * Wrong answers allowed PER MODULE before that module fails and seals
   * (1-3, SLP-set). The mission always runs to completion; stakes live in
   * the end-of-mission grade. Field name kept for stored-session compat.
   */
  maxStrikes: number;
  hintsAllowed: boolean;
  /**
   * The Static Protocol (repair drills): 0 = off; 1-3 = on marked modules the
   * Handler answers the Agent's first description(s) with that many escalating
   * neutral clarification requests before acting. Which modules are marked is
   * seeded from the mission code (engine/staticProtocol.ts). Optional for
   * stored-session compatibility.
   */
  repairDrills?: number;
}

/**
 * 'complete' = played to the end (the grade tells the story). 'escaped' and
 * 'alarm' are legacy values that may exist in stored sessions.
 */
export type MissionOutcome = 'complete' | 'escaped' | 'alarm' | 'timeout' | 'abandoned';

export interface ModuleResult {
  moduleId: string;
  difficulty: Difficulty;
  solved: boolean;
  /** true when the module sealed after too many wrong answers */
  failed?: boolean;
  /** wrong answers committed on this module */
  strikes: number;
  hintsUsed: number;
  /** ms spent on this module */
  elapsedMs: number;
}

export interface MissionResult {
  code: string;
  startedAt: number;
  endedAt: number;
  outcome: MissionOutcome;
  timerMode: TimerMode;
  modules: ModuleResult[];
}
