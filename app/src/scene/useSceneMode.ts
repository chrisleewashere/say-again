import { useCallback, useEffect, useState } from 'react';

/**
 * Mission presentation mode. 'auto' resolves to the immersive Field Case
 * when WebGL is available, otherwise classic 2D. Classic mode is a real,
 * feature-parity setting (accessibility + low-end devices), not a fallback
 * stub — both shells share useMissionRunner.
 */
export type SceneModePreference = 'auto' | '3d' | '2d';

const STORAGE_KEY = 'ky-scene-mode';

let webglSupport: boolean | null = null;

export function webglAvailable(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    webglSupport = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export function loadSceneModePreference(): SceneModePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === '3d' || raw === '2d' || raw === 'auto' ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

export function resolveSceneMode(pref: SceneModePreference): '3d' | '2d' {
  if (pref === '2d') return '2d';
  if (!webglAvailable()) return '2d';
  return '3d';
}

export function useSceneMode(): [SceneModePreference, '3d' | '2d', (p: SceneModePreference) => void] {
  const [pref, setPref] = useState<SceneModePreference>(loadSceneModePreference);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // storage unavailable — preference still applies this session
    }
  }, [pref]);

  const update = useCallback((p: SceneModePreference) => setPref(p), []);
  return [pref, resolveSceneMode(pref), update];
}
