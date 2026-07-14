import { Suspense, lazy, useState } from 'react';
import { Debrief } from './game/Debrief';
import { Home } from './game/Home';
import { HowTo } from './game/HowTo';
import { MissionRun } from './game/MissionRun';
import { MissionSetup } from './game/MissionSetup';
import { Settings } from './game/Settings';
import { useA11y } from './game/useA11y';
import { useSceneMode } from './scene/useSceneMode';
import { Logbook } from './slp/Logbook';
import { saveSession, type TallyEvent } from './slp/db';
import { gradeMission } from './engine/grade';
import type { MissionConfig, MissionResult } from './engine/types';

// Lazy so three.js only loads when a 3D mission actually starts
const MissionRun3D = lazy(() =>
  import('./scene/MissionRun3D').then((m) => ({ default: m.MissionRun3D })),
);

type Screen =
  | { name: 'home' }
  | { name: 'setup'; replayCode?: string }
  | { name: 'play'; config: MissionConfig; students: { a: string; b: string } }
  | { name: 'debrief'; result: MissionResult; config: MissionConfig; students: { a: string; b: string } }
  | { name: 'logbook' }
  | { name: 'settings' }
  | { name: 'howto' };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [a11y, updateA11y] = useA11y();
  const [scenePref, sceneMode, setScenePref] = useSceneMode();

  async function handleFinish(
    config: MissionConfig,
    students: { a: string; b: string },
    result: MissionResult,
    tallies: TallyEvent[],
  ) {
    const grade = gradeMission(result.outcome, result.modules);
    try {
      // Never let a hung IndexedDB write (seen in WKWebView after
      // backgrounding) strand players on the run screen.
      await Promise.race([
        saveSession({
        code: result.code,
        startedAt: result.startedAt,
        endedAt: result.endedAt,
        outcome: result.outcome,
        timerMode: result.timerMode,
        maxStrikes: config.maxStrikes,
        repairDrills: config.repairDrills ?? 0,
        grade: grade.letter,
        gradeScore: grade.score,
        studentA: students.a,
        studentB: students.b,
        modules: result.modules,
        tallies,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('save timeout')), 3000)),
      ]);
    } catch {
      // storage failure shouldn't block the debrief screen
    }
    setScreen({ name: 'debrief', result, config, students });
  }

  switch (screen.name) {
    case 'home':
      return (
        <Home
          onNewMission={() => setScreen({ name: 'setup' })}
          onReplayCode={(code) => setScreen({ name: 'setup', replayCode: code })}
          onLogbook={() => setScreen({ name: 'logbook' })}
          onSettings={() => setScreen({ name: 'settings' })}
          onHowTo={() => setScreen({ name: 'howto' })}
        />
      );
    case 'setup':
      return (
        <MissionSetup
          replayCode={screen.replayCode}
          onStart={(config, students) => setScreen({ name: 'play', config, students })}
          onBack={() => setScreen({ name: 'home' })}
        />
      );
    case 'play': {
      const onFinish = (result: MissionResult, tallies: TallyEvent[]) =>
        void handleFinish(screen.config, screen.students, result, tallies);
      if (sceneMode === '3d' && screen.config.modules.length <= 6) {
        return (
          <Suspense fallback={<main className="screen home-screen"><p className="home-sub">Unpacking the field case…</p></main>}>
            <MissionRun3D config={screen.config} a11y={a11y} onFinish={onFinish} />
          </Suspense>
        );
      }
      return <MissionRun config={screen.config} a11y={a11y} onFinish={onFinish} />;
    }
    case 'debrief':
      return (
        <Debrief
          result={screen.result}
          onReplaySame={() => setScreen({ name: 'play', config: screen.config, students: screen.students })}
          onNewMission={() => setScreen({ name: 'setup' })}
          onHome={() => setScreen({ name: 'home' })}
        />
      );
    case 'logbook':
      return <Logbook onBack={() => setScreen({ name: 'home' })} />;
    case 'settings':
      return <Settings a11y={a11y} onChange={updateA11y} scenePref={scenePref} onSceneChange={setScenePref} onBack={() => setScreen({ name: 'home' })} />;
    case 'howto':
      return <HowTo onBack={() => setScreen({ name: 'home' })} />;
  }
}

export default App;
