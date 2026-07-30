import { describe, expect, it } from 'vitest';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { updateCeilingCutaway, type CutawayState } from '../../src/render/ceilingCutaway.js';
import { computeSpawnPoint } from '../../src/deck/spawn.js';
import { roomAtPosition } from '../../src/deck/roomQuery.js';

describe('ceiling cutaway (G5)', () => {
  it('E10: hides occupied room ceiling, keeps others visible', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state: CutawayState = { lastRoomId: null };

    updateCeilingCutaway(deck.roomGroups, graph, spawn.x, spawn.z, state);
    const roomId = roomAtPosition(graph, spawn.x, spawn.z);
    expect(roomId).toBe('port-airlock');

    for (const [id, group] of deck.roomGroups) {
      const ceiling = group.getObjectByName(`ceiling:${id}`);
      if (!ceiling) continue;
      if (id === roomId) {
        expect(ceiling.visible).toBe(false);
      } else {
        expect(ceiling.visible).toBe(true);
      }
    }
  });

  it('E10: doorway gap retains last occupied room', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph);
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    const state: CutawayState = { lastRoomId: null };
    updateCeilingCutaway(deck.roomGroups, graph, spawn.x, spawn.z, state);

    updateCeilingCutaway(deck.roomGroups, graph, -999, -999, state);
    expect(state.lastRoomId).toBe('port-airlock');
    const ceiling = deck.roomGroups.get('port-airlock')!.getObjectByName('ceiling:port-airlock')!;
    expect(ceiling.visible).toBe(false);
  });
});
