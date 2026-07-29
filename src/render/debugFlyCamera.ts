import * as THREE from 'three';
import { DEBUG_CAMERA_PARAM } from '../config.js';

const MOVE_SPEED_MPS = 12;
const SPRINT_MULTIPLIER = 2.5;
const LOOK_SENSITIVITY = 0.002;
const PITCH_LIMIT = Math.PI / 2 - 0.01;

export function isDebugFlyCameraEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  return params.get(DEBUG_CAMERA_PARAM) === '1';
}

export interface DebugFlyCamera {
  camera: THREE.PerspectiveCamera;
  update(dtSec: number): void;
  dispose(): void;
}

export function createDebugFlyCamera(canvas: HTMLCanvasElement): DebugFlyCamera {
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);
  camera.position.set(50, 5, 50);

  let yaw = 0;
  let pitch = -0.2;
  const keys = new Set<string>();
  let pointerLocked = false;

  const onKeyDown = (e: KeyboardEvent) => keys.add(e.code);
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const onMouseMove = (e: MouseEvent) => {
    if (!pointerLocked) return;
    yaw -= e.movementX * LOOK_SENSITIVITY;
    pitch -= e.movementY * LOOK_SENSITIVITY;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  };
  const onClick = () => {
    if (!pointerLocked) {
      canvas.requestPointerLock();
    }
  };
  const onPointerLockChange = () => {
    pointerLocked = document.pointerLockElement === canvas;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  document.addEventListener('pointerlockchange', onPointerLockChange);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const update = (dtSec: number): void => {
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight')
      ? MOVE_SPEED_MPS * SPRINT_MULTIPLIER
      : MOVE_SPEED_MPS;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, up).normalize();

    if (keys.has('KeyW')) camera.position.addScaledVector(forward, speed * dtSec);
    if (keys.has('KeyS')) camera.position.addScaledVector(forward, -speed * dtSec);
    if (keys.has('KeyA')) camera.position.addScaledVector(right, -speed * dtSec);
    if (keys.has('KeyD')) camera.position.addScaledVector(right, speed * dtSec);
    if (keys.has('KeyE')) camera.position.y += speed * dtSec;
    if (keys.has('KeyQ')) camera.position.y -= speed * dtSec;
  };

  const dispose = (): void => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('click', onClick);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
  };

  return { camera, update, dispose };
}
