/**
 * The Field Case shell: same mission logic as the classic 2D shell (shared
 * useMissionRunner hook), presented as an opened analog spycraft briefcase.
 * Modules play ON their plates: each face is a canvas texture and taps
 * arrive via the scene raycaster (iPad-reliable — iOS Safari drops touches
 * on CSS-3D-transformed DOM, but mesh raycasting is native canvas input).
 * A flat screen-space panel remains as the accessibility path (VoiceOver /
 * switch access) and the fallback for modules without an in-scene face.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { playSfx } from '../audio/useSfx';
import { useQuality } from '../quality/useQuality';
import { gradeMission, type MissionGrade } from '../engine/grade';
import { getModule } from '../engine/registry';
import type { A11ySettings, MissionConfig, MissionResult } from '../engine/types';
import { haptic } from '../game/haptics';
import { MissionHeader } from '../game/MissionRun';
import { ModuleLamp, type LampState } from '../game/ModuleLamp';
import { formatClock, useMissionRunner } from '../game/useMissionRunner';
import { useMissionSfx } from '../game/useMissionSfx';
import { TallyOverlay } from '../slp/TallyOverlay';
import type { TallyEvent } from '../slp/db';
import { CameraRig, type CameraPose } from './CameraRig';
import { Faceplate, type BayState } from './Faceplate';
import { getFace } from './faces';
import { FieldCase } from './FieldCase';
import { baySlots, OVERVIEW_CAMERA } from './layout';
import { applyPatina } from './materials';
import './scene.css';

/** Feeds real frame timestamps to the auto quality ladder. */
function QualityFrameBridge({ recordFrame }: { recordFrame: (t: number) => void }) {
  useFrame(() => recordFrame(performance.now()));
  return null;
}

/** Procedural neutral studio environment — zero network fetches. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Drives the case-open ritual: 0 -> 1 over ~1.4s (instant under reduced motion). */
function useOpenAmount(reducedMotion: boolean): number {
  const [amount, setAmount] = useState(reducedMotion ? 1 : 0);
  const raf = useRef(0);
  useEffect(() => {
    if (reducedMotion) {
      // skip only the animation — the audio ritual still plays
      playSfx('latchOpen');
      playSfx('lampWarm');
      return;
    }
    playSfx('latchOpen');
    const start = performance.now() + 350; // beat of stillness before the latch
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / dur));
      // exponential ease with a springy settle
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -9 * p) * Math.cos(p * 7);
      setAmount(Math.min(1, eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else playSfx('lampWarm');
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reducedMotion]);
  return amount;
}

interface MissionRun3DProps {
  config: MissionConfig;
  a11y: A11ySettings;
  onFinish: (result: MissionResult, tallies: TallyEvent[]) => void;
}

