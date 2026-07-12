import { describe, expect, it, vi } from 'vitest';
import manifestRaw from '../public/manifest.webmanifest?raw';
import swSource from '../public/sw.js?raw';
import { registerServiceWorker } from './pwa';

const makeNav = () => {
  const register = vi.fn().mockResolvedValue({ scope: '/' });
  return { nav: { serviceWorker: { register } } as unknown as Navigator, register };
};

describe('registerServiceWorker', () => {
  it('no-ops in dev mode', () => {
    const { nav, register } = makeNav();
    expect(registerServiceWorker({ isDev: true, nav })).toBe(false);
    expect(register).not.toHaveBeenCalled();
  });

  it('no-ops when navigator is unavailable', () => {
    expect(registerServiceWorker({ isDev: false, nav: undefined })).toBe(false);
  });

  it('no-ops when serviceWorker is unsupported', () => {
    expect(
      registerServiceWorker({ isDev: false, nav: {} as unknown as Navigator }),
    ).toBe(false);
  });

  it('registers /sw.js in production with support', () => {
    const { nav, register } = makeNav();
    expect(registerServiceWorker({ isDev: false, nav })).toBe(true);
    // node env has no window, so registration runs immediately
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('never throws when registration rejects', async () => {
    const register = vi.fn().mockRejectedValue(new Error('nope'));
    const nav = { serviceWorker: { register } } as unknown as Navigator;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(registerServiceWorker({ isDev: false, nav })).toBe(true);
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});

describe('manifest.webmanifest', () => {
  const manifest = JSON.parse(manifestRaw);

  it('has the required installability fields', () => {
    expect(manifest.name).toBe('Keep Yapping & Everyone Escapes');
    expect(manifest.short_name).toBe('Keep Yapping');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('any');
    expect(manifest.background_color).toBe('#0f141a');
    expect(manifest.theme_color).toBe('#0f141a');
    expect(manifest.start_url).toBe('/');
  });

  it('declares the 1024 icon as both any and maskable', () => {
    const purposes = manifest.icons
      .filter((i: { src: string }) => i.src === '/icon-1024.png')
      .map((i: { purpose: string }) => i.purpose)
      .sort();
    expect(purposes).toEqual(['any', 'maskable']);
    for (const icon of manifest.icons) {
      expect(icon.sizes).toBe('1024x1024');
      expect(icon.type).toBe('image/png');
    }
  });
});

describe('sw.js shell precache list', () => {
  it('includes the app shell and manifest', () => {
    for (const url of ['/', '/index.html', '/icon-1024.png', '/manifest.webmanifest']) {
      expect(swSource).toContain(`'${url}'`);
    }
    expect(swSource).toMatch(/const CACHE_VERSION = \d+/);
    expect(swSource).toContain('skipWaiting');
    expect(swSource).toContain('clients.claim');
  });
});
