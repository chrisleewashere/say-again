import type { ModuleDefinition } from '../../engine/types';
import { generateWireMaze, solveWireMaze, validateWireMaze, type WireMazeAnswer, type WireMazeState } from './logic';
import { wireMazeManual } from './manual';
import { WireMaze } from './WireMaze';

export const wireMazeModule: ModuleDefinition<WireMazeState, WireMazeAnswer> = {
  id: 'wire-maze',
  codename: 'Laser Grid Bypass',
  tagline: 'Describe the wires; cut the right ones using if/then rules.',
  targets: { primary: 'receptive', secondary: ['expressive', 'pragmatics'] },
  minutes: { 1: 3, 2: 4, 3: 6 },
  generate: generateWireMaze,
  solve: solveWireMaze,
  validate: validateWireMaze,
  Component: WireMaze,
  manual: wireMazeManual,
  hints: [
    'Work the wire list from the top and use the FIRST rule that fits — then stop. Count the wires and say each color, pattern, and letter out loud before anyone says “cut”.',
  ],
};
