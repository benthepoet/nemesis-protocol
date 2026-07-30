/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { CommandBus } from '../../src/input/commandBus.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { createWorld } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

describe('interact verb (G6)', () => {
  it('E12: press/release edges through bus', () => {
    const world = createWorld();
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();

    kbm.pushSample('interact', 1);
    bus.enqueueFromDevices([kbm, pad]);
    applyCommands(world, bus.drainForTick(world.tick));
    fixedStep(world);
    expect(world.meta.interactHeld).toBe(true);
    expect(world.meta.interactCount).toBe(1);

    kbm.pushSample('interact', 0);
    bus.enqueueFromDevices([kbm, pad]);
    applyCommands(world, bus.drainForTick(world.tick));
    expect(world.meta.interactHeld).toBe(false);
    expect(world.meta.interactCount).toBe(1);
  });

  it('E13: DEV interact press logs once via console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const world = createWorld();
    applyCommands(world, [
      { tick: 0, sequence: 0, action: 'interact', value: 1 },
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
    applyCommands(world, [
      { tick: 0, sequence: 1, action: 'interact', value: 0 },
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
