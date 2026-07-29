import { describe, expect, it } from 'vitest';
import { createPlaceholderScene } from '../../src/render/createPlaceholderScene.js';
import { hashSimState } from '../../src/sim/hash.js';
import { assertReplayDeterministic, replay } from '../../src/sim/replay.js';
import { createWorld, spawnEntity } from '../../src/sim/world.js';
import { scriptedScaffoldSession } from '../helpers/commandFixtures.js';

describe('replay determinism (G7)', () => {
  it('E10: identical replays produce identical hashSimState', async () => {
    const initial = createWorld();
    spawnEntity(initial, 'box', 0, 0, 0);
    await assertReplayDeterministic(initial, scriptedScaffoldSession);
    const once = replay(initial, scriptedScaffoldSession);
    const twice = replay(initial, scriptedScaffoldSession);
    expect(await hashSimState(once)).toBe(await hashSimState(twice));
  });

  it('hash excludes render state (Q5)', async () => {
    const sim = createWorld();
    spawnEntity(sim, 'hull', 1, 2, 3);
    const hashBefore = await hashSimState(sim);
    createPlaceholderScene();
    expect(await hashSimState(sim)).toBe(hashBefore);
  });
});
