import {
  CREW_SIGHT_HALF_ANGLE_RAD,
  CREW_SIGHT_RANGE_M,
} from '../config.js';
import type { CollisionWorld } from '../deck/collision.js';
import { earliestWallHit } from '../combat/projectileCollision.js';
import type { Entity } from '../sim/types.js';

function normalizeAngle(rad: number): number {
  let a = rad;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/** True if segment crew→player has no wall hit before the player endpoint. */
export function hasLineOfSight(
  collisionWorld: CollisionWorld,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): boolean {
  const wallHit = earliestWallHit(fromX, fromZ, toX, toZ, collisionWorld);
  if (!wallHit) return true;
  return wallHit.t >= 1 - 1e-6;
}

/** Angle between facing yaw and vector to target ≤ half cone; range ≤ CREW_SIGHT_RANGE_M. */
export function canSeePlayer(
  crew: Entity,
  player: Entity,
  collisionWorld: CollisionWorld,
): boolean {
  const dx = player.x - crew.x;
  const dz = player.z - crew.z;
  const dist = Math.hypot(dx, dz);
  if (dist > CREW_SIGHT_RANGE_M) return false;
  const angleTo = Math.atan2(dx, dz);
  const diff = Math.abs(normalizeAngle(angleTo - crew.yaw));
  if (diff > CREW_SIGHT_HALF_ANGLE_RAD) return false;
  return hasLineOfSight(collisionWorld, crew.x, crew.z, player.x, player.z);
}
