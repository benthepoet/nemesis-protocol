import { describe, expect, it } from 'vitest';
import { M_PER_PX, RIFLE_DAMAGE_PER_HIT } from '../../src/config.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { getEntity } from '../../src/sim/world.js';
import { createCombatTestHarness } from '../helpers/combatTestUtils.js';

const EXPECTED = [
  { room: 'main-spine', x: 570 * M_PER_PX, z: 400 * M_PER_PX },
  { room: 'cargo-hold', x: 497 * M_PER_PX, z: 335 * M_PER_PX },
  { room: 'barracks', x: 527 * M_PER_PX, z: 465 * M_PER_PX },
] as const;

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

  it('E16: kill each stand-in via repeated damage', () => {
    const harness = createCombatTestHarness();
    for (const id of harness.state.meta.standInIds) {
      for (let h = 0; h < 4; h += 1) {
        applyDamage(harness.state, id, RIFLE_DAMAGE_PER_HIT);
      }
      expect(getEntity(harness.state, id)!.alive).toBe(false);
    }
  });
});
