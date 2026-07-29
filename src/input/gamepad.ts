import type { ActionId } from '../sim/commands.js';
import { findGamepadBinding, gamepadButtonIndices } from './bindings.js';
import type { DeviceSample, InputDevice } from './types.js';

export class GamepadDevice implements InputDevice {
  readonly kind = 'gamepad' as const;

  private held = new Set<ActionId>();
  private pending: DeviceSample[] = [];
  private previousButtons = new Map<number, boolean>();
  private connected = false;

  poll(): DeviceSample[] {
    this.pending = [];
    const pads = navigator.getGamepads?.() ?? [];
    const pad = pads.find((p) => p !== null && p.connected) ?? null;

    if (!pad) {
      if (this.connected) {
        this.connected = false;
        this.previousButtons.clear();
      }
      return this.pending;
    }

    this.connected = true;
    const indices = gamepadButtonIndices();
    for (const index of indices) {
      const pressed = Boolean(pad.buttons[index]?.pressed);
      const was = this.previousButtons.get(index) ?? false;
      if (pressed && !was) {
        const action = findGamepadBinding(index);
        if (action && !this.held.has(action)) {
          this.pending.push({ kind: this.kind, action, value: 1 });
          this.held.add(action);
        }
      } else if (!pressed && was) {
        const action = findGamepadBinding(index);
        if (action && this.held.has(action)) {
          this.pending.push({ kind: this.kind, action, value: 0 });
          this.held.delete(action);
        }
      }
      this.previousButtons.set(index, pressed);
    }

    return this.pending;
  }

  getHeldActions(): ReadonlySet<ActionId> {
    return this.held;
  }

  clearHeld(): void {
    this.held.clear();
    this.previousButtons.clear();
  }

  dispose(): void {
    this.pending = [];
    this.held.clear();
    this.previousButtons.clear();
  }
}
