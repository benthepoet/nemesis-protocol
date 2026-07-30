import { ACTOR_PROXY_RADIUS_M, CREW_ARRIVAL_EPSILON_M, FIXED_DT } from '../config.js';
import { circleHitsWalls } from '../deck/collision.js';
import type { CollisionWorld } from '../deck/collision.js';
import { doorBetween, neighbors } from '../deck/graph.js';
import { roomAtPosition } from '../deck/roomQuery.js';
import type { DeckGraph } from '../deck/types.js';
import type { EntityId, SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';

function openingCenter(graph: DeckGraph, roomA: string, roomB: string): { x: number; z: number } | null {
  const door = doorBetween(graph, roomA, roomB);
  if (!door) return null;
  const o = door.opening;
  return { x: o.x + o.w / 2, z: o.z + o.h / 2 };
}

/** BFS on room ids via door edges; deterministic neighbor order (sorted ids). */
export function shortestRoomPath(
  graph: DeckGraph,
  fromRoom: string,
  toRoom: string,
  closedDoorEdgeIds?: ReadonlySet<string>,
): string[] {
  if (fromRoom === toRoom) return [fromRoom];
  const queue: string[][] = [[fromRoom]];
  const visited = new Set<string>([fromRoom]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1]!;
    for (const next of neighbors(graph, current, closedDoorEdgeIds)) {
      if (visited.has(next)) continue;
      const nextPath = [...path, next];
      if (next === toRoom) return nextPath;
      visited.add(next);
      queue.push(nextPath);
    }
  }
  return [fromRoom];
}

export function buildSteerPathToPoint(
  graph: DeckGraph,
  fromX: number,
  fromZ: number,
  goalX: number,
  goalZ: number,
  closedDoorEdgeIds?: ReadonlySet<string>,
): { x: number; z: number }[] {
  const fromRoom = roomAtPosition(graph, fromX, fromZ);
  const toRoom = roomAtPosition(graph, goalX, goalZ);
  if (!fromRoom || !toRoom || fromRoom === toRoom) {
    return [{ x: goalX, z: goalZ }];
  }
  const roomPath = shortestRoomPath(graph, fromRoom, toRoom, closedDoorEdgeIds);
  const points: { x: number; z: number }[] = [];
  for (let i = 0; i < roomPath.length - 1; i += 1) {
    const center = openingCenter(graph, roomPath[i]!, roomPath[i + 1]!);
    if (center) points.push(center);
  }
  points.push({ x: goalX, z: goalZ });
  return points;
}

function distSq(ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  return dx * dx + dz * dz;
}

function actorWouldOverlap(state: SimState, selfId: EntityId, nx: number, nz: number): boolean {
  const r = ACTOR_PROXY_RADIUS_M * 2;
  const rSq = r * r;
  const playerId = state.meta.playerId;
  if (playerId !== null && playerId !== selfId) {
    const p = getEntity(state, playerId);
    if (p?.alive && distSq(nx, nz, p.x, p.z) < rSq) return true;
  }
  for (const cid of state.meta.crewIds) {
    if (cid === selfId) continue;
    const c = getEntity(state, cid);
    if (c?.alive && distSq(nx, nz, c.x, c.z) < rSq) return true;
  }
  return false;
}

export function steerCrewStep(
  state: SimState,
  id: EntityId,
  collisionWorld: CollisionWorld,
  graph: DeckGraph,
  goalX: number,
  goalZ: number,
  speedMps: number,
  closedDoorEdgeIds?: ReadonlySet<string>,
): number {
  const entity = getEntity(state, id);
  if (!entity) return 0;

  const path = buildSteerPathToPoint(graph, entity.x, entity.z, goalX, goalZ, closedDoorEdgeIds);
  let targetX = goalX;
  let targetZ = goalZ;
  const epsSq = CREW_ARRIVAL_EPSILON_M * CREW_ARRIVAL_EPSILON_M;
  for (const pt of path) {
    if (distSq(entity.x, entity.z, pt.x, pt.z) > epsSq) {
      targetX = pt.x;
      targetZ = pt.z;
      break;
    }
  }

  const dx = targetX - entity.x;
  const dz = targetZ - entity.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-9) return 0;

  const dirX = dx / len;
  const dirZ = dz / len;
  const stepX = dirX * speedMps * FIXED_DT;
  const stepZ = dirZ * speedMps * FIXED_DT;

  const tryMove = (mx: number, mz: number): boolean => {
    const nx = entity.x + mx;
    const nz = entity.z + mz;
    if (circleHitsWalls(collisionWorld, nx, nz, ACTOR_PROXY_RADIUS_M)) return false;
    if (actorWouldOverlap(state, id, nx, nz)) return false;
    entity.x = nx;
    entity.z = nz;
    entity.yaw = Math.atan2(dirX, dirZ);
    return true;
  };

  const before = distSq(entity.x, entity.z, targetX, targetZ);
  if (tryMove(stepX, stepZ)) {
    return Math.sqrt(before) - Math.sqrt(distSq(entity.x, entity.z, targetX, targetZ));
  }
  if (tryMove(stepX, 0)) {
    return Math.sqrt(before) - Math.sqrt(distSq(entity.x, entity.z, targetX, targetZ));
  }
  if (tryMove(0, stepZ)) {
    return Math.sqrt(before) - Math.sqrt(distSq(entity.x, entity.z, targetX, targetZ));
  }
  return 0;
}

export function arrivedAt(x: number, z: number, gx: number, gz: number): boolean {
  return distSq(x, z, gx, gz) <= CREW_ARRIVAL_EPSILON_M * CREW_ARRIVAL_EPSILON_M;
}
