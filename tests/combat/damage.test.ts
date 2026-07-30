import { describe, expect, it } from 'vitest';
import { RIFLE_DAMAGE_PER_HIT } from '../../src/config.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('damage (G3)', () => {
  it('E7: projectile hit stand-in reduces HP 100→75', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.standInIds[0]!;
    const stand = getEntity(harness.state, standId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = stand.x - 1.5;
    player.z = stand.z;
    player.yaw = Math.atan2(stand.x - player.x, stand.z - player.z);
    const cmds = new Map<number, InputCommand[]>();
    cmds.set(0, [fireHeldOn(0, 0)]);
    runTicks(harness, 6, cmds);
    expect(getEntity(harness.state, standId)!.hp).toBe(100 - RIFLE_DAMAGE_PER_HIT);
  });

  it('E8: four hits kill stand-in', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.standInIds[0]!;
    for (let hit = 0; hit < 4; hit += 1) {
      applyDamage(harness.state, standId, RIFLE_DAMAGE_PER_HIT);
    }
    const stand = getEntity(harness.state, standId)!;
    expect(stand.hp).toBe(0);
    expect(stand.alive).toBe(false);
  });

  it('E9: applyDamage(999) clamps hp at 0', () => {
    const harness = createCombatTestHarness();
    const standId = harness.state.meta.standInIds[0]!;
    applyDamage(harness.state, standId, 999);
    expect(getEntity(harness.state, standId)!.hp).toBe(0);
  });
});
