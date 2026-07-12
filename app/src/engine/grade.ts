import type { MissionOutcome, ModuleResult } from './types';

/**
 * Mission grading. Transparent enough for a student to reason about:
 * each module is worth 100 — a passed module loses 20 per wrong answer
 * (never below 40); a failed module scores 0; a module never reached
 * scores 0. The mission grade is the average, mapped to a standard
 * letter scale. Abandoned missions grade as Incomplete ("I").
 */

export type LetterGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F'
  | 'I';

export const WRONG_ANSWER_PENALTY = 20;
export const PASSED_FLOOR = 40;

export function moduleScore(result: ModuleResult): number {
  if (!result.solved) return 0;
  return Math.max(PASSED_FLOOR, 100 - result.strikes * WRONG_ANSWER_PENALTY);
}

export function missionScore(modules: ModuleResult[]): number {
  if (modules.length === 0) return 0;
  const total = modules.reduce((sum, m) => sum + moduleScore(m), 0);
  return Math.round(total / modules.length);
}

export function letterFromScore(score: number): LetterGrade {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

export interface MissionGrade {
  letter: LetterGrade;
  /** 0-100; 0 for Incomplete */
  score: number;
}

export function gradeMission(outcome: MissionOutcome, modules: ModuleResult[]): MissionGrade {
  if (outcome === 'abandoned') return { letter: 'I', score: 0 };
  const score = missionScore(modules);
  return { letter: letterFromScore(score), score };
}

/** Debrief headline copy per grade band — honest, never mocking. */
export function gradeCopy(grade: MissionGrade): { title: string; body: string } {
  if (grade.letter === 'I') {
    return {
      title: 'Mission paused',
      body: 'No grade this time — the mission code will bring these exact puzzles back whenever you are ready.',
    };
  }
  if (grade.score >= 90) {
    return {
      title: `Mission grade: ${grade.letter}`,
      body: 'Outstanding fieldwork — clear descriptions, sharp questions, clean choices.',
    };
  }
  if (grade.score >= 80) {
    return {
      title: `Mission grade: ${grade.letter}`,
      body: 'Solid work. A couple of rushed choices cost you — confirm before you commit.',
    };
  }
  if (grade.score >= 70) {
    return {
      title: `Mission grade: ${grade.letter}`,
      body: 'You got through, but wrong picks added up. Talk it out fully before touching the panel.',
    };
  }
  if (grade.score >= 60) {
    return {
      title: `Mission grade: ${grade.letter}`,
      body: 'Rough mission. Slow down: describe, ask, confirm — then choose.',
    };
  }
  return {
    title: `Mission grade: ${grade.letter}`,
    body: 'This one got away from you. Same code, same puzzles — plan your questions and take it back.',
  };
}
