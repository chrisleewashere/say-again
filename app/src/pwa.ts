/**
 * Production-only service-worker registration for the PWA build.
 *
 * No-ops in dev (Vite serves modules straight from src/, so a stale
 * cache-first worker would break hot reload) and on browsers without
 * serviceWorker support. Exposed as a pure-ish function so the guard
 * logic is unit-testable.
 */

export interface RegisterOptions {
  /** Defaults to import.meta.env.DEV — injectable for tests. */
  isDev?: boolean;
  /** Defaults to the real navigator — injectable for tests. */
  nav?: Pick<Navigator, 'serviceWorker'> | undefined;
}

/**
 * Returns true when registration was initiated, false when skipped.
 * Registration itself is fire-and-forget; failures are logged, never thrown,
 * so an odd browser can't take the app down.
 */
export function registerServiceWorker(options: RegisterOptions = {}): boolean {
  const isDev = options.isDev ?? import.meta.env.DEV;
  const nav =
    'nav' in options ? options.nav : typeof navigator !== 'undefined' ? navigator : undefined;

  if (isDev) return false;
  if (!nav || !('serviceWorker' in nav) || !nav.serviceWorker) return false;

  const register = () => {
    nav.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.log('[pwa] service worker registered, scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('[pwa] service worker registration failed:', err);
      });
  };

  // Defer until load so registration never competes with first paint.
  if (typeof window !== 'undefined' && document.readyState !== 'complete') {
    window.addEventListener('load', register, { once: true });
  } else {
    register();
  }
  return true;
}
