import { describe, expect, it } from 'vitest';
import { PLAYER_KIND } from '../../src/config.js';
import { computeSpawnPoint } from '../../src/deck/spawn.js';
import { spawnDeckEntities } from '../../src/deck/spawnDeckEntities.js';
import { createWorld, getEntity } from '../../src/sim/world.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { spawnPlayer } from '../../src/player/spawnPlayer.js';

describe('spawnPlayer (G1)', () => {
  it('E1: one player at port-airlock spawn with meta.playerId', () => {
    const graph = loadTestDeck03();
    const state = createWorld();
    spawnDeckEntities(state, graph);
    const id = spawnPlayer(state, graph);
    expect(state.meta.playerId).toBe(id);

    const players = [...state.entities.values()].filter((e) => e.kind === PLAYER_KIND);
    expect(players).toHaveLength(1);

    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const entity = getEntity(state, id)!;
    expect(Math.abs(entity.x - spawn.x)).toBeLessThan(0.01);
    expect(Math.abs(entity.z - spawn.z)).toBeLessThan(0.01);
    expect(entity.y).toBe(0);
    expect(entity.yaw).toBeCloseTo(spawn.yaw, 5);
  });
});
