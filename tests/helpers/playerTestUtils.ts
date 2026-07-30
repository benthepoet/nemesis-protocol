import { buildCollisionWorld } from '../../src/deck/collision.js';
import { spawnDeckEntities } from '../../src/deck/spawnDeckEntities.js';
import { spawnPlayer } from '../../src/player/spawnPlayer.js';
import { createWorld } from '../../src/sim/world.js';
import type { CollisionWorld } from '../../src/deck/collision.js';
import type { DeckGraph } from '../../src/deck/types.js';
import type { SimState } from '../../src/sim/types.js';
import { loadTestDeck03 } from './deckTestUtils.js';

export interface PlayerTestHarness {
  graph: DeckGraph;
  state: SimState;
  collisionWorld: CollisionWorld;
}

export function createPlayerTestHarness(): PlayerTestHarness {
  const graph = loadTestDeck03();
  const state = createWorld();
  spawnDeckEntities(state, graph);
  spawnPlayer(state, graph);
  const collisionWorld = buildCollisionWorld(graph);
  return { graph, state, collisionWorld };
}
