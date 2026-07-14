import { registerModule } from '../engine/registry';
import { alarmBypassModule } from './alarmBypass';
import { assetInterviewModule } from './assetInterview';
import { badIntelModule } from './badIntel';
import { debriefTapesModule } from './debriefTapes';
import { escapeRouteModule } from './escapeRoute';
import { idCheckModule } from './idCheck';
import { keypadCipherModule } from './keypadCipher';
import { passwordInterceptModule } from './passwordIntercept';
import { vaultDialModule } from './vaultDial';
import { wireMazeModule } from './wireMaze';

/**
 * Import-and-register every puzzle module exactly once. New modules: add the
 * import + register call here and nothing else — the mission builder, runner,
 * and manual generator discover modules through the registry.
 */
let registered = false;

export function registerAllModules(): void {
  if (registered) return;
  registered = true;
  registerModule(wireMazeModule);
  registerModule(vaultDialModule);
  registerModule(keypadCipherModule);
  registerModule(passwordInterceptModule);
  registerModule(alarmBypassModule);
  registerModule(escapeRouteModule);
  registerModule(idCheckModule);
  registerModule(debriefTapesModule);
  registerModule(badIntelModule);
  registerModule(assetInterviewModule);
}
