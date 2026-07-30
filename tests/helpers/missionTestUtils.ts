import { buildCollisionWorld } from '../../src/deck/collision.js';
import { createMissionWorld } from '../../src/mission/createMissionWorld.js';
import type { CollisionWorldRef } from '../../src/mission/integrateMissionShell.js';
import { integrateMissionShell } from '../../src/mission/integrateMissionShell.js';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { integrateCrewAi } from '../../src/ai/integrateCrewAi.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import type { DeckGraph } from '../../src/deck/types.js';
import type { InputCommand } from '../../src/sim/commands.js';
import type { SimState } from '../../src/sim/types.js';
import { loadTestDeck03 } from './deckTestUtils.js';
import { bootstrapMissionActive } from './combatTestUtils.js';

export function createMissionTestWorld(): {
  graph: DeckGraph;
  state: SimState;
  collisionRef: CollisionWorldRef;
} {
  const graph = loadTestDeck03();
  const state = createMissionWorld(graph);
  const collisionRef: CollisionWorldRef = { current: buildCollisionWorld(graph) };
  return { graph, state, collisionRef };
}

export function interactPress(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'interact', value: 1 };
}

export function interactRelease(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'interact', value: 0 };
}

export function moveAxis(
  tick: number,
  sequence: number,
  axisX: number,
  axisZ: number,
): InputCommand {
  return { tick, sequence, action: 'move', value: 0, axisX, axisZ };
}

export function runMissionTicks(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  ticks: number,
  commandsByTick?: Map<number, InputCommand[]>,
): void {
  for (let i = 0; i < ticks; i += 1) {
    const t = state.tick;
    const cmds = commandsByTick?.get(t) ?? [];
    applyCommands(state, cmds);
    integrateMissionShell(state, graph, collisionRef);
    integratePlayerMotion(state, collisionRef.current);
    integrateCrewAi(state, collisionRef.current, graph);
    integrateCombat(state, collisionRef.current, graph);
    fixedStep(state);
  }
}

export function confirmBreachInsertion(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void {
  runMissionTicks(state, graph, collisionRef, 1, new Map([[state.tick, [interactPress(state.tick, 0)]]]));
}

export function releaseShellInteract(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void {
  runMissionTicks(state, graph, collisionRef, 1, new Map([[state.tick, [interactRelease(state.tick, 0)]]]));
}

export function confirmBreachAndSkipToActive(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  roomId: 'port-airlock' | 'stbd-airlock' = 'port-airlock',
): void {
  bootstrapMissionActive(state, graph, collisionRef, roomId);
}

export { bootstrapMissionActive };
