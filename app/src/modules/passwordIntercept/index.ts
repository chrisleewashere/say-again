import type { ModuleDefinition } from '../../engine/types';
import {
  generatePasswordIntercept,
  solvePasswordIntercept,
  validatePasswordIntercept,
  type PasswordInterceptAnswer,
  type PasswordInterceptState,
} from './logic';
import { passwordInterceptManual } from './manual';
import { PasswordIntercept } from './PasswordIntercept';

export const passwordInterceptModule: ModuleDefinition<
  PasswordInterceptState,
  PasswordInterceptAnswer
> = {
  id: 'password-intercept',
  codename: 'Password Intercept',
  tagline: 'Decode enemy passwords with synonym, opposite, and definition clues.',
  targets: { primary: 'vocabulary', secondary: ['receptive', 'pragmatics'] },
  minutes: { 1: 3, 2: 4, 3: 6 },
  generate: generatePasswordIntercept,
  solve: solvePasswordIntercept,
  validate: validatePasswordIntercept,
  Component: PasswordIntercept,
  manual: passwordInterceptManual,
};
