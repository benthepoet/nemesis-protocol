import type { ActionId } from '../sim/commands.js';
import { findKeyboardBinding, findMouseBinding } from './bindings.js';
import type { DeviceSample, InputDevice } from './types.js';

export class KeyboardMouseDevice implements InputDevice {
  readonly kind = 'keyboard-mouse' as const;

  private held = new Set<ActionId>();
  private pending: DeviceSample[] = [];
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;

  constructor() {
    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundKeyUp = (e) => this.onKeyUp(e);
    this.boundMouseDown = (e) => this.onMouseDown(e);
    this.boundMouseUp = (e) => this.onMouseUp(e);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
  }

  private emit(action: ActionId, value: 0 | 1): void {
    this.pending.push({ kind: this.kind, action, value });
    if (value === 1) this.held.add(action);
    else this.held.delete(action);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    const action = findKeyboardBinding(e.code);
    if (!action || this.held.has(action)) return;
    this.emit(action, 1);
  }

  private onKeyUp(e: KeyboardEvent): void {
    const action = findKeyboardBinding(e.code);
    if (!action || !this.held.has(action)) return;
    this.emit(action, 0);
  }

  private onMouseDown(e: MouseEvent): void {
    const action = findMouseBinding(e.button);
    if (!action || this.held.has(action)) return;
    this.emit(action, 1);
  }

  private onMouseUp(e: MouseEvent): void {
    const action = findMouseBinding(e.button);
    if (!action || !this.held.has(action)) return;
    this.emit(action, 0);
  }

  poll(): DeviceSample[] {
    const out = this.pending;
    this.pending = [];
    return out;
  }

  getHeldActions(): ReadonlySet<ActionId> {
    return this.held;
  }

  clearHeld(): void {
    this.held.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
  }
}
