import { WALL_THICKNESS_M } from '../config.js';
import type { CollisionWorld } from '../deck/collision.js';
import type { WorldRect } from '../deck/types.js';
import type { Entity, EntityId } from '../sim/types.js';
import type { SimState } from '../sim/types.js';
import { ACTOR_PROXY_RADIUS_M, PLAYER_KIND, SECURITY_CREW_KIND } from '../config.js';

export interface SegmentHit {
  t: number;
  x: number;
  z: number;
  kind: 'wall' | 'actor';
  targetId?: EntityId;
}

export interface WallHit {
  t: number;
  x: number;
  z: number;
}

function segmentAabbHit(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  rect: WorldRect,
): number | null {
  const dx = bx - ax;
  const dz = bz - az;
  let tMin = 0;
  let tMax = 1;

  const planes = [
    { p: -dx, q: ax - rect.x },
    { p: dx, q: rect.x + rect.w - ax },
    { p: -dz, q: az - rect.z },
    { p: dz, q: rect.z + rect.h - az },
  ];

  for (const { p, q } of planes) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      tMin = Math.max(tMin, t);
    } else {
      tMax = Math.min(tMax, t);
    }
    if (tMin > tMax) return null;
  }

  if (tMin >= 0 && tMin <= 1) return tMin;
  return null;
}

function segmentSegmentHitT(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  dx: number,
  dz: number,
  halfThickness: number,
): number | null {
  const segDx = bx - ax;
  const segDz = bz - az;
  const lenSq = segDx * segDx + segDz * segDz;
  if (lenSq === 0) return null;

  const edgeDx = dx - cx;
  const edgeDz = dz - cz;
  const edgeLenSq = edgeDx * edgeDx + edgeDz * edgeDz;
  if (edgeLenSq === 0) return null;

  let best: number | null = null;
  const steps = 8;
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const px = ax + segDx * u;
    const pz = az + segDz * u;
    let tEdge = ((px - cx) * edgeDx + (pz - cz) * edgeDz) / edgeLenSq;
    tEdge = Math.max(0, Math.min(1, tEdge));
    const closestX = cx + tEdge * edgeDx;
    const closestZ = cz + tEdge * edgeDz;
    const distSq = (px - closestX) ** 2 + (pz - closestZ) ** 2;
    if (distSq <= halfThickness * halfThickness) {
      if (best === null || u < best) best = u;
    }
  }
  return best;
}

function segmentCircleHitT(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  radius: number,
): number | null {
  const dx = bx - ax;
  const dz = bz - az;
  const fx = ax - cx;
  const fz = az - cz;
  const a = dx * dx + dz * dz;
  if (a < 1e-12) return null;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - radius * radius;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sqrt = Math.sqrt(disc);
  const t1 = (-b - sqrt) / (2 * a);
  const t2 = (-b + sqrt) / (2 * a);
  let best: number | null = null;
  for (const t of [t1, t2]) {
    if (t >= 0 && t <= 1 && (best === null || t < best)) best = t;
  }
  return best;
}

function isActorTargetForOwner(state: SimState, ownerId: EntityId, entity: Entity): boolean {
  if (!entity.alive) return false;
  const owner = state.entities.get(ownerId);
  if (!owner) return false;
  if (owner.kind === PLAYER_KIND) {
    return entity.kind === SECURITY_CREW_KIND;
  }
  if (owner.kind === SECURITY_CREW_KIND) {
    return entity.kind === PLAYER_KIND;
  }
  return false;
}

/**
 * First wall obstruction along segment (AABB + polyEdges + prop AABBs).
 * Actors ignored. Read-only vs CollisionWorld.
 */
export function earliestWallHit(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  world: CollisionWorld,
): WallHit | null {
  let best: WallHit | null = null;

  for (const aabb of world.aabbs) {
    const t = segmentAabbHit(ax, az, bx, bz, aabb);
    if (t !== null && (best === null || t < best.t)) {
      best = {
        t,
        x: ax + (bx - ax) * t,
        z: az + (bz - az) * t,
      };
    }
  }

  for (const aabb of world.propAabbs ?? []) {
    const t = segmentAabbHit(ax, az, bx, bz, aabb);
    if (t !== null && (best === null || t < best.t)) {
      best = {
        t,
        x: ax + (bx - ax) * t,
        z: az + (bz - az) * t,
      };
    }
  }

  const halfHull = WALL_THICKNESS_M / 2;
  for (const edge of world.polyEdges) {
    const t = segmentSegmentHitT(ax, az, bx, bz, edge.ax, edge.az, edge.bx, edge.bz, halfHull);
    if (t !== null && (best === null || t < best.t)) {
      best = {
        t,
        x: ax + (bx - ax) * t,
        z: az + (bz - az) * t,
      };
    }
  }

  return best;
}

export function earliestSegmentHit(
  state: SimState,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  ownerId: EntityId,
  world: CollisionWorld,
): SegmentHit | null {
  let best: SegmentHit | null = null;

  const wallHit = earliestWallHit(ax, az, bx, bz, world);
  if (wallHit) {
    best = {
      t: wallHit.t,
      x: wallHit.x,
      z: wallHit.z,
      kind: 'wall',
    };
  }

  for (const entity of state.entities.values()) {
    if (entity.id === ownerId) continue;
    if (!isActorTargetForOwner(state, ownerId, entity)) continue;
    const t = segmentCircleHitT(ax, az, bx, bz, entity.x, entity.z, ACTOR_PROXY_RADIUS_M);
    if (t !== null && (best === null || t < best.t)) {
      best = {
        t,
        x: ax + (bx - ax) * t,
        z: az + (bz - az) * t,
        kind: 'actor',
        targetId: entity.id,
      };
    }
  }

  return best;
}
