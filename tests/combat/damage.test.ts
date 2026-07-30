import { describe, expect, it } from 'vitest';
import {
  ACTOR_MAX_HP,
  CREW_SIDEARM_DAMAGE,
  RESPAWN_DELAY_TICKS,
  RIFLE_DAMAGE_PER_HIT,
} from '../../src/config.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('damage (G3)', () => {
  it('E7: projectile hit stand-in reduces HP 100→75 with impact events', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.crewIds[2]!;
    const stand = getEntity(harness.state, standId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = stand.x - 1.5;
    player.z = stand.z;
    player.yaw = Math.atan2(stand.x - player.x, stand.z - player.z);
    const cmds = new Map<number, InputCommand[]>();
    cmds.set(0, [fireHeldOn(0, 0)]);
    const events = runTicks(harness, 6, cmds, { collectEvents: true });
    expect(getEntity(harness.state, standId)!.hp).toBe(100 - RIFLE_DAMAGE_PER_HIT);
    expect(events.some((e) => e.type === 'impact-actor' && e.targetId === standId)).toBe(true);
    expect(events.some((e) => e.type === 'hit-flash' && e.targetId === standId)).toBe(true);
  });

  it('E8: four projectile hits kill stand-in; later shots pass through', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.crewIds[2]!;
    const stand = getEntity(harness.state, standId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = stand.x - 1.5;
    player.z = stand.z;
    player.yaw = Math.atan2(stand.x - player.x, stand.z - player.z);

    const cmds = new Map<number, InputCommand[]>();
    for (let t = 0; t < 24; t += 1) {
      cmds.set(t, [fireHeldOn(t, 0)]);
    }
    runTicks(harness, 24, cmds);
    expect(getEntity(harness.state, standId)!.hp).toBe(0);
    expect(getEntity(harness.state, standId)!.alive).toBe(false);

    const hpBefore = getEntity(harness.state, standId)!.hp;
    const extra = new Map<number, InputCommand[]>();
    for (let i = 0; i < 12; i += 1) {
      const t = harness.state.tick + i;
      extra.set(t, [fireHeldOn(t, 0)]);
    }
    const events = runTicks(harness, 12, extra, { collectEvents: true });
    expect(getEntity(harness.state, standId)!.hp).toBe(hpBefore);
    expect(events.some((e) => e.type === 'impact-actor' && e.targetId === standId)).toBe(false);
  });

  it('E19: crew projectile −10 HP; death then 180-tick respawn', () => {
    const harness = createCombatTestHarness();
    const playerId = harness.state.meta.playerId!;
    const player = getEntity(harness.state, playerId)!;
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    player.x = crew.x + 6;
    player.z = crew.z;
    crew.yaw = Math.atan2(player.x - crew.x, player.z - crew.z);
    const ai = harness.state.crewAi.get(crewId)!;
    ai.fsm = 'ATTACK';
    ai.windupTicksRemaining = 0;
    ai.fireCooldownTicks = 0;
    harness.state.crewAi.set(crewId, ai);

    const hp0 = player.hp;
    runTicks(harness, 12);
    expect(hp0 - getEntity(harness.state, playerId)!.hp).toBe(CREW_SIDEARM_DAMAGE);

    player.hp = CREW_SIDEARM_DAMAGE;
    player.alive = true;
    ai.windupTicksRemaining = 0;
    ai.fireCooldownTicks = 0;
    harness.state.crewAi.set(crewId, ai);
    runTicks(harness, 12);
    expect(getEntity(harness.state, playerId)!.hp).toBe(0);
    expect(getEntity(harness.state, playerId)!.alive).toBe(false);
    expect(harness.state.meta.respawnTicksRemaining).toBeGreaterThan(0);

    runTicks(harness, RESPAWN_DELAY_TICKS);
    const respawned = getEntity(harness.state, playerId)!;
    expect(respawned.alive).toBe(true);
    expect(respawned.hp).toBe(ACTOR_MAX_HP);
    expect(RESPAWN_DELAY_TICKS).toBe(180);
  });

  it('E9: applyDamage(999) clamps hp at 0', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.crewIds[2]!;
    applyDamage(harness.state, standId, 999);
    expect(getEntity(harness.state, standId)!.hp).toBe(0);
  });
});
