/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { KeyboardMouseDevice } from '../../src/input/keyboardMouse.js';

describe('KeyboardMouseDevice mouse aim (M3/M4)', () => {
  let kbm: KeyboardMouseDevice;

  afterEach(() => {
    kbm?.dispose();
  });

  it('emits aim only when the cursor moves, not every poll', () => {
    kbm = new KeyboardMouseDevice();
    kbm.setAimSampler(() => ({ axisX: 0, axisZ: -1 }));
    kbm.setPlayerPositionForAim(0, 0);

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
    const first = kbm.poll().filter((s) => s.action === 'aim');
    const second = kbm.poll().filter((s) => s.action === 'aim');

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it('emits aim again after a new mousemove', () => {
    kbm = new KeyboardMouseDevice();
    kbm.setAimSampler(() => ({ axisX: 1, axisZ: 0 }));
    kbm.setPlayerPositionForAim(0, 0);

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
    kbm.poll();

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 100 }));
    const afterMove = kbm.poll().filter((s) => s.action === 'aim');

    expect(afterMove).toHaveLength(1);
    expect(afterMove[0]).toMatchObject({ axisX: 1, axisZ: 0 });
  });
});
