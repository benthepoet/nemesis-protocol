import type { DeckGraph } from '../deck/types.js';
import { integrateMissionShell, type CollisionWorldRef } from '../mission/integrateMissionShell.js';
import type { InputCommand } from './commands.js';
import { integrateCrewAi } from '../ai/integrateCrewAi.js';
import { integrateCombat } from '../combat/integrateCombat.js';
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
  collisionRef: CollisionWorldRef,
  graph: DeckGraph,
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
    integrateMissionShell(state, graph, collisionRef);
    integratePlayerMotion(state, collisionRef.current);
    integrateCrewAi(state, collisionRef.current, graph);
    integrateCombat(state, collisionRef.current, graph);
    fixedStep(state);
  }
  return state;
}

export async function assertReplayDeterministic(
  initial: SimState,
  commands: readonly InputCommand[],
  collisionRef: CollisionWorldRef,
  graph: DeckGraph,
): Promise<void> {
  const a = replay(cloneSimState(initial), commands, collisionRef, graph);
  const b = replay(cloneSimState(initial), commands, collisionRef, graph);
  const hashA = await hashSimState(a);
  const hashB = await hashSimState(b);
  if (hashA !== hashB) {
    throw new Error(`Replay hashes differ: ${hashA} vs ${hashB}`);
  }
}
