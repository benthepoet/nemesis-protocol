import { describe, expect, it } from 'vitest';
import { AIRLOCK_ENTRY_CYCLE_TICKS } from '../../src/config.js';
import { computeInsertSpawn } from '../../src/deck/spawn.js';
import { neighbors } from '../../src/deck/graph.js';
import { closedDoorEdgeIdSet } from '../../src/mission/closedDoors.js';
import { spineDoorEdgeId } from '../../src/mission/closedDoors.js';
import {
  confirmBreachInsertion,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { applyCommands } from '../../src/sim/step.js';
import { integrateMissionShell } from '../../src/mission/integrateMissionShell.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { fixedStep } from '../../src/sim/step.js';

describe('insertion cycle (G3)', () => {
  it('300-tick cycle and center spawn facing spine door', () => {
    expect(AIRLOCK_ENTRY_CYCLE_TICKS).toBe(300);
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    const spawn = computeInsertSpawn(graph, 'port-airlock');
    const player = state.entities.get(state.meta.playerId!)!;
    expect(player.x).toBeCloseTo(spawn.x, 2);
    expect(state.meta.insertionTicksRemaining).toBe(AIRLOCK_ENTRY_CYCLE_TICKS);
    expect(state.meta.closedDoorEdgeId).toBe(spineDoorEdgeId('port-airlock'));
    const closed = closedDoorEdgeIdSet(state.meta.closedDoorEdgeId)!;
    expect(neighbors(graph, 'port-airlock', closed)).not.toContain('main-spine');
    expect(neighbors(graph, 'port-airlock')).toContain('main-spine');
    runMissionTicks(state, graph, collisionRef, AIRLOCK_ENTRY_CYCLE_TICKS);
    expect(state.meta.missionPhase).toBe('ACTIVE');
    expect(neighbors(graph, 'port-airlock')).toContain('main-spine');
  });

  it('E-c: move blocked during INSERTION', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    const player = state.entities.get(state.meta.playerId!)!;
    const x0 = player.x;
    applyCommands(state, [{ tick: state.tick, sequence: 0, action: 'move', value: 0, axisX: 0, axisZ: 1 }]);
    integrateMissionShell(state, graph, collisionRef);
    integratePlayerMotion(state, collisionRef.current);
    fixedStep(state);
    expect(player.x).toBeCloseTo(x0, 5);
  });
});
