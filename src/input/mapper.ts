import type { ActionIntent, DeviceSample } from './types.js';

export function mapSamplesToIntents(samples: DeviceSample[]): ActionIntent[] {
  return samples.map(({ action, value, axisX, axisZ }) => {
    if (action === 'move' || action === 'aim') {
      return { action, value: 0, axisX, axisZ };
    }
    return { action, value };
  });
}
