import { describe, expect, it } from 'vitest';
import {
  FOOTSTEP_RATE_AT_CAP_HZ,
  FOOTSTEP_STRIDE_M,
  PLAYER_MOVE_SPEED_MPS,
} from '../../src/config.js';
import {
  createFootstepAudioState,
  updateFootsteps,
} from '../../src/audio/footsteps.js';

describe('footsteps (G1, R1)', () => {
  it('plays ~2.2 steps in 1s at 6 m/s', () => {
    const plays: string[] = [];
    const play = (req: { cueId: string }) => plays.push(req.cueId);
    let state = createFootstepAudioState();
    const dt = 1 / 60;
    const steps = 60;
    let x = 0;
    for (let i = 0; i < steps; i++) {
      x += (PLAYER_MOVE_SPEED_MPS * dt);
      state = updateFootsteps(
        state,
        dt,
        { missionPhase: 'ACTIVE', alive: true, x, z: 0 },
        play,
      );
    }
    expect(plays.length).toBeGreaterThanOrEqual(FOOTSTEP_RATE_AT_CAP_HZ - 0.25);
    expect(plays.length).toBeLessThanOrEqual(FOOTSTEP_RATE_AT_CAP_HZ + 0.15);
  });

  it('half speed → ~half cadence', () => {
    const full: string[] = [];
    const half: string[] = [];
    const playFull = (req: { cueId: string }) => full.push(req.cueId);
    const playHalf = (req: { cueId: string }) => half.push(req.cueId);
    const dt = 1 / 60;
    const steps = 60;
    let sFull = createFootstepAudioState();
    let sHalf = createFootstepAudioState();
    let xFull = 0;
    let xHalf = 0;
    for (let i = 0; i < steps; i++) {
      xFull += PLAYER_MOVE_SPEED_MPS * dt;
      xHalf += (PLAYER_MOVE_SPEED_MPS * 0.5) * dt;
      sFull = updateFootsteps(sFull, dt, { missionPhase: 'ACTIVE', alive: true, x: xFull, z: 0 }, playFull);
      sHalf = updateFootsteps(sHalf, dt, { missionPhase: 'ACTIVE', alive: true, x: xHalf, z: 0 }, playHalf);
    }
    expect(half.length).toBeGreaterThan(0);
    expect(half.length).toBeLessThan(full.length);
    expect(full.length / half.length).toBeGreaterThan(1.4);
  });

  it('silences when slow, dead, or non-ACTIVE', () => {
    const plays: string[] = [];
    const play = (req: { cueId: string }) => plays.push(req.cueId);
    let state = createFootstepAudioState();
    state = updateFootsteps(state, 1, { missionPhase: 'BRIEFING', alive: true, x: 10, z: 0 }, play);
    state = updateFootsteps(state, 1, { missionPhase: 'ACTIVE', alive: false, x: 20, z: 0 }, play);
    state = updateFootsteps(state, 1, { missionPhase: 'INSERTION', alive: true, x: 30, z: 0 }, play);
    expect(plays).toHaveLength(0);
    state = updateFootsteps(state, 0.1, { missionPhase: 'ACTIVE', alive: true, x: 30, z: 0 }, play);
    state = updateFootsteps(state, 0.1, { missionPhase: 'ACTIVE', alive: true, x: 30.01, z: 0 }, play);
    expect(plays).toHaveLength(0);
  });

  it('stride constant matches config', () => {
    expect(FOOTSTEP_STRIDE_M).toBeCloseTo(PLAYER_MOVE_SPEED_MPS / FOOTSTEP_RATE_AT_CAP_HZ, 5);
  });
});
