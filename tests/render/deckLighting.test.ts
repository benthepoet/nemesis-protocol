/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  ALARM_LEVEL_AL0,
  ALARM_LEVEL_AL1,
  HAZE_DENSITY_AL0,
  HAZE_DENSITY_AL1,
} from '../../src/config.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { countActiveCorridorBeacons, createDeckLighting } from '../../src/render/createDeckLighting.js';
import { preloadHeroAssets } from '../../src/render/assets/preloadHeroAssets.js';
import { getHeroFixtures } from '../../src/render/assets/preloadHeroAssets.js';

describe('deck lighting (G7–G9, M5–M6)', () => {
  it('E3: AL0 has no visible corridor beacons and AL0 haze density', async () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const fixtures = getHeroFixtures(await preloadHeroAssets());
    const lighting = createDeckLighting(deck.scene, graph, fixtures);
    lighting.update(0.016, ALARM_LEVEL_AL0);
    expect(countActiveCorridorBeacons(deck.scene)).toBe(0);
    expect((deck.scene.fog as THREE.FogExp2).density).toBe(HAZE_DENSITY_AL0);
    lighting.dispose();
    deck.disposeMaterials();
  });

  it('E4/E5: AL1 activates corridor beacons; haze increases', async () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const fixtures = getHeroFixtures(await preloadHeroAssets());
    const lighting = createDeckLighting(deck.scene, graph, fixtures);
    lighting.update(0.01, ALARM_LEVEL_AL1);
    expect(countActiveCorridorBeacons(deck.scene)).toBeGreaterThan(0);
    expect((deck.scene.fog as THREE.FogExp2).density).toBe(HAZE_DENSITY_AL1);
    lighting.update(0.01, ALARM_LEVEL_AL1);
    expect(countActiveCorridorBeacons(deck.scene)).toBeGreaterThan(0);
    lighting.dispose();
    deck.disposeMaterials();
  });

  it('haze density monotonic AL0→AL1', async () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const fixtures = getHeroFixtures(await preloadHeroAssets());
    const lighting = createDeckLighting(deck.scene, graph, fixtures);
    lighting.update(0, ALARM_LEVEL_AL0);
    const d0 = (deck.scene.fog as THREE.FogExp2).density;
    lighting.update(0, ALARM_LEVEL_AL1);
    const d1 = (deck.scene.fog as THREE.FogExp2).density;
    expect(d1).toBeGreaterThan(d0);
    lighting.dispose();
    deck.disposeMaterials();
  });
});
