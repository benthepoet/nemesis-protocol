import { describe, expect, it } from 'vitest';
import { CommandBus } from '../../src/input/commandBus.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

describe('fire/reload channel arbitration (M4)', () => {
  it('E24: pad fire while KBM holds fire → synthetic fire release then pad owns channel', () => {
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    kbm.pushSample('fire', 1);
    const bus = new CommandBus();
    bus.enqueueFromDevices([kbm]);
    bus.drainForTick(0);
    kbm.setHeld('fire', true);
    pad.pushSample('fire', 1);
    bus.enqueueFromDevices([kbm, pad]);
    const cmds = bus.drainForTick(0);
    const release = cmds.find((c) => c.action === 'fire' && c.value === 0);
    const press = cmds.filter((c) => c.action === 'fire' && c.value === 1);
    expect(release).toBeDefined();
    expect(press.length).toBeGreaterThanOrEqual(1);
    expect(bus.getChannelOwner('fire')).toBe('gamepad');
  });

  it('E25: pad move while KBM holds fire → no synthetic fire release', () => {
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    kbm.pushSample('fire', 1);
    const bus = new CommandBus();
    bus.enqueueFromDevices([kbm]);
    bus.drainForTick(0);
    kbm.setHeld('fire', true);
    pad.pushAxisSample('move', 1, 0);
    bus.enqueueFromDevices([kbm, pad]);
    const cmds = bus.drainForTick(0);
    expect(cmds.find((c) => c.action === 'fire' && c.value === 0)).toBeUndefined();
    expect(bus.getChannelOwner('fire')).toBe('keyboard-mouse');
  });
});
