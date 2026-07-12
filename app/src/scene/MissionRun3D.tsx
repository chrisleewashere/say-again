/**
 * The Field Case shell: same mission logic as the classic 2D shell (shared
 * useMissionRunner hook), presented as an opened analog spycraft briefcase
 * with the mission's modules racked on it.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { playSfx } from '../audio/useSfx';
import { useQuality } from '../quality/useQuality';
import type { A11ySettings, MissionConfig, MissionResult } from '../engine/types';
import { MissionHeader } from '../game/MissionRun';
import { useMissionRunner } from '../game/useMissionRunner';
import { useMissionSfx } from '../game/useMissionSfx';
import { TallyOverlay } from '../slp/TallyOverlay';
import type { TallyEvent } from '../slp/db';
import { CameraRig, type CameraPose } from './CameraRig';
import { Faceplate, type BayState } from './Faceplate';
import { FieldCase } from './FieldCase';
import { baySlots, OVERVIEW_CAMERA } from './layout';
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
  const finishWithSfx = useMemo(
    () =>
      (result: MissionResult, tallies: TallyEvent[]) => {
        playSfx(result.outcome === 'escaped' ? 'missionWin' : result.outcome === 'alarm' ? 'lockdown' : 'lidCreak');
        onFinish(result, tallies);
      },
    [onFinish],
  );
  const runner = useMissionRunner(config, finishWithSfx);
  useMissionSfx(runner);
  const quality = useQuality();
  const [zoomed, setZoomed] = useState<{ index: number; pose: CameraPose } | null>(null);
  const poseGetters = useRef(new Map<number, () => CameraPose | null>());
  const slots = useMemo(() => baySlots(runner.instances.length), [runner.instances.length]);
  const reducedMotion =
    a11y.reducedMotion ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const openAmount = useOpenAmount(reducedMotion);

  // Step back to overview when a solve advances the mission, so the solved
  // lamp ping and the next lit module both read.
  const prevModuleIndex = useRef(runner.moduleIndex);
  useEffect(() => {
    if (runner.moduleIndex !== prevModuleIndex.current) {
      prevModuleIndex.current = runner.moduleIndex;
      setZoomed(null);
    }
  }, [runner.moduleIndex]);

  const bayState = (i: number): BayState =>
    i < runner.moduleIndex ? 'solved' : i === runner.moduleIndex ? 'active' : 'locked';

  const renderPlate = (i: number) => (
    <Faceplate
      key={i}
      slot={slots[i]}
      instance={runner.instances[i]}
      state={bayState(i)}
      zoomed={zoomed?.index === i}
      onSelect={(pose) => {
        playSfx('buttonPress');
        setZoomed({ index: i, pose });
      }}
      registerPoseGetter={(get) => poseGetters.current.set(i, get)}
      moduleProps={{
        onSolved: runner.handleSolved,
        onStrike: runner.handleStrike,
        a11y,
        disabled: runner.finished,
      }}
    />
  );

  const platesReady = openAmount > 0.98;
  const basePlates = platesReady
    ? runner.instances.map((_, i) => (slots[i].parent === 'base' ? renderPlate(i) : null))
    : null;
  const lidPlates = platesReady
    ? runner.instances.map((_, i) => (slots[i].parent === 'lid' ? renderPlate(i) : null))
    : null;

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
          strikes={runner.strikes}
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

        <CameraRig zoomPose={zoomed?.pose ?? null} reducedMotion={reducedMotion} />
      </Canvas>

      {runner.alarmFlash && <div className="scene-flash-overlay" aria-hidden="true" />}

      <div className="scene-chrome scene-chrome-bottom">
        {zoomed ? (
          <button className="scene-back-btn" onClick={() => setZoomed(null)}>
            &larr; Step back from the panel
          </button>
        ) : (
          <div className="scene-hint-row">
            <p className="scene-hint" role="status">
              Drag (or use arrow keys) to turn the case · tap the lit module to work on it
            </p>
            {platesReady && !runner.finished && (
              <button
                className="scene-open-btn"
                onClick={() => {
                  const pose = poseGetters.current.get(runner.moduleIndex)?.();
                  if (pose) {
                    playSfx('buttonPress');
                    setZoomed({ index: runner.moduleIndex, pose });
                  }
                }}
              >
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
