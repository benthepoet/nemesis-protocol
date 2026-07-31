/** @vitest-environment jsdom */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DECK_VISUAL_MESH_RATIO_MAX } from '../../src/config.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { loadGltf } from '../../src/render/assets/loadGltf.js';
import { P1_NEMESIS_DECK03_GLB } from '../../src/render/assets/urls.js';
import {
  assertBlenderDeckNodeContract,
  buildRoomGroupsFromGltf,
} from '../../src/render/blenderDeckBindings.js';
import {
  countSceneMeshes,
  createBlenderDeckScene,
} from '../../src/render/createBlenderDeckScene.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import { APERTURE_SITES } from '../../src/config.js';
import { listNodes } from '../../src/deck/graph.js';
import { apertureObjectName, findDeckObject } from '../../src/render/blenderDeckBindings.js';

const GLB_PATH = join(process.cwd(), 'assets/models/p1_nemesis_deck03.glb');
const hasDeckGlb = existsSync(GLB_PATH);

describe.skipIf(!hasDeckGlb)('createBlenderDeckScene (M1–M3, G5)', () => {
  it('binds room groups, apertures, signage, and mesh ratio', async () => {
    const graph = loadTestDeck03();
    const mats = createFallbackDeckMaterials();
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    const procedural = createDeckScene(graph, mats);
    const blender = createBlenderDeckScene(graph, { glbRoot, materials: mats });

    assertBlenderDeckNodeContract(blender.scene, graph);
    const roomGroups = buildRoomGroupsFromGltf(glbRoot, graph);
    expect(roomGroups.size).toBe(listNodes(graph).length);

    for (const site of APERTURE_SITES) {
      const name = apertureObjectName(site.roomId, site.wallSegmentId);
      expect(findDeckObject(glbRoot, name)).toBeTruthy();
    }

    expect(
      findDeckObject(blender.hullEnvelope!, 'hull-interstitial:ceiling'),
    ).toBeTruthy();

    let signageCount = 0;
    for (const [, group] of blender.roomGroups) {
      group.traverse((obj) => {
        if (obj.name.startsWith('signage:')) signageCount += 1;
      });
    }
    expect(signageCount).toBeGreaterThan(0);

    const procMeshes = countSceneMeshes(procedural.scene);
    const blendMeshes = countSceneMeshes(blender.scene);
    expect(blendMeshes).toBeLessThanOrEqual(
      Math.ceil(DECK_VISUAL_MESH_RATIO_MAX * procMeshes),
    );

    blender.disposeMaterials();
    procedural.disposeMaterials();
    mats.dispose();
  });
});

describe('createBlenderDeckScene contract failure (G4)', () => {
  it('throws DeckGltfContractError when ceiling missing', async () => {
    if (!hasDeckGlb) return;
    const graph = loadTestDeck03();
    const mats = createFallbackDeckMaterials();
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    const ceiling = findDeckObject(glbRoot, 'ceiling:bridge');
    expect(ceiling).toBeTruthy();
    ceiling!.name = 'removed-bridge-ceiling';
    expect(() => createBlenderDeckScene(graph, { glbRoot, materials: mats })).toThrow(
      /DeckGltfContractError|missing ceiling/,
    );
    mats.dispose();
  });
});
