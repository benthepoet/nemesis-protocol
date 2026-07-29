import type { ActionId } from '../sim/commands.js';

export interface ActionBinding {
  action: ActionId;
  keyboard?: string;
  mouseButton?: number;
  gamepadButton?: number;
}

export const ACTION_BINDINGS: readonly ActionBinding[] = [
  { action: 'interact', keyboard: 'KeyE', mouseButton: 0, gamepadButton: 0 },
  { action: 'cancel', keyboard: 'Escape', gamepadButton: 1 },
];

export function findKeyboardBinding(code: string): ActionId | null {
  for (const binding of ACTION_BINDINGS) {
    if (binding.keyboard === code) return binding.action;
  }
  return null;
}

export function findMouseBinding(button: number): ActionId | null {
  for (const binding of ACTION_BINDINGS) {
    if (binding.mouseButton === button) return binding.action;
  }
  return null;
}

export function findGamepadBinding(buttonIndex: number): ActionId | null {
  for (const binding of ACTION_BINDINGS) {
    if (binding.gamepadButton === buttonIndex) return binding.action;
  }
  return null;
}

export function gamepadButtonIndices(): number[] {
  const indices = new Set<number>();
  for (const binding of ACTION_BINDINGS) {
    if (binding.gamepadButton !== undefined) indices.add(binding.gamepadButton);
  }
  return [...indices];
}
