import './game.css';

interface HowToProps {
  onBack: () => void;
}

export function HowTo({ onBack }: HowToProps) {
  return (
    <main className="screen">
      <header className="screen-header">
        <button onClick={onBack} aria-label="Back to home">&larr; Back</button>
        <h1>How to Play</h1>
      </header>

      <section className="card setup-section">
        <h2>The setup</h2>
        <p className="home-sub" style={{ maxWidth: 'none' }}>
          This is a two-player talking game. The <strong>Field Agent</strong> holds this device and
          sees the puzzles. The <strong>Handler</strong> holds the printed Field Manual and can see
          the rules — but not the screen. Neither of you has the whole picture, so the only way
          through is to keep yapping.
        </p>
      </section>

      <section className="card setup-section">
        <h2>A round in four steps</h2>
        <ol style={{ margin: 0, paddingLeft: '1.4em', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li><strong>Agent describes</strong> what's on screen — colors, shapes, letters, positions.</li>
          <li><strong>Handler finds</strong> the matching section in the manual and works the rules.</li>
          <li><strong>Handler directs</strong>; the Agent confirms before touching anything.</li>
          <li><strong>Ask when unsure!</strong> "Which one?", "Say that again?", and "Do you mean the striped one?" are power moves, not weaknesses.</li>
        </ol>
      </section>

      <section className="card setup-section">
        <h2>Wrong answers, grades, and time</h2>
        <p className="home-sub" style={{ maxWidth: 'none' }}>
          Every wrong choice flashes the module's corner lamp red — and each module only forgives
          so many (your teacher sets it: one to three). Push past the limit and that module fails
          and seals shut; the mission moves on without it. At the end you get a real letter grade,
          A+ to F, built from how cleanly you worked each module. Talk first, confirm, then commit.
          Timers are optional; your teacher picks relaxed, gentle, or challenge pace.
        </p>
      </section>

      <section className="card setup-section">
        <h2>Swap roles</h2>
        <p className="home-sub" style={{ maxWidth: 'none' }}>
          After each mission, trade places. Describing and directing are different skills — everyone
          gets to practice both.
        </p>
      </section>
    </main>
  );
}
