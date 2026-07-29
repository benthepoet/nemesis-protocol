import { describe, expect, it } from 'vitest';
import { CommandBus } from '../../src/input/commandBus.js';
import { GamepadDevice } from '../../src/input/gamepad.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { createWorld } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

function stubGamepads(pads: (Gamepad | null)[]): void {
  Object.defineProperty(globalThis.navigator, 'getGamepads', {
    configurable: true,
    value: () => pads,
  });
}

function fakeGamepad(buttonsPressed: boolean[]): Gamepad {
  return {
    connected: true,
    id: 'vitest-pad',
    index: 0,
    mapping: 'standard',
    timestamp: 0,
    axes: [],
    buttons: buttonsPressed.map((pressed) => ({
      pressed,
      touched: pressed,
      value: pressed ? 1 : 0,
    })),
  } as unknown as Gamepad;
}

describe('device hot-swap (G5 / Q4)', () => {
  it('E8: switching devices emits synthetic interact release', () => {
    const world = createWorld();
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    kbm.pushSample('interact', 1);
    const bus = new CommandBus();

    bus.enqueueFromDevices([kbm, pad]);
    let cmds = bus.drainForTick(world.tick);
    applyCommands(world, cmds);
    fixedStep(world);
    expect(world.meta.interactHeld).toBe(true);

    kbm.setHeld('interact', true);
    pad.pushSample('interact', 1);
    bus.enqueueFromDevices([kbm, pad]);
    cmds = bus.drainForTick(world.tick);
    const release = cmds.find((c) => c.action === 'interact' && c.value === 0);
    expect(release).toBeDefined();
    applyCommands(world, cmds);
    expect(world.meta.interactHeld).toBe(true);
  });

  it('E13: disconnect flushes synthetic releases for all held actions', () => {
    const kbm = new FakeInputDevice('keyboard-mouse');
    kbm.setHeld('interact', true);
    kbm.setHeld('cancel', true);
    const bus = new CommandBus();
    bus.enqueueFromDevices([kbm]);
    bus.notifyDeviceDeparting(kbm);
    const cmds = bus.drainForTick(0);
    const releases = cmds.filter((c) => c.value === 0);
    expect(releases.map((c) => c.action).sort()).toEqual(['cancel', 'interact']);
    expect(kbm.getHeldActions().size).toBe(0);
  });

  it('E13: gamepad disconnect emits release edges for held actions (Q4)', () => {
    const world = createWorld();
    const pad = new GamepadDevice();
    const bus = new CommandBus();
    const connected = fakeGamepad([true, true]);
    stubGamepads([connected]);

    bus.enqueueFromDevices([pad]);
    let cmds = bus.drainForTick(world.tick);
    applyCommands(world, cmds);
    expect(world.meta.interactHeld).toBe(true);
    expect(world.meta.cancelHeld).toBe(true);

    stubGamepads([null]);
    bus.enqueueFromDevices([pad]);
    cmds = bus.drainForTick(world.tick);
    const releases = cmds.filter((c) => c.value === 0);
    expect(releases.map((c) => c.action).sort()).toEqual(['cancel', 'interact']);
    applyCommands(world, cmds);
    expect(world.meta.interactHeld).toBe(false);
    expect(world.meta.cancelHeld).toBe(false);
    expect(pad.getHeldActions().size).toBe(0);
  });
});
