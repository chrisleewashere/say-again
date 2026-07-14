import type { ModuleDefinition } from '../../engine/types';
import { EscapeRoute } from './EscapeRoute';
import {
  generateEscapeRoute,
  solveEscapeRoute,
  validateEscapeRoute,
  type EscapeRouteAnswer,
  type EscapeRouteState,
} from './logic';
import { escapeRouteManual } from './manual';

export const escapeRouteModule: ModuleDefinition<EscapeRouteState, EscapeRouteAnswer> = {
  id: 'escape-route',
  codename: 'Escape Route',
  tagline: 'Talk your Agent across the floor — only your map shows the hidden sensors.',
  targets: { primary: 'expressive', secondary: ['receptive', 'pragmatics'] },
  minutes: { 1: 3, 2: 5, 3: 7 },
  generate: generateEscapeRoute,
  solve: solveEscapeRoute,
  validate: validateEscapeRoute,
  Component: EscapeRoute,
  manual: escapeRouteManual,
  hints: [
    'Read the floor code to your Handler, then move ONE step at a time. Repeat each direction back before you step — sensors reset you to the start.',
  ],
};
