import { CREW_SIDEARM_SPREAD_HALF_DEG, SIM_SPREAD_SEED } from '../config.js';
import type { EntityId } from '../sim/types.js';

const HALF_RAD = (CREW_SIDEARM_SPREAD_HALF_DEG * Math.PI) / 180;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCombine(seed: number, tick: number, ownerId: number, shotIndex: number): number {
  return (
    (seed ^
      tick ^
      Math.imul(ownerId, 374761393) ^
      Math.imul(shotIndex, 668265263)) >>>
    0
  );
}

/** Deterministic signed half-angle offset in radians, magnitude ≤ 4°. */
export function sampleSpreadYawOffset(tick: number, ownerId: EntityId, shotIndex: number): number {
  const seed = hashCombine(SIM_SPREAD_SEED, tick, ownerId as number, shotIndex);
  const rnd = mulberry32(seed)();
  return (rnd * 2 - 1) * HALF_RAD;
}
