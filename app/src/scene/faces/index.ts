/**
 * Registry of in-case module faces, keyed by moduleId. A module without a
 * face here still works in the Field Case — the shell falls back to the
 * flat screen-space panel for it — so faces can land one at a time and
 * adding a future module never REQUIRES 3D work (a 2D component alone is a
 * complete module).
 */
import type { ModuleFace } from './types';
import { alarmBypassFace } from './alarmBypass';
import { escapeRouteFace } from './escapeRoute';
import { idCheckFace } from './idCheck';
import { keypadCipherFace } from './keypadCipher';
import { passwordInterceptFace } from './passwordIntercept';
import { vaultDialFace } from './vaultDial';
import { wireMazeFace } from './wireMaze';

const FACES: Record<string, ModuleFace<never>> = {
  'wire-maze': wireMazeFace as ModuleFace<never>,
  'vault-dial': vaultDialFace as ModuleFace<never>,
  'keypad-cipher': keypadCipherFace as ModuleFace<never>,
  'password-intercept': passwordInterceptFace as ModuleFace<never>,
  'alarm-bypass': alarmBypassFace as ModuleFace<never>,
  'escape-route': escapeRouteFace as ModuleFace<never>,
  'id-check': idCheckFace as ModuleFace<never>,
};

export function getFace(moduleId: string): ModuleFace | undefined {
  return FACES[moduleId] as ModuleFace | undefined;
}
