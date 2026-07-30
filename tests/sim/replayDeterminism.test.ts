import { describe, expect, it } from 'vitest';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { createPlaceholderScene } from '../../src/render/createPlaceholderScene.js';
import { hashSimState } from '../../src/sim/hash.js';
import { assertReplayDeterministic, replay } from '../../src/sim/replay.js';
import { createWorld, spawnEntity } from '../../src/sim/world.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { scriptedScaffoldSession } from '../helpers/commandFixtures.js';

describe('replay determinism (G7)', () => {
  const collisionWorld = buildCollisionWorld(loadTestDeck03());

  it('E10: identical replays produce identical hashSimState', async () => {
    const initial = createWorld();
    spawnEntity(initial, 'box', 0, 0, 0);
    await assertReplayDeterministic(initial, scriptedScaffoldSession, collisionWorld);
    const once = replay(initial, scriptedScaffoldSession, collisionWorld);
    const twice = replay(initial, scriptedScaffoldSession, collisionWorld);
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
