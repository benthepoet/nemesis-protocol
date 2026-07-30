import { describe, expect, it } from 'vitest';
import { PROJECTILE_KIND } from '../../src/config.js';
import { getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('projectiles (G2)', () => {
  it('E26: owner skipped — muzzle spawn does not hit firer same tick', () => {
    const harness = createCombatTestHarness();
    const playerId = harness.state.meta.playerId!;
    const cmds = new Map<number, InputCommand[]>([[0, [fireHeldOn(0, 0)]]]);
    runTicks(harness, 1, cmds);
    expect(getEntity(harness.state, playerId)!.hp).toBe(100);
  });

  it('E4: projectile travels 1 m/tick and despawns at max range', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.yaw = 0;
    const cmds = new Map<number, InputCommand[]>();
    cmds.set(0, [fireHeldOn(0, 0)]);
    cmds.set(1, [{ tick: 1, sequence: 0, action: 'fire', value: 0 }]);
    runTicks(harness, 2, cmds);
    expect([...harness.state.entities.values()].filter((e) => e.kind === PROJECTILE_KIND).length).toBe(1);
    runTicks(harness, 60);
    expect([...harness.state.entities.values()].filter((e) => e.kind === PROJECTILE_KIND).length).toBe(0);
  });

  it('E5: wall collision removes projectile', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = 118;
    player.z = 83;
    player.yaw = Math.PI;
    const cmds = new Map<number, InputCommand[]>([[0, [fireHeldOn(0, 0)]]]);
    runTicks(harness, 5, cmds);
    const projs = [...harness.state.entities.values()].filter((e) => e.kind === PROJECTILE_KIND);
    expect(projs.length).toBe(0);
  });
});
