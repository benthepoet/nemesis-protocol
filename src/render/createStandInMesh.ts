import * as THREE from 'three';
import type { Entity } from '../sim/types.js';
import type { CrewAiState } from '../ai/types.js';
import { getHeroMaterialMode } from './heroMaterialMode.js';
import { getCachedHeroTemplates, type HeroAssetTemplates } from './assets/preloadHeroAssets.js';
import { cloneSkinnedGltf } from './assets/loadGltf.js';
import {
  bindHeroAnimation,
  crewPresentationSpeedMps,
  type HeroAnimHandle,
} from './heroAnimation.js';
import {
  cloneHeroMaterials,
  countHeroBasicMaterials,
  countHeroNamedMaterials,
  flashMaterialForHit,
  tuneHeroMaterials,
} from './heroMaterialTune.js';

export async function createStandInMeshAsync(templates?: HeroAssetTemplates): Promise<THREE.Group> {
  return createStandInMeshFromTemplates(templates ?? getCachedHeroTemplates());
}

function applyHeroShadowFlags(group: THREE.Group): void {
  const cast = getHeroMaterialMode() === 'pbr';
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      obj.castShadow = cast;
      obj.receiveShadow = false;
    }
  });
}

export function createStandInMeshFromTemplates(templates: HeroAssetTemplates): THREE.Group {
  const group = cloneSkinnedGltf(templates.crew);
  tuneHeroMaterials(group, 'crew', getHeroMaterialMode());
  cloneHeroMaterials(group);
  const anim = bindHeroAnimation(group, templates.crewClips, 'crew');
  group.userData.heroAnim = anim;
  group.name = 'stand-in';
  applyHeroShadowFlags(group);
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

export function updateStandInHeroPresentation(
  mesh: THREE.Group,
  entity: Entity,
  ai: CrewAiState | undefined,
  dtSec: number,
): void {
  syncStandInMeshPose(mesh, entity);
  const anim = mesh.userData.heroAnim as HeroAnimHandle | undefined;
  if (anim && ai) {
    anim.update(dtSec, {
      speedMps: crewPresentationSpeedMps(ai.fsm, ai.pauseTicksRemaining),
      aimFire: ai.fsm === 'ATTACK',
      dead: !entity.alive || ai.fsm === 'DEAD',
    });
  }
  mesh.updateMatrixWorld(true);
}

export function disposeStandInHeroPresentation(mesh: THREE.Group): void {
  const anim = mesh.userData.heroAnim as HeroAnimHandle | undefined;
  anim?.dispose();
}

export function setStandInHitFlash(mesh: THREE.Group, active: boolean): void {
  const store = new Map<THREE.Material, number>();
  mesh.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) flashMaterialForHit(material, active, store);
  });
}
