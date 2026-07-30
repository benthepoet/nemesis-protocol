import * as THREE from 'three';
import { PROJECTILE_MUZZLE_OFFSET_M, MUZZLE_ANCHOR_TOLERANCE_M } from '../config.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';

function findMuzzleAnchor(root: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (found) return;
    if (obj.name === 'muzzle' || obj.name === 'muzzleAnchor') found = obj;
  });
  return found;
}

/** Attach hero rifle; ensure muzzle empty world XZ matches sim offset within tolerance. */
export function attachRifleHero(playerGroup: THREE.Group, rifleTemplate: THREE.Group): THREE.Object3D {
  const rifle = cloneGltfTemplate(rifleTemplate);
  rifle.name = 'p1_rifle';
  playerGroup.add(rifle);

  let muzzle = findMuzzleAnchor(rifle);
  if (!muzzle) {
    muzzle = new THREE.Object3D();
    muzzle.name = 'muzzle';
    muzzle.position.set(0, 0.85, PROJECTILE_MUZZLE_OFFSET_M);
    rifle.add(muzzle);
  }

  playerGroup.updateMatrixWorld(true);
  const world = new THREE.Vector3();
  muzzle.getWorldPosition(world);
  const px = playerGroup.position.x;
  const pz = playerGroup.position.z;
  const yaw = playerGroup.rotation.y;
  const expectedX = px + Math.sin(yaw) * PROJECTILE_MUZZLE_OFFSET_M;
  const expectedZ = pz + Math.cos(yaw) * PROJECTILE_MUZZLE_OFFSET_M;
  const dx = world.x - expectedX;
  const dz = world.z - expectedZ;
  if (Math.hypot(dx, dz) > MUZZLE_ANCHOR_TOLERANCE_M) {
    rifle.position.x -= dx;
    rifle.position.z -= dz;
  }

  playerGroup.userData.muzzleAnchor = muzzle;
  return muzzle;
}

export function getMuzzleWorldXZ(playerGroup: THREE.Group): { x: number; z: number } {
  const anchor = (playerGroup.userData.muzzleAnchor as THREE.Object3D | undefined) ?? playerGroup;
  const world = new THREE.Vector3();
  anchor.getWorldPosition(world);
  return { x: world.x, z: world.z };
}

/** @deprecated blockout replaced by hero GLB — kept for import stability. */
export function attachRifleBlockout(_playerGroup: THREE.Group): THREE.Object3D {
  throw new Error('attachRifleBlockout removed — use attachRifleHero with preloaded rifle GLB');
}
