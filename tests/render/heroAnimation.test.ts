/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  HERO_CLIP_AIM_FIRE,
  HERO_CLIP_DEATH,
  HERO_CLIP_IDLE,
  HERO_CLIP_MOVE,
  MOVE_CLIP_REF_CREW_MPS,
  MOVE_CLIP_REF_PLAYER_MPS,
  PLAYER_MOVE_SPEED_MPS,
} from '../../src/config.js';
import {
  bindHeroAnimation,
  clampAnimRate,
  crewPresentationSpeedMps,
  moveClipRate,
  playerPresentationSpeedMps,
  resolveHeroClipName,
  stripRootMotionFromClips,
} from '../../src/render/heroAnimation.js';

function makeClip(name: string, duration = 1): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, [
    new THREE.NumberKeyframeTrack('.bones[0].rotation[x]', [0, duration], [0, 0.1]),
  ]);
}

describe('heroAnimation (G16, G17, M10, G15)', () => {
  it('E4: aim_fire wins over move for player', () => {
    expect(
      resolveHeroClipName('player', { speedMps: PLAYER_MOVE_SPEED_MPS, aimFire: true, dead: false }),
    ).toBe(HERO_CLIP_AIM_FIRE);
  });

  it('E5: crew ATTACK uses aim_fire at speed 0', () => {
    expect(crewPresentationSpeedMps('ATTACK', 0)).toBe(0);
    expect(
      resolveHeroClipName('crew', { speedMps: 0, aimFire: true, dead: false }),
    ).toBe(HERO_CLIP_AIM_FIRE);
  });

  it('player move rate ≈ 1.0 at 6 m/s', () => {
    expect(playerPresentationSpeedMps(1, 0)).toBe(PLAYER_MOVE_SPEED_MPS);
    expect(moveClipRate(PLAYER_MOVE_SPEED_MPS, MOVE_CLIP_REF_PLAYER_MPS)).toBeCloseTo(1, 5);
  });

  it('crew move rates vs ref 2.0 m/s', () => {
    expect(moveClipRate(2.0, MOVE_CLIP_REF_CREW_MPS)).toBeCloseTo(1, 5);
    expect(moveClipRate(3.5, MOVE_CLIP_REF_CREW_MPS)).toBeCloseTo(1.75, 5);
    expect(moveClipRate(4.5, MOVE_CLIP_REF_CREW_MPS)).toBeCloseTo(2.25, 5);
  });

  it('clamps playback rate', () => {
    expect(clampAnimRate(0.001)).toBe(0.05);
    expect(clampAnimRate(99)).toBe(3);
  });

  it('idle↔move transitions on player handle', () => {
    const root = new THREE.Group();
    const clips = [makeClip(HERO_CLIP_IDLE), makeClip(HERO_CLIP_MOVE), makeClip(HERO_CLIP_AIM_FIRE)];
    const anim = bindHeroAnimation(root, clips, 'player');
    anim.update(0.016, { speedMps: 0, aimFire: false, dead: false });
    expect(anim.activeClipName()).toBe(HERO_CLIP_IDLE);
    anim.update(0.016, { speedMps: PLAYER_MOVE_SPEED_MPS, aimFire: false, dead: false });
    expect(anim.activeClipName()).toBe(HERO_CLIP_MOVE);
    anim.dispose();
  });

  it('E6: crew death one-shot does not restart', () => {
    const root = new THREE.Group();
    const clips = [
      makeClip(HERO_CLIP_IDLE),
      makeClip(HERO_CLIP_MOVE),
      makeClip(HERO_CLIP_AIM_FIRE),
      makeClip(HERO_CLIP_DEATH, 0.05),
    ];
    const anim = bindHeroAnimation(root, clips, 'crew');
    anim.update(0.03, { speedMps: 0, aimFire: false, dead: true });
    expect(anim.activeClipName()).toBe(HERO_CLIP_DEATH);
    anim.update(0.03, { speedMps: 0, aimFire: false, dead: true });
    anim.update(0.03, { speedMps: 0, aimFire: false, dead: true });
    expect(anim.activeClipName()).toBe(HERO_CLIP_DEATH);
    anim.dispose();
  });

  it('E8: strips root.position tracks', () => {
    const raw = new THREE.AnimationClip('idle', 1, [
      new THREE.VectorKeyframeTrack('root.position', [0, 1], [0, 0, 0, 0, 1, 0]),
      new THREE.NumberKeyframeTrack('spine.rotation[x]', [0, 1], [0, 0.2]),
    ]);
    const stripped = stripRootMotionFromClips([raw])[0]!;
    expect(stripped.tracks.some((t) => t.name === 'root.position')).toBe(false);
    expect(stripped.tracks.length).toBe(1);
  });

  it('E1: missing clip throws with clip name', () => {
    const root = new THREE.Group();
    expect(() => bindHeroAnimation(root, [makeClip(HERO_CLIP_IDLE)], 'player')).toThrow(
      /Missing required animation clip "move"/,
    );
  });
});
