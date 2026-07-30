import { describe, expect, it } from 'vitest';
import {
  CREW_ATTACK_WINDUP_TICKS,
  CREW_FIRE_INTERVAL_TICKS,
  CREW_SIDEARM_DAMAGE,
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

    const hpBefore = player.hp;
    let firstMuzzleTick: number | null = null;
    let secondMuzzleTick: number | null = null;
    for (let i = 0; i < CREW_FIRE_INTERVAL_TICKS + 40; i += 1) {
      const events = runTicks(harness, 1, undefined, { collectEvents: true });
      if (events.some((e) => e.type === 'muzzle' && e.ownerKind === 'security-crew')) {
        if (firstMuzzleTick === null) firstMuzzleTick = harness.state.tick - 1;
        else if (secondMuzzleTick === null) secondMuzzleTick = harness.state.tick - 1;
      }
      const p = getEntity(harness.state, harness.state.meta.playerId!)!;
      if (p.hp < hpBefore) break;
    }
    expect(firstMuzzleTick).not.toBeNull();
    expect(hpBefore - getEntity(harness.state, harness.state.meta.playerId!)!.hp).toBe(
      CREW_SIDEARM_DAMAGE,
    );
    if (secondMuzzleTick !== null && firstMuzzleTick !== null) {
      const gap = secondMuzzleTick - firstMuzzleTick;
      expect(gap).toBeGreaterThanOrEqual(CREW_FIRE_INTERVAL_TICKS - 1);
      expect(gap).toBeLessThanOrEqual(CREW_FIRE_INTERVAL_TICKS + 1);
    }

    for (let i = 0; i < 64; i += 1) {
      const off = sampleSpreadYawOffset(100, crewId, i);
      expect(Math.abs(off)).toBeLessThanOrEqual((4 * Math.PI) / 180 + 1e-9);
    }
  });
});
