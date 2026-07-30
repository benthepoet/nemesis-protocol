import { ACTOR_MAX_HP, MAGAZINE_SIZE, PLAYER_KIND, RESERVE_AMMO_START } from '../config.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { computeInsertSpawn, computeSpawnPoint, validateSpawnPoint } from '../deck/spawn.js';
import type { DeckGraph } from '../deck/types.js';
import type { BreachRoomId } from '../mission/types.js';
import type { EntityId, SimState } from '../sim/types.js';
import { setEntityYaw, spawnEntity } from '../sim/world.js';

export function spawnPlayerAtAirlock(
  state: SimState,
  graph: DeckGraph,
  roomId: BreachRoomId,
): EntityId {
  const spawn = computeInsertSpawn(graph, roomId);
  const world = buildCollisionWorld(graph, {
    closedDoorEdgeIds: state.meta.closedDoorEdgeId ? [state.meta.closedDoorEdgeId] : undefined,
  });
  const validation = validateSpawnPoint(graph, world, spawn);
  if (!validation.ok) {
    throw new Error(`invalid player spawn: ${validation.issues.join(', ')}`);
  }

  const id = spawnEntity(state, PLAYER_KIND, spawn.x, 0, spawn.z);
  setEntityYaw(state, id, spawn.yaw);
  const entity = state.entities.get(id)!;
  entity.moveIntentX = 0;
  entity.moveIntentZ = 0;
  entity.hp = ACTOR_MAX_HP;
  state.meta.playerId = id;
  state.meta.magazine = MAGAZINE_SIZE;
  state.meta.reserve = RESERVE_AMMO_START;
  state.meta.reloadTicksRemaining = 0;
  state.meta.fireCooldownTicks = 0;
  state.meta.fireHeld = false;
  return id;
}

/** Spawns exactly one player at port-airlock spawn; sets meta.playerId. */
export function spawnPlayer(state: SimState, graph: DeckGraph): EntityId {
  const spawn = computeSpawnPoint(graph, 'port-airlock');
  const world = buildCollisionWorld(graph);
  const validation = validateSpawnPoint(graph, world, spawn);
  if (!validation.ok) {
    throw new Error(`invalid player spawn: ${validation.issues.join(', ')}`);
  }

  const id = spawnEntity(state, PLAYER_KIND, spawn.x, 0, spawn.z);
  setEntityYaw(state, id, spawn.yaw);
  const entity = state.entities.get(id)!;
  entity.moveIntentX = 0;
  entity.moveIntentZ = 0;
  entity.hp = ACTOR_MAX_HP;
  state.meta.playerId = id;
  state.meta.magazine = MAGAZINE_SIZE;
  state.meta.reserve = RESERVE_AMMO_START;
  state.meta.reloadTicksRemaining = 0;
  state.meta.fireCooldownTicks = 0;
  state.meta.fireHeld = false;
  return id;
}
