/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { commandsEqualForParity } from '../../src/sim/commands.js';
import { CommandBus } from '../../src/input/commandBus.js';
import { KeyboardMouseDevice } from '../../src/input/keyboardMouse.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

describe('input parity (G5)', () => {
  it('E7: KBM vs gamepad interact press produce parity-equal commands', () => {
    const tick = 0;
    const kbm = new FakeInputDevice('keyboard-mouse');
    kbm.pushSample('interact', 1);
    const busA = new CommandBus();
    busA.enqueueFromDevices([kbm]);
    const cmdA = busA.drainForTick(tick)[0]!;

    const pad = new FakeInputDevice('gamepad');
    pad.pushSample('interact', 1);
    const busB = new CommandBus();
    busB.enqueueFromDevices([pad]);
    const cmdB = busB.drainForTick(tick)[0]!;

    expect(commandsEqualForParity(cmdA, cmdB)).toBe(true);
  });

  it('E9: keyboard repeat does not emit extra command', () => {
    const device = new KeyboardMouseDevice();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyE', repeat: false, bubbles: true }),
    );
    expect(device.poll().filter((s) => s.action === 'interact').length).toBe(1);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyE', repeat: true, bubbles: true }),
    );
    expect(device.poll().filter((s) => s.action === 'interact').length).toBe(0);
    device.dispose();
  });

  it('E14: drained commands have no provenance fields', () => {
    const kbm = new FakeInputDevice('keyboard-mouse');
    kbm.pushSample('cancel', 1);
    const bus = new CommandBus();
    bus.enqueueFromDevices([kbm]);
    const cmds = bus.drainForTick(0);
    for (const cmd of cmds) {
      expect(Object.prototype.hasOwnProperty.call(cmd, 'source')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(cmd, 'device')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(cmd, 'kind')).toBe(false);
    }
  });
});
