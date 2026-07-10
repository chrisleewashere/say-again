import { registerModule } from '../engine/registry';
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
}
