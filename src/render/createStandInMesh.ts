import * as THREE from 'three';
import type { Entity } from '../sim/types.js';
import { getCachedHeroTemplates, type HeroAssetTemplates } from './assets/preloadHeroAssets.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';

export async function createStandInMeshAsync(templates?: HeroAssetTemplates): Promise<THREE.Group> {
  return createStandInMeshFromTemplates(templates ?? getCachedHeroTemplates());
}

export function createStandInMeshFromTemplates(templates: HeroAssetTemplates): THREE.Group {
  const group = cloneGltfTemplate(templates.crew);
  group.name = 'stand-in';
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

export function createStandInMesh(): THREE.Group {
  return createStandInMeshFromTemplates(getCachedHeroTemplates());
}

export function syncStandInMeshPose(mesh: THREE.Group, entity: Entity): void {
  mesh.position.set(entity.x, entity.y, entity.z);
  mesh.rotation.y = entity.yaw;
}

export function setStandInHitFlash(mesh: THREE.Group, active: boolean): void {
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      obj.material.emissive.setHex(active ? 0xffffff : 0x000000);
      obj.material.emissiveIntensity = active ? 0.85 : 0;
    }
  });
}
