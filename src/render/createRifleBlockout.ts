import * as THREE from 'three';
import { HERO_GRIP_BONE, PROJECTILE_MUZZLE_OFFSET_M, MUZZLE_ANCHOR_TOLERANCE_M } from '../config.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';

function findMuzzleAnchor(root: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (found) return;
    if (obj.name === 'muzzle' || obj.name === 'muzzleAnchor') found = obj;
  });
  return found;
}

function findGripBone(root: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (found) return;
    if (obj.name === HERO_GRIP_BONE) found = obj;
  });
  return found;
}

let gripFallbackWarned = false;

function applyMuzzleXZCorrection(playerGroup: THREE.Group, rifle: THREE.Object3D, muzzle: THREE.Object3D): void {
  playerGroup.updateMatrixWorld(true);
  const world = new THREE.Vector3();
  muzzle.getWorldPosition(world);
  const px = playerGroup.position.x;
  const pz = playerGroup.position.z;
  const yaw = playerGroup.rotation.y;
  const expectedX = px + Math.sin(yaw) * PROJECTILE_MUZZLE_OFFSET_M;
  const expectedZ = pz + Math.cos(yaw) * PROJECTILE_MUZZLE_OFFSET_M;
  const dx = expectedX - world.x;
  const dz = expectedZ - world.z;
  if (Math.hypot(dx, dz) <= MUZZLE_ANCHOR_TOLERANCE_M) return;

  const rifleParent = rifle.parent;
  if (!rifleParent) return;
  const rifleWorld = new THREE.Vector3();
  rifle.getWorldPosition(rifleWorld);
  const targetWorld = rifleWorld.add(new THREE.Vector3(dx, 0, dz));
  const localPos = targetWorld.clone();
  rifleParent.worldToLocal(localPos);
  rifle.position.copy(localPos);
}

/** Parent rifle to hand_r_grip when present; else root fallback. Returns muzzle anchor. */
export function attachRifleHero(playerGroup: THREE.Group, rifleTemplate: THREE.Group): THREE.Object3D {
  const rifle = cloneGltfTemplate(rifleTemplate);
  rifle.name = 'p1_rifle';

  let muzzle = findMuzzleAnchor(rifle);
  if (!muzzle) {
    muzzle = new THREE.Object3D();
    muzzle.name = 'muzzle';
    muzzle.position.set(0, 0.85, PROJECTILE_MUZZLE_OFFSET_M);
    rifle.add(muzzle);
  }

  const grip = findGripBone(playerGroup);
  if (grip) {
    grip.add(rifle);
  } else {
    playerGroup.add(rifle);
    if (import.meta.env.DEV && !gripFallbackWarned) {
      gripFallbackWarned = true;
      console.warn(
        `[nemesis] ${HERO_GRIP_BONE} missing — rifle parented to player root (interim rigid GLB fallback).`,
      );
    }
  }

  applyMuzzleXZCorrection(playerGroup, rifle, muzzle);

  playerGroup.userData.muzzleAnchor = muzzle;
  return muzzle;
}

/** Keep mesh muzzle XZ aligned with sim offset after pose / animation (R6). */
export function syncHeroMuzzleAnchorToSim(playerGroup: THREE.Group): void {
  const muzzle = playerGroup.userData.muzzleAnchor as THREE.Object3D | undefined;
  if (!muzzle) return;
  let rifle: THREE.Object3D | null = null;
  playerGroup.traverse((obj) => {
    if (obj.name === 'p1_rifle') rifle = obj;
  });
  if (rifle) applyMuzzleXZCorrection(playerGroup, rifle, muzzle);
}

export function getMuzzleWorldXZ(playerGroup: THREE.Group): { x: number; z: number } {
  const anchor = (playerGroup.userData.muzzleAnchor as THREE.Object3D | undefined) ?? playerGroup;
  const world = new THREE.Vector3();
  anchor.getWorldPosition(world);
  return { x: world.x, z: world.z };
}

export function heroHasGripBone(root: THREE.Object3D): boolean {
  return findGripBone(root) !== null;
}

/** @deprecated blockout replaced by hero GLB — kept for import stability. */
export function attachRifleBlockout(_playerGroup: THREE.Group): THREE.Object3D {
  throw new Error('attachRifleBlockout removed — use attachRifleHero with preloaded rifle GLB');
}
