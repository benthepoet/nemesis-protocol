import { describe, expect, it } from 'vitest';
import { CREW_INVESTIGATE_SCAN_TICKS, CREW_CHASE_SPEED_MPS, FIXED_DT, TICK_HZ } from '../../src/config.js';
import { getEntity } from '../../src/sim/world.js';
import { createCombatTestHarness, runTicks } from '../helpers/combatTestUtils.js';
import { tripAlarm } from '../../src/ai/alarm.js';

describe('crew fsm (G1,G4)', () => {
  it('E8: chase to LKP then investigate scan', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    tripAlarm(harness.state, 'player-shot');
    harness.state.meta.lkpX = player.x + 5;
    harness.state.meta.lkpZ = player.z;
    harness.state.meta.lkpValid = true;
    player.x = 500;
    player.z = 500;
    runTicks(harness, TICK_HZ * 30);
    const crewId = harness.state.meta.crewIds[0]!;
    const ai = harness.state.crewAi.get(crewId)!;
    expect(['INVESTIGATE', 'CHASE', 'PATROL']).toContain(ai.fsm);
    expect(CREW_INVESTIGATE_SCAN_TICKS).toBe(240);
  });

  it('E9: chase speed approx 4.5 m/s on spine', () => {
    const harness = createCombatTestHarness();
    tripAlarm(harness.state, 'detection');
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    harness.state.meta.lkpX = crew.x + 25;
    harness.state.meta.lkpZ = crew.z;
    harness.state.meta.lkpValid = true;
    const ai = harness.state.crewAi.get(crewId)!;
    ai.fsm = 'CHASE';
    harness.state.crewAi.set(crewId, ai);
    const x0 = crew.x;
    runTicks(harness, 60);
    const dist = Math.abs(getEntity(harness.state, crewId)!.x - x0);
    const speed = dist / (60 * FIXED_DT);
    expect(speed).toBeGreaterThan(CREW_CHASE_SPEED_MPS * 0.99);
    expect(speed).toBeLessThan(CREW_CHASE_SPEED_MPS * 1.01);
  });
});
