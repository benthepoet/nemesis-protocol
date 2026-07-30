import { describe, expect, it } from 'vitest';
import {
  ACTOR_MAX_HP,
  MAGAZINE_SIZE,
  RESERVE_AMMO_START,
  RESPAWN_DELAY_TICKS,
  RIFLE_DAMAGE_PER_HIT,
} from '../../src/config.js';
import { computeSpawnPoint } from '../../src/deck/spawn.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { applyCommands } from '../../src/sim/step.js';
import { getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  debugDamagePress,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('death and respawn (G4)', () => {
  it('E10: debugDamage ×4 → dead; respawn at 180 ticks with full hp/ammo', () => {
    const harness = createCombatTestHarness();
    const playerId = harness.state.meta.playerId!;
    const cmds: InputCommand[] = [];
    for (let i = 0; i < 4; i += 1) {
      cmds.push(debugDamagePress(harness.state.tick + i, i));
    }
    const byTick = new Map<number, InputCommand[]>();
    for (const c of cmds) {
      const list = byTick.get(c.tick) ?? [];
      list.push(c);
      byTick.set(c.tick, list);
    }
    runTicks(harness, 4, byTick);
    expect(getEntity(harness.state, playerId)!.alive).toBe(false);
    expect(harness.state.meta.respawnTicksRemaining).toBeGreaterThan(0);

    const moveCmd = { tick: 5, sequence: 99, action: 'move' as const, value: 0 as const, axisX: 1, axisZ: 0 };
    applyCommands(harness.state, [moveCmd]);
    expect(getEntity(harness.state, playerId)!.moveIntentX).toBe(0);

    runTicks(harness, RESPAWN_DELAY_TICKS);
    const player = getEntity(harness.state, playerId)!;
    expect(player.alive).toBe(true);
    expect(player.hp).toBe(ACTOR_MAX_HP);
    expect(harness.state.meta.magazine).toBe(MAGAZINE_SIZE);
    expect(harness.state.meta.reserve).toBe(RESERVE_AMMO_START);
    const spawn = computeSpawnPoint(harness.graph, 'port-airlock');
    expect(player.x).toBeCloseTo(spawn.x, 2);
    expect(player.z).toBeCloseTo(spawn.z, 2);
    expect(RESPAWN_DELAY_TICKS).toBe(180);
  });

  it('E11: stand-in corpse remains in entity map', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.crewIds[2]!;
    applyDamage(harness.state, standId, RIFLE_DAMAGE_PER_HIT * 4);
    expect(harness.state.entities.has(standId)).toBe(true);
    expect(getEntity(harness.state, standId)!.kind).toBe('security-crew');
  });

  it('E27: production guard — debugDamage no-op when not DEV', () => {
    const harness = createCombatTestHarness();
    const playerId = harness.state.meta.playerId!;
    const prevDev = import.meta.env.DEV;
    try {
      (import.meta.env as { DEV: boolean }).DEV = false;
      applyCommands(harness.state, [debugDamagePress(0, 0)]);
      expect(getEntity(harness.state, playerId)!.hp).toBe(ACTOR_MAX_HP);
    } finally {
      (import.meta.env as { DEV: boolean }).DEV = prevDev;
    }
  });
});
