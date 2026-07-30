import * as THREE from 'three';
import type { Entity } from '../sim/types.js';
import { getCachedHeroTemplates, type HeroAssetTemplates } from './assets/preloadHeroAssets.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';
import { cloneHeroMaterials, tuneHeroMaterials } from './heroMaterialTune.js';

export async function createStandInMeshAsync(templates?: HeroAssetTemplates): Promise<THREE.Group> {
  return createStandInMeshFromTemplates(templates ?? getCachedHeroTemplates());
}

export function createStandInMeshFromTemplates(templates: HeroAssetTemplates): THREE.Group {
  const group = cloneGltfTemplate(templates.crew);
  tuneHeroMaterials(group, 'crew');
  cloneHeroMaterials(group);
  group.name = 'stand-in';
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = false;
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
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial
      ) {
        material.emissive.setHex(active ? 0xffffff : 0x000000);
        material.emissiveIntensity = active ? 0.85 : 0;
      }
    }
  });
}
