import {
  FOOTSTEP_SILENCE_SPEED_MPS,
  FOOTSTEP_STRIDE_M,
} from '../config.js';
import { FOOTSTEP_CUES, type ShippedCueId } from './cueIds.js';
import type { PlaySpatialCue } from './types.js';

export interface FootstepAudioState {
  lastX: number;
  lastZ: number;
  strideAccum: number;
  variant: number;
  hasSample: boolean;
}

export function createFootstepAudioState(): FootstepAudioState {
  return { lastX: 0, lastZ: 0, strideAccum: 0, variant: 0, hasSample: false };
}

function pickFootstep(variant: number): ShippedCueId {
  return FOOTSTEP_CUES[variant % FOOTSTEP_CUES.length]!;
}

export function updateFootsteps(
  state: FootstepAudioState,
  dtSec: number,
  opts: { missionPhase: string; alive: boolean; x: number; z: number },
  play: PlaySpatialCue,
): FootstepAudioState {
  if (opts.missionPhase !== 'ACTIVE' || !opts.alive) {
    return { ...state, strideAccum: 0, hasSample: false };
  }
  if (!state.hasSample) {
    return {
      ...state,
      lastX: opts.x,
      lastZ: opts.z,
      hasSample: true,
      strideAccum: 0,
    };
  }
  const dx = opts.x - state.lastX;
  const dz = opts.z - state.lastZ;
  const dist = Math.hypot(dx, dz);
  const speed = dist / Math.max(dtSec, 1e-6);
  let accum = state.strideAccum;
  let variant = state.variant;
  if (speed < FOOTSTEP_SILENCE_SPEED_MPS) {
    accum = 0;
  } else {
    accum += dist;
    while (accum >= FOOTSTEP_STRIDE_M) {
      accum -= FOOTSTEP_STRIDE_M;
      const cueId = pickFootstep(variant);
      variant += 1;
      play({ cueId, x: opts.x, y: 0, z: opts.z, spatial: true });
    }
  }
  return {
    lastX: opts.x,
    lastZ: opts.z,
    strideAccum: accum,
    variant,
    hasSample: true,
  };
}
