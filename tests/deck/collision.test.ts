import { describe, expect, it } from 'vitest';
import { ACTOR_PROXY_RADIUS_M, M_PER_PX } from '../../src/config.js';
import {
  buildCollisionWorld,
  circleHitsWalls,
  doorPassageClear,
} from '../../src/deck/collision.js';
import { getNode } from '../../src/deck/graph.js';
import type { DoorEdge } from '../../src/deck/types.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

function doorPassageSamples(door: DoorEdge): { x: number; z: number }[] {
  const { x, z, w, h } = door.opening;
  return [{ x: x + w / 2, z: z + h / 2 }];
}

/** Half-span for centerline sweep inset from opening edges by actor radius. */
function doorTraverseHalfSpan(door: DoorEdge): number {
  const r = ACTOR_PROXY_RADIUS_M;
  const passage = Math.max(door.opening.w, door.opening.h);
  if (passage <= 2 * r) return 0;
  return Math.min(passage / 2 - r, passage / 4);
}

function traverseDoorOpening(
  world: ReturnType<typeof buildCollisionWorld>,
  door: DoorEdge,
  axis: 'x' | 'z',
  spanM: number,
): boolean {
  const { x, z, w, h } = door.opening;
  const cx = x + w / 2;
  const cz = z + h / 2;
  const r = ACTOR_PROXY_RADIUS_M;
  const step = M_PER_PX * 0.5;
  if (axis === 'x') {
    for (let px = cx - spanM; px <= cx + spanM; px += step) {
      if (circleHitsWalls(world, px, cz, r)) return false;
    }
    return true;
  }
  for (let pz = cz - spanM; pz <= cz + spanM; pz += step) {
    if (circleHitsWalls(world, cx, pz, r)) return false;
  }
  return true;
}

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

  it('E10: all 17 door openings clear at actor radius', () => {
    const r = ACTOR_PROXY_RADIUS_M;
    for (const door of graph.doorEdges) {
      for (const sample of doorPassageSamples(door)) {
        expect(circleHitsWalls(world, sample.x, sample.z, r)).toBe(false);
      }
      expect(doorPassageClear(graph, world, door.id)).toBe(true);
      const halfSpan = doorTraverseHalfSpan(door);
      if (halfSpan > 0) {
        const axis = door.opening.w >= door.opening.h ? 'x' : 'z';
        expect(traverseDoorOpening(world, door, axis, halfSpan)).toBe(true);
      }
    }
  });

  it('E10: blast doors traversable eng↔spine and spine↔connector at actor radius', () => {
    const engBlast = graph.doorEdges.find((d) => d.id === 'door-engineering-spine-blast')!;
    const foreBlast = graph.doorEdges.find((d) => d.id === 'door-spine-connector-blast')!;
    expect(traverseDoorOpening(world, engBlast, 'x', engBlast.opening.w)).toBe(true);
    expect(traverseDoorOpening(world, foreBlast, 'x', foreBlast.opening.w)).toBe(true);
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
