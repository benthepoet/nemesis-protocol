import type { InputCommand } from '../../src/sim/commands.js';

export const interactPressAt0: InputCommand = {
  tick: 0,
  sequence: 0,
  action: 'interact',
  value: 1,
};

export const interactReleaseAt0: InputCommand = {
  tick: 0,
  sequence: 1,
  action: 'interact',
  value: 0,
};

export const cancelPressAt0: InputCommand = {
  tick: 0,
  sequence: 0,
  action: 'cancel',
  value: 1,
};

export const scriptedScaffoldSession: InputCommand[] = [
  { tick: 0, sequence: 0, action: 'interact', value: 1 },
  { tick: 0, sequence: 1, action: 'cancel', value: 1 },
  { tick: 1, sequence: 2, action: 'interact', value: 0 },
];
