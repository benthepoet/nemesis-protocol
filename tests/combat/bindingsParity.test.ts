/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { commandsEqualForParity } from '../../src/sim/commands.js';
import { CommandBus } from '../../src/input/commandBus.js';
import { findMouseBinding, findGamepadBinding } from '../../src/input/bindings.js';
import { KeyboardMouseDevice } from '../../src/input/keyboardMouse.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

describe('combat bindings parity (G7)', () => {
  it('E17: KBM vs gamepad fire/reload parity-equal commands', () => {
    const tick = 0;
    for (const action of ['fire', 'reload'] as const) {
      const kbm = new FakeInputDevice('keyboard-mouse');
      kbm.pushSample(action, 1);
      const busA = new CommandBus();
      busA.enqueueFromDevices([kbm]);
      const cmdA = busA.drainForTick(tick).find((c) => c.action === action)!;

      const pad = new FakeInputDevice('gamepad');
      pad.pushSample(action, 1);
      const busB = new CommandBus();
      busB.enqueueFromDevices([pad]);
      const cmdB = busB.drainForTick(tick).find((c) => c.action === action)!;

      expect(commandsEqualForParity(cmdA, cmdB)).toBe(true);
    }
  });

  it('E18: mouse-0 → fire; never interact', () => {
    expect(findMouseBinding(0)).toBe('fire');
    const device = new KeyboardMouseDevice();
    window.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
    const samples = device.poll();
    expect(samples.some((s) => s.action === 'fire' && s.value === 1)).toBe(true);
    expect(samples.some((s) => s.action === 'interact')).toBe(false);
    device.dispose();
  });

  it('E18: gamepad RT (7) → fire', () => {
    expect(findGamepadBinding(7)).toBe('fire');
    expect(findGamepadBinding(0)).toBe('interact');
  });
});
