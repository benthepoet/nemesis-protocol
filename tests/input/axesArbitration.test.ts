import { describe, expect, it } from 'vitest';
import { commandsEqualForParity } from '../../src/sim/commands.js';
import { CommandBus } from '../../src/input/commandBus.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { createWorld } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

describe('per-channel M4 arbitration', () => {
  it('E18: pad move while KBM holds interact — no synthetic interact release', () => {
    const world = createWorld();
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();

    kbm.pushSample('interact', 1);
    bus.enqueueFromDevices([kbm, pad]);
    applyCommands(world, bus.drainForTick(world.tick));
    fixedStep(world);
    expect(world.meta.interactHeld).toBe(true);

    kbm.setHeld('interact', true);
    pad.pushAxisSample('move', 1, 0);
    bus.enqueueFromDevices([kbm, pad]);
    const cmds = bus.drainForTick(world.tick);

    expect(cmds.some((c) => c.action === 'interact' && c.value === 0)).toBe(false);
    expect(cmds.some((c) => c.action === 'move' && c.axisX === 1)).toBe(true);

    applyCommands(world, cmds);
    expect(world.meta.interactHeld).toBe(true);
  });

  it('E19: pad interact while KBM holds interact — synthetic release then pad press', () => {
    const world = createWorld();
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();

    kbm.pushSample('interact', 1);
    bus.enqueueFromDevices([kbm, pad]);
    applyCommands(world, bus.drainForTick(world.tick));
    fixedStep(world);

    kbm.setHeld('interact', true);
    pad.pushSample('interact', 1);

    bus.enqueueFromDevices([kbm, pad]);
    const cmds = bus.drainForTick(world.tick);

    const release = cmds.find((c) => c.action === 'interact' && c.value === 0);
    const press = cmds.find((c) => c.action === 'interact' && c.value === 1);
    expect(release).toBeDefined();
    expect(press).toBeDefined();

    applyCommands(world, cmds);
    expect(world.meta.interactHeld).toBe(true);
  });

  it('E4: KBM vs pad move samples parity-equal when axis matches', () => {
    const tick = 0;
    const kbm = new FakeInputDevice('keyboard-mouse');
    kbm.pushAxisSample('move', 0, -1);
    const busA = new CommandBus();
    busA.enqueueFromDevices([kbm]);
    const cmdA = busA.drainForTick(tick).find((c) => c.action === 'move')!;

    const pad = new FakeInputDevice('gamepad');
    pad.pushAxisSample('move', 0, -1);
    const busB = new CommandBus();
    busB.enqueueFromDevices([pad]);
    const cmdB = busB.drainForTick(tick).find((c) => c.action === 'move')!;

    expect(commandsEqualForParity(cmdA, cmdB)).toBe(true);
  });
});
