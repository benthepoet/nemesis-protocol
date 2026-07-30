import {
  ACTOR_MAX_HP,
  ACTOR_PROXY_RADIUS_M,
  SECURITY_CREW_KIND,
} from '../config.js';
import { circleHitsWalls } from '../deck/collision.js';
import { buildCollisionWorld } from '../deck/collision.js';
import { getNode } from '../deck/graph.js';
import type { DeckGraph } from '../deck/types.js';
import type { EntityId, SimState } from '../sim/types.js';
import { computeSpawnPoint, footprintCenter } from '../deck/spawn.js';
import { setEntityYaw, spawnEntity } from '../sim/world.js';

const STAND_IN_ROOMS = ['main-spine', 'cargo-hold', 'barracks'] as const;

export function spawnStandIns(state: SimState, graph: DeckGraph): EntityId[] {
  const world = buildCollisionWorld(graph);
  const spineCenter = footprintCenter(getNode(graph, 'main-spine'));
  const portSpawn = computeSpawnPoint(graph, 'port-airlock');
  const ids: EntityId[] = [];

  for (const roomId of STAND_IN_ROOMS) {
    const center = footprintCenter(getNode(graph, roomId));
    if (circleHitsWalls(world, center.x, center.z, ACTOR_PROXY_RADIUS_M)) {
      throw new Error(`stand-in center blocked in ${roomId}`);
    }
    let yaw: number;
    if (roomId === 'main-spine') {
      yaw = Math.atan2(portSpawn.x - center.x, portSpawn.z - center.z);
    } else {
      yaw = Math.atan2(spineCenter.x - center.x, spineCenter.z - center.z);
    }
    const id = spawnEntity(state, SECURITY_CREW_KIND, center.x, 0, center.z);
    setEntityYaw(state, id, yaw);
    const entity = state.entities.get(id)!;
    entity.hp = ACTOR_MAX_HP;
    entity.alive = true;
    ids.push(id);
  }

  state.meta.standInIds = ids;
  return ids;
}
