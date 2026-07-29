import type { ActionId } from '../sim/commands.js';

export type DeviceKind = 'keyboard-mouse' | 'gamepad';

export interface DeviceSample {
  kind: DeviceKind;
  action: ActionId;
  value: 0 | 1;
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
}
