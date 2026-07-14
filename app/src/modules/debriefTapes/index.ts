import type { ModuleDefinition } from '../../engine/types';
import {
  generateDebriefTapes,
  solveDebriefTapes,
  validateDebriefTapes,
  type DebriefTapesAnswer,
  type DebriefTapesState,
} from './logic';
import { debriefTapesManual } from './manual';
import { DebriefTapes } from './DebriefTapes';

export const debriefTapesModule: ModuleDefinition<DebriefTapesState, DebriefTapesAnswer> = {
  id: 'debrief-tapes',
  codename: 'Debrief Tapes',
  tagline: 'Rebuild the shuffled operation, link the entries, and retell the story.',
  targets: { primary: 'narrative', secondary: ['expressive', 'pragmatics'] },
  minutes: { 1: 4, 2: 5, 3: 6 },
  generate: generateDebriefTapes,
  solve: solveDebriefTapes,
  validate: validateDebriefTapes,
  Component: DebriefTapes,
  manual: debriefTapesManual,
};
