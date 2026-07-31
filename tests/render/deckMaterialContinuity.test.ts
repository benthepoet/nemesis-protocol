/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { HULL_UV_REPEAT, HULL_UV_ROTATION } from '../../src/config.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import { applyHullFamilyUv, createInterstitialMaterial } from '../../src/render/deckHullGeometry.js';
import { interstitialMaterialMeetsLuminanceFloor } from '../../src/render/deckHullAudit.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('deck material continuity (G8, M7, S9)', () => {
  it('applyHullFamilyUv sets repeat and rotation on mapped mats', () => {
    const mats = createFallbackDeckMaterials();
    const mat = mats.hullWall.clone();
    if (mat.map) {
      applyHullFamilyUv(mat);
      expect(mat.map.repeat.x).toBeCloseTo(HULL_UV_REPEAT);
      expect(mat.map.repeat.y).toBeCloseTo(HULL_UV_REPEAT);
      expect(mat.map.rotation).toBeCloseTo(HULL_UV_ROTATION);
    }
    const interstitial = createInterstitialMaterial(mats.hullWall);
    if (mat.map) {
      expect(interstitialMaterialMeetsLuminanceFloor(interstitial)).toBe(true);
    }
  });

  it('envelope family meshes share UV policy', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, createFallbackDeckMaterials());
    const sampleNames = [
      'hull-interstitial:floor',
      'hull-envelope:shell:north',
      'hull-envelope:corner:nw',
      'hull-envelope:top-band:north',
    ];
    for (const name of sampleNames) {
      const mesh = deck.hullEnvelope!.getObjectByName(name) as THREE.Mesh | undefined;
      expect(mesh, name).toBeDefined();
      const mat = mesh!.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        expect(mat.map.repeat.x).toBeCloseTo(HULL_UV_REPEAT);
        expect(mat.map.rotation).toBeCloseTo(HULL_UV_ROTATION);
      }
    }
    deck.disposeMaterials();
  });
});
