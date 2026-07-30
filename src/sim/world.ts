import { MAGAZINE_SIZE, RESERVE_AMMO_START } from '../config.js';
import { EntityIdAllocator } from './entityId.js';
import type { Entity, EntityId, SimState } from './types.js';

const entityIdAllocators = new WeakMap<SimState, EntityIdAllocator>();

function attachEntityIdAllocator(state: SimState, startId: number): void {
  entityIdAllocators.set(state, new EntityIdAllocator(startId));
}

/** Rebind allocator after wholesale entity map replacement (mission reset). */
export function syncEntityIdAllocator(state: SimState): void {
  attachEntityIdAllocator(state, state.nextEntityId);
}

function defaultMeta(): SimState['meta'] {
  return {
    interactCount: 0,
    cancelCount: 0,
    lastAction: null,
    interactHeld: false,
    cancelHeld: false,
    playerId: null,
    crewIds: [],
    alarmLevel: 0,
    lkpValid: false,
    lkpX: 0,
    lkpZ: 0,
    fireHeld: false,
    magazine: MAGAZINE_SIZE,
    reserve: RESERVE_AMMO_START,
    reloadTicksRemaining: 0,
    fireCooldownTicks: 0,
    missionPhase: 'BRIEFING',
    breachSelectIndex: 0,
    breachRoomId: null,
    insertionTicksRemaining: 0,
    closedDoorEdgeId: null,
    objectiveIssued: false,
    objectiveComplete: false,
    alarmTripTick: null,
    score: null,
    shellInteractPrev: false,
    shellMoveAxisX: 0,
    shellMoveAxisZ: 0,
  };
}

export function createWorld(): SimState {
  const state: SimState = {
    tick: 0,
    nextEntityId: 1,
    entities: new Map(),
    meta: defaultMeta(),
    projectileTraveledM: new Map(),
    crewAi: new Map(),
  };
  attachEntityIdAllocator(state, 1);
  return state;
}

export function spawnEntity(state: SimState, kind: string, x: number, y: number, z: number): EntityId {
  let allocator = entityIdAllocators.get(state);
  if (!allocator) {
    allocator = new EntityIdAllocator(state.nextEntityId);
    entityIdAllocators.set(state, allocator);
  }
  const id = allocator.allocate();
  state.nextEntityId = allocator.peekNext();
  const entity: Entity = {
    id,
    kind,
    x,
    y,
    z,
    yaw: 0,
    moveIntentX: 0,
    moveIntentZ: 0,
    alive: true,
    hp: 0,
    ownerId: null,
  };
  state.entities.set(id, entity);
  return id;
}

export function getEntity(state: SimState, id: EntityId): Entity | undefined {
  return state.entities.get(id);
}

export function setEntityPose(
  state: SimState,
  id: EntityId,
  x: number,
  y: number,
  z: number,
): void {
  const entity = state.entities.get(id);
  if (entity) {
    entity.x = x;
    entity.y = y;
    entity.z = z;
  }
}

export function setEntityYaw(state: SimState, id: EntityId, yaw: number): void {
  const entity = state.entities.get(id);
  if (entity) {
    entity.yaw = yaw;
  }
}

export function cloneSimState(state: SimState): SimState {
  const entities = new Map<EntityId, Entity>();
  for (const [id, entity] of state.entities) {
    entities.set(id, { ...entity });
  }
  const cloned: SimState = {
    tick: state.tick,
    nextEntityId: state.nextEntityId,
    entities,
    meta: {
      ...state.meta,
      crewIds: [...state.meta.crewIds],
      score: state.meta.score ? { ...state.meta.score } : null,
    },
    projectileTraveledM: new Map(state.projectileTraveledM),
    crewAi: new Map(
      [...state.crewAi.entries()].map(([id, ai]) => [id, { ...ai }]),
    ),
  };
  attachEntityIdAllocator(cloned, cloned.nextEntityId);
  return cloned;
}
