import type { ModuleDefinition } from '../../engine/types';
import {
  generateKeypadCipher,
  solveKeypadCipher,
  validateKeypadCipher,
  type KeypadCipherAnswer,
  type KeypadCipherState,
} from './logic';
import { keypadCipherManual } from './manual';
import { KeypadCipher } from './KeypadCipher';

export const keypadCipherModule: ModuleDefinition<KeypadCipherState, KeypadCipherAnswer> = {
  id: 'keypad-cipher',
  codename: 'Code Room',
  tagline: 'Sort word keys into their categories and press them in priority order.',
  targets: { primary: 'vocabulary', secondary: ['expressive', 'pragmatics'] },
  minutes: { 1: 3, 2: 4, 3: 6 },
  generate: generateKeypadCipher,
  solve: solveKeypadCipher,
  validate: validateKeypadCipher,
  Component: KeypadCipher,
  manual: keypadCipherManual,
};
