import type { ActionId } from '../../src/sim/commands.js';
import type { DeviceSample, InputDevice } from '../../src/input/types.js';

export class FakeInputDevice implements InputDevice {
  readonly kind: 'keyboard-mouse' | 'gamepad';
  private held = new Set<ActionId>();
  private queue: DeviceSample[] = [];

  constructor(kind: 'keyboard-mouse' | 'gamepad') {
    this.kind = kind;
  }

  pushSample(action: ActionId, value: 0 | 1): void {
    this.queue.push({ kind: this.kind, action, value });
    if (value === 1) this.held.add(action);
    else this.held.delete(action);
  }

  pushAxisSample(action: 'move' | 'aim', axisX: number, axisZ: number): void {
    this.queue.push({ kind: this.kind, action, value: 0, axisX, axisZ });
  }

  setHeld(action: ActionId, held: boolean): void {
    if (held) this.held.add(action);
    else this.held.delete(action);
  }

  poll(): DeviceSample[] {
    const out = this.queue;
    this.queue = [];
    return out;
  }

  getHeldActions(): ReadonlySet<ActionId> {
    return this.held;
  }

  clearHeld(): void {
    this.held.clear();
  }

  dispose(): void {
    this.queue = [];
    this.held.clear();
  }
}
