import { buildCollisionWorld } from '../../src/deck/collision.js';
import { createMissionWorld } from '../../src/mission/createMissionWorld.js';
import { integrateMissionShell, type CollisionWorldRef } from '../../src/mission/integrateMissionShell.js';
import { spawnPlayerAtAirlock } from '../../src/player/spawnPlayer.js';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { integrateCrewAi } from '../../src/ai/integrateCrewAi.js';
import type { CombatEvent } from '../../src/combat/types.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import type { CollisionWorld } from '../../src/deck/collision.js';
import type { DeckGraph } from '../../src/deck/types.js';
import type { InputCommand } from '../../src/sim/commands.js';
import type { SimState } from '../../src/sim/types.js';
import type { BreachRoomId } from '../../src/mission/types.js';
import { loadTestDeck03 } from './deckTestUtils.js';

export interface CombatTestHarness {
  graph: DeckGraph;
  state: SimState;
  collisionRef: CollisionWorldRef;
  /** @deprecated use collisionRef.current */
  collisionWorld: CollisionWorld;
}

export function createCombatTestHarness(): CombatTestHarness {
  const graph = loadTestDeck03();
  const state = createMissionWorld(graph);
  const collisionRef: CollisionWorldRef = { current: buildCollisionWorld(graph) };
  bootstrapMissionActive(state, graph, collisionRef, 'port-airlock');
  return { graph, state, collisionRef, collisionWorld: collisionRef.current };
}

export function bootstrapMissionActive(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  roomId: BreachRoomId = 'port-airlock',
): void {
  if (state.meta.playerId !== null) {
    state.entities.delete(state.meta.playerId);
    state.meta.playerId = null;
  }
  for (const [id, e] of [...state.entities.entries()]) {
    if (e.kind === 'projectile') state.entities.delete(id);
  }
  state.projectileTraveledM.clear();
  state.meta.breachSelectIndex = roomId === 'port-airlock' ? 0 : 1;
  state.meta.breachRoomId = roomId;
  spawnPlayerAtAirlock(state, graph, roomId);
  state.meta.closedDoorEdgeId = null;
  state.meta.insertionTicksRemaining = 0;
  state.meta.objectiveIssued = true;
  state.meta.objectiveComplete = false;
  state.meta.missionPhase = 'ACTIVE';
  collisionRef.current = buildCollisionWorld(graph);
}

export function runTicks(
  harness: CombatTestHarness,
  ticks: number,
  commandsByTick?: Map<number, InputCommand[]>,
  options?: { collectEvents?: boolean },
): CombatEvent[] {
  const allEvents: CombatEvent[] = [];
  for (let i = 0; i < ticks; i += 1) {
    const t = harness.state.tick;
    const cmds = commandsByTick?.get(t) ?? [];
    applyCommands(harness.state, cmds);
    integrateMissionShell(harness.state, harness.graph, harness.collisionRef);
    integratePlayerMotion(harness.state, harness.collisionRef.current);
    integrateCrewAi(harness.state, harness.collisionRef.current, harness.graph);
    const events = integrateCombat(harness.state, harness.collisionRef.current, harness.graph);
    if (options?.collectEvents) {
      allEvents.push(...events);
    }
    fixedStep(harness.state);
  }
  return allEvents;
}

export function countProjectiles(state: SimState): number {
  let n = 0;
  for (const e of state.entities.values()) {
    if (e.kind === 'projectile' && e.alive) n += 1;
  }
  return n;
}

export function fireHeldOn(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'fire', value: 1 };
}

export function fireHeldOff(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'fire', value: 0 };
}

export function reloadPress(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'reload', value: 1 };
}

export function debugDamagePress(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'debugDamage', value: 1 };
}

export function aimToward(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  tick: number,
  sequence: number,
): InputCommand {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const len = Math.hypot(dx, dz) || 1;
  return { tick, sequence, action: 'aim', value: 0, axisX: dx / len, axisZ: dz / len };
}
