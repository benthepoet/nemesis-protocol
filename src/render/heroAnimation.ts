import * as THREE from 'three';
import {
  ANIM_RATE_MAX,
  ANIM_RATE_MIN,
  CREW_CHASE_SPEED_MPS,
  CREW_INVESTIGATE_SPEED_MPS,
  CREW_PATROL_SPEED_MPS,
  HERO_CLIP_AIM_FIRE,
  HERO_CLIP_DEATH,
  HERO_CLIP_IDLE,
  HERO_CLIP_MOVE,
  MOVE_CLIP_REF_CREW_MPS,
  MOVE_CLIP_REF_PLAYER_MPS,
  MOVE_INTENT_EPS,
  MOVE_SPEED_EPS_MPS,
  PLAYER_MOVE_SPEED_MPS,
} from '../config.js';
import type { CrewFsmState } from '../ai/types.js';

export type HeroAnimRole = 'player' | 'crew';

export interface HeroAnimInputs {
  speedMps: number;
  aimFire: boolean;
  dead: boolean;
}

export interface HeroAnimHandle {
  update(dtSec: number, inputs: HeroAnimInputs): void;
  dispose(): void;
  activeClipName(): string | null;
}

const PLAYER_REQUIRED = [HERO_CLIP_IDLE, HERO_CLIP_MOVE, HERO_CLIP_AIM_FIRE] as const;
const CREW_REQUIRED = [HERO_CLIP_IDLE, HERO_CLIP_MOVE, HERO_CLIP_AIM_FIRE, HERO_CLIP_DEATH] as const;

export function clampAnimRate(rate: number): number {
  return Math.min(ANIM_RATE_MAX, Math.max(ANIM_RATE_MIN, rate));
}

export function moveClipRate(speedMps: number, refMps: number): number {
  if (speedMps <= MOVE_SPEED_EPS_MPS) return 1;
  return clampAnimRate(speedMps / refMps);
}

export function playerPresentationSpeedMps(moveIntentX: number, moveIntentZ: number): number {
  const mag = Math.hypot(moveIntentX, moveIntentZ);
  return mag > MOVE_INTENT_EPS ? PLAYER_MOVE_SPEED_MPS : 0;
}

export function crewPresentationSpeedMps(
  fsm: CrewFsmState,
  pauseTicksRemaining: number,
): number {
  if (fsm === 'DEAD' || fsm === 'ATTACK') return 0;
  if (fsm === 'PATROL' && pauseTicksRemaining > 0) return 0;
  switch (fsm) {
    case 'PATROL':
      return CREW_PATROL_SPEED_MPS;
    case 'INVESTIGATE':
      return CREW_INVESTIGATE_SPEED_MPS;
    case 'CHASE':
      return CREW_CHASE_SPEED_MPS;
    default:
      return 0;
  }
}

export function resolveHeroClipName(
  role: HeroAnimRole,
  inputs: HeroAnimInputs,
): typeof HERO_CLIP_IDLE | typeof HERO_CLIP_MOVE | typeof HERO_CLIP_AIM_FIRE | typeof HERO_CLIP_DEATH {
  if (role === 'crew' && inputs.dead) return HERO_CLIP_DEATH;
  if (inputs.aimFire) return HERO_CLIP_AIM_FIRE;
  if (inputs.speedMps > MOVE_SPEED_EPS_MPS) return HERO_CLIP_MOVE;
  return HERO_CLIP_IDLE;
}

/** Strip root translation tracks so mixer never drives actor root XZ (G15 / R13). */
export function stripRootMotionFromClips(clips: readonly THREE.AnimationClip[]): THREE.AnimationClip[] {
  return clips.map((clip) => {
    const filtered = clip.tracks.filter((track) => {
      if (!track.name.endsWith('.position')) return true;
      const nodeName = track.name.slice(0, -'.position'.length);
      return !(
        nodeName === '' ||
        nodeName === 'root' ||
        nodeName === 'Root' ||
        nodeName === 'Armature' ||
        nodeName.toLowerCase().includes('root')
      );
    });
    if (filtered.length === clip.tracks.length) return clip;
    return new THREE.AnimationClip(clip.name, clip.duration, filtered);
  });
}

