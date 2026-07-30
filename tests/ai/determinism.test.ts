import { describe, expect, it } from 'vitest';
import { cloneSimState } from '../../src/sim/world.js';
import { hashSimState } from '../../src/sim/hash.js';
import { createCombatTestHarness, runTicks } from '../helpers/combatTestUtils.js';
import { replay } from '../../src/sim/replay.js';

describe('ai determinism (G9)', () => {
  it('E22: identical command stream yields identical hash', async () => {
    const harness = createCombatTestHarness();
    runTicks(harness, 120);
    const a = replay(cloneSimState(harness.state), [], harness.collisionWorld, harness.graph);
    const b = replay(cloneSimState(harness.state), [], harness.collisionWorld, harness.graph);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
  });

  it('E24: no Math.random or Date.now in src/ai', () => {
    const modules = import.meta.glob('../../src/ai/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
      string,
      string
    >;
    for (const text of Object.values(modules)) {
      expect(text).not.toMatch(/Math\.random/);
      expect(text).not.toMatch(/Date\.now/);
    }
  });
});
