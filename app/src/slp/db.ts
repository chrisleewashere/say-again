import Dexie, { type EntityTable } from 'dexie';
import type { MissionOutcome, ModuleResult, TherapyTarget, TimerMode } from '../engine/types';

/**
 * All therapy data stays on-device (IndexedDB). No accounts, no cloud, no
 * sync. Student labels are free-text chosen by the SLP — the quick-start
 * guide recommends initials or nicknames, never full names.
 */

export type TallyResult = 'correct' | 'prompted' | 'incorrect';

export interface TallyEvent {
  at: number;
  /** which member of the pair: A = Field Agent, B = Handler */
  student: 'A' | 'B';
  result: TallyResult;
  target?: TherapyTarget;
}

export interface SessionRecord {
  id?: number;
  code: string;
  startedAt: number;
  endedAt: number;
  outcome: MissionOutcome;
  timerMode: TimerMode;
  studentA: string;
  studentB: string;
  modules: ModuleResult[];
  tallies: TallyEvent[];
}

class KyDatabase extends Dexie {
  sessions!: EntityTable<SessionRecord, 'id'>;

  constructor() {
    super('keep-yapping');
    this.version(1).stores({
      sessions: '++id, startedAt, studentA, studentB, outcome',
    });
  }
}

export const db = new KyDatabase();

export async function saveSession(record: Omit<SessionRecord, 'id'>): Promise<number> {
  const id = await db.sessions.add(record);
  return id as number;
}

export async function recentSessions(limit = 100): Promise<SessionRecord[]> {
  return db.sessions.orderBy('startedAt').reverse().limit(limit).toArray();
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

export async function deleteAllSessions(): Promise<void> {
  await db.sessions.clear();
}

/** Flatten sessions to CSV for export into the SLP's own records. */
export function sessionsToCsv(sessions: SessionRecord[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    'date', 'time', 'mission_code', 'outcome', 'timer_mode', 'student_agent', 'student_handler',
    'modules_played', 'modules_solved', 'total_strikes', 'total_hints', 'duration_min',
    'tally_A_correct', 'tally_A_prompted', 'tally_A_incorrect',
    'tally_B_correct', 'tally_B_prompted', 'tally_B_incorrect',
  ];
  const rows = sessions.map((s) => {
    const d = new Date(s.startedAt);
    const count = (st: 'A' | 'B', r: TallyResult) =>
      s.tallies.filter((t) => t.student === st && t.result === r).length;
    return [
      d.toLocaleDateString(), d.toLocaleTimeString(), s.code, s.outcome, s.timerMode,
      s.studentA, s.studentB,
      s.modules.length,
      s.modules.filter((m) => m.solved).length,
      s.modules.reduce((n, m) => n + m.strikes, 0),
      s.modules.reduce((n, m) => n + m.hintsUsed, 0),
      Math.round((s.endedAt - s.startedAt) / 60000),
      count('A', 'correct'), count('A', 'prompted'), count('A', 'incorrect'),
      count('B', 'correct'), count('B', 'prompted'), count('B', 'incorrect'),
    ].map(esc).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}
