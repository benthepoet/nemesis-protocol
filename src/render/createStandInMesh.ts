import * as THREE from 'three';
import type { Entity } from '../sim/types.js';
import { getCachedHeroTemplates, type HeroAssetTemplates } from './assets/preloadHeroAssets.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';
import { cloneHeroMaterials, countHeroBasicMaterials, countHeroNamedMaterials, flashMaterialForHit, tuneHeroMaterials } from './heroMaterialTune.js';

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
      obj.castShadow = false;
      obj.receiveShadow = false;
    }
  });
  if (import.meta.env.DEV) {
    const named = countHeroNamedMaterials(group);
    const basic = countHeroBasicMaterials(group);
    console.info('[nemesis] crew stand-in p1_* material slots:', named, 'basic:', basic);
  }
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
  const store = new Map<THREE.Material, number>();
  mesh.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) flashMaterialForHit(material, active, store);
  });
}
