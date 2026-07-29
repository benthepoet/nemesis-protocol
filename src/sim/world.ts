import type { Entity, EntityId, SimState } from './types.js';

function defaultMeta(): SimState['meta'] {
  return {
    interactCount: 0,
    cancelCount: 0,
    lastAction: null,
    interactHeld: false,
    cancelHeld: false,
  };
}

export function createWorld(): SimState {
  return {
    tick: 0,
    nextEntityId: 1,
    entities: new Map(),
    meta: defaultMeta(),
  };
}

export function spawnEntity(state: SimState, kind: string, x: number, y: number, z: number): EntityId {
  const id = state.nextEntityId as EntityId;
  state.nextEntityId += 1;
  const entity: Entity = { id, kind, x, y, z, alive: true };
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

export function cloneSimState(state: SimState): SimState {
  const entities = new Map<EntityId, Entity>();
  for (const [id, entity] of state.entities) {
    entities.set(id, { ...entity });
  }
  return {
    tick: state.tick,
    nextEntityId: state.nextEntityId,
    entities,
    meta: { ...state.meta },
  };
}
