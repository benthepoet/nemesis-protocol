import { describe, expect, it } from 'vitest';
import { computeSpawnPoint } from '../../src/deck/spawn.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { getEntity } from '../../src/sim/world.js';
import { createPlayerTestHarness } from '../helpers/playerTestUtils.js';

describe('player aim (G3)', () => {
  it('E5: aim-only updates yaw, not position', () => {
    const { state, collisionWorld, graph } = createPlayerTestHarness();
    const id = state.meta.playerId!;
    const start = getEntity(state, id)!;
    const x0 = start.x;
    const z0 = start.z;
    const yaw0 = start.yaw;

    applyCommands(state, [
      { tick: state.tick, sequence: 0, action: 'move', value: 0, axisX: 0, axisZ: 0 },
      { tick: state.tick, sequence: 1, action: 'aim', value: 0, axisX: 1, axisZ: 0 },
    ]);
    integratePlayerMotion(state, collisionWorld);
    fixedStep(state);

    const end = getEntity(state, id)!;
    expect(end.x).toBeCloseTo(x0, 5);
    expect(end.z).toBeCloseTo(z0, 5);
    expect(end.yaw).toBeCloseTo(Math.atan2(1, 0), 5);
    expect(end.yaw).not.toBeCloseTo(yaw0, 3);
    expect(graph).toBeDefined();
  });

  it('E6: move-only leaves yaw at spawn', () => {
    const { state, collisionWorld, graph } = createPlayerTestHarness();
    const id = state.meta.playerId!;
    const spawn = computeSpawnPoint(graph, 'port-airlock');
    for (let i = 0; i < 10; i += 1) {
      applyCommands(state, [
        { tick: state.tick, sequence: 0, action: 'move', value: 0, axisX: 1, axisZ: 0 },
      ]);
      integratePlayerMotion(state, collisionWorld);
      fixedStep(state);
    }
    const end = getEntity(state, id)!;
    expect(end.yaw).toBeCloseTo(spawn.yaw, 5);
  });

  it('E20: zero-length aim axis leaves yaw unchanged', () => {
    const { state, collisionWorld } = createPlayerTestHarness();
    const id = state.meta.playerId!;
    const yaw0 = getEntity(state, id)!.yaw;
    applyCommands(state, [
      { tick: state.tick, sequence: 0, action: 'aim', value: 0, axisX: 0, axisZ: 0 },
    ]);
    integratePlayerMotion(state, collisionWorld);
    fixedStep(state);
    expect(getEntity(state, id)!.yaw).toBe(yaw0);
  });
});
