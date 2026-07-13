/**
 * The playable surface of an active module, rendered INSIDE the case: the
 * face draws itself onto a canvas that is textured onto the plate, and taps
 * arrive through the scene raycaster's UV hit (mesh intersection) — the same
 * input path as tap-to-zoom, which is reliable on iOS where CSS-3D-projected
 * DOM drops touches.
 */
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { playSfx } from '../audio/useSfx';
import type { PuzzleInstance } from '../engine/types';
import type { FaceCallbacks, FaceUi, ModuleFace } from './faces/types';

interface FaceHandlers {
  onSolved: () => void;
  onStrike: () => void;
  setStatus: (text: string) => void;
}

interface FaceSurfaceProps {
  face: ModuleFace;
  instance: PuzzleInstance;
  /** world-units side of the square face plane */
  size: number;
  /** camera is zoomed on this plate — taps operate the module */
  interactive: boolean;
  /** taps ignored (mission finished / a11y panel open on top) */
  disabled: boolean;
  /** tap while NOT interactive: ask the shell to zoom here */
  onZoomRequest: () => void;
  handlers: FaceHandlers;
}

declare global {
  interface Window {
    /** dev-only test hook: lets e2e drive the in-scene face without pixel math */
    __kyFace?: {
      regions: () => { id: string; label: string; disabled?: boolean }[];
      tap: (regionId: string) => void;
    };
  }
}

export function FaceSurface({ face, instance, size, interactive, disabled, onZoomRequest, handlers }: FaceSurfaceProps) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = face.canvasSize;
    c.height = face.canvasSize;
    return c;
  }, [face]);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
  useEffect(() => () => texture.dispose(), [texture]);

  // View state lives in a ref: it must survive step-back/re-zoom (the plate
  // stays mounted while active) without re-render churn per tap.
  const uiRef = useRef<FaceUi | null>(null);
  const uiForRef = useRef<PuzzleInstance | null>(null);
  if (uiRef.current === null || uiForRef.current !== instance) {
    uiRef.current = face.initUi(instance);
    uiForRef.current = instance;
  }

  // Handlers change identity every shell render — keep the latest in a ref
  // so the memoized callbacks never go stale.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const repaint = useMemo(
    () => () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !uiRef.current) return;
      face.draw(ctx, face.canvasSize, instance, uiRef.current);
      texture.needsUpdate = true;
    },
    [canvas, face, instance, texture],
  );

  const cb: FaceCallbacks = useMemo(
    () => ({
      onSolved: () => handlersRef.current.onSolved(),
      onStrike: () => handlersRef.current.onStrike(),
      setStatus: (text) => handlersRef.current.setStatus(text),
      repaint,
      sfx: (cue) => playSfx(cue),
    }),
    [repaint],
  );

  useEffect(() => {
    repaint();
  }, [repaint]);

  // Becoming the active zoomed surface: announce, run onShow (sequence
  // playback etc.); leaving it: onHide clears any timers the face started.
  useEffect(() => {
    if (!interactive || !uiRef.current) return;
    handlersRef.current.setStatus(face.initialStatus(instance));
    face.onShow?.(instance, uiRef.current, cb);
    const ui = uiRef.current;
    return () => face.onHide?.(ui);
  }, [interactive, face, instance, cb]);

  const tap = useMemo(
    () => (regionId: string) => {
      if (disabledRef.current || !uiRef.current) return;
      face.onTap(regionId, instance, uiRef.current, cb);
    },
    [face, instance, cb],
  );

  // Dev-only hook so e2e can operate the face deterministically (headless
  // software GL makes pixel-coordinate raycast clicks flaky).
  useEffect(() => {
    if (!import.meta.env.DEV || !interactive) return;
    window.__kyFace = {
      regions: () => (uiRef.current ? face.regions(instance, uiRef.current) : []),
      tap,
    };
    return () => {
      delete window.__kyFace;
    };
  }, [interactive, face, instance, tap]);

  function handleTap(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (!interactive) {
      onZoomRequest();
      return;
    }
    if (disabledRef.current || !e.uv || !uiRef.current) return;
    // CanvasTexture flipY: canvas row 0 (top) sits at v=1, so canvas-space
    // y = 1 - v. FaceRegion rects are declared in canvas-top-left UV space.
    const x = e.uv.x;
    const y = 1 - e.uv.y;
    const hit = face
      .regions(instance, uiRef.current)
      .find((r) => !r.disabled && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (hit) tap(hit.id);
  }

  return (
    <mesh position={[0, 0, 0.004]} onClick={handleTap}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
