/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  INTERSTITIAL_ALBEDO_TINT_HEX,
  INTERSTITIAL_MIN_LINEAR_LUMINANCE,
  VOID_FAMILY_RGB,
} from '../../src/config.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import {
  computeDeckBounds,
  buildRoomFootprintPolygons,
  createInterstitialMaterial,
} from '../../src/render/deckHullGeometry.js';
import {
  isVoidFamilyRgb,
  materialLinearLuminance,
  interstitialMaterialMeetsLuminanceFloor,
  buildInterstitialMask,
} from '../../src/render/deckHullAudit.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('deck hull pixel audit (G1, R-DP9)', () => {
  it('void-family classifier matches #05080f', () => {
    expect(isVoidFamilyRgb(VOID_FAMILY_RGB.r, VOID_FAMILY_RGB.g, VOID_FAMILY_RGB.b)).toBe(true);
    expect(isVoidFamilyRgb(40, 40, 40)).toBe(false);
  });

  it('interstitial / skirt / envelope sample mats meet luminance floor', () => {
    const mats = createFallbackDeckMaterials();
    const interstitial = createInterstitialMaterial(mats.floor);
    expect(interstitial.color.getHexString()).toBe(INTERSTITIAL_ALBEDO_TINT_HEX.slice(1));
    expect(materialLinearLuminance(interstitial)).toBeGreaterThanOrEqual(
      INTERSTITIAL_MIN_LINEAR_LUMINANCE,
    );
    expect(interstitialMaterialMeetsLuminanceFloor(interstitial)).toBe(true);
    expect(isVoidFamilyRgb(5, 8, 15)).toBe(true);
    expect(materialLinearLuminance(interstitial)).toBeGreaterThan(0.06);

    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, mats);
    const floor = deck.hullEnvelope!.getObjectByName('hull-interstitial:floor') as THREE.Mesh;
    const floorMat = floor.material as THREE.MeshStandardMaterial;
    expect(interstitialMaterialMeetsLuminanceFloor(floorMat)).toBe(true);

    const skirt = deck.hullEnvelope!.getObjectByName('hull-skirt:wall-c-port-airlock-top') as
      | THREE.Mesh
      | undefined;
    if (skirt) {
      expect(interstitialMaterialMeetsLuminanceFloor(skirt.material as THREE.MeshStandardMaterial)).toBe(
        true,
      );
    }
    deck.disposeMaterials();
  });

  it('interstitial mask has non-empty interstitial cells', () => {
    const graph = loadTestDeck03();
    const bounds = computeDeckBounds(graph);
    const polys = buildRoomFootprintPolygons(graph);
    const mask = buildInterstitialMask(bounds, polys);
    const any = mask.insideInterstitial.some(Boolean);
    expect(any).toBe(true);
    expect(mask.width).toBeGreaterThan(0);
    expect(mask.height).toBeGreaterThan(0);
  });
});
