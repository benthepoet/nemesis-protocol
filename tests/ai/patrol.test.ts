import { describe, expect, it } from 'vitest';
import { TICK_HZ } from '../../src/config.js';
import { cloneSimState } from '../../src/sim/world.js';
import { createCombatTestHarness, runTicks } from '../helpers/combatTestUtils.js';
import { getEntity } from '../../src/sim/world.js';

describe('patrol (G2)', () => {
  it('E2: AL0 patrol deterministic over 60s', () => {
    const a = createCombatTestHarness();
    runTicks(a, TICK_HZ * 60);
    const snapA = cloneSimState(a.state);

    const b = createCombatTestHarness();
    runTicks(b, TICK_HZ * 60);
    for (const id of a.state.meta.crewIds) {
      const ea = getEntity(snapA, id)!;
      const eb = getEntity(b.state, id)!;
      expect(ea.x).toBeCloseTo(eb.x, 4);
      expect(ea.z).toBeCloseTo(eb.z, 4);
    }
  });
});
