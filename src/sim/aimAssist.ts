import {
  AIM_ASSIST_HALF_ANGLE_RAD,
  AIM_ASSIST_MAGNETISM,
  AIM_ASSIST_RANGE_M,
  SECURITY_CREW_KIND,
} from '../config.js';
import { hasLineOfSight } from '../ai/perception.js';
import type { CollisionWorld } from '../deck/collision.js';
import type { EntityId, SimState } from './types.js';
import { getEntity } from './world.js';

/** Normalize to (-π, π]. */
export function normalizeAngle(rad: number): number {
  let a = rad;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

export function selectAimAssistTarget(
  state: SimState,
  collisionWorld: CollisionWorld,
  originX: number,
  originZ: number,
  rawYaw: number,
): EntityId | null {
  let bestId: EntityId | null = null;
  let bestOffset = Infinity;
  let bestDist = Infinity;

  for (const id of state.meta.crewIds) {
    const crew = getEntity(state, id);
    if (!crew || !crew.alive || crew.kind !== SECURITY_CREW_KIND) continue;

    const dx = crew.x - originX;
    const dz = crew.z - originZ;
    const d = Math.hypot(dx, dz);
    if (d === 0 || d > AIM_ASSIST_RANGE_M) continue;

    const angleTo = Math.atan2(dx, dz);
    const offset = Math.abs(normalizeAngle(angleTo - rawYaw));
    if (offset > AIM_ASSIST_HALF_ANGLE_RAD) continue;

    if (!hasLineOfSight(collisionWorld, originX, originZ, crew.x, crew.z)) continue;

    const better =
      bestId === null ||
      offset < bestOffset ||
      (offset === bestOffset && d < bestDist) ||
      (offset === bestOffset && d === bestDist && id < bestId);
    if (better) {
      bestId = id;
      bestOffset = offset;
      bestDist = d;
    }
  }

  return bestId;
}

export function assistedYawFromStick(
  state: SimState,
  collisionWorld: CollisionWorld,
  originX: number,
  originZ: number,
  currentYaw: number,
  axisX: number,
  axisZ: number,
): number {
  const rawYaw = Math.atan2(axisX, axisZ);
  const targetId = selectAimAssistTarget(state, collisionWorld, originX, originZ, rawYaw);
  if (targetId === null) {
    return rawYaw;
  }
  const target = getEntity(state, targetId)!;
  const targetYaw = Math.atan2(target.x - originX, target.z - originZ);
  return normalizeAngle(
    currentYaw + AIM_ASSIST_MAGNETISM * normalizeAngle(targetYaw - currentYaw),
  );
}
