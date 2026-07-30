import { describe, expect, it } from 'vitest';
import { ACTOR_MAX_HP, RIFLE_DAMAGE_PER_HIT } from '../../src/config.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { applyCommands } from '../../src/sim/step.js';
import { getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  debugDamagePress,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('death and mission fail (G7)', () => {
  it('E10: debugDamage ×4 → dead; mission SCORE FAILED (no respawn)', () => {
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
    expect(harness.state.meta.missionPhase).toBe('SCORE');
    expect(harness.state.meta.score?.outcome).toBe('FAILED');

    runTicks(harness, 300);
    expect(getEntity(harness.state, playerId)!.alive).toBe(false);
    expect(harness.state.meta.missionPhase).toBe('SCORE');
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
