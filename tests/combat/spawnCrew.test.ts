import { describe, expect, it } from 'vitest';
import { CREW_POPULATION } from '../../src/config.js';
import { BINDING_CREW_SPAWN_WORLD } from '../../src/combat/spawnCrew.js';
import { getEntity, cloneSimState } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';
import { replay } from '../../src/sim/replay.js';

describe('spawnCrew (G6)', () => {
  it('E1: eight crew at binding coords ±0.01', () => {
    const harness = createCombatTestHarness();
    expect(harness.state.meta.crewIds.length).toBe(CREW_POPULATION);
    const cargoId = harness.state.meta.crewIds[2]!;
    const cargo = getEntity(harness.state, cargoId)!;
    expect(cargo.x).toBeCloseTo(BINDING_CREW_SPAWN_WORLD.cargo.x, 2);
    expect(cargo.z).toBeCloseTo(BINDING_CREW_SPAWN_WORLD.cargo.z, 2);
    const barracksId = harness.state.meta.crewIds[5]!;
    const barracks = getEntity(harness.state, barracksId)!;
    expect(barracks.x).toBeCloseTo(BINDING_CREW_SPAWN_WORLD.barracks.x, 2);
    expect(barracks.z).toBeCloseTo(BINDING_CREW_SPAWN_WORLD.barracks.z, 2);
  });

  it('E14: kill crew leaves corpse; replay does not respawn', () => {
    const harness = createCombatTestHarness();
    const targetId = harness.state.meta.crewIds[2]!;
    const target = getEntity(harness.state, targetId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = target.x - 1.5;
    player.z = target.z;
    player.yaw = Math.atan2(target.x - player.x, target.z - player.z);
    const cmds = new Map<number, InputCommand[]>();
    for (let t = 0; t < 30; t += 1) {
      cmds.set(t, [fireHeldOn(t, 0)]);
    }
    runTicks(harness, 30, cmds);
    expect(getEntity(harness.state, targetId)!.alive).toBe(false);
    const snap = cloneSimState(harness.state);
    const replayed = replay(snap, [], harness.collisionWorld, harness.graph);
    expect(getEntity(replayed, targetId)!.alive).toBe(false);
    expect(getEntity(replayed, targetId)!.hp).toBe(0);
  });
});

describe('crew constants', () => {
  it('binding tick constants match spec', async () => {
    const {
      CREW_DETECTION_DELAY_TICKS,
      CREW_ATTACK_WINDUP_TICKS,
      CREW_FIRE_INTERVAL_TICKS,
      CREW_WAYPOINT_PAUSE_TICKS,
      CREW_INVESTIGATE_SCAN_TICKS,
      TRACER_MAX_CONCURRENT,
    } = await import('../../src/config.js');
    expect(CREW_DETECTION_DELAY_TICKS).toBe(15);
    expect(CREW_ATTACK_WINDUP_TICKS).toBe(30);
    expect(CREW_FIRE_INTERVAL_TICKS).toBe(54);
    expect(CREW_WAYPOINT_PAUSE_TICKS).toBe(120);
    expect(CREW_INVESTIGATE_SCAN_TICKS).toBe(240);
    expect(TRACER_MAX_CONCURRENT).toBe(24);
  });
});
