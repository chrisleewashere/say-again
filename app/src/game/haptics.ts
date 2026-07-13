/**
 * Gentle haptic feedback. Uses the Vibration API where available (Android /
 * Chromebook touch); iOS Safari ignores it silently, and the Capacitor iOS
 * wrapper picks up Haptics if the plugin is present. Never throws.
 */
type CapacitorHaptics = { impact: (opts: { style: string }) => Promise<void> };

function capacitorHaptics(): CapacitorHaptics | null {
  const cap = (window as { Capacitor?: { Plugins?: { Haptics?: CapacitorHaptics } } }).Capacitor;
  return cap?.Plugins?.Haptics ?? null;
}

export type HapticCue = 'tap' | 'solve' | 'wrong' | 'fail' | 'win';

const VIBRATE: Record<HapticCue, number | number[]> = {
  tap: 8,
  solve: [12, 60, 18],
  wrong: 35,
  fail: [50, 80, 50],
  win: [15, 70, 15, 70, 30],
};

const IMPACT: Record<HapticCue, string> = {
  tap: 'Light',
  solve: 'Medium',
  wrong: 'Medium',
  fail: 'Heavy',
  win: 'Heavy',
};

export function haptic(cue: HapticCue): void {
  try {
    const native = capacitorHaptics();
    if (native) {
      void native.impact({ style: IMPACT[cue] }).catch(() => undefined);
      return;
    }
    navigator.vibrate?.(VIBRATE[cue]);
  } catch {
    // haptics are garnish — never let them break gameplay
  }
}
