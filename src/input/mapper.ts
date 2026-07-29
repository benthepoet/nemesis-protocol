import type { ActionIntent, DeviceSample } from './types.js';

export function mapSamplesToIntents(samples: DeviceSample[]): ActionIntent[] {
  return samples.map(({ action, value }) => ({ action, value }));
}
