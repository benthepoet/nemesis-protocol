import { ACTOR_PROXY_RADIUS_M, FIXED_DT, PLAYER_MOVE_SPEED_MPS } from '../config.js';
import { circleHitsWalls } from '../deck/collision.js';
import type { CollisionWorld } from '../deck/collision.js';
import type { SimState } from './types.js';
import { getEntity } from './world.js';

export function integratePlayerMotion(state: SimState, world: CollisionWorld): void {
  const playerId = state.meta.playerId;
  if (playerId === null) return;
  const entity = getEntity(state, playerId);
  if (!entity || !entity.alive) return;

  const ix = entity.moveIntentX;
  const iz = entity.moveIntentZ;
  const mag = Math.hypot(ix, iz);
  if (mag <= 0) return;

  const dirX = ix / mag;
  const dirZ = iz / mag;
  const stepX = dirX * PLAYER_MOVE_SPEED_MPS * FIXED_DT;
  const stepZ = dirZ * PLAYER_MOVE_SPEED_MPS * FIXED_DT;

  const tryMove = (dx: number, dz: number): boolean => {
    const nx = entity.x + dx;
    const nz = entity.z + dz;
    if (!circleHitsWalls(world, nx, nz, ACTOR_PROXY_RADIUS_M)) {
      entity.x = nx;
      entity.z = nz;
      return true;
    }
    return false;
  };

  if (tryMove(stepX, stepZ)) return;
  if (tryMove(stepX, 0)) return;
  tryMove(0, stepZ);
}
