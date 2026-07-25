import { useState } from 'react';
import { allModules } from '../engine/registry';
import './game.css';
import './crt.css';

interface HomeProps {
  onNewMission: () => void;
  onReplayCode: (code: string) => void;
  onLogbook: () => void;
  onSettings: () => void;
  onHowTo: () => void;
}

/** Graduation marks for the badge dial — every third one runs long. */
const BADGE_TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const outer = 23;
  const inner = i % 3 === 0 ? 16 : 19.5;
  return {
    x1: 32 + Math.sin(angle) * inner,
    y1: 32 - Math.cos(angle) * inner,
    x2: 32 + Math.sin(angle) * outer,
    y2: 32 - Math.cos(angle) * outer,
    long: i % 3 === 0,
  };
});

export function Home({ onNewMission, onReplayCode, onLogbook, onSettings, onHowTo }: HomeProps) {
  const [code, setCode] = useState('');
  const codeValid = /^[A-Z]{3}-\d{3}$/.test(code.trim().toUpperCase());
  // registerAllModules() runs in main.tsx before render, so this is populated.
  const moduleCount = allModules().length;

  return (
    <main className="screen crt">
      <div className="fi-frame">
        <header className="fi-topbar">
          <div className="fi-mark">
            <svg
              className="fi-badge"
              viewBox="0 0 64 64"
              width="54"
              height="54"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="1" y="1" width="62" height="62" fill="none" stroke="var(--fi-line)" strokeWidth="1" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--fi-brass)" strokeWidth="1.5" />
              {BADGE_TICKS.map((t, i) => (
                <line
                  key={i}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.long ? 'var(--fi-brass)' : 'var(--fi-line)'}
                  strokeWidth={t.long ? 1.6 : 1}
                />
              ))}
              <circle cx="32" cy="32" r="12" fill="none" stroke="var(--fi-line)" strokeWidth="1" />
              <path d="M32 32 L44 21" fill="none" stroke="var(--fi-hot)" strokeWidth="2.4" strokeLinecap="square" />
              <circle cx="32" cy="32" r="2.6" fill="var(--fi-hot)" />
            </svg>
            <span className="fi-mark-lines" aria-hidden="true">
              <span className="fi-mark-l1">Field Case</span>
              <span className="fi-mark-l2">Two-station comms trainer</span>
            </span>
          </div>
          <nav className="fi-topbar-keys" aria-label="Main menu">
            <button onClick={onHowTo}>How to Play</button>
            <button onClick={onLogbook}>Logbook</button>
            <button onClick={onSettings}>Settings</button>
          </nav>
        </header>

        <div className="fi-titleblock">
          <h1 className="home-title">Say Again?</h1>
          <div className="fi-scale" aria-hidden="true" />
          <p className="home-sub">
            A two-player talking game. One of you sees the puzzle. One of you holds the manual.
            When a clue doesn&rsquo;t land — say it again.
          </p>
        </div>

        <p className="fi-banner">** Handler works from the printed manual — never the screen **</p>

        <div className="fi-console">
          <div className="fi-console-main">
            <div className="fi-runrow">
              <button className="btn-primary home-big-btn fi-run" onClick={onNewMission}>
                New Mission
              </button>
              <p className="fi-launch-note">Draws a fresh code and loads empty bays</p>
            </div>

            <section className="fi-panel" aria-labelledby="home-recall">
              <h2 id="home-recall">Recall</h2>
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
                <p className="fi-hint">
                  Format AAA-000. The same code rebuilds the same puzzles, as long as the puzzle
                  list matches too.
                </p>
              </div>
            </section>

            {/* The reference console's inverted "STATUS: …" row. It also
                does real work: Load is disabled until the code parses, and
                this says why in words rather than leaving a dashed key as
                the only explanation. */}
            <p className="fi-statusbar">
              <span className="fi-statusbar-k">Status</span>
              <span>
                {codeValid
                  ? 'Code accepted — Load is armed'
                  : 'Standby — no mission loaded'}
              </span>
            </p>
          </div>

          <aside className="fi-rail">
            <div className="fi-readout">
              <span className="fi-readout-cap">Modules on file</span>
              <strong className="fi-readout-val">{String(moduleCount).padStart(2, '0')}</strong>
            </div>
            <div className="fi-readout">
              <span className="fi-readout-cap">Case bays</span>
              <strong className="fi-readout-val">06</strong>
            </div>
            <div className="fi-checks">
              <p className="fi-readout-cap fi-checks-cap">Pre-flight</p>
              {/* Checkbox rows are things the pair must DO. The green jewel
                  below is a different kind of thing — a state the app is
                  reporting — so it is split out under its own rule and
                  labelled in words. Two glyphs, two meanings; previously
                  they sat in one list and the colour was the only hint
                  that the last row was not another checklist item.

                  The boxes are left EMPTY on purpose. Everywhere else in
                  this design a filled box means "selected" and an empty
                  one means "not" — the filter chips, the timer/strikes/
                  static chips, the bay grid. These two rows are static
                  reminders the app cannot know the state of, so filling
                  them would spend that convention on nothing and dilute
                  the one visual rule the rest of the redesign leans on
                  hardest. Empty reads as "check this before you start",
                  which is what they actually are. */}
              <ul>
                <li>
                  <span className="fi-box" aria-hidden="true" />
                  Two players, one device, one printed manual
                </li>
                <li>
                  <span className="fi-box" aria-hidden="true" />
                  Handler cannot see the screen
                </li>
              </ul>
              <p className="fi-lamp">
                <span className="fi-led" aria-hidden="true" />
                <span>
                  <span className="fi-lamp-k">On-device</span> — records never leave this device
                </span>
              </p>
            </div>
          </aside>
        </div>

        <p className="fi-footer">After each mission, swap roles — describing and directing are different skills.</p>
      </div>
    </main>
  );
}
