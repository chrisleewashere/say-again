import type { ModuleDefinition } from '../../engine/types';
import {
  generateVaultDial,
  solveVaultDial,
  validateVaultDial,
  type VaultDialAnswer,
  type VaultDialState,
} from './logic';
import { vaultDialManual } from './manual';
import { VaultDial } from './VaultDial';

export const vaultDialModule: ModuleDefinition<VaultDialState, VaultDialAnswer> = {
  id: 'vault-dial',
  codename: 'Crack the Safe',
  tagline: 'Describe each gem precisely; the Handler computes the vault code.',
  targets: { primary: 'expressive', secondary: ['vocabulary', 'pragmatics'] },
  minutes: { 1: 3, 2: 4, 3: 6 },
  generate: generateVaultDial,
  solve: solveVaultDial,
  validate: validateVaultDial,
  Component: VaultDial,
  manual: vaultDialManual,
};
