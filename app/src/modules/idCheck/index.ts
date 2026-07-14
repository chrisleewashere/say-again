import type { ModuleDefinition } from '../../engine/types';
import { IdCheck } from './IdCheck';
import { generateIdCheck, solveIdCheck, validateIdCheck, type IdCheckAnswer, type IdCheckState } from './logic';
import { idCheckManual } from './manual';

export const idCheckModule: ModuleDefinition<IdCheckState, IdCheckAnswer> = {
  id: 'id-check',
  codename: 'Spot the Contact',
  tagline: 'Describe the suspects; work the elimination checklist to find the contact.',
  targets: { primary: 'expressive', secondary: ['vocabulary', 'pragmatics'] },
  minutes: { 1: 3, 2: 5, 3: 7 },
  generate: generateIdCheck,
  solve: solveIdCheck,
  validate: validateIdCheck,
  Component: IdCheck,
  manual: idCheckManual,
  hints: [
    'Describe one suspect at a time — top to bottom: hat, glasses, hair, clothing. The Handler crosses people off their checklist until one remains.',
  ],
};
