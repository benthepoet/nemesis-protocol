import { PLAYER_KIND } from '../config.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { computeSpawnPoint, validateSpawnPoint } from '../deck/spawn.js';
import type { DeckGraph } from '../deck/types.js';
import type { EntityId, SimState } from '../sim/types.js';
import { setEntityYaw, spawnEntity } from '../sim/world.js';

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
  state.meta.playerId = id;
  return id;
}
