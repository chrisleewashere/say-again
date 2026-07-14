import type { ModuleDefinition } from '../../engine/types';
import {
  generateAlarmBypass,
  solveAlarmBypass,
  validateAlarmBypass,
  type AlarmBypassAnswer,
  type AlarmBypassState,
} from './logic';
import { alarmBypassManual } from './manual';
import { AlarmBypass } from './AlarmBypass';

export const alarmBypassModule: ModuleDefinition<AlarmBypassState, AlarmBypassAnswer> = {
  id: 'alarm-bypass',
  codename: 'Alarm Bypass',
  tagline: 'Report the flashed glyphs; press back the translated sequence.',
  targets: { primary: 'receptive', secondary: ['expressive'] },
  minutes: { 1: 3, 2: 5, 3: 7 },
  generate: generateAlarmBypass,
  solve: solveAlarmBypass,
  validate: validateAlarmBypass,
  Component: AlarmBypass,
  manual: alarmBypassManual,
  hints: [
    'Play the signal again and name each glyph out loud (crescent, key, bolt, eye). The Handler translates the sequence — agree on all of it before the first press.',
  ],
};
