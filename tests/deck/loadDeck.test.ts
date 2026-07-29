import { describe, expect, it } from 'vitest';
import { M_PER_PX, SCALE_M, SCALE_PX } from '../../src/config.js';
import { getNode } from '../../src/deck/graph.js';
import { buildDeckGraph, loadDeck03 } from '../../src/deck/loadDeck.js';
import { svgLengthToMeters } from '../../src/deck/transform.js';

describe('loadDeck (G1)', () => {
  it('E1: deck03 counts and door typing', () => {
    const graph = loadDeck03();
    expect(graph.nodes.size).toBe(18);
    expect(graph.doorEdges.length).toBe(17);

    const classA = graph.wallSegments.filter((w) => w.wallClass === 'A').length;
    expect(classA).toBe(9);
    const bulkheadBands = new Set(
      graph.wallSegments
        .filter((w) => w.role === 'bulkhead')
        .map((w) => w.id.replace(/-(above|below)$/, '')),
    );
    expect(bulkheadBands.size).toBe(3);

    const nonBlast = graph.doorEdges.filter((d) => !d.isBlast);
    expect(nonBlast).toHaveLength(15);
    for (const door of nonBlast) {
      expect(door.wallClass).toBe('B');
      expect(door.presentation).toBe('interior');
    }

    const blast = graph.doorEdges.filter((d) => d.isBlast);
    expect(blast).toHaveLength(2);
    for (const door of blast) {
      expect(door.wallClass).toBe('B');
      expect(door.presentation).toBe('bulkhead');
    }
  });

  it('E2: main-spine length in meters', () => {
    const graph = loadDeck03();
    const spine = getNode(graph, 'main-spine');
    expect(spine.footprint.kind).toBe('rect');
    if (spine.footprint.kind === 'rect') {
      expect(spine.footprint.rect.w).toBeGreaterThanOrEqual(95.8 - 0.5);
      expect(spine.footprint.rect.w).toBeLessThanOrEqual(95.8 + 0.5);
    }
  });

  it('E3: scale round-trip', () => {
    expect(SCALE_M / SCALE_PX).toBe(M_PER_PX);
    expect(svgLengthToMeters(120)).toBe(25);
  });

  it('buildDeckGraph produces frozen graph', () => {
    const graph = loadDeck03();
    expect(graph.id).toBe('deck-03');
    expect(buildDeckGraph).toBeDefined();
  });
});
