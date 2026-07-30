import type { CollisionWorld } from '../deck/collision.js';
import type { InputCommand } from './commands.js';
import { hashSimState } from './hash.js';
import { integratePlayerMotion } from './playerMotion.js';
import { applyCommands, fixedStep } from './step.js';
import type { SimState } from './types.js';
import { cloneSimState } from './world.js';

export function recordCommands(commands: readonly InputCommand[]): InputCommand[] {
  return commands.map((c) => ({ ...c }));
}

export function replay(
  initial: SimState,
  commands: readonly InputCommand[],
  collisionWorld: CollisionWorld,
): SimState {
  const state = cloneSimState(initial);
  const byTick = new Map<number, InputCommand[]>();
  for (const cmd of commands) {
    const list = byTick.get(cmd.tick) ?? [];
    list.push(cmd);
    byTick.set(cmd.tick, list);
  }

  const maxTick = commands.reduce((max, c) => Math.max(max, c.tick), state.tick - 1);
  for (let t = state.tick; t <= maxTick; t += 1) {
    const tickCmds = byTick.get(t) ?? [];
    applyCommands(state, tickCmds);
    integratePlayerMotion(state, collisionWorld);
    fixedStep(state);
  }
  return state;
}

export async function assertReplayDeterministic(
  initial: SimState,
  commands: readonly InputCommand[],
  collisionWorld: CollisionWorld,
): Promise<void> {
  const a = replay(cloneSimState(initial), commands, collisionWorld);
  const b = replay(cloneSimState(initial), commands, collisionWorld);
  const hashA = await hashSimState(a);
  const hashB = await hashSimState(b);
  if (hashA !== hashB) {
    throw new Error(`Replay hashes differ: ${hashA} vs ${hashB}`);
  }
}
