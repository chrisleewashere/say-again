/**
 * Gentle haptic feedback. On the native iOS wrapper this drives the Taptic
 * Engine via the Capacitor Haptics plugin (impact + notification cues); on
 * the web it uses the Vibration API where available (Android / Chromebook
 * touch — iOS Safari ignores it silently). Never throws: haptics are
 * garnish, and must never break gameplay.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticCue = 'tap' | 'solve' | 'wrong' | 'fail' | 'win';

const VIBRATE: Record<HapticCue, number | number[]> = {
  tap: 8,
  solve: [12, 60, 18],
  wrong: 35,
  fail: [50, 80, 50],
  win: [15, 70, 15, 70, 30],
};

export function haptic(cue: HapticCue): void {
  try {
    if (Capacitor.isNativePlatform()) {
      // notification cues carry semantic weight on the Taptic Engine;
      // impacts cover the mechanical taps
      const run =
        cue === 'solve' || cue === 'win'
          ? Haptics.notification({ type: NotificationType.Success })
          : cue === 'fail'
            ? Haptics.notification({ type: NotificationType.Error })
            : Haptics.impact({ style: cue === 'wrong' ? ImpactStyle.Medium : ImpactStyle.Light });
      void run.catch(() => undefined);
      return;
    }
    navigator.vibrate?.(VIBRATE[cue]);
  } catch {
    // no haptics available — fine
  }
}
