/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { KeyboardMouseDevice } from '../../src/input/keyboardMouse.js';

vi.mock('../../src/render/debugFlyCamera.js', () => ({
  isDebugFlyCameraEnabled: () => true,
}));

describe('KeyE debug fly precedence (G8 E21)', () => {
  it('KeyE does not enqueue interact when debug fly enabled', () => {
    const device = new KeyboardMouseDevice();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyE', repeat: false, bubbles: true }),
    );
    const samples = device.poll().filter((s) => s.action === 'interact');
    expect(samples).toHaveLength(0);
    device.dispose();
  });
});
