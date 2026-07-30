import { describe, expect, it } from 'vitest';
import { buildHashPayloadForTests } from '../../src/sim/hash.js';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { setEntityPose } from '../../src/sim/world.js';
import { createMissionWorld, resetMission } from '../../src/mission/createMissionWorld.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
  interactPress,
  releaseShellInteract,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

function restartFromScore(
  state: ReturnType<typeof createMissionTestWorld>['state'],
  graph: ReturnType<typeof createMissionTestWorld>['graph'],
  collisionRef: ReturnType<typeof createMissionTestWorld>['collisionRef'],
): void {
  state.meta.interactHeld = false;
  state.meta.shellInteractPrev = false;
  const t = state.tick;
  runMissionTicks(state, graph, collisionRef, 1, new Map([[t, [interactPress(t, 0)]]]));
  releaseShellInteract(state, graph, collisionRef);
}

describe('restart (G8)', () => {
  it('SCORE restart matches fresh BRIEFING hash', () => {
    const graph = loadTestDeck03();
    const fresh = createMissionWorld(graph);
    const { state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.missionPhase).toBe('SCORE');
    resetMission(state, graph);
    collisionRef.current = buildCollisionWorld(graph);
    expect(buildHashPayloadForTests(state)).toBe(buildHashPayloadForTests(fresh));
  });

  it('E-k: two restarts identical', () => {
    const graph = loadTestDeck03();
    const { state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    restartFromScore(state, graph, collisionRef);
    const h1 = buildHashPayloadForTests(state);
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    restartFromScore(state, graph, collisionRef);
    expect(buildHashPayloadForTests(state)).toBe(h1);
  });
});
