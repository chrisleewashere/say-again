/**
 * A module faceplate on the case: phenolic panel, corner screws, engraved
 * codename tag, jewel lamp, and the module's face. The ACTIVE module's face
 * is a live canvas texture played by raycast taps (FaceSurface) — fully
 * in-scene, iPad-reliable. Modules without an in-scene face yet (and sealed/
 * passed/failed plates) show a decorative printed face instead; taps on the
 * lit plate zoom the camera either way.
 */
import { Html, RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import type { PuzzleInstance } from '../engine/types';
import { getModule } from '../engine/registry';
import { DIFFICULTY_LABELS } from '../engine/types';
import type { BaySlot } from './layout';
import { PLATE_SIZE, zoomPoseFromWorld } from './layout';
import type { CameraPose } from './CameraRig';
import { FaceSurface } from './FaceSurface';
import { getFace } from './faces';
import { CASE_ALUMINUM_WORN, FACEPLATE_PHENOLIC, LAMP_AMBER, LAMP_GREEN, LAMP_OFF, LAMP_RED, SCREW_STEEL } from './materials';
import './scene.css';

export type BayState = 'locked' | 'active' | 'solved' | 'failed';

interface FaceplateProps {
  slot: BaySlot;
  instance: PuzzleInstance;
  state: BayState;
  /** called with the camera pose for this plate, resolved from world space */
  onSelect: (pose: CameraPose) => void;
  /** lets the shell zoom here programmatically (keyboard/switch access) */
  registerPoseGetter?: (getPose: () => CameraPose | null) => void;
  /** camera is currently zoomed on this plate */
  zoomed?: boolean;
  /** wired to the mission runner when this plate is active and has a face */
  faceHandlers?: {
    onSolved: () => void;
    onStrike: () => void;
    setStatus: (text: string) => void;
    disabled: boolean;
  };
}

const worldPos = new THREE.Vector3();
const worldQuat = new THREE.Quaternion();
const worldNormal = new THREE.Vector3();
const worldUp = new THREE.Vector3();

const STATUS_WORD: Record<BayState, string> = {
  locked: 'SEALED',
  active: 'IN OPERATION',
  solved: 'PASSED',
  failed: 'FAILED',
};

const LAMP: Record<BayState, THREE.Material> = {
  locked: LAMP_OFF,
  active: LAMP_AMBER,
  solved: LAMP_GREEN,
  failed: LAMP_RED,
};

/** Simple original hardware glyph per state — dials for live, bars for sealed. */
function FaceGlyph({ state }: { state: BayState }) {
  if (state === 'failed') {
    return (
      <svg viewBox="0 0 96 96" width="120" height="120" aria-hidden="true">
        <circle cx="48" cy="48" r="34" fill="none" stroke="#7a3b42" strokeWidth="6" />
        <line x1="28" y1="28" x2="68" y2="68" stroke="#7a3b42" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'solved') {
    return (
      <svg viewBox="0 0 96 96" width="120" height="120" aria-hidden="true">
        <circle cx="48" cy="48" r="34" fill="none" stroke="#3f7a5c" strokeWidth="6" />
        <path d="M32 50 l12 12 l22 -26" fill="none" stroke="#3f7a5c" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === 'locked') {
    return (
      <svg viewBox="0 0 96 96" width="120" height="120" aria-hidden="true">
        <rect x="26" y="42" width="44" height="34" rx="6" fill="none" stroke="#4a4238" strokeWidth="6" />
        <path d="M34 42 v-7 a14 14 0 0 1 28 0 v7" fill="none" stroke="#4a4238" strokeWidth="6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 96" width="120" height="120" aria-hidden="true">
      <circle cx="48" cy="48" r="30" fill="none" stroke="#8a7a5c" strokeWidth="5" />
      <circle cx="48" cy="48" r="5" fill="#8a7a5c" />
      <line x1="48" y1="48" x2="64" y2="32" stroke="#8a7a5c" strokeWidth="5" strokeLinecap="round" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={48 + Math.cos(a) * 34}
            y1={48 + Math.sin(a) * 34}
            x2={48 + Math.cos(a) * 39}
            y2={48 + Math.sin(a) * 39}
            stroke="#8a7a5c"
            strokeWidth="4"
          />
        );
      })}
    </svg>
  );
}

