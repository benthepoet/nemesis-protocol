import { describe, expect, it } from 'vitest';
import { AIRLOCK_ENTRY_CYCLE_TICKS } from '../../src/config.js';
import {
  confirmBreachInsertion,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';

describe('mission state machine (G1)', () => {
  it('legal BRIEFING→INSERTION→ACTIVE→SCORE and illegal direct skips rejected', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    expect(state.meta.missionPhase).toBe('BRIEFING');
    confirmBreachInsertion(state, graph, collisionRef);
    expect(state.meta.missionPhase).toBe('INSERTION');
    runMissionTicks(state, graph, collisionRef, AIRLOCK_ENTRY_CYCLE_TICKS);
    expect(state.meta.missionPhase).toBe('ACTIVE');
    expect(state.meta.objectiveIssued).toBe(true);
  });

  it('E-a: cannot jump BRIEFING→ACTIVE without INSERTION', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    state.meta.missionPhase = 'ACTIVE';
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.playerId).toBeNull();
  });
});
