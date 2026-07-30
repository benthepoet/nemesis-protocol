import * as THREE from 'three';
import { getHeroMaterialMode } from './heroMaterialMode.js';
import { getCachedHeroTemplates, type HeroAssetTemplates } from './assets/preloadHeroAssets.js';
import { cloneSkinnedGltf } from './assets/loadGltf.js';
import {
  cloneHeroMaterials,
  countHeroBasicMaterials,
  countHeroNamedMaterials,
  tuneHeroMaterials,
} from './heroMaterialTune.js';
import { attachRifleHero, syncHeroMuzzleAnchorToSim } from './createRifleBlockout.js';
import { bindHeroAnimation, playerPresentationSpeedMps, type HeroAnimHandle } from './heroAnimation.js';
import type { Entity } from '../sim/types.js';
import type { WorldMeta } from '../sim/types.js';

export async function createPlayerMeshAsync(templates?: HeroAssetTemplates): Promise<THREE.Group> {
  return createPlayerMeshFromTemplates(templates ?? getCachedHeroTemplates());
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

export function createPlayerMeshFromTemplates(templates: HeroAssetTemplates): THREE.Group {
  const group = cloneSkinnedGltf(templates.player);
  group.name = 'player';
  attachRifleHero(group, templates.rifle);
  tuneHeroMaterials(group, 'player', getHeroMaterialMode());
  cloneHeroMaterials(group);
  const anim = bindHeroAnimation(group, templates.playerClips, 'player');
  group.userData.heroAnim = anim;
  applyHeroShadowFlags(group);
  if (import.meta.env.DEV) {
    const named = countHeroNamedMaterials(group);
    const basic = countHeroBasicMaterials(group);
    console.info('[nemesis] player hero p1_* material slots:', named, 'basic:', basic);
    if (getHeroMaterialMode() === 'basic' && basic !== named) {
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

export function updatePlayerHeroPresentation(
  mesh: THREE.Group,
  player: Entity,
  meta: Pick<WorldMeta, 'fireHeld'>,
  dtSec: number,
): void {
  syncPlayerMeshPose(mesh, player);
  const anim = mesh.userData.heroAnim as HeroAnimHandle | undefined;
  anim?.update(dtSec, {
    speedMps: playerPresentationSpeedMps(player.moveIntentX, player.moveIntentZ),
    aimFire: meta.fireHeld,
    dead: false,
  });
  syncHeroMuzzleAnchorToSim(mesh);
  mesh.updateMatrixWorld(true);
}

export function disposePlayerHeroPresentation(mesh: THREE.Group): void {
  const anim = mesh.userData.heroAnim as HeroAnimHandle | undefined;
  anim?.dispose();
}

export function playerHasDebugWedge(group: THREE.Group): boolean {
  let wedge = false;
  group.traverse((obj) => {
    if (obj.name === 'player-wedge') wedge = true;
  });
  return wedge;
}
