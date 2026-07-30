import { describe, expect, it } from 'vitest';
import { ACTION_BINDINGS } from '../../src/input/bindings.js';

describe('bindings audit (G6)', () => {
  it('ACTION_BINDINGS matches §8 v1.12 contract', () => {
    expect(ACTION_BINDINGS).toEqual([
      { action: 'fire', mouseButton: 0, gamepadButton: 7 },
      { action: 'reload', keyboard: 'KeyR', gamepadButton: 2 },
      { action: 'interact', keyboard: 'KeyE', gamepadButton: 0 },
      { action: 'cancel', keyboard: 'Escape', gamepadButton: 1 },
    ]);
  });

  it('confirm/interact never shares fire binding', () => {
    const fire = ACTION_BINDINGS.find((b) => b.action === 'fire')!;
    const interact = ACTION_BINDINGS.find((b) => b.action === 'interact')!;
    expect(fire.mouseButton).not.toBe(interact.mouseButton);
    expect(fire.gamepadButton).not.toBe(interact.gamepadButton);
    expect(fire.keyboard).toBeUndefined();
  });
});
