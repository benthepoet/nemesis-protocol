import { describe, expect, it } from 'vitest';
import { hashSimState } from '../../src/sim/hash.js';
import { cloneSimState } from '../../src/sim/world.js';
import {
  createMissionTestWorld,
  interactPress,
  interactRelease,
  moveAxis,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { replay } from '../../src/sim/replay.js';

describe('mission determinism (G9)', () => {
  it('identical shell command streams → identical hash', async () => {
    const a = createMissionTestWorld();
    const b = createMissionTestWorld();
    const cmds = new Map([
      [0, [moveAxis(0, 0, 0, 1)]],
      [1, [interactPress(1, 0)]],
      [2, [interactRelease(2, 0)]],
    ]);
    runMissionTicks(a.state, a.graph, a.collisionRef, 3, cmds);
    runMissionTicks(b.state, b.graph, b.collisionRef, 3, cmds);
    expect(await hashSimState(a.state)).toBe(await hashSimState(b.state));
  });

  it('replay includes mission shell integrator', async () => {
    const { state, graph, collisionRef } = createMissionTestWorld();
    const cmds = [{ tick: 0, sequence: 0, action: 'interact' as const, value: 1 as const }];
    const once = replay(cloneSimState(state), cmds, collisionRef, graph);
    const twice = replay(cloneSimState(state), cmds, collisionRef, graph);
    expect(await hashSimState(once)).toBe(await hashSimState(twice));
  });
});
