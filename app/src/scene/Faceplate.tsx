/**
 * A standard module faceplate: phenolic panel, four corner screws, engraved
 * codename tag, solved/active jewel lamp — with the module's real (tested,
 * accessible) DOM UI rendered live on the plate via drei's Html transform.
 * Interaction is enabled only while the camera is zoomed to this bay, so
 * distant plates can't be mis-tapped.
 */
import { Html, RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import type { ModuleComponentProps, PuzzleInstance } from '../engine/types';
import { getModule } from '../engine/registry';
import type { BaySlot } from './layout';
import { PLATE_SIZE, zoomPoseFromWorld } from './layout';
import type { CameraPose } from './CameraRig';
import { FACEPLATE_PHENOLIC, LAMP_AMBER, LAMP_GREEN, LAMP_OFF, SCREW_STEEL } from './materials';
import './scene.css';

export type BayState = 'locked' | 'active' | 'solved';

interface FaceplateProps {
  slot: BaySlot;
  instance: PuzzleInstance;
  state: BayState;
  zoomed: boolean;
  /** called with the camera pose for this plate, resolved from world space */
  onSelect: (pose: CameraPose) => void;
  /** lets the shell zoom here programmatically (keyboard/switch access) */
  registerPoseGetter?: (getPose: () => CameraPose | null) => void;
  moduleProps: Omit<ModuleComponentProps<unknown, unknown>, 'instance'>;
}

const worldPos = new THREE.Vector3();
const worldQuat = new THREE.Quaternion();
const worldNormal = new THREE.Vector3();

export function Faceplate({ slot, instance, state, zoomed, onSelect, registerPoseGetter, moduleProps }: FaceplateProps) {
  const def = getModule(instance.moduleId);
  const groupRef = useRef<THREE.Group>(null);
  const s = PLATE_SIZE;
  const screwOff = s / 2 + 0.02;
  const interactive = zoomed && state === 'active';

  function computePose(): CameraPose | null {
    const g = groupRef.current;
    if (!g) return null;
    g.getWorldPosition(worldPos);
    g.getWorldQuaternion(worldQuat);
    // plate content faces +Z in slot-local space
    worldNormal.set(0, 0, 1).applyQuaternion(worldQuat);
    return zoomPoseFromWorld(
      [worldPos.x, worldPos.y, worldPos.z],
      [worldNormal.x, worldNormal.y, worldNormal.z],
    );
  }

  registerPoseGetter?.(computePose);

  function select() {
    const pose = computePose();
    if (pose) onSelect(pose);
  }

  return (
    <group ref={groupRef} position={slot.position} rotation={slot.rotation}>
      {/* phenolic panel behind the DOM face */}
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
      {/* jewel lamp: amber = active, green = solved, dark = locked */}
      <mesh
        position={[screwOff, 0, 0.01]}
        material={state === 'solved' ? LAMP_GREEN : state === 'active' ? LAMP_AMBER : LAMP_OFF}
      >
        <sphereGeometry args={[0.045, 14, 10]} />
      </mesh>

      {/* invisible tap target covering the plate (select/zoom in overview) */}
      {!zoomed && state !== 'locked' && (
        <mesh position={[0, 0, 0.02]} onClick={(e) => { e.stopPropagation(); select(); }}>
          <planeGeometry args={[s + 0.18, s + 0.18]} />
          {/* invisible but raycastable (visible=false is skipped by the raycaster) */}
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* the live module UI on the plate face */}
      <Html
        transform
        position={[0, 0, 0.004]}
        scale={0.0715}
        wrapperClass="faceplate-wrap"
        className={`faceplate-html${interactive ? ' faceplate-live' : ''}`}
        zIndexRange={[10, 0]}
      >
        <div className="faceplate-content" aria-hidden={!interactive} data-bay-state={state}>
          <div className="faceplate-tag" aria-hidden="true">{def.codename.toUpperCase()}</div>
          {state === 'locked' ? (
            <div className="faceplate-locked">
              <svg viewBox="0 0 48 48" width="64" height="64" aria-hidden="true">
                <rect x="10" y="20" width="28" height="20" rx="4" fill="none" stroke="#5b6675" strokeWidth="3.5" />
                <path d="M16 20 v-4 a8 8 0 0 1 16 0 v4" fill="none" stroke="#5b6675" strokeWidth="3.5" />
              </svg>
              <p>Sealed — finish the lit module first.</p>
            </div>
          ) : (
            <def.Component instance={instance} {...moduleProps} disabled={moduleProps.disabled || !interactive} />
          )}
        </div>
      </Html>
    </group>
  );
}
