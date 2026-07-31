/** @vitest-environment jsdom */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CEILING_FADE_ALPHA,
  CEILING_FADE_ALPHA_MAX,
  CEILING_FADE_ALPHA_MIN,
} from '../../src/config.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { createBlenderDeckScene } from '../../src/render/createBlenderDeckScene.js';
import { loadGltf } from '../../src/render/assets/loadGltf.js';
import { P1_NEMESIS_DECK03_GLB } from '../../src/render/assets/urls.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import {
  createCutawayState,
  getCeilingOpacity,
  updateCeilingCutaway,
} from '../../src/render/ceilingCutaway.js';
import { computeSpawnPoint } from '../../src/deck/spawn.js';
import { getNode, listAdjacentRooms } from '../../src/deck/graph.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { roomAtPosition } from '../../src/deck/roomQuery.js';

describe('ceiling cutaway opacity (G9–G12, M8)', () => {
  it('E2: no active room — all ceilings opaque', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(0, 50, 50);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    updateCeilingCutaway(deck.roomGroups, graph, -999, -999, state, cam, 0.016, null);
    expect(state.lastRoomId).toBeNull();

    for (const [id, group] of deck.roomGroups) {
      const ceiling = group.getObjectByName(`ceiling:${id}`) as THREE.Mesh | undefined;
      if (!ceiling) continue;
      expect(getCeilingOpacity(ceiling)).toBeCloseTo(1, 1);
    }
    deck.disposeMaterials();
  });

  it('G9: active room ceiling targets zero opacity', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(spawn.x, 40, spawn.z + 30);
    cam.lookAt(spawn.x, 0, spawn.z);
    cam.updateMatrixWorld();

    for (let i = 0; i < 30; i++) {
      updateCeilingCutaway(
        deck.roomGroups,
        graph,
        spawn.x,
        spawn.z,
        state,
        cam,
        0.05,
        deck.hullEnvelope!.getObjectByName('hull-interstitial:ceiling'),
      );
    }

    const roomId = roomAtPosition(graph, spawn.x, spawn.z)!;
    const activeCeiling = deck.roomGroups.get(roomId)!.getObjectByName(`ceiling:${roomId}`) as THREE.Mesh;
    expect(getCeilingOpacity(activeCeiling)).toBeLessThan(0.05);
    deck.disposeMaterials();
  });

  it('G10: adjacent room fades to CEILING_FADE_ALPHA band', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(spawn.x, 40, spawn.z + 30);
    cam.lookAt(spawn.x, 0, spawn.z);
    cam.updateMatrixWorld();

    for (let i = 0; i < 40; i++) {
      updateCeilingCutaway(
        deck.roomGroups,
        graph,
        spawn.x,
        spawn.z,
        state,
        cam,
        0.05,
        null,
      );
    }

    const adj = listAdjacentRooms(graph, 'port-airlock')[0];
    expect(adj).toBeDefined();
    const adjCeiling = deck.roomGroups.get(adj!)!.getObjectByName(`ceiling:${adj}`) as THREE.Mesh;
    const alpha = getCeilingOpacity(adjCeiling);
    expect(alpha).toBeGreaterThanOrEqual(CEILING_FADE_ALPHA_MIN);
    expect(alpha).toBeLessThanOrEqual(CEILING_FADE_ALPHA_MAX);
    expect(alpha).toBeCloseTo(CEILING_FADE_ALPHA, 1);
    deck.disposeMaterials();
  });

  it('E7: small dt does not jump 1→0 in one step', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(spawn.x, 40, spawn.z + 30);
    cam.lookAt(spawn.x, 0, spawn.z);
    cam.updateMatrixWorld();

    updateCeilingCutaway(deck.roomGroups, graph, spawn.x, spawn.z, state, cam, 0.001, null);
    const roomId = roomAtPosition(graph, spawn.x, spawn.z)!;
    const ceiling = deck.roomGroups.get(roomId)!.getObjectByName(`ceiling:${roomId}`) as THREE.Mesh;
    const afterOne = getCeilingOpacity(ceiling);
    expect(afterOne).toBeGreaterThan(0.5);
    expect(afterOne).toBeLessThan(1);
    deck.disposeMaterials();
  });

  it('interstitial ceiling fades when active room set', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(spawn.x, 40, spawn.z + 30);
    cam.lookAt(spawn.x, 0, spawn.z);
    cam.updateMatrixWorld();
    const interstitial = deck.hullEnvelope!.getObjectByName('hull-interstitial:ceiling') as THREE.Mesh;

    for (let i = 0; i < 40; i++) {
      updateCeilingCutaway(deck.roomGroups, graph, spawn.x, spawn.z, state, cam, 0.05, interstitial);
    }
    expect(state.interstitialOpacity).toBeCloseTo(CEILING_FADE_ALPHA, 1);
    expect((interstitial.material as THREE.MeshStandardMaterial).opacity).toBeCloseTo(
      CEILING_FADE_ALPHA,
      1,
    );
    deck.disposeMaterials();
  });
});

const GLB_PATH = join(process.cwd(), 'assets/models/p1_nemesis_deck03.glb');
const hasDeckGlb = existsSync(GLB_PATH);

describe.skipIf(!hasDeckGlb)('ceiling cutaway on blender roomGroups (G2, S10/S11)', () => {
  it('G9: active room ceiling targets zero opacity on blender path', async () => {
    const graph = loadTestDeck03();
    const mats = createFallbackDeckMaterials();
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    const deck = createBlenderDeckScene(graph, { glbRoot, materials: mats });
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(spawn.x, 40, spawn.z + 30);
    cam.lookAt(spawn.x, 0, spawn.z);
    cam.updateMatrixWorld();

    for (let i = 0; i < 30; i++) {
      updateCeilingCutaway(
        deck.roomGroups,
        graph,
        spawn.x,
        spawn.z,
        state,
        cam,
        0.05,
        deck.hullEnvelope!.getObjectByName('hull-interstitial:ceiling'),
      );
    }

    const roomId = roomAtPosition(graph, spawn.x, spawn.z)!;
    const activeCeiling = deck.roomGroups.get(roomId)!.getObjectByName(`ceiling:${roomId}`) as THREE.Mesh;
    expect(getCeilingOpacity(activeCeiling)).toBeLessThan(0.05);
    deck.disposeMaterials();
    mats.dispose();
  });

  it('G9: main-spine ceiling fades when active in corridor', async () => {
    const graph = loadTestDeck03();
    const mats = createFallbackDeckMaterials();
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    const deck = createBlenderDeckScene(graph, { glbRoot, materials: mats });
    const center = footprintCenter(getNode(graph, 'main-spine'));
    const spawn = { x: center.x, z: center.z };
    const state = createCutawayState();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    cam.position.set(spawn.x, 40, spawn.z + 30);
    cam.lookAt(spawn.x, 0, spawn.z);
    cam.updateMatrixWorld();

    for (let i = 0; i < 35; i++) {
      updateCeilingCutaway(
        deck.roomGroups,
        graph,
        spawn.x,
        spawn.z,
        state,
        cam,
        0.05,
        deck.hullEnvelope!.getObjectByName('hull-interstitial:ceiling'),
      );
    }

    const activeCeiling = deck.roomGroups
      .get('main-spine')!
      .getObjectByName('ceiling:main-spine') as THREE.Mesh;
    expect(getCeilingOpacity(activeCeiling)).toBeLessThan(0.05);
    deck.disposeMaterials();
    mats.dispose();
  });
});
