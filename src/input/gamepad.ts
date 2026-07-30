import { GAMEPAD_AXIS_DEADZONE } from '../config.js';
import type { ActionId } from '../sim/commands.js';
import { findGamepadBinding, gamepadButtonIndices } from './bindings.js';
import type { DeviceSample, InputDevice } from './types.js';

function applyRadialDeadzone(x: number, y: number, deadzone: number): { x: number; z: number } {
  const mag = Math.hypot(x, y);
  if (mag <= deadzone) return { x: 0, z: 0 };
  const scale = (mag - deadzone) / (1 - deadzone) / mag;
  return { x: x * scale, z: -y * scale };
}

function readStickDirection(x: number, y: number, deadzone: number): { axisX: number; axisZ: number } | null {
  const { x: ax, z: az } = applyRadialDeadzone(x, y, deadzone);
  const mag = Math.hypot(ax, az);
  if (mag <= 0) return null;
  return { axisX: ax / mag, axisZ: az / mag };
}

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
        for (const action of [...this.held]) {
          this.pending.push({ kind: this.kind, action, value: 0 });
          this.held.delete(action);
        }
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

    const lx = pad.axes[0] ?? 0;
    const ly = pad.axes[1] ?? 0;
    const move = applyRadialDeadzone(lx, ly, GAMEPAD_AXIS_DEADZONE);
    this.pending.push({
      kind: this.kind,
      action: 'move',
      value: 0,
      axisX: move.x,
      axisZ: move.z,
    });

    const rx = pad.axes[2] ?? 0;
    const ry = pad.axes[3] ?? 0;
    const aim = readStickDirection(rx, ry, GAMEPAD_AXIS_DEADZONE);
    if (aim) {
      this.pending.push({
        kind: this.kind,
        action: 'aim',
        value: 0,
        axisX: aim.axisX,
        axisZ: aim.axisZ,
      });
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
