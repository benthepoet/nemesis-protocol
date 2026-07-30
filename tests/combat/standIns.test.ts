import { describe, expect, it } from 'vitest';
import type { EntityId } from '../../src/sim/types.js';
import { M_PER_PX, ACTOR_MAX_HP } from '../../src/config.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { getEntity } from '../../src/sim/world.js';
import {
  aimToward,
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

const EXPECTED = [
  { room: 'main-spine', x: 570 * M_PER_PX, z: 400 * M_PER_PX },
  { room: 'cargo-hold', x: 497 * M_PER_PX, z: 335 * M_PER_PX },
  { room: 'barracks', x: 527 * M_PER_PX, z: 465 * M_PER_PX },
] as const;

function killStandInWithScriptedFire(
  harness: ReturnType<typeof createCombatTestHarness>,
  standId: EntityId,
  tickStart: number,
): number {
  const stand = getEntity(harness.state, standId)!;
  const player = getEntity(harness.state, harness.state.meta.playerId!)!;
  const dx = stand.x - player.x;
  const dz = stand.z - player.z;
  const dist = Math.hypot(dx, dz) || 1;
  player.x = stand.x - (dx / dist) * 2.5;
  player.z = stand.z - (dz / dist) * 2.5;

  let tick = tickStart;
  while (getEntity(harness.state, standId)!.alive && tick < tickStart + 400) {
    const cmds = new Map<number, InputCommand[]>([
      [
        tick,
        [
          aimToward(player.x, player.z, stand.x, stand.z, tick, 0),
          fireHeldOn(tick, 1),
        ],
      ],
    ]);
    runTicks(harness, 1, cmds);
    tick = harness.state.tick;
  }
  return tick;
}

describe('stand-ins (G6)', () => {
  it('E15: three stand-ins at binding positions ±0.01', () => {
    const harness = createCombatTestHarness();
    expect(harness.state.meta.standInIds.length).toBe(3);
    for (let i = 0; i < 3; i += 1) {
      const id = harness.state.meta.standInIds[i]!;
      const entity = getEntity(harness.state, id)!;
      expect(entity.x).toBeCloseTo(EXPECTED[i]!.x, 2);
      expect(entity.z).toBeCloseTo(EXPECTED[i]!.z, 2);
      const center = footprintCenter(getNode(harness.graph, EXPECTED[i]!.room));
      expect(entity.x).toBeCloseTo(center.x, 2);
      expect(entity.z).toBeCloseTo(center.z, 2);
    }
  });

  it('E16: kill each stand-in via scripted rifle fire', () => {
    const harness = createCombatTestHarness();
    let tick = 0;
    for (const id of harness.state.meta.standInIds) {
      expect(getEntity(harness.state, id)!.hp).toBe(ACTOR_MAX_HP);
      tick = killStandInWithScriptedFire(harness, id, tick);
      const dead = getEntity(harness.state, id)!;
      expect(dead.alive).toBe(false);
      expect(dead.hp).toBe(0);
    }
  });
});
