import type { ModuleDefinition } from './types';

/**
 * Central module registry. Modules self-describe (contract in types.ts);
 * the mission builder, mission runner, and manual generator all read from
 * this single list.
 */
const modules = new Map<string, ModuleDefinition<unknown, unknown>>();

export function registerModule<S, A>(def: ModuleDefinition<S, A>): void {
  if (modules.has(def.id)) {
    throw new Error(`Duplicate module id: ${def.id}`);
  }
  modules.set(def.id, def as unknown as ModuleDefinition<unknown, unknown>);
}

export function getModule(id: string): ModuleDefinition<unknown, unknown> {
  const def = modules.get(id);
  if (!def) throw new Error(`Unknown module id: ${id}`);
  return def;
}

export function allModules(): ModuleDefinition<unknown, unknown>[] {
  return [...modules.values()];
}
