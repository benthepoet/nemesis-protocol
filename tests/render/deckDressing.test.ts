/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { DRESSING_PROPS_PER_ROOM_MAX } from '../../src/config.js';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('deck dressing (G5, M4)', () => {
  it('deterministic naming, scene presence, not in collision', () => {
    const graph = loadTestDeck03();
    const worldBefore = buildCollisionWorld(graph);
    const deck = createDeckScene(graph, createFallbackDeckMaterials());
    expect(buildCollisionWorld(graph)).toEqual(worldBefore);

    const names: string[] = [];
    deck.dressing!.traverse((obj) => {
      if (obj.name.startsWith('dressing:')) names.push(obj.name);
    });
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      expect(n).toMatch(/^dressing:(pipe|conduit|panel|vent):[^:]+:\d+$/);
    }

    const deck2 = createDeckScene(loadTestDeck03(), createFallbackDeckMaterials());
    const names2: string[] = [];
    deck2.dressing!.traverse((obj) => {
      if (obj.name.startsWith('dressing:')) names2.push(obj.name);
    });
    names.sort();
    names2.sort();
    expect(names2).toEqual(names);

    const perRoom = new Map<string, number>();
    for (const n of names) {
      const roomId = n.split(':')[2]!;
      perRoom.set(roomId, (perRoom.get(roomId) ?? 0) + 1);
    }
    for (const count of perRoom.values()) {
      expect(count).toBeLessThanOrEqual(DRESSING_PROPS_PER_ROOM_MAX + 2);
    }

    deck.disposeMaterials();
    deck2.disposeMaterials();
  });
});
