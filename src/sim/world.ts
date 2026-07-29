import { EntityIdAllocator } from './entityId.js';
import type { Entity, EntityId, SimState } from './types.js';

const entityIdAllocators = new WeakMap<SimState, EntityIdAllocator>();

function attachEntityIdAllocator(state: SimState, startId: number): void {
  entityIdAllocators.set(state, new EntityIdAllocator(startId));
}

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
  const state: SimState = {
    tick: 0,
    nextEntityId: 1,
    entities: new Map(),
    meta: defaultMeta(),
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
  const cloned: SimState = {
    tick: state.tick,
    nextEntityId: state.nextEntityId,
    entities,
    meta: { ...state.meta },
  };
  attachEntityIdAllocator(cloned, cloned.nextEntityId);
  return cloned;
}
