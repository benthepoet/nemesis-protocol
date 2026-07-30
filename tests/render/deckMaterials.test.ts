/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { createDeckScene, meshUsesPbrMaps } from '../../src/render/createDeckScene.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';

describe('deck PBR materials (G5, M4)', () => {
  it('floor/wall materials include PBR maps when map-backed', () => {
    const mats = createFallbackDeckMaterials();
    const tex = new THREE.DataTexture(new Uint8Array([180, 180, 180, 255]), 1, 1);
    tex.needsUpdate = true;
    for (const key of ['map', 'metalnessMap', 'roughnessMap', 'normalMap'] as const) {
      mats.floor[key] = tex;
    }

    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, mats);
    const spine = deck.roomGroups.get('main-spine')!;
    const floor = spine.getObjectByName('floor:main-spine') as THREE.Mesh | undefined;
    expect(floor).toBeDefined();
    expect(meshUsesPbrMaps(floor!)).toBe(true);
    deck.disposeMaterials();
    mats.dispose();
  });
});
