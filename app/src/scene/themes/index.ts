/**
 * Theme registry + application. Themes are applied by MUTATING the shared
 * material singletons in materials.ts (so every mesh updates without
 * re-mounting) and by feeding the lighting/backdrop values to the shell.
 * Competing looks each add one file here — nothing else changes.
 */
import type { SceneTheme } from './types';
import { atomic } from './atomic';
import { blackline } from './blackline';
import { noir } from './noir';
import { tradecraft } from './tradecraft';

export const THEME_STORAGE_KEY = 'ky-scene-theme';
export const DEFAULT_THEME_ID = 'tradecraft';

const REGISTRY = new Map<string, SceneTheme>();

export function registerTheme(theme: SceneTheme): void {
  REGISTRY.set(theme.id, theme);
}

registerTheme(tradecraft);
registerTheme(blackline);
registerTheme(atomic);
registerTheme(noir);

export function allThemes(): SceneTheme[] {
  return [...REGISTRY.values()];
}

export function getTheme(id: string | null | undefined): SceneTheme {
  return (id && REGISTRY.get(id)) || (REGISTRY.get(DEFAULT_THEME_ID) as SceneTheme);
}

/** Active theme id from storage (safe when storage is unavailable). */
export function activeThemeId(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function activeTheme(): SceneTheme {
  return getTheme(activeThemeId());
}
