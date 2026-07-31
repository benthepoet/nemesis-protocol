import { describe, expect, it } from 'vitest';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { listAdjacentRooms, neighbors } from '../../src/deck/graph.js';

describe('listAdjacentRooms (G10, M8)', () => {
  it('door-linked rooms are adjacent', () => {
    const graph = loadTestDeck03();
    const port = neighbors(graph, 'port-airlock');
    expect(port.length).toBeGreaterThan(0);
    for (const next of port) {
      expect(listAdjacentRooms(graph, 'port-airlock')).toContain(next);
    }
  });

  it('wall-sharing rooms are adjacent without a door', () => {
    const graph = loadTestDeck03();
    const spineAdj = listAdjacentRooms(graph, 'main-spine');
    expect(spineAdj.length).toBeGreaterThan(0);
    for (const id of spineAdj) {
      const shared = graph.wallSegments.some(
        (w) => w.rooms.includes('main-spine') && w.rooms.includes(id),
      );
      const doorLinked = neighbors(graph, 'main-spine').includes(id);
      expect(shared || doorLinked).toBe(true);
    }
  });

  it('excludes self and returns sorted stable ids', () => {
    const graph = loadTestDeck03();
    const ids = listAdjacentRooms(graph, 'engineering');
    expect(ids).not.toContain('engineering');
    expect([...ids].sort()).toEqual(ids);
    expect(listAdjacentRooms(graph, 'engineering')).toEqual(listAdjacentRooms(graph, 'engineering'));
  });
});
