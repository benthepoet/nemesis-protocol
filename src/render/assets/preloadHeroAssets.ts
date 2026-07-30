import * as THREE from 'three';
import {
  P1_AMBER_BEACON_GLB,
  P1_CORRIDOR_LIGHT_FIXTURE_GLB,
  P1_PLAYER_BOARDER_GLB,
  P1_RIFLE_GLB,
  P1_SECURITY_CREW_GLB,
} from './urls.js';
import {
  cloneGltfTemplate,
  loadGltf,
  loadGltfWithAnimations,
  stripOptionalMaterialMaps,
} from './loadGltf.js';
import { assertHeroGlbLoaded, tuneHeroMaterials } from '../heroMaterialTune.js';
import { getHeroMaterialMode } from '../heroMaterialMode.js';
import { assertRequiredHeroClips, stripRootMotionFromClips } from '../heroAnimation.js';

export interface HeroAssetTemplates {
  player: THREE.Group;
  playerClips: THREE.AnimationClip[];
  crew: THREE.Group;
  crewClips: THREE.AnimationClip[];
  rifle: THREE.Group;
  corridorLight: THREE.Group;
  amberBeacon: THREE.Group;
}

export async function preloadHeroAssets(): Promise<HeroAssetTemplates> {
  const [playerLoad, crewLoad, rifle, corridorLight, amberBeacon] = await Promise.all([
    loadGltfWithAnimations(P1_PLAYER_BOARDER_GLB),
    loadGltfWithAnimations(P1_SECURITY_CREW_GLB),
    loadGltf(P1_RIFLE_GLB),
    loadGltf(P1_CORRIDOR_LIGHT_FIXTURE_GLB),
    loadGltf(P1_AMBER_BEACON_GLB),
  ]);
  const player = playerLoad.scene;
  const crew = crewLoad.scene;
  const playerClips = playerLoad.animations;
  const crewClips = crewLoad.animations;

  assertRequiredHeroClips(playerClips, 'player', P1_PLAYER_BOARDER_GLB);
  assertRequiredHeroClips(crewClips, 'crew', P1_SECURITY_CREW_GLB);

  const playerClipsStripped = stripRootMotionFromClips(playerClips);
  const crewClipsStripped = stripRootMotionFromClips(crewClips);

  for (const root of [player, crew, rifle, corridorLight, amberBeacon]) {
    stripOptionalMaterialMaps(root);
  }
  const mode = getHeroMaterialMode();
  tuneHeroMaterials(player, 'player', mode);
  tuneHeroMaterials(crew, 'crew', mode);
  tuneHeroMaterials(rifle, 'player', mode);
  assertHeroGlbLoaded(player, 'p1_player_boarder');
  assertHeroGlbLoaded(crew, 'p1_security_crew');
  const bundle: HeroAssetTemplates = {
    player,
    playerClips: playerClipsStripped,
    crew,
    crewClips: crewClipsStripped,
    rifle,
    corridorLight,
    amberBeacon,
  };
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