export function MissionRun3D({ config, a11y, onFinish }: MissionRun3DProps) {
  const [ritualGrade, setRitualGrade] = useState<MissionGrade | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
  }, []);

  // Hold the debrief for a beat: lamps settle, the grade stamps over the
  // case, THEN the report card. Reduced motion keeps it brief.
  const finishWithSfx = useMemo(
    () =>
      (result: MissionResult, tallies: TallyEvent[]) => {
        const grade = gradeMission(result.outcome, result.modules);
        const good = grade.letter !== 'I' && grade.score >= 80;
        playSfx(good ? 'missionWin' : 'lidCreak');
        haptic(good ? 'win' : 'fail');
        setRitualGrade(grade);
        const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        finishTimer.current = setTimeout(() => onFinish(result, tallies), quick ? 900 : 2600);
      },
    [onFinish],
  );
  const runner = useMissionRunner(config, finishWithSfx);
  useMissionSfx(runner);
  const quality = useQuality();
  const [zoomed, setZoomed] = useState<CameraPose | null>(null);
  const [faceStatus, setFaceStatus] = useState('');
  const [a11yPanel, setA11yPanel] = useState(false);
  const poseGetters = useRef(new Map<number, () => CameraPose | null>());
  const slots = useMemo(() => baySlots(runner.instances.length), [runner.instances.length]);
  const reducedMotion =
    a11y.reducedMotion ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const openAmount = useOpenAmount(reducedMotion);

  useEffect(() => {
    applyPatina();
  }, []);

  // Step back to overview when the mission advances, so the plate lamp
  // (green or red) and the next lit module both read before re-opening.
  const prevModuleIndex = useRef(runner.moduleIndex);
  useEffect(() => {
    if (runner.moduleIndex !== prevModuleIndex.current) {
      prevModuleIndex.current = runner.moduleIndex;
      setZoomed(null);
      setA11yPanel(false);
      setFaceStatus('');
    }
  }, [runner.moduleIndex]);

  const bayState = (i: number): BayState => {
    if (i === runner.moduleIndex && !runner.finished) return 'active';
    const recorded = runner.results[i];
    if (recorded) return recorded.solved ? 'solved' : 'failed';
    return i < runner.moduleIndex ? 'solved' : 'locked';
  };

  function openActivePanel(pose?: CameraPose | null) {
    const resolved = pose ?? poseGetters.current.get(runner.moduleIndex)?.() ?? null;
    if (resolved) {
      playSfx('buttonPress');
      setZoomed(resolved);
    }
  }

  const activeInstance = runner.instances[runner.moduleIndex];
  const activeHasFace = getFace(activeInstance.moduleId) !== undefined;
  const zoomedIn = zoomed !== null && !runner.finished;
  // Flat DOM panel: the a11y path (VoiceOver/switch), and the gameplay
  // surface for any module without an in-scene face yet.
  const panelOpen = zoomedIn && (!activeHasFace || a11yPanel);

  const renderPlate = (i: number) => (
    <Faceplate
      key={i}
      slot={slots[i]}
      instance={runner.instances[i]}
      state={bayState(i)}
      onSelect={(pose) => openActivePanel(pose)}
      registerPoseGetter={(get) => poseGetters.current.set(i, get)}
      zoomed={i === runner.moduleIndex && zoomedIn}
      faceHandlers={
        i === runner.moduleIndex
          ? {
              onSolved: runner.handleSolved,
              onStrike: runner.handleStrike,
              setStatus: setFaceStatus,
              disabled: runner.finished || panelOpen,
            }
          : undefined
      }
    />
  );

  const platesReady = openAmount > 0.98;
  const basePlates = platesReady
    ? runner.instances.map((_, i) => (slots[i].parent === 'base' ? renderPlate(i) : null))
    : null;
  const lidPlates = platesReady
    ? runner.instances.map((_, i) => (slots[i].parent === 'lid' ? renderPlate(i) : null))
    : null;

  const activeDef = getModule(activeInstance.moduleId);
  const lampState: LampState = runner.moduleFailedFlash
    ? 'failed'
    : runner.alarmFlash
      ? 'wrong'
      : 'active';

  return (
    <main className="scene-screen">
      <div className="scene-chrome scene-chrome-top">
        <MissionHeader config={config} runner={runner} />
      </div>

      <Canvas
        className="scene-canvas"
        camera={{ position: OVERVIEW_CAMERA.position, fov: 42 }}
        dpr={quality.tier === 'high' ? [1, 2] : quality.tier === 'medium' ? [1, 1.5] : 1}
        shadows={quality.features.shadows}
      >
        <QualityFrameBridge recordFrame={quality.recordFrame} />
        {quality.features.reflections && <StudioEnvironment />}
        <ambientLight intensity={quality.features.reflections ? 0.25 : 0.55} color="#3a4250" />
        {/* warm desk-lamp key */}
        <directionalLight
          position={[3.5, 6, 4]}
          intensity={quality.features.reflections ? 1.15 : 1.5}
          color="#ffd9a0"
          castShadow={quality.features.shadows}
          shadow-mapSize={[1024, 1024]}
        />
        {/* cool dim fill */}
        <directionalLight position={[-4, 3, -2]} intensity={0.3} color="#7f9ac2" />

        <FieldCase
          openAmount={openAmount}
          code={config.code}
          clock={runner.timed ? formatClock(runner.secondsLeft) : null}
          strikes={runner.moduleStrikes}
          maxStrikes={config.maxStrikes}
          alarmFlash={runner.alarmFlash}
          baseChildren={basePlates}
          lidChildren={lidPlates}
        />

        {/* table surface */}
        <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#101418" roughness={0.9} />
        </mesh>

        <CameraRig zoomPose={zoomed} reducedMotion={reducedMotion} />
      </Canvas>

      {runner.alarmFlash && <div className="scene-flash-overlay" aria-hidden="true" />}

      {ritualGrade && (
        <div className="scene-grade-stamp" role="img" aria-label={`Mission grade ${ritualGrade.letter}`}>
          <span>{ritualGrade.letter}</span>
        </div>
      )}

      {/* Flat DOM panel: the accessibility path (full semantic module UI for
          VoiceOver/switch users) and the surface for modules without an
          in-scene face. Kept mounted while hidden so in-module progress
          survives stepping back to look at the case. */}
      <div className={`scene-panel${panelOpen ? '' : ' scene-panel-hidden'}`} aria-hidden={!panelOpen}>
        <div className="scene-panel-frame">
          <span className="scene-panel-screw scene-panel-screw-tl" aria-hidden="true" />
          <span className="scene-panel-screw scene-panel-screw-tr" aria-hidden="true" />
          <span className="scene-panel-screw scene-panel-screw-bl" aria-hidden="true" />
          <span className="scene-panel-screw scene-panel-screw-br" aria-hidden="true" />
          <div className="scene-panel-head">
            <span className="scene-panel-tag">{activeDef.codename.toUpperCase()}</span>
            <ModuleLamp state={lampState} wrongs={runner.moduleStrikes} limit={config.maxStrikes} />
          </div>
          <div className="scene-panel-body">
            <activeDef.Component
              key={runner.moduleIndex}
              instance={activeInstance}
              onSolved={runner.handleSolved}
              onStrike={runner.handleStrike}
              a11y={a11y}
              disabled={runner.finished || !panelOpen}
            />
          </div>
        </div>
      </div>

      <div className="scene-chrome scene-chrome-bottom">
        {panelOpen ? (
          <button className="scene-back-btn" onClick={() => { setZoomed(null); setA11yPanel(false); }}>
            &larr; Step back to the case
          </button>
        ) : zoomedIn && activeHasFace ? (
          <div className="scene-zoom-hud">
            <button className="scene-back-btn" onClick={() => setZoomed(null)}>
              &larr; Step back
            </button>
            <span className="scene-panel-tag">{activeDef.codename.toUpperCase()}</span>
            <ModuleLamp state={lampState} wrongs={runner.moduleStrikes} limit={config.maxStrikes} />
            <p className="scene-status" role="status">{faceStatus}</p>
            <button className="scene-a11y-btn" onClick={() => setA11yPanel(true)}>
              Accessible panel
            </button>
          </div>
        ) : (
          <div className="scene-hint-row">
            <p className="scene-hint" role="status">
              Drag (or use arrow keys) to turn the case · tap the lit module to work on it
            </p>
            {platesReady && !runner.finished && (
              <button className="scene-open-btn" onClick={() => openActivePanel()}>
                Open the lit panel
              </button>
            )}
          </div>
        )}
      </div>

      <TallyOverlay onTally={runner.handleTally} />
    </main>
  );
}
