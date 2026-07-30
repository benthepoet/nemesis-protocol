import { describe, expect, it } from 'vitest';
import { ALARM_LEVEL_AL1 } from '../../src/config.js';
import { tripAlarm } from '../../src/ai/alarm.js';
import {
  confirmBreachInsertion,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { createCombatTestHarness, fireHeldOn } from '../helpers/combatTestUtils.js';

describe('alarm integration (G4)', () => {
  it('insertion cycle leaves AL0; post-ACTIVE shot trips AL1', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    runMissionTicks(state, graph, collisionRef, 300);
    expect(state.meta.alarmLevel).toBe(0);
    expect(state.meta.alarmTripTick).toBeNull();
    const fireTick = state.tick;
    runMissionTicks(state, graph, collisionRef, 1, new Map([[fireTick, [fireHeldOn(fireTick, 0)]]]));
    expect(state.meta.alarmLevel).toBe(ALARM_LEVEL_AL1);
    expect(state.meta.alarmTripTick).toBe(fireTick);
  });

  it('E-i: alarmTripTick unchanged on second trip attempt', () => {
    const harness = createCombatTestHarness();
    tripAlarm(harness.state, 'player-shot');
    const first = harness.state.meta.alarmTripTick;
    tripAlarm(harness.state, 'crew-damage');
    expect(harness.state.meta.alarmTripTick).toBe(first);
  });

  it('E-b: fire during BRIEFING does not trip alarm', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    runMissionTicks(state, graph, collisionRef, 1, new Map([[0, [fireHeldOn(0, 0)]]]));
    expect(state.meta.alarmLevel).toBe(0);
  });
});
