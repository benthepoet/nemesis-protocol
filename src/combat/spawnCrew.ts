import {
  ACTOR_MAX_HP,
  ACTOR_PROXY_RADIUS_M,
  CREW_POPULATION,
  M_PER_PX,
  SECURITY_CREW_KIND,
  SPAWN_CLEARANCE_M,
} from '../config.js';
import { buildCollisionWorld, circleHitsWalls } from '../deck/collision.js';
import { doorBetween } from '../deck/graph.js';
import type { DeckGraph } from '../deck/types.js';
import { createInitialCrewAi } from '../ai/integrateCrewAi.js';
import type { EntityId, SimState } from '../sim/types.js';
import { setEntityYaw, spawnEntity } from '../sim/world.js';

function doorCenterYaw(graph: DeckGraph, homeRoomId: string, sx: number, sz: number): number {
  let door;
  if (homeRoomId === 'cic') {
    door = doorBetween(graph, 'cic', 'fore-connector');
  } else {
    door = doorBetween(graph, homeRoomId, 'main-spine');
  }
  if (!door) return 0;
  const o = door.opening;
  const cx = o.x + o.w / 2;
  const cz = o.z + o.h / 2;
  return Math.atan2(cx - sx, cz - sz);
}

function spawnClearanceOk(
  world: ReturnType<typeof buildCollisionWorld>,
  x: number,
  z: number,
): boolean {
  const r = ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M;
  return !circleHitsWalls(world, x, z, r);
}

function postsOverlap(ax: number, az: number, bx: number, bz: number): boolean {
  const minDist = 2 * (ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M);
  return Math.hypot(ax - bx, az - bz) < minDist;
}

export function spawnCrew(state: SimState, graph: DeckGraph): EntityId[] {
  const table = graph.crewSpawnTable;
  if (table.length !== CREW_POPULATION) {
    throw new Error(`crewSpawnTable must have ${CREW_POPULATION} posts, got ${table.length}`);
  }

  const world = buildCollisionWorld(graph);
  const spawnPositions: { x: number; z: number }[] = [];
  const ids: EntityId[] = [];

  for (const post of table) {
    const { x, z, yawRad } = post.spawn;
    let yaw = yawRad;
    if (post.role === 'posted') {
      yaw = doorCenterYaw(graph, post.homeRoomId, x, z);
    }
    if (!spawnClearanceOk(world, x, z)) {
      throw new Error(`crew spawn blocked for post ${post.id}`);
    }
    for (const prev of spawnPositions) {
      if (postsOverlap(x, z, prev.x, prev.z)) {
        throw new Error(`crew spawn overlap for post ${post.id}`);
      }
    }
    spawnPositions.push({ x, z });

    const id = spawnEntity(state, SECURITY_CREW_KIND, x, 0, z);
    setEntityYaw(state, id, yaw);
    const entity = state.entities.get(id)!;
    entity.hp = ACTOR_MAX_HP;
    entity.alive = true;
    state.crewAi.set(id, createInitialCrewAi(post.id));
    ids.push(id);
  }

  state.meta.crewIds = ids;
  return ids;
}

/** Binding world coords for regression tests (E1). */
export const BINDING_CREW_SPAWN_WORLD = {
  cargo: { x: 497 * M_PER_PX, z: 335 * M_PER_PX },
  barracks: { x: 527 * M_PER_PX, z: 465 * M_PER_PX },
  spineMid: { x: 570 * M_PER_PX, z: 400 * M_PER_PX },
} as const;
