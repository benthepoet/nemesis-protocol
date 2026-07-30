import * as THREE from 'three';
import { getCachedHeroTemplates, type HeroAssetTemplates } from './assets/preloadHeroAssets.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';
import { cloneHeroMaterials, countHeroBasicMaterials, countHeroNamedMaterials, tuneHeroMaterials } from './heroMaterialTune.js';
import { attachRifleHero } from './createRifleBlockout.js';

export async function createPlayerMeshAsync(templates?: HeroAssetTemplates): Promise<THREE.Group> {
  return createPlayerMeshFromTemplates(templates ?? getCachedHeroTemplates());
}

export function createPlayerMeshFromTemplates(templates: HeroAssetTemplates): THREE.Group {
  const group = cloneGltfTemplate(templates.player);
  group.name = 'player';
  attachRifleHero(group, templates.rifle);
  tuneHeroMaterials(group, 'player');
  cloneHeroMaterials(group);
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = false;
      obj.receiveShadow = false;
    }
  });
  if (import.meta.env.DEV) {
    const named = countHeroNamedMaterials(group);
    const basic = countHeroBasicMaterials(group);
    console.info('[nemesis] player hero p1_* material slots:', named, 'basic:', basic);
    if (basic !== named) {
      console.warn(
        '[nemesis] hero materials not fully unlit — rebuild dev server; expect basic === slots for visible palette (G2/G3).',
      );
    }
  }
  return group;
}

export function createPlayerMesh(): THREE.Group {
  return createPlayerMeshFromTemplates(getCachedHeroTemplates());
}

export function syncPlayerMeshPose(
  mesh: THREE.Group,
  player: { x: number; y: number; z: number; yaw: number },
): void {
  mesh.position.set(player.x, player.y, player.z);
  mesh.rotation.y = player.yaw;
  mesh.updateMatrixWorld(true);
}

export function playerHasDebugWedge(group: THREE.Group): boolean {
  let wedge = false;
  group.traverse((obj) => {
    if (obj.name === 'player-wedge') wedge = true;
  });
  return wedge;
}