export function Faceplate({ slot, instance, state, onSelect, registerPoseGetter, zoomed, faceHandlers }: FaceplateProps) {
  const def = getModule(instance.moduleId);
  const groupRef = useRef<THREE.Group>(null);
  const s = PLATE_SIZE;
  const screwOff = s / 2 + 0.02;
  const face = state === 'active' ? getFace(instance.moduleId) : undefined;
  const liveFace = face && faceHandlers ? face : undefined;

  function computePose(): CameraPose | null {
    const g = groupRef.current;
    if (!g) return null;
    g.getWorldPosition(worldPos);
    g.getWorldQuaternion(worldQuat);
    // plate content faces +Z, reads upward along +Y in slot-local space
    worldNormal.set(0, 0, 1).applyQuaternion(worldQuat);
    worldUp.set(0, 1, 0).applyQuaternion(worldQuat);
    const pose = zoomPoseFromWorld(
      [worldPos.x, worldPos.y, worldPos.z],
      [worldNormal.x, worldNormal.y, worldNormal.z],
    );
    return { ...pose, up: [worldUp.x, worldUp.y, worldUp.z] as [number, number, number] };
  }

  registerPoseGetter?.(computePose);

  function select() {
    const pose = computePose();
    if (pose) onSelect(pose);
  }

  return (
    <group ref={groupRef} position={slot.position} rotation={slot.rotation}>
      {/* phenolic panel */}
      <RoundedBox args={[s + 0.18, s + 0.18, 0.06]} radius={0.02} position={[0, 0, -0.032]} material={FACEPLATE_PHENOLIC} />
      {/* corner screws on the bezel margin */}
      {[
        [-screwOff, -screwOff],
        [-screwOff, screwOff],
        [screwOff, -screwOff],
        [screwOff, screwOff],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.002]} rotation={[Math.PI / 2, 0, 0]} material={SCREW_STEEL}>
          <cylinderGeometry args={[0.026, 0.026, 0.015, 10]} />
        </mesh>
      ))}
      {/* Status jewel: amber = live, green = passed, red = failed, dark = sealed.
          Lives on the BEZEL MARGIN, centred between the two top screws — the same
          ring the screws sit on. It used to be inset by 0.09 from the corner screw,
          which put it on top of the face content and collided with the title the
          face texture draws there. The bezel has no content, so it can never
          overlap at any face size. */}
      <mesh position={[0, screwOff, 0.01]} material={LAMP[state]}>
        <sphereGeometry args={[0.045, 14, 10]} />
      </mesh>
      {/* the lit module glows: a soft amber pool so the active plate reads
          across the room, not just by its corner jewel */}
      {state === 'active' && (
        <pointLight position={[0, 0, 0.55]} color="#ffb347" intensity={0.55} distance={1.6} decay={2} />
      )}

      {/* lockdown bars bolt across a failed module */}
      {state === 'failed' &&
        [-0.28, 0.28].map((y) => (
          <RoundedBox
            key={y}
            args={[s + 0.34, 0.14, 0.05]}
            radius={0.02}
            position={[0, y, 0.045]}
            rotation={[0, 0, y > 0 ? 0.1 : -0.1]}
            material={CASE_ALUMINUM_WORN}
          />
        ))}

      {/* live in-scene face: canvas texture + raycast taps (iPad-reliable) */}
      {liveFace && faceHandlers && (
        <FaceSurface
          face={liveFace}
          instance={instance}
          size={s + 0.14}
          interactive={!!zoomed}
          disabled={faceHandlers.disabled}
          onZoomRequest={select}
          handlers={faceHandlers}
        />
      )}

      {/* tap target: only the lit module opens (FaceSurface handles this itself) */}
      {state === 'active' && !liveFace && (
        <mesh position={[0, 0, 0.02]} onClick={(e) => { e.stopPropagation(); select(); }}>
          <planeGeometry args={[s + 0.18, s + 0.18]} />
          {/* invisible but raycastable (visible=false is skipped by the raycaster) */}
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* decorative printed face for plates without a live surface */}
      {!liveFace && (
        <Html
          transform
          position={[0, 0, 0.004]}
          scale={0.0715}
          wrapperClass="faceplate-wrap"
          className="faceplate-html"
          zIndexRange={[10, 0]}
        >
          <div className="faceplate-content" aria-hidden="true" data-bay-state={state}>
            <div className="faceplate-tag">{def.codename.toUpperCase()}</div>
            <FaceGlyph state={state} />
            <div className="faceplate-status">{STATUS_WORD[state]}</div>
            <div className="faceplate-diff">{DIFFICULTY_LABELS[instance.difficulty].toUpperCase()}</div>
            {state === 'active' && <div className="faceplate-cta">TAP TO OPERATE</div>}
          </div>
        </Html>
      )}
    </group>
  );
}
