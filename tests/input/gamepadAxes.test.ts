import { afterEach, describe, expect, it, vi } from 'vitest';
import { GamepadDevice } from '../../src/input/gamepad.js';

function mockPad(axes: number[]): Gamepad {
  return {
    axes,
    buttons: [],
    connected: true,
    id: 'test',
    index: 0,
    mapping: 'standard',
    timestamp: 0,
    vibrationActuator: null,
    hapticActuators: [],
  } as unknown as Gamepad;
}

describe('GamepadDevice stick mapping (Web Gamepad: up = negative axis Y)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stick up on left stick maps to forward (−Z), matching WASD W', () => {
    vi.stubGlobal('navigator', {
      getGamepads: () => [mockPad([0, -1, 0, 0])],
    });
    const pad = new GamepadDevice();
    const samples = pad.poll();
    const move = samples.find((s) => s.action === 'move');
    expect(move).toBeDefined();
    expect(move!.axisX).toBeCloseTo(0, 5);
    expect(move!.axisZ).toBeCloseTo(-1, 5);
  });

  it('stick up on right stick maps aim to forward (−Z)', () => {
    vi.stubGlobal('navigator', {
      getGamepads: () => [mockPad([0, 0, 0, -1])],
    });
    const pad = new GamepadDevice();
    const samples = pad.poll();
    const aim = samples.find((s) => s.action === 'aim');
    expect(aim).toBeDefined();
    expect(aim!.axisX).toBeCloseTo(0, 5);
    expect(aim!.axisZ).toBeCloseTo(-1, 5);
  });
});
