import { describe, expect, it } from 'vitest';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { shortestRoomPath, buildSteerPathToPoint } from '../../src/ai/pathing.js';

describe('pathing (G4,R11)', () => {
  it('E7: cross-room path uses door rooms', () => {
    const graph = loadTestDeck03();
    const path = shortestRoomPath(graph, 'cargo-hold', 'barracks');
    expect(path[0]).toBe('cargo-hold');
    expect(path[path.length - 1]).toBe('barracks');
    expect(path).toContain('main-spine');
  });

  it('steer path includes door centers between rooms', () => {
    const graph = loadTestDeck03();
    const cargo = graph.crewSpawnTable.find((p) => p.id === 'cargo-post')!;
    const barracks = graph.crewSpawnTable.find((p) => p.id === 'barracks-post')!;
    const points = buildSteerPathToPoint(graph, cargo.spawn.x, cargo.spawn.z, barracks.spawn.x, barracks.spawn.z);
    expect(points.length).toBeGreaterThan(1);
  });
});
