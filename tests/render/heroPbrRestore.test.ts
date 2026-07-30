/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SHADOW_CASTING_DIRECTIONAL_MAX } from '../../src/config.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { P1_PLAYER_BOARDER_GLB } from '../../src/render/assets/urls.js';
import { loadGltfWithAnimations, stripOptionalMaterialMaps } from '../../src/render/assets/loadGltf.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { countShadowCastingDirectionals, createDeckLighting } from '../../src/render/createDeckLighting.js';
import { getHeroFixtures, preloadHeroAssets } from '../../src/render/assets/preloadHeroAssets.js';
import {
  countHeroBasicMaterials,
  countHeroStandardBodyMaterials,
  heroBodyHasAlbedoMap,
  heroBodyHasFactorAlbedo,
  tuneHeroMaterials,
} from '../../src/render/heroMaterialTune.js';

describe('hero PBR restore (G2–G4, R15)', () => {
  it('E11: pbr tune retains Standard body mats; shadow cap unchanged', async () => {
    const { scene: playerRoot } = await loadGltfWithAnimations(P1_PLAYER_BOARDER_GLB);
    stripOptionalMaterialMaps(playerRoot);
    tuneHeroMaterials(playerRoot, 'player', 'pbr');

    let aoCleared = true;
    playerRoot.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial && m.aoMap !== null) aoCleared = false;
      }
    });
    expect(aoCleared).toBe(true);

    expect(countHeroStandardBodyMaterials(playerRoot)).toBeGreaterThan(0);
    expect(countHeroBasicMaterials(playerRoot)).toBe(0);
    if (heroBodyHasAlbedoMap(playerRoot)) {
      expect(heroBodyHasAlbedoMap(playerRoot)).toBe(true);
    } else {
      expect(heroBodyHasFactorAlbedo(playerRoot)).toBe(true);
    }

    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const fixtures = getHeroFixtures(await preloadHeroAssets());
    createDeckLighting(deck.scene, graph, fixtures);
    expect(countShadowCastingDirectionals(deck.scene)).toBe(SHADOW_CASTING_DIRECTIONAL_MAX);

    let pointShadow = false;
    deck.scene.traverse((obj) => {
      if (obj instanceof THREE.PointLight && obj.castShadow) pointShadow = true;
    });
    expect(pointShadow).toBe(false);

    deck.disposeMaterials();
  });
});
