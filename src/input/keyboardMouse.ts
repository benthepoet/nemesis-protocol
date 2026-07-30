import * as THREE from 'three';
import type { ActionId } from '../sim/commands.js';
import {
  findKeyboardBinding,
  findMouseBinding,
  isInteractKeyboardSuppressed,
  isMoveKeyCode,
} from './bindings.js';
import type { DeviceSample, InputDevice } from './types.js';

export type AimAxisSampler = (
  playerX: number,
  playerZ: number,
) => { axisX: number; axisZ: number } | null;

export function computeMouseAimAxis(
  playerX: number,
  playerZ: number,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { axisX: number; axisZ: number } | null {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 1;
  const height = rect.height || 1;
  const ndcX = ((clientX - rect.left) / width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / height) * 2 - 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) return null;
  const dx = hit.x - playerX;
  const dz = hit.z - playerZ;
  const len = Math.hypot(dx, dz);
  if (len <= 1e-6) return null;
  return { axisX: dx / len, axisZ: dz / len };
}

export class KeyboardMouseDevice implements InputDevice {
  readonly kind = 'keyboard-mouse' as const;

  private held = new Set<ActionId>();
  private moveKeys = new Set<string>();
  private pending: DeviceSample[] = [];
  private mouseClientX = 0;
  private mouseClientY = 0;
  private aimSampler: AimAxisSampler | null = null;
  private lastPlayerX = 0;
  private lastPlayerZ = 0;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;

  constructor() {
    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundKeyUp = (e) => this.onKeyUp(e);
    this.boundMouseDown = (e) => this.onMouseDown(e);
    this.boundMouseUp = (e) => this.onMouseUp(e);
    this.boundMouseMove = (e) => this.onMouseMove(e);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('mousemove', this.boundMouseMove);
  }

  setAimSampler(sampler: AimAxisSampler | null): void {
    this.aimSampler = sampler;
  }

  getMouseClientPosition(): { clientX: number; clientY: number } {
    return { clientX: this.mouseClientX, clientY: this.mouseClientY };
  }

  setPlayerPositionForAim(x: number, z: number): void {
    this.lastPlayerX = x;
    this.lastPlayerZ = z;
  }

  private emit(action: ActionId, value: 0 | 1): void {
    this.pending.push({ kind: this.kind, action, value });
    if (value === 1) this.held.add(action);
    else this.held.delete(action);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    if (isMoveKeyCode(e.code)) {
      this.moveKeys.add(e.code);
      return;
    }
    if (e.code === 'KeyE' && findKeyboardBinding('KeyE') === 'interact' && isInteractKeyboardSuppressed()) {
      return;
    }
    const action = findKeyboardBinding(e.code);
    if (!action || this.held.has(action)) return;
    this.emit(action, 1);
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (isMoveKeyCode(e.code)) {
      this.moveKeys.delete(e.code);
      return;
    }
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

  private onMouseMove(e: MouseEvent): void {
    this.mouseClientX = e.clientX;
    this.mouseClientY = e.clientY;
  }

  private readMoveAxis(): { axisX: number; axisZ: number } {
    let axisX = 0;
    let axisZ = 0;
    if (this.moveKeys.has('KeyW')) axisZ -= 1;
    if (this.moveKeys.has('KeyS')) axisZ += 1;
    if (this.moveKeys.has('KeyA')) axisX -= 1;
    if (this.moveKeys.has('KeyD')) axisX += 1;
    return { axisX, axisZ };
  }

  poll(): DeviceSample[] {
    const out = [...this.pending];
    this.pending = [];

    const move = this.readMoveAxis();
    out.push({ kind: this.kind, action: 'move', value: 0, axisX: move.axisX, axisZ: move.axisZ });

    if (this.aimSampler) {
      const aim = this.aimSampler(this.lastPlayerX, this.lastPlayerZ);
      if (aim && Math.hypot(aim.axisX, aim.axisZ) > 0) {
        out.push({ kind: this.kind, action: 'aim', value: 0, axisX: aim.axisX, axisZ: aim.axisZ });
      }
    }

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
    window.removeEventListener('mousemove', this.boundMouseMove);
  }
}
