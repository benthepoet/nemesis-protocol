import { describe, expect, it } from 'vitest';
import { profileTextForIndex } from '../../src/mission/breachSelect.js';
import { computeInsertSpawn } from '../../src/deck/spawn.js';
import {
  createMissionTestWorld,
  interactPress,
  interactRelease,
  moveAxis,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';

describe('breach select (G2, M8)', () => {
  it('Port/Starboard select and profile strings', () => {
    expect(profileTextForIndex(0)).toContain('loot-rich');
    expect(profileTextForIndex(1)).toContain('softer');
  });

  it('confirm spawns matching room', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    const cmds = new Map<number, ReturnType<typeof moveAxis>[]>([
      [0, [moveAxis(0, 0, 0, -1)]],
      [1, [interactPress(1, 0)]],
      [2, [interactRelease(2, 0)]],
    ]);
    runMissionTicks(state, graph, collisionRef, 3, cmds);
    expect(state.meta.breachRoomId).toBe('stbd-airlock');
    const spawn = computeInsertSpawn(graph, 'stbd-airlock');
    const player = state.entities.get(state.meta.playerId!)!;
    expect(player.x).toBeCloseTo(spawn.x, 2);
    expect(player.z).toBeCloseTo(spawn.z, 2);
  });
});
