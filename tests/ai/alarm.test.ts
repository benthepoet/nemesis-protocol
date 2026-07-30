import { describe, expect, it } from 'vitest';
import {
  ALARM_LEVEL_AL0,
  ALARM_LEVEL_AL1,
  CREW_DETECTION_DELAY_TICKS,
  TICK_HZ,
} from '../../src/config.js';
import { tripAlarm } from '../../src/ai/alarm.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { getEntity } from '../../src/sim/world.js';
import { createCombatTestHarness, fireHeldOn, runTicks } from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('alarm (G7)', () => {
  it('E15: player shot trips AL1 and seeds LKP', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const cmds = new Map<number, InputCommand[]>([[0, [fireHeldOn(0, 0)]]]);
    runTicks(harness, 6, cmds);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL1);
    expect(harness.state.meta.lkpValid).toBe(true);
    expect(harness.state.meta.lkpX).toBeCloseTo(player.x, 2);
    expect(harness.state.meta.lkpZ).toBeCloseTo(player.z, 2);
  });

  it('E16/E17: detection and crew damage trip AL1', () => {
    const harness = createCombatTestHarness();
    tripAlarm(harness.state, 'detection');
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL1);

    const h2 = createCombatTestHarness();
    expect(h2.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL0);
    const crewId = h2.state.meta.crewIds[2]!;
    applyDamage(h2.state, crewId, 1);
    expect(h2.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL1);
  });

  it('E18: no de-escalate over long run', () => {
    const harness = createCombatTestHarness();
    tripAlarm(harness.state, 'player-shot');
    runTicks(harness, TICK_HZ * 300);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL1);
  });
});

describe('perception (G3)', () => {
  it('E3/E4: detection delay and reset', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    player.x = crew.x + 12;
    player.z = crew.z + 0.5;
    crew.yaw = Math.atan2(player.x - crew.x, player.z - crew.z);
    runTicks(harness, CREW_DETECTION_DELAY_TICKS - 1);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL0);
    runTicks(harness, 1);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL1);
  });
});
