import type { ModuleDefinition } from '../../engine/types';
import {
  generateBadIntel,
  solveBadIntel,
  validateBadIntel,
  type BadIntelAnswer,
  type BadIntelState,
} from './logic';
import { badIntelManual } from './manual';
import { BadIntel } from './BadIntel';

export const badIntelModule: ModuleDefinition<BadIntelState, BadIntelAnswer> = {
  id: 'bad-intel',
  codename: 'Bad Intel',
  tagline: 'Walk the printed service steps — and flag the one the panel cannot obey.',
  targets: { primary: 'pragmatics', secondary: ['receptive', 'expressive'] },
  minutes: { 1: 3, 2: 4, 3: 5 },
  generate: generateBadIntel,
  solve: solveBadIntel,
  validate: validateBadIntel,
  Component: BadIntel,
  manual: badIntelManual,
};
