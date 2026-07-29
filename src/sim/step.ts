import type { InputCommand } from './commands.js';
import type { SimState } from './types.js';

export function applyCommands(state: SimState, commands: readonly InputCommand[]): void {
  const sorted = [...commands].sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.sequence - b.sequence;
  });

  for (const cmd of sorted) {
    if (cmd.tick !== state.tick) {
      continue;
    }
    if (cmd.action === 'interact') {
      if (cmd.value === 1) {
        state.meta.interactCount += 1;
        state.meta.lastAction = 'interact';
        state.meta.interactHeld = true;
      } else {
        state.meta.interactHeld = false;
      }
    } else if (cmd.action === 'cancel') {
      if (cmd.value === 1) {
        state.meta.cancelCount += 1;
        state.meta.lastAction = 'cancel';
        state.meta.cancelHeld = true;
      } else {
        state.meta.cancelHeld = false;
      }
    }
  }
}

export function fixedStep(state: SimState): void {
  state.tick += 1;
}
