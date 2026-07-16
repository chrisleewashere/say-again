/**
 * Keep the screen awake during a mission — the Handler reads and the pair
 * talks for long stretches without touching the iPad, and a dimming screen
 * mid-heist kills the moment. Native (Capacitor) uses the keep-awake
 * plugin; the web build tries the Screen Wake Lock API. Both directions
 * are best-effort and never throw.
 */
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

let webLock: { release: () => Promise<void> } | null = null;

export async function setKeepAwake(on: boolean): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      if (on) await KeepAwake.keepAwake();
      else await KeepAwake.allowSleep();
      return;
    }
    if (on) {
      webLock = (await navigator.wakeLock?.request('screen')) ?? null;
    } else {
      await webLock?.release();
      webLock = null;
    }
  } catch {
    // wake lock denied/unsupported — the mission still plays
  }
}
