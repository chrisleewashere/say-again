import { useState } from 'react';
import './game.css';

interface HomeProps {
  onNewMission: () => void;
  onReplayCode: (code: string) => void;
  onLogbook: () => void;
  onSettings: () => void;
  onHowTo: () => void;
}

export function Home({ onNewMission, onReplayCode, onLogbook, onSettings, onHowTo }: HomeProps) {
  const [code, setCode] = useState('');
  const codeValid = /^[A-Z]{3}-\d{3}$/.test(code.trim().toUpperCase());

  return (
    <main className="screen home-screen">
      <div className="home-badge" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="96" height="96">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--amber)" strokeWidth="4" />
          <circle cx="60" cy="60" r="42" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="6 8" />
          <path d="M40 62 l14 14 l26 -30" fill="none" stroke="var(--amber)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="home-title">Say Again?</h1>
      <p className="home-sub">A two-player talking game. One of you sees the puzzle. One of you holds the manual. When a clue doesn&rsquo;t land — say it again.</p>

      <div className="home-actions">
        <button className="btn-primary home-big-btn" onClick={onNewMission}>New Mission</button>
        <button onClick={onHowTo}>How to Play</button>
        <button onClick={onLogbook}>Logbook</button>
        <button onClick={onSettings}>Settings</button>
      </div>

      <div className="home-replay">
        <label htmlFor="mission-code">Replay a mission code</label>
        <div className="home-replay-row">
          <input
            id="mission-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. FOX-492"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={7}
          />
          <button disabled={!codeValid} onClick={() => onReplayCode(code.trim().toUpperCase())}>
            Load
          </button>
        </div>
      </div>
    </main>
  );
}
