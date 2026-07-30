import type { ActionId } from '../sim/commands.js';

export type DeviceKind = 'keyboard-mouse' | 'gamepad';

export type InputChannel = 'move' | 'aim' | 'interact' | 'fire' | 'reload' | 'debug';

export function channelForAction(action: ActionId): InputChannel {
  if (action === 'move') return 'move';
  if (action === 'aim') return 'aim';
  if (action === 'fire') return 'fire';
  if (action === 'reload') return 'reload';
  if (action === 'debugDamage') return 'debug';
  return 'interact';
}

export interface DeviceSample {
  kind: DeviceKind;
  action: ActionId;
  value: 0 | 1;
  axisX?: number;
  axisZ?: number;
}

export interface InputDevice {
  readonly kind: DeviceKind;
  poll(): DeviceSample[];
  getHeldActions(): ReadonlySet<ActionId>;
  clearHeld(): void;
  dispose(): void;
}

export interface ActionIntent {
  action: ActionId;
  value: 0 | 1;
  axisX?: number;
  axisZ?: number;
}
