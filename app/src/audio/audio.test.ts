import { describe, expect, it } from 'vitest';
import { CUE_GAINS, SFX_CUES, SFX_CUE_NAMES, type SfxCueName } from './sfx';
import {
  AUDIO_STORAGE_KEY,
  DEFAULT_AUDIO_PREFS,
  clampVolume,
  loadAudioPrefs,
  saveAudioPrefs,
} from './useSfx';

/* ------------------------------------------------------------------ */
/* Cue registry completeness.                                          */
/* ------------------------------------------------------------------ */

const REQUIRED_CUES: SfxCueName[] = [
  'latchOpen',
  'lidCreak',
  'lampWarm',
  'buttonPress',
  'dialDetent',
  'wireSnip',
  'solveKachunk',
  'strikeBuzz',
  'needleSweep',
  'timerTick',
  'missionWin',
  'lockdown',
];

describe('sfx cue registry', () => {
  it('exposes exactly the design-brief cue set', () => {
    expect([...SFX_CUE_NAMES].sort()).toEqual([...REQUIRED_CUES].sort());
    expect(Object.keys(SFX_CUES).sort()).toEqual([...REQUIRED_CUES].sort());
  });

  it('every cue is a (ctx, destination) function', () => {
    for (const name of SFX_CUE_NAMES) {
      expect(typeof SFX_CUES[name]).toBe('function');
      expect(SFX_CUES[name].length).toBe(2);
    }
  });

  it('every cue has a configured gain', () => {
    expect(Object.keys(CUE_GAINS).sort()).toEqual([...REQUIRED_CUES].sort());
  });
});

/* ------------------------------------------------------------------ */
/* Gain discipline (therapy setting: failure is never punished).       */
/* ------------------------------------------------------------------ */

describe('gain discipline', () => {
  it('all cue gains are within (0, 1]', () => {
    for (const name of SFX_CUE_NAMES) {
      expect(CUE_GAINS[name]).toBeGreaterThan(0);
      expect(CUE_GAINS[name]).toBeLessThanOrEqual(1);
    }
  });

  it('strikeBuzz peaks quieter than solveKachunk', () => {
    expect(CUE_GAINS.strikeBuzz).toBeLessThan(CUE_GAINS.solveKachunk);
  });

  it('lockdown peaks quieter than solveKachunk', () => {
    expect(CUE_GAINS.lockdown).toBeLessThan(CUE_GAINS.solveKachunk);
  });

  it('no failure cue is the loudest cue in the mix', () => {
    const loudest = Math.max(...SFX_CUE_NAMES.map((n) => CUE_GAINS[n]));
    expect(CUE_GAINS.strikeBuzz).toBeLessThan(loudest);
    expect(CUE_GAINS.lockdown).toBeLessThan(loudest);
  });
});

/* ------------------------------------------------------------------ */
/* Cue scheduling smoke test on a stub AudioContext (node env).        */
/* ------------------------------------------------------------------ */

class StubParam {
  value = 0;
  setValueAtTime(): StubParam {
    return this;
  }
  linearRampToValueAtTime(): StubParam {
    return this;
  }
  exponentialRampToValueAtTime(): StubParam {
    return this;
  }
  setTargetAtTime(): StubParam {
    return this;
  }
  cancelScheduledValues(): StubParam {
    return this;
  }
}

class StubNode {
  connections: StubNode[] = [];
  connect(node: StubNode): StubNode {
    this.connections.push(node);
    return node;
  }
  disconnect(): void {}
}

class StubGain extends StubNode {
  gain = new StubParam();
}

class StubFilter extends StubNode {
  type = 'lowpass';
  frequency = new StubParam();
  Q = new StubParam();
}

class StubOscillator extends StubNode {
  type = 'sine';
  frequency = new StubParam();
  detune = new StubParam();
  onended: (() => void) | null = null;
  started = 0;
  start(): void {
    this.started++;
  }
  stop(): void {}
}

class StubBufferSource extends StubNode {
  buffer: unknown = null;
  loop = false;
  onended: (() => void) | null = null;
  started = 0;
  start(): void {
    this.started++;
  }
  stop(): void {}
}

