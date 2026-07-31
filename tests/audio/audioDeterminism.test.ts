/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { hashSimState } from '../../src/sim/hash.js';
import { cloneSimState } from '../../src/sim/world.js';
import { pushCombatEventsToAudio } from '../../src/audio/combatCues.js';
import { updateFootsteps, createFootstepAudioState } from '../../src/audio/footsteps.js';
import { detectShellAudioCues, snapshotShellAudio } from '../../src/audio/shellCues.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';

describe('audio determinism (G7)', () => {
  it('presentation audio helpers do not mutate sim hash', async () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    runMissionTicks(state, graph, collisionRef, 30);
    const before = await hashSimState(state);
    const noop = () => {};
    pushCombatEventsToAudio(
      [{ type: 'muzzle', x: 0, y: 0, z: 0, yaw: 0, ownerKind: 'player' }],
      state.meta.missionPhase,
      { rifle: 0, sidearm: 0, wall: 0, actor: 0 },
      noop,
    );
    updateFootsteps(createFootstepAudioState(), 0.016, {
      missionPhase: state.meta.missionPhase,
      alive: true,
      x: 1,
      z: 2,
    }, noop);
    detectShellAudioCues(null, snapshotShellAudio(state.meta), noop);
    expect(await hashSimState(state)).toBe(before);
    expect(await hashSimState(cloneSimState(state))).toBe(before);
  });
});
