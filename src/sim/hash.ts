import type { CrewAiState } from '../ai/types.js';
import type { Entity } from './types.js';
import type { SimState } from './types.js';

function serializeEntity(entity: Entity): Record<string, unknown> {
  return {
    alive: entity.alive,
    hp: entity.hp,
    id: entity.id,
    kind: entity.kind,
    moveIntentX: entity.moveIntentX,
    moveIntentZ: entity.moveIntentZ,
    ownerId: entity.ownerId,
    x: entity.x,
    y: entity.y,
    yaw: entity.yaw,
    z: entity.z,
  };
}

function serializeCrewAi(ai: CrewAiState): Record<string, unknown> {
  return {
    fsm: ai.fsm,
    waypointIndex: ai.waypointIndex,
    pauseTicksRemaining: ai.pauseTicksRemaining,
    losTicks: ai.losTicks,
    investigateTicksRemaining: ai.investigateTicksRemaining,
    windupTicksRemaining: ai.windupTicksRemaining,
    fireCooldownTicks: ai.fireCooldownTicks,
    shotIndex: ai.shotIndex,
    postId: ai.postId,
  };
}

function buildHashPayload(state: SimState): string {
  const entities = [...state.entities.values()]
    .sort((a, b) => a.id - b.id)
    .map(serializeEntity);

  const crewAi = [...state.crewAi.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, ai]) => ({ id, ...serializeCrewAi(ai) }));

  const payload = {
    crewAi,
    entities,
    meta: {
      alarmLevel: state.meta.alarmLevel,
      alarmTripTick: state.meta.alarmTripTick,
      breachRoomId: state.meta.breachRoomId,
      breachSelectIndex: state.meta.breachSelectIndex,
      cancelCount: state.meta.cancelCount,
      cancelHeld: state.meta.cancelHeld,
      closedDoorEdgeId: state.meta.closedDoorEdgeId,
      crewIds: state.meta.crewIds,
      fireCooldownTicks: state.meta.fireCooldownTicks,
      fireHeld: state.meta.fireHeld,
      insertionTicksRemaining: state.meta.insertionTicksRemaining,
      interactCount: state.meta.interactCount,
      interactHeld: state.meta.interactHeld,
      lastAction: state.meta.lastAction,
      lkpValid: state.meta.lkpValid,
      lkpX: state.meta.lkpX,
      lkpZ: state.meta.lkpZ,
      magazine: state.meta.magazine,
      missionPhase: state.meta.missionPhase,
      objectiveComplete: state.meta.objectiveComplete,
      objectiveIssued: state.meta.objectiveIssued,
      playerId: state.meta.playerId,
      reloadTicksRemaining: state.meta.reloadTicksRemaining,
      reserve: state.meta.reserve,
      score: state.meta.score
        ? {
            alarmTripTick: state.meta.score.alarmTripTick,
            alarmTripped: state.meta.score.alarmTripped,
            breachRoomId: state.meta.score.breachRoomId,
            crewNeutralized: state.meta.score.crewNeutralized,
            missionEndTick: state.meta.score.missionEndTick,
            outcome: state.meta.score.outcome,
          }
        : null,
      shellInteractPrev: state.meta.shellInteractPrev,
      shellMoveAxisX: state.meta.shellMoveAxisX,
      shellMoveAxisZ: state.meta.shellMoveAxisZ,
    },
    nextEntityId: state.nextEntityId,
    tick: state.tick,
  };

  return JSON.stringify(payload);
}

async function sha256Hex(data: string): Promise<string> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto subtle digest unavailable');
  }
  const encoded = new TextEncoder().encode(data);
  const digest = await cryptoObj.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashSimState(state: SimState): Promise<string> {
  return sha256Hex(buildHashPayload(state));
}

export { buildHashPayload as buildHashPayloadForTests };
