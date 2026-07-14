import type { ModuleDefinition } from '../../engine/types';
import {
  generateAssetInterview,
  solveAssetInterview,
  validateAssetInterview,
  type AssetInterviewAnswer,
  type AssetInterviewState,
} from './logic';
import { assetInterviewManual } from './manual';
import { AssetInterview } from './AssetInterview';

export const assetInterviewModule: ModuleDefinition<AssetInterviewState, AssetInterviewAnswer> = {
  id: 'asset-interview',
  codename: 'Asset Interview',
  tagline: 'You hold the answers; your Handler holds the questions — asking is the only way in.',
  targets: { primary: 'pragmatics', secondary: ['expressive', 'receptive'] },
  minutes: { 1: 3, 2: 4, 3: 5 },
  generate: generateAssetInterview,
  solve: solveAssetInterview,
  validate: validateAssetInterview,
  Component: AssetInterview,
  manual: assetInterviewManual,
};
