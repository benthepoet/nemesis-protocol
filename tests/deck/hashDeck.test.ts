import { describe, expect, it } from 'vitest';
import { hashDeckGraph } from '../../src/deck/hashDeck.js';
import { loadDeck03 } from '../../src/deck/loadDeck.js';
import { spawnDeckEntities } from '../../src/deck/spawnDeckEntities.js';
import { createWorld } from '../../src/sim/world.js';
import { isDebugFlyCameraEnabled } from '../../src/render/debugFlyCamera.js';

describe('hashDeck and entities (G7/G8)', () => {
  it('E16: identical loads produce identical graph hash and entity ids', async () => {
    const graphA = loadDeck03();
    const graphB = loadDeck03();
    expect(await hashDeckGraph(graphA)).toBe(await hashDeckGraph(graphB));

    const worldA = createWorld();
    const worldB = createWorld();
    spawnDeckEntities(worldA, graphA);
    spawnDeckEntities(worldB, graphB);

    const idsA = [...worldA.entities.values()].map((e) => e.id).sort((a, b) => a - b);
    const idsB = [...worldB.entities.values()].map((e) => e.id).sort((a, b) => a - b);
    expect(idsA).toEqual(idsB);
    expect(idsA).toHaveLength(6);
  });

  it('E17: debug fly camera disabled without DEV flag context', () => {
    expect(isDebugFlyCameraEnabled()).toBe(false);
  });
});
