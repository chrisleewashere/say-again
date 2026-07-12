import { useEffect, useState } from 'react';
import { allSessions, deleteSession, recentSessions, sessionsToCsv, type SessionRecord } from './db';
import './slp.css';
import '../game/game.css';

interface LogbookProps {
  onBack: () => void;
}

export function Logbook({ onBack }: LogbookProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [exported, setExported] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function refresh() {
    setSessions(await recentSessions());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function exportCsv() {
    // export the FULL table, not just the rows shown on screen
    const csv = sessionsToCsv(await allSessions());
    const file = new File([csv], `keep-yapping-sessions-${new Date().toISOString().slice(0, 10)}.csv`, {
      type: 'text/csv',
    });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Keep Yapping session data' });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  }

  // Two-tap confirm — native confirm dialogs are unreliable in sandboxed
  // webviews, and tapping the same button twice is clearer on a tablet.
  async function remove(id: number | undefined) {
    if (id === undefined) return;
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId((c) => (c === id ? null : c)), 3500);
      return;
    }
    setConfirmingId(null);
    await deleteSession(id);
    await refresh();
  }

  const tallySummary = (s: SessionRecord, student: 'A' | 'B') => {
    const c = s.tallies.filter((t) => t.student === student && t.result === 'correct').length;
    const p = s.tallies.filter((t) => t.student === student && t.result === 'prompted').length;
    const i = s.tallies.filter((t) => t.student === student && t.result === 'incorrect').length;
    return c + p + i === 0 ? '—' : `${c}/${p}/${i}`;
  };

  return (
    <main className="screen">
      <header className="screen-header">
        <button onClick={onBack} aria-label="Back to home">&larr; Back</button>
        <h1>Logbook</h1>
      </header>

      <p className="home-sub" style={{ maxWidth: 'none' }}>
        Sessions are stored only on this device. Tally columns show correct / prompted / incorrect.
      </p>

      <div className="logbook-actions">
        <button className="btn-primary" onClick={exportCsv} disabled={sessions.length === 0}>
          {exported ? 'Exported ✓' : 'Export CSV'}
        </button>
      </div>

      <section className="card">
        {sessions.length === 0 ? (
          <p className="logbook-empty">No sessions yet. Finish a mission and it will appear here.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="logbook-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mission</th>
                  <th>Team</th>
                  <th>Grade</th>
                  <th>Outcome</th>
                  <th>Solved</th>
                  <th>Agent tally</th>
                  <th>Handler tally</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.startedAt).toLocaleDateString()}</td>
                    <td><span className="mission-code">{s.code}</span></td>
                    <td>{[s.studentA, s.studentB].filter(Boolean).join(' & ') || '—'}</td>
                    <td>{s.grade ?? '—'}</td>
                    <td>{s.outcome}</td>
                    <td>
                      {s.modules.filter((m) => m.solved).length}/{s.modules.length}
                    </td>
                    <td>{tallySummary(s, 'A')}</td>
                    <td>{tallySummary(s, 'B')}</td>
                    <td>
                      <button
                        onClick={() => remove(s.id)}
                        className={confirmingId === s.id ? 'btn-primary' : ''}
                        aria-label={confirmingId === s.id ? `Tap again to permanently delete session ${s.code}` : `Delete session ${s.code}`}
                      >
                        {confirmingId === s.id ? 'Delete? Tap again' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