/** @deprecated use stripRootMotionFromClips — kept for tests documenting reject path. */
export function assertClipsNoRootMotion(clips: readonly THREE.AnimationClip[], assetLabel: string): void {
  for (const clip of clips) {
    for (const track of clip.tracks) {
      if (!track.name.endsWith('.position')) continue;
      const nodeName = track.name.slice(0, -'.position'.length);
      if (
        nodeName === '' ||
        nodeName === 'root' ||
        nodeName === 'Root' ||
        nodeName === 'Armature' ||
        nodeName.toLowerCase().includes('root')
      ) {
        throw new Error(
          `${assetLabel}: clip "${clip.name}" has root-motion position track "${track.name}" — export without root translation (R13).`,
        );
      }
    }
  }
}

function clipByName(clips: readonly THREE.AnimationClip[], name: string): THREE.AnimationClip {
  const found = clips.find((c) => c.name === name);
  if (!found) {
    throw new Error(`Missing required animation clip "${name}" — check rigged GLB export (R14).`);
  }
  return found;
}

export function assertRequiredHeroClips(
  clips: readonly THREE.AnimationClip[],
  role: HeroAnimRole,
  assetPath: string,
): void {
  const required = role === 'player' ? PLAYER_REQUIRED : CREW_REQUIRED;
  for (const name of required) {
    if (!clips.some((c) => c.name === name)) {
      throw new Error(`Missing required animation clip "${name}" in ${assetPath} (R14).`);
    }
  }
}

export function bindHeroAnimation(
  root: THREE.Object3D,
  clips: readonly THREE.AnimationClip[],
  role: HeroAnimRole,
): HeroAnimHandle {
  assertRequiredHeroClips(clips, role, role === 'player' ? 'p1_player_boarder.glb' : 'p1_security_crew.glb');

  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map<string, THREE.AnimationAction>();

  const bindClip = (name: string, loop: THREE.AnimationActionLoopStyles, clamp = false) => {
    const action = mixer.clipAction(clipByName(clips, name));
    action.loop = loop;
    action.clampWhenFinished = clamp;
    actions.set(name, action);
  };

  bindClip(HERO_CLIP_IDLE, THREE.LoopRepeat);
  bindClip(HERO_CLIP_MOVE, THREE.LoopRepeat);
  bindClip(HERO_CLIP_AIM_FIRE, THREE.LoopRepeat);
  if (role === 'crew') {
    bindClip(HERO_CLIP_DEATH, THREE.LoopOnce, true);
  }

  let active: THREE.AnimationAction | null = null;
  let activeName: string | null = null;
  let deathFinished = false;

  const refMps = role === 'player' ? MOVE_CLIP_REF_PLAYER_MPS : MOVE_CLIP_REF_CREW_MPS;

  const playExclusive = (name: string, rate: number) => {
    if (activeName === name && active) {
      active.timeScale = rate;
      return;
    }
    if (active) active.stop();
    const next = actions.get(name)!;
    next.reset();
    next.timeScale = rate;
    next.play();
    active = next;
    activeName = name;
  };

  return {
    activeClipName: () => activeName,
    update(dtSec: number, inputs: HeroAnimInputs) {
      if (role === 'crew' && inputs.dead) {
        if (deathFinished) {
          mixer.update(0);
          return;
        }
        const deathAction = actions.get(HERO_CLIP_DEATH)!;
        if (activeName !== HERO_CLIP_DEATH) {
          if (active) active.stop();
          deathAction.reset();
          deathAction.timeScale = 1;
          deathAction.play();
          active = deathAction;
          activeName = HERO_CLIP_DEATH;
        }
        mixer.update(dtSec);
        if (deathAction.time >= deathAction.getClip().duration - 1e-5) {
          deathFinished = true;
        }
        return;
      }

      const target = resolveHeroClipName(role, inputs);
      const rate =
        target === HERO_CLIP_MOVE ? moveClipRate(inputs.speedMps, refMps) : 1;
      playExclusive(target, rate);
      mixer.update(dtSec);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
    },
  };
}
