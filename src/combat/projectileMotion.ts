import { FIXED_DT, PROJECTILE_SPEED_MPS } from '../config.js';

/** Per-tick projectile travel distance (m). */
export function projectileStepDistanceM(): number {
  return PROJECTILE_SPEED_MPS * FIXED_DT;
}
