/**
 * Camera state machine: free orbit at overview; smooth dolly to a bay when a
 * module is selected. Damped lerp gives the case perceived weight; reduced
 * motion snaps instantly.
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
}

interface CameraRigProps {
  /** null = free overview orbit; set = dolly to this pose and hold */
  zoomPose: CameraPose | null;
  reducedMotion: boolean;
}

export function CameraRig({ zoomPose, reducedMotion }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...OVERVIEW_CAMERA.position));
  const targetLook = useRef(new THREE.Vector3(...OVERVIEW_CAMERA.target));

  useEffect(() => {
    const pose = zoomPose ?? OVERVIEW_CAMERA;
    targetPos.current.set(...pose.position);
    targetLook.current.set(...pose.target);
    if (reducedMotion) {
      camera.position.copy(targetPos.current);
      controlsRef.current?.target.copy(targetLook.current);
      controlsRef.current?.update();
    }
  }, [zoomPose, reducedMotion, camera]);

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
      const k = 1 - Math.exp(-delta * 5.5);
      camera.position.lerp(targetPos.current, k);
      c.target.lerp(targetLook.current, k);
      c.update();
    } else {
      const k = 1 - Math.exp(-delta * 4);
      c.target.lerp(targetLook.current, k);
      c.update();
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
