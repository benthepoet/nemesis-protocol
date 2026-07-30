import * as THREE from 'three';
import {
  HOSTILE_COLOR_HEX,
  PLAYER_MESH_RADIUS_M,
  STAND_IN_MESH_HEIGHT_M,
} from '../config.js';
import type { Entity } from '../sim/types.js';

export function createStandInMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'stand-in';

  const mat = new THREE.MeshStandardMaterial({
    color: HOSTILE_COLOR_HEX,
    metalness: 0.35,
    roughness: 0.6,
  });
  const capsuleGeo = new THREE.CapsuleGeometry(
    PLAYER_MESH_RADIUS_M,
    STAND_IN_MESH_HEIGHT_M - 2 * PLAYER_MESH_RADIUS_M,
    8,
    16,
  );
  const capsule = new THREE.Mesh(capsuleGeo, mat);
  capsule.position.y = STAND_IN_MESH_HEIGHT_M / 2;
  group.add(capsule);

  return group;
}

export function syncStandInMeshPose(mesh: THREE.Group, entity: Entity): void {
  mesh.position.set(entity.x, entity.y, entity.z);
  mesh.rotation.y = entity.yaw;
}

export function setStandInHitFlash(mesh: THREE.Group, active: boolean): void {
  const body = mesh.children[0] as THREE.Mesh | undefined;
  if (!body || !(body.material instanceof THREE.MeshStandardMaterial)) return;
  body.material.emissive.setHex(active ? 0xffffff : 0x000000);
  body.material.emissiveIntensity = active ? 0.85 : 0;
}
