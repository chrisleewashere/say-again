/**
 * Camera state machine: free orbit at overview; smooth dolly to a bay when a
 * module is selected; damped return to the overview pose on step-back (until
 * the user grabs the controls). Reduced motion snaps instantly.
 */
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OVERVIEW_CAMERA } from './layout';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  /** world-space "content up" of the plate, keeps zoomed modules upright */
  up?: [number, number, number];
}

interface CameraRigProps {
  /** null = free overview orbit; set = dolly to this pose and hold */
  zoomPose: CameraPose | null;
  reducedMotion: boolean;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function CameraRig({ zoomPose, reducedMotion }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...OVERVIEW_CAMERA.position));
  const targetLook = useRef(new THREE.Vector3(...OVERVIEW_CAMERA.target));
  const targetUp = useRef(new THREE.Vector3(0, 1, 0));
  /** true while easing back to overview after step-back; user drag cancels */
  const returning = useRef(false);

  useEffect(() => {
    const pose = zoomPose ?? OVERVIEW_CAMERA;
    targetPos.current.set(...pose.position);
    targetLook.current.set(...pose.target);
    targetUp.current.set(...(zoomPose?.up ?? [0, 1, 0]));
    returning.current = !zoomPose;
    if (reducedMotion) {
      camera.position.copy(targetPos.current);
      camera.up.copy(targetUp.current);
      controlsRef.current?.target.copy(targetLook.current);
      camera.lookAt(targetLook.current);
      controlsRef.current?.update();
      returning.current = false;
    }
  }, [zoomPose, reducedMotion, camera]);

  // A manual grab of the controls cancels the automatic return-to-overview.
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const onStart = () => {
      returning.current = false;
    };
    c.addEventListener('start', onStart);
    return () => c.removeEventListener('start', onStart);
  }, []);

  // Keyboard rotation at overview (Chromebook trackpad/keyboard support)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const c = controlsRef.current;
      if (!c || zoomPose) return;
      const step = 0.12;
      switch (e.key) {
        case 'ArrowLeft':
          c.setAzimuthalAngle(c.getAzimuthalAngle() + step);
          break;
        case 'ArrowRight':
          c.setAzimuthalAngle(c.getAzimuthalAngle() - step);
          break;
        case 'ArrowUp':
          c.setPolarAngle(Math.max(0.35, c.getPolarAngle() - step));
          break;
        case 'ArrowDown':
          c.setPolarAngle(Math.min(1.45, c.getPolarAngle() + step));
          break;
        default:
          return;
      }
      e.preventDefault();
      returning.current = false;
      c.update();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomPose]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    const c = controlsRef.current;
    if (!c) return;
    if (zoomPose) {
      // dolly toward the bay, easing the up-vector so top-down plates stay
      // upright instead of inheriting the orbit azimuth
      const k = 1 - Math.exp(-delta * 5.5);
      camera.position.lerp(targetPos.current, k);
      camera.up.lerp(targetUp.current, k).normalize();
      c.target.lerp(targetLook.current, k);
      camera.lookAt(c.target);
    } else if (returning.current) {
      // ease all the way home; release to free orbit when we arrive
      const k = 1 - Math.exp(-delta * 4);
      camera.position.lerp(targetPos.current, k);
      camera.up.lerp(WORLD_UP, k).normalize();
      c.target.lerp(targetLook.current, k);
      c.update();
      if (camera.position.distanceTo(targetPos.current) < 0.02) {
        camera.up.copy(WORLD_UP);
        returning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!zoomPose}
      enablePan={false}
      minDistance={3.2}
      maxDistance={7.5}
      minPolarAngle={0.35}
      maxPolarAngle={1.45}
      rotateSpeed={0.6}
      target={OVERVIEW_CAMERA.target}
    />
  );
}