class StubContext {
  currentTime = 0;
  sampleRate = 48000;
  destination = new StubNode();
  sources: (StubOscillator | StubBufferSource)[] = [];
  createGain(): StubGain {
    return new StubGain();
  }
  createBiquadFilter(): StubFilter {
    return new StubFilter();
  }
  createOscillator(): StubOscillator {
    const o = new StubOscillator();
    this.sources.push(o);
    return o;
  }
  createBufferSource(): StubBufferSource {
    const s = new StubBufferSource();
    this.sources.push(s);
    return s;
  }
  createBuffer(_channels: number, length: number): { getChannelData(i: number): Float32Array } {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }
}

describe('cue synthesis (stub context)', () => {
  for (const name of REQUIRED_CUES) {
    it(`${name} schedules at least one source without throwing`, () => {
      const ctx = new StubContext();
      const destination = new StubNode();
      SFX_CUES[name](ctx as unknown as AudioContext, destination as unknown as AudioNode);
      expect(ctx.sources.length).toBeGreaterThan(0);
      for (const src of ctx.sources) expect(src.started).toBe(1);
    });
  }
});

/* ------------------------------------------------------------------ */
/* Volume/mute persistence logic (mock localStorage).                  */
/* ------------------------------------------------------------------ */

function mockStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('audio prefs persistence', () => {
  it('returns defaults when storage is empty', () => {
    expect(loadAudioPrefs(mockStorage())).toEqual(DEFAULT_AUDIO_PREFS);
  });

  it('returns defaults when storage is unavailable', () => {
    expect(loadAudioPrefs(null)).toEqual(DEFAULT_AUDIO_PREFS);
    expect(() => saveAudioPrefs({ volume: 0.5, muted: true }, null)).not.toThrow();
  });

  it('round-trips save → load under the ky-audio key', () => {
    const storage = mockStorage();
    saveAudioPrefs({ volume: 0.35, muted: true }, storage);
    expect(Object.keys(storage.data)).toEqual([AUDIO_STORAGE_KEY]);
    expect(loadAudioPrefs(storage)).toEqual({ volume: 0.35, muted: true });
  });

  it('clamps out-of-range persisted volume on load', () => {
    const over = mockStorage({ [AUDIO_STORAGE_KEY]: JSON.stringify({ volume: 4, muted: false }) });
    expect(loadAudioPrefs(over).volume).toBe(1);
    const under = mockStorage({ [AUDIO_STORAGE_KEY]: JSON.stringify({ volume: -2, muted: false }) });
    expect(loadAudioPrefs(under).volume).toBe(0);
  });

  it('recovers from corrupt or wrong-typed persisted data', () => {
    expect(loadAudioPrefs(mockStorage({ [AUDIO_STORAGE_KEY]: 'not json{{' }))).toEqual(DEFAULT_AUDIO_PREFS);
    expect(loadAudioPrefs(mockStorage({ [AUDIO_STORAGE_KEY]: '"just a string"' }))).toEqual(DEFAULT_AUDIO_PREFS);
    expect(
      loadAudioPrefs(mockStorage({ [AUDIO_STORAGE_KEY]: JSON.stringify({ volume: 'loud', muted: 'yes' }) })),
    ).toEqual(DEFAULT_AUDIO_PREFS);
  });

  it('preserves known fields when the other is missing', () => {
    const storage = mockStorage({ [AUDIO_STORAGE_KEY]: JSON.stringify({ muted: true }) });
    expect(loadAudioPrefs(storage)).toEqual({ volume: DEFAULT_AUDIO_PREFS.volume, muted: true });
  });
});

describe('clampVolume', () => {
  it('clamps to the 0..1 range', () => {
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(0.62)).toBe(0.62);
    expect(clampVolume(1)).toBe(1);
    expect(clampVolume(1.5)).toBe(1);
  });

  it('falls back to the default volume for non-finite input', () => {
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_AUDIO_PREFS.volume);
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(DEFAULT_AUDIO_PREFS.volume);
  });
});
