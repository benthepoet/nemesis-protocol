import { describe, expect, it } from 'vitest';
import * as graphModule from '../../src/deck/graph.js';
import { neighbors, pathExists } from '../../src/deck/graph.js';
import graphSource from '../../src/deck/graph.ts?raw';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('graph API (G6)', () => {
  it('E15: pathExists and neighbors; no SVG literals in graph.ts', () => {
    const graph = loadTestDeck03();
    expect(pathExists(graph, 'port-airlock', 'engineering')).toBe(true);

    const portNeighbors = [...neighbors(graph, 'port-airlock')].sort();
    expect(portNeighbors).toEqual(['main-spine']);

    const spineNeighbors = [...neighbors(graph, 'main-spine')].sort();
    expect(spineNeighbors).toContain('port-airlock');
    expect(spineNeighbors).toContain('engineering');
    expect(spineNeighbors.length).toBe(11);

    const source = graphSource as string;
    expect(source).not.toMatch(/\b(340|372|933)\b/);
    expect(Object.keys(graphModule).length).toBeGreaterThan(5);
  });
});
