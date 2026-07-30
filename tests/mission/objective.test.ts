import { describe, expect, it } from 'vitest';
import { getNode } from '../../src/deck/graph.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { setEntityPose } from '../../src/sim/world.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
} from '../helpers/missionTestUtils.js';
import { runMissionTicks } from '../helpers/missionTestUtils.js';

describe('objective (G5)', () => {
  it('unissued until ACTIVE; complete in engineering', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    expect(state.meta.objectiveIssued).toBe(false);
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    expect(state.meta.objectiveIssued).toBe(true);
    expect(state.meta.objectiveComplete).toBe(false);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    const playerId = state.meta.playerId!;
    setEntityPose(state, playerId, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.objectiveComplete).toBe(true);
    expect(state.meta.missionPhase).toBe('SCORE');
    expect(state.meta.score?.outcome).toBe('COMPLETE');
  });

  it('E-g: dead player in engineering does not complete', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    const player = state.entities.get(state.meta.playerId!)!;
    player.x = eng.x;
    player.z = eng.z;
    player.alive = false;
    player.hp = 0;
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.score?.outcome).toBe('FAILED');
  });
});
