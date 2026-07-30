import * as THREE from 'three';
import {
  FOLLOW_AIM_BIAS_M,
  FOLLOW_CAMERA_DISTANCE_M,
  FOLLOW_CAMERA_FOCUS_SMOOTH,
  FOLLOW_CAMERA_FOV_DEG,
  FOLLOW_CAMERA_PITCH_DEG,
  FOLLOW_CAMERA_POS_SMOOTH,
} from '../config.js';

export interface FollowCamera {
  camera: THREE.PerspectiveCamera;
  /** Render-only update; reads player pose + yaw; must not mutate SimState. */
  update(dtSec: number, player: { x: number; y: number; z: number; yaw: number }): void;
}

const PITCH_RAD = (FOLLOW_CAMERA_PITCH_DEG * Math.PI) / 180;

export function createFollowCamera(): FollowCamera {
  const camera = new THREE.PerspectiveCamera(FOLLOW_CAMERA_FOV_DEG, 1, 0.1, 500);

  let smoothFocusX = 0;
  let smoothFocusZ = 0;
  let smoothCamX = 0;
  let smoothCamY = 10;
  let smoothCamZ = 20;
  let initialized = false;

  const update = (dtSec: number, player: { x: number; y: number; z: number; yaw: number }): void => {
    const facingX = Math.sin(player.yaw);
    const facingZ = Math.cos(player.yaw);
    const aimX = player.x + facingX * FOLLOW_AIM_BIAS_M;
    const aimZ = player.z + facingZ * FOLLOW_AIM_BIAS_M;

    let focusX = player.x + (aimX - player.x) * 0.5;
    let focusZ = player.z + (aimZ - player.z) * 0.5;
    const offX = focusX - player.x;
    const offZ = focusZ - player.z;
    const offMag = Math.hypot(offX, offZ);
    if (offMag > FOLLOW_AIM_BIAS_M) {
      const s = FOLLOW_AIM_BIAS_M / offMag;
      focusX = player.x + offX * s;
      focusZ = player.z + offZ * s;
    }

    if (!initialized) {
      smoothFocusX = focusX;
      smoothFocusZ = focusZ;
      initialized = true;
    }

    const focusT = 1 - Math.exp(-FOLLOW_CAMERA_FOCUS_SMOOTH * dtSec);
    smoothFocusX += (focusX - smoothFocusX) * focusT;
    smoothFocusZ += (focusZ - smoothFocusZ) * focusT;

    const horizontalBack = FOLLOW_CAMERA_DISTANCE_M * Math.cos(PITCH_RAD);
    const height = FOLLOW_CAMERA_DISTANCE_M * Math.sin(PITCH_RAD);
    const targetCamX = smoothFocusX;
    const targetCamY = player.y + height;
    const targetCamZ = smoothFocusZ + horizontalBack;

    const posT = 1 - Math.exp(-FOLLOW_CAMERA_POS_SMOOTH * dtSec);
    smoothCamX += (targetCamX - smoothCamX) * posT;
    smoothCamY += (targetCamY - smoothCamY) * posT;
    smoothCamZ += (targetCamZ - smoothCamZ) * posT;

    camera.position.set(smoothCamX, smoothCamY, smoothCamZ);
    camera.lookAt(smoothFocusX, player.y, smoothFocusZ);
  };

  return { camera, update };
}

/** Pitch angle from horizontal (radians) for rig tests. */
export function followCameraPitchFromHorizontal(camera: THREE.PerspectiveCamera): number {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const horizontal = Math.hypot(dir.x, dir.z);
  return Math.atan2(-dir.y, horizontal);
}

/** Horizontal distance from player to camera look-at target on XZ (aim bias proxy). */
export function followCameraFocusBiasFromPlayer(
  player: { x: number; z: number; yaw: number },
  dtSec: number,
): number {
  const rig = createFollowCamera();
  rig.update(dtSec, { ...player, y: 0 });
  const lookAt = new THREE.Vector3();
  rig.camera.getWorldDirection(lookAt);
  const dist = FOLLOW_CAMERA_DISTANCE_M;
  lookAt.multiplyScalar(dist);
  const focus = rig.camera.position.clone().add(lookAt);
  return Math.hypot(focus.x - player.x, focus.z - player.z);
}
