import { describe, expect, it } from 'vitest';
import { hashSimState } from '../../src/sim/hash.js';
import { replay } from '../../src/sim/replay.js';
import { cloneSimState } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('combat determinism (G8)', () => {
  it('E19: identical fire streams → identical hash', async () => {
    const harness = createCombatTestHarness();
    const cmds: InputCommand[] = [];
    for (let t = 0; t < 30; t += 1) {
      cmds.push(fireHeldOn(t, t));
    }
    const a = replay(cloneSimState(harness.state), cmds, harness.collisionWorld, harness.graph);
    const b = replay(cloneSimState(harness.state), cmds, harness.collisionWorld, harness.graph);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
  });

  it('E20: different fire streams → different hash', async () => {
    const harness = createCombatTestHarness();
    const short: InputCommand[] = [fireHeldOn(0, 0)];
    const long: InputCommand[] = [];
    for (let t = 0; t < 20; t += 1) {
      long.push(fireHeldOn(t, t));
    }
    const a = replay(cloneSimState(harness.state), short, harness.collisionWorld, harness.graph);
    const b = replay(cloneSimState(harness.state), long, harness.collisionWorld, harness.graph);
    expect(await hashSimState(a)).not.toBe(await hashSimState(b));
  });

  it('E28: no Math.random / Date.now in src/combat', () => {
    const modules = import.meta.glob('../../src/combat/*.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    for (const text of Object.values(modules)) {
      expect(text).not.toMatch(/Math\.random/);
      expect(text).not.toMatch(/Date\.now/);
    }
  });
});
