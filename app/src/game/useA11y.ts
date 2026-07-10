import { useCallback, useEffect, useState } from 'react';
import type { A11ySettings } from '../engine/types';

const STORAGE_KEY = 'ky-a11y';

const DEFAULTS: A11ySettings = {
  dyslexiaFont: false,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
};

const HTML_CLASS: Record<keyof A11ySettings, string> = {
  dyslexiaFont: 'a11y-dyslexia',
  highContrast: 'a11y-high-contrast',
  largeText: 'a11y-large-text',
  reducedMotion: 'a11y-reduced-motion',
};

function load(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function applyToHtml(settings: A11ySettings): void {
  for (const key of Object.keys(HTML_CLASS) as (keyof A11ySettings)[]) {
    document.documentElement.classList.toggle(HTML_CLASS[key], settings[key]);
  }
}

export function useA11y(): [A11ySettings, (patch: Partial<A11ySettings>) => void] {
  const [settings, setSettings] = useState<A11ySettings>(load);

  useEffect(() => {
    applyToHtml(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable (private mode) — settings still apply this session
    }
  }, [settings]);

  const update = useCallback((patch: Partial<A11ySettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return [settings, update];
}
