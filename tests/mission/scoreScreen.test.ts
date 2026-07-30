import { describe, expect, it } from 'vitest';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { setEntityPose } from '../../src/sim/world.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';

describe('score screen (G6)', () => {
  it('COMPLETE snapshot fields', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef, 'port-airlock');
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    const s = state.meta.score!;
    expect(s.outcome).toBe('COMPLETE');
    expect(s.breachRoomId).toBe('port-airlock');
    expect(s.missionEndTick).toBeGreaterThanOrEqual(0);
    expect(s.crewNeutralized).toBe(0);
    expect(s.alarmTripped).toBe(false);
  });
});
