import { describe, expect, it } from 'vitest';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { computeSpawnPoint, validateSpawnPoint } from '../../src/deck/spawn.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('spawn (G5)', () => {
  const graph = loadTestDeck03();
  const world = buildCollisionWorld(graph);

  it('E13: both airlocks spawn valid with Q4 offset and profiles', () => {
    for (const roomId of ['port-airlock', 'stbd-airlock'] as const) {
      const spawn = computeSpawnPoint(graph, roomId);
      expect(spawn.roomId).toBe(roomId);
      if (roomId === 'port-airlock') {
        expect(spawn.profile).toBe('port-cargo-armory');
      } else {
        expect(spawn.profile).toBe('stbd-life-barracks');
      }
      const validation = validateSpawnPoint(graph, world, spawn);
      expect(validation.ok).toBe(true);

      const spineDoor = graph.doorEdges.find(
        (d) =>
          (d.a === roomId && d.b === 'main-spine') || (d.b === roomId && d.a === 'main-spine'),
      );
      expect(spineDoor).toBeDefined();
      const doorCx = spineDoor!.opening.x + spineDoor!.opening.w / 2;
      const doorCz = spineDoor!.opening.z + spineDoor!.opening.h / 2;
      const distToDoor = Math.hypot(spawn.x - doorCx, spawn.z - doorCz);
      expect(distToDoor).toBeGreaterThan(0.5);
      expect(distToDoor).toBeLessThan(15);
      expect(Number.isFinite(spawn.yaw)).toBe(true);
    }
  });

  it('E14: spawn on wall fails validation', () => {
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    spawn.x = graph.wallSegments[0]!.rect.x;
    spawn.z = graph.wallSegments[0]!.rect.z;
    const validation = validateSpawnPoint(graph, world, spawn);
    expect(validation.ok).toBe(false);
  });
});
