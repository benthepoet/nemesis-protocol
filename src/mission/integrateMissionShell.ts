import {
  AIRLOCK_ENTRY_CYCLE_TICKS,
  ALARM_LEVEL_AL1,
  SHELL_SELECT_DEADZONE,
} from '../config.js';
import { buildCollisionWorld } from '../deck/collision.js';
import type { CollisionWorld } from '../deck/collision.js';
import { roomAtPosition } from '../deck/roomQuery.js';
import type { DeckGraph, WorldRect } from '../deck/types.js';
import { spawnPlayerAtAirlock } from '../player/spawnPlayer.js';
import type { SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';
import { breachRoomIdFromIndex } from './breachSelect.js';
import { spineDoorEdgeId } from './closedDoors.js';
import { resetMission } from './createMissionWorld.js';
import type { ScoreSnapshot } from './types.js';

export interface CollisionWorldRef {
  current: CollisionWorld;
  /** Static prop obstacles from deck presentation; merged into `current` on every rebuild. */
  propOverlay?: readonly WorldRect[];
}

function propOverlayForRef(collisionRef: CollisionWorldRef): readonly WorldRect[] {
  return collisionRef.propOverlay ?? collisionRef.current.propAabbs ?? [];
}

function syncCollisionWorld(
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  options?: Parameters<typeof buildCollisionWorld>[1],
): void {
  const propAabbs = propOverlayForRef(collisionRef);
  collisionRef.current = {
    ...buildCollisionWorld(graph, options),
    propAabbs,
  };
}

export function createCollisionWorldRef(
  graph: DeckGraph,
  propOverlay: readonly WorldRect[] = [],
): CollisionWorldRef {
  const overlay = Object.freeze([...propOverlay]);
  return {
    propOverlay: overlay,
    current: { ...buildCollisionWorld(graph), propAabbs: overlay },
  };
}

function countCrewNeutralized(state: SimState): number {
  let n = 0;
  for (const id of state.meta.crewIds) {
    const e = state.entities.get(id);
    if (e && !e.alive) n += 1;
  }
  return n;
}

function buildScoreSnapshot(state: SimState, outcome: 'COMPLETE' | 'FAILED'): ScoreSnapshot {
  const breachRoomId = state.meta.breachRoomId ?? 'port-airlock';
  return {
    outcome,
    breachRoomId,
    missionEndTick: state.tick,
    alarmTripped: state.meta.alarmLevel === ALARM_LEVEL_AL1,
    alarmTripTick: state.meta.alarmTripTick,
    crewNeutralized: countCrewNeutralized(state),
  };
}

function enterScore(state: SimState, outcome: 'COMPLETE' | 'FAILED'): void {
  state.meta.score = buildScoreSnapshot(state, outcome);
  state.meta.missionPhase = 'SCORE';
}

function rebuildIfNeeded(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void {
  syncCollisionWorld(graph, collisionRef, {
    closedDoorEdgeIds: state.meta.closedDoorEdgeId ? [state.meta.closedDoorEdgeId] : undefined,
  });
}

function processBreachSelect(state: SimState): void {
  const z = state.meta.shellMoveAxisZ;
  if (z > SHELL_SELECT_DEADZONE) {
    state.meta.breachSelectIndex = 0;
  } else if (z < -SHELL_SELECT_DEADZONE) {
    state.meta.breachSelectIndex = 1;
  }
}

function interactRisingEdge(state: SimState): boolean {
  return state.meta.interactHeld && !state.meta.shellInteractPrev;
}

function enterInsertion(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void {
  const roomId = breachRoomIdFromIndex(state.meta.breachSelectIndex);
  state.meta.breachRoomId = roomId;
  spawnPlayerAtAirlock(state, graph, roomId);
  state.meta.closedDoorEdgeId = spineDoorEdgeId(roomId);
  rebuildIfNeeded(state, graph, collisionRef);
  state.meta.insertionTicksRemaining = AIRLOCK_ENTRY_CYCLE_TICKS;
  state.meta.missionPhase = 'INSERTION';
}

function tickInsertionCycle(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void {
  if (state.meta.insertionTicksRemaining <= 0) return;
  state.meta.insertionTicksRemaining -= 1;
  if (state.meta.insertionTicksRemaining === 0) {
    state.meta.closedDoorEdgeId = null;
    rebuildIfNeeded(state, graph, collisionRef);
    state.meta.objectiveIssued = true;
    state.meta.missionPhase = 'ACTIVE';
  }
}

function checkActiveEndConditions(state: SimState, graph: DeckGraph): 'FAILED' | 'COMPLETE' | null {
  const playerId = state.meta.playerId;
  if (playerId === null) return null;
  const player = getEntity(state, playerId);
  const dead = !player || !player.alive || player.hp <= 0;
  if (dead) return 'FAILED';

  if (player.alive && roomAtPosition(graph, player.x, player.z) === 'engineering') {
    state.meta.objectiveComplete = true;
    return 'COMPLETE';
  }
  return null;
}

export function integrateMissionShell(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void {
  const phase = state.meta.missionPhase;

  if (phase === 'BRIEFING') {
    processBreachSelect(state);
    if (interactRisingEdge(state)) {
      enterInsertion(state, graph, collisionRef);
    }
  } else if (phase === 'INSERTION') {
    tickInsertionCycle(state, graph, collisionRef);
  } else if (phase === 'ACTIVE') {
    const end = checkActiveEndConditions(state, graph);
    if (end === 'FAILED') {
      enterScore(state, 'FAILED');
    } else if (end === 'COMPLETE') {
      enterScore(state, 'COMPLETE');
    }
  } else if (phase === 'SCORE') {
    if (interactRisingEdge(state)) {
      resetMission(state, graph);
      syncCollisionWorld(graph, collisionRef);
    }
  }

  state.meta.shellInteractPrev = state.meta.interactHeld;
  state.meta.shellMoveAxisX = 0;
  state.meta.shellMoveAxisZ = 0;
}
