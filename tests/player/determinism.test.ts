import { describe, expect, it } from 'vitest';
import type { InputCommand } from '../../src/sim/commands.js';
import { hashSimState } from '../../src/sim/hash.js';
import { replay } from '../../src/sim/replay.js';
import { getEntity } from '../../src/sim/world.js';
import { createPlayerTestHarness } from '../helpers/playerTestUtils.js';

function moveStream(ticks: number): InputCommand[] {
  const cmds: InputCommand[] = [];
  for (let t = 0; t < ticks; t += 1) {
    cmds.push({ tick: t, sequence: t, action: 'move', value: 0, axisX: 1, axisZ: 0 });
  }
  return cmds;
}

describe('player determinism (G7)', () => {
  it('E14: identical replays → same pose and hash', async () => {
    const harness = createPlayerTestHarness();
    const cmds = moveStream(45);
    const a = replay(harness.state, cmds, harness.collisionWorld);
    const b = replay(harness.state, cmds, harness.collisionWorld);
    const id = a.meta.playerId!;
    const ea = getEntity(a, id)!;
    const eb = getEntity(b, id)!;
    expect(ea.x).toBe(eb.x);
    expect(ea.z).toBe(eb.z);
    expect(ea.yaw).toBe(eb.yaw);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
  });

  it('E15: different streams → different hash', async () => {
    const harness = createPlayerTestHarness();
    const a = replay(harness.state, moveStream(10), harness.collisionWorld);
    const b = replay(harness.state, moveStream(20), harness.collisionWorld);
    expect(await hashSimState(a)).not.toBe(await hashSimState(b));
  });
});
