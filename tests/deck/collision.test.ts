import { describe, expect, it } from 'vitest';
import { ACTOR_PROXY_RADIUS_M } from '../../src/config.js';
import {
  buildCollisionWorld,
  circleHitsWalls,
  doorPassageClear,
} from '../../src/deck/collision.js';
import { getNode } from '../../src/deck/graph.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('collision (G4)', () => {
  const graph = loadTestDeck03();
  const world = buildCollisionWorld(graph);

  it('E9: circle pushed into Class A wall hits', () => {
    const cargo = getNode(graph, 'cargo-hold');
    expect(cargo.footprint.kind).toBe('rect');
    if (cargo.footprint.kind !== 'rect') return;

    const cx = cargo.footprint.rect.x + cargo.footprint.rect.w / 2;
    const cz = cargo.footprint.rect.z + cargo.footprint.rect.h / 2;
    const partitionX = cargo.footprint.rect.x + cargo.footprint.rect.w - 0.1;
    expect(circleHitsWalls(world, partitionX, cz, ACTOR_PROXY_RADIUS_M)).toBe(true);
    expect(circleHitsWalls(world, cx, cz, ACTOR_PROXY_RADIUS_M)).toBe(false);
  });

  it('E10: all 17 door opening centers are clear', () => {
    for (const door of graph.doorEdges) {
      const cx = door.opening.x + door.opening.w / 2;
      const cz = door.opening.z + door.opening.h / 2;
      expect(circleHitsWalls(world, cx, cz, 0.05)).toBe(false);
      expect(doorPassageClear(graph, world, door.id)).toBe(true);
    }
  });

  it('E11: point outside hull hits collider', () => {
    const med = getNode(graph, 'med-bay');
    expect(med.footprint.kind).toBe('rect');
    if (med.footprint.kind !== 'rect') return;
    const outsideX = med.footprint.rect.x + med.footprint.rect.w + 5;
    const cz = med.footprint.rect.z + med.footprint.rect.h / 2;
    expect(circleHitsWalls(world, outsideX, cz, ACTOR_PROXY_RADIUS_M)).toBe(true);
  });

  it('E12: bridge interior clear, exterior hits poly edge', () => {
    const bridge = getNode(graph, 'bridge');
    expect(bridge.footprint.kind).toBe('polygon');
    if (bridge.footprint.kind !== 'polygon') return;
    const pts = bridge.footprint.points;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
    const maxX = Math.max(...pts.map((p) => p.x));
    expect(circleHitsWalls(world, cx, cz, ACTOR_PROXY_RADIUS_M)).toBe(false);
    expect(circleHitsWalls(world, maxX + 0.15, cz, ACTOR_PROXY_RADIUS_M)).toBe(true);
  });
});
