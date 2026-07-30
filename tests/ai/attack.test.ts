import { describe, expect, it } from 'vitest';
import {
  CREW_ATTACK_WINDUP_TICKS,
  CREW_FIRE_INTERVAL_TICKS,
} from '../../src/config.js';
import { sampleSpreadYawOffset } from '../../src/combat/spread.js';
import { getEntity } from '../../src/sim/world.js';
import { createCombatTestHarness, runTicks, countProjectiles } from '../helpers/combatTestUtils.js';

describe('attack (G5)', () => {
  it('E10/E11: windup before fire and spread bound', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    player.x = crew.x + 8;
    player.z = crew.z;
    crew.yaw = Math.atan2(player.x - crew.x, player.z - crew.z);
    const ai = harness.state.crewAi.get(crewId)!;
    ai.fsm = 'ATTACK';
    ai.windupTicksRemaining = CREW_ATTACK_WINDUP_TICKS;
    ai.fireCooldownTicks = 0;
    harness.state.crewAi.set(crewId, ai);
    runTicks(harness, CREW_ATTACK_WINDUP_TICKS - 1);
    expect(countProjectiles(harness.state)).toBe(0);
    runTicks(harness, CREW_FIRE_INTERVAL_TICKS + 2);
    expect(countProjectiles(harness.state)).toBeGreaterThanOrEqual(0);

    for (let i = 0; i < 64; i += 1) {
      const off = sampleSpreadYawOffset(100, crewId, i);
      expect(Math.abs(off)).toBeLessThanOrEqual((4 * Math.PI) / 180 + 1e-9);
    }
  });
});
