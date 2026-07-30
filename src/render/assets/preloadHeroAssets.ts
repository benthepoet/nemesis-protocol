import * as THREE from 'three';
import {
  P1_AMBER_BEACON_GLB,
  P1_CORRIDOR_LIGHT_FIXTURE_GLB,
  P1_PLAYER_BOARDER_GLB,
  P1_RIFLE_GLB,
  P1_SECURITY_CREW_GLB,
} from './urls.js';
import { cloneGltfTemplate, loadGltf, stripOptionalMaterialMaps } from './loadGltf.js';
import { assertHeroGlbLoaded, tuneHeroMaterials } from '../heroMaterialTune.js';

export interface HeroAssetTemplates {
  player: THREE.Group;
  crew: THREE.Group;
  rifle: THREE.Group;
  corridorLight: THREE.Group;
  amberBeacon: THREE.Group;
}

export async function preloadHeroAssets(): Promise<HeroAssetTemplates> {
  const [player, crew, rifle, corridorLight, amberBeacon] = await Promise.all([
    loadGltf(P1_PLAYER_BOARDER_GLB),
    loadGltf(P1_SECURITY_CREW_GLB),
    loadGltf(P1_RIFLE_GLB),
    loadGltf(P1_CORRIDOR_LIGHT_FIXTURE_GLB),
    loadGltf(P1_AMBER_BEACON_GLB),
  ]);
  for (const root of [player, crew, rifle, corridorLight, amberBeacon]) {
    stripOptionalMaterialMaps(root);
  }
  tuneHeroMaterials(player, 'player');
  tuneHeroMaterials(crew, 'crew');
  assertHeroGlbLoaded(player, 'p1_player_boarder');
  assertHeroGlbLoaded(crew, 'p1_security_crew');
  const bundle = { player, crew, rifle, corridorLight, amberBeacon };
  cachedHeroTemplates = bundle;
  return bundle;
}

let cachedHeroTemplates: HeroAssetTemplates | null = null;

export function getCachedHeroTemplates(): HeroAssetTemplates {
  if (!cachedHeroTemplates) {
    throw new Error('hero assets not preloaded');
  }
  return cachedHeroTemplates;
}

export function getHeroFixtures(templates: HeroAssetTemplates): {
  corridorLight: THREE.Group;
  amberBeacon: THREE.Group;
} {
  return {
    corridorLight: templates.corridorLight,
    amberBeacon: templates.amberBeacon,
  };
}

export { cloneGltfTemplate };
