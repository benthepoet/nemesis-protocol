import { describe, expect, it } from 'vitest';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { hashDeckGraph } from '../../src/deck/hashDeck.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

function collisionSnapshot(graph: ReturnType<typeof loadTestDeck03>) {
  const world = buildCollisionWorld(graph);
  return JSON.stringify({
    n: world.aabbs.length,
    aabbs: world.aabbs,
    polyEdges: world.polyEdges,
  });
}

describe('collision drift snapshot (G7)', () => {
  it('identical buildCollisionWorld before and after deck polish scene', async () => {
    const graph = loadTestDeck03();
    const snap = collisionSnapshot(graph);
    const deckHash = await hashDeckGraph(graph);

    createDeckScene(graph, createFallbackDeckMaterials()).disposeMaterials();

    expect(collisionSnapshot(graph)).toBe(snap);
    expect(await hashDeckGraph(graph)).toBe(deckHash);
  });
});
