import { describe, expect, it } from 'vitest';
import { CommandBus } from '../../src/input/commandBus.js';
import { computeSpawnPoint } from '../../src/deck/spawn.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { getEntity } from '../../src/sim/world.js';
import { createPlayerTestHarness } from '../helpers/playerTestUtils.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

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

  it('G3: KBM aim channel owner disables assist (bus predicate)', () => {
    const { state, collisionWorld } = createPlayerTestHarness();
    const kbm = new FakeInputDevice('keyboard-mouse');
    kbm.pushAxisSample('aim', 1, 0);
    const bus = new CommandBus();
    bus.enqueueFromDevices([kbm]);
    expect(bus.getChannelOwner('aim')).toBe('keyboard-mouse');
    const cmds = bus.drainForTick(state.tick);
    applyCommands(state, cmds, {
      collisionWorld,
      aimAssist: bus.getChannelOwner('aim') === 'gamepad',
    });
    expect(getEntity(state, state.meta.playerId!)!.yaw).toBeCloseTo(Math.atan2(1, 0), 5);
  });
});
