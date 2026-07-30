import { spawnCrew } from '../combat/spawnCrew.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { spawnDeckEntities } from '../deck/spawnDeckEntities.js';
import type { DeckGraph } from '../deck/types.js';
import type { SimState } from '../sim/types.js';
import { createWorld, syncEntityIdAllocator } from '../sim/world.js';

function applyBriefingMeta(state: SimState): void {
  state.meta.missionPhase = 'BRIEFING';
  state.meta.breachSelectIndex = 0;
  state.meta.breachRoomId = null;
  state.meta.insertionTicksRemaining = 0;
  state.meta.closedDoorEdgeId = null;
  state.meta.objectiveIssued = false;
  state.meta.objectiveComplete = false;
  state.meta.alarmTripTick = null;
  state.meta.score = null;
  state.meta.shellInteractPrev = false;
  state.meta.shellMoveAxisX = 0;
  state.meta.shellMoveAxisZ = 0;
  state.meta.playerId = null;
  state.meta.alarmLevel = 0;
  state.meta.lkpValid = false;
  state.meta.lkpX = 0;
  state.meta.lkpZ = 0;
  state.meta.interactCount = 0;
  state.meta.cancelCount = 0;
  state.meta.interactHeld = false;
  state.meta.cancelHeld = false;
  state.meta.lastAction = null;
  state.meta.fireHeld = false;
  state.meta.crewIds = [];
}

export function createMissionWorld(graph: DeckGraph): SimState {
  const state = createWorld();
  applyBriefingMeta(state);
  spawnDeckEntities(state, graph);
  spawnCrew(state, graph);
  return state;
}

export function resetMission(state: SimState, graph: DeckGraph): void {
  const fresh = createMissionWorld(graph);
  state.tick = fresh.tick;
  state.nextEntityId = fresh.nextEntityId;
  state.entities = fresh.entities;
  state.meta = { ...fresh.meta, crewIds: [...fresh.meta.crewIds] };
  state.projectileTraveledM = fresh.projectileTraveledM;
  state.crewAi = fresh.crewAi;
  syncEntityIdAllocator(state);
}

export function rebuildMissionCollision(
  graph: DeckGraph,
  closedDoorEdgeId: string | null,
): ReturnType<typeof buildCollisionWorld> {
  return buildCollisionWorld(graph, {
    closedDoorEdgeIds: closedDoorEdgeId ? [closedDoorEdgeId] : undefined,
  });
}
