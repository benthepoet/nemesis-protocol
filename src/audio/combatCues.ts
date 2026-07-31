import type { CombatEvent } from '../combat/types.js';
import { PLAYER_KIND, SECURITY_CREW_KIND } from '../config.js';
import {
  IMPACT_ACTOR_CUES,
  IMPACT_WALL_CUES,
  RIFLE_FIRE_CUES,
  SIDEARM_FIRE_CUES,
  type ShippedCueId,
} from './cueIds.js';
import type { PlaySpatialCue } from './types.js';

export interface CombatCueCounters {
  rifle: number;
  sidearm: number;
  wall: number;
  actor: number;
}

export function createCombatCueCounters(): CombatCueCounters {
  return { rifle: 0, sidearm: 0, wall: 0, actor: 0 };
}

function pickCue(list: readonly ShippedCueId[], index: number): ShippedCueId {
  return list[index % list.length]!;
}

export function pushCombatEventsToAudio(
  events: readonly CombatEvent[],
  missionPhase: string,
  counters: CombatCueCounters,
  play: PlaySpatialCue,
): CombatCueCounters {
  if (missionPhase !== 'ACTIVE') return counters;
  const next = { ...counters };
  for (const ev of events) {
    if (ev.type === 'hit-flash') continue;
    if (ev.type === 'muzzle') {
      if (ev.ownerKind === SECURITY_CREW_KIND) {
        const cueId = pickCue(SIDEARM_FIRE_CUES, next.sidearm);
        next.sidearm += 1;
        play({ cueId, x: ev.x, y: ev.y, z: ev.z, spatial: true });
      } else if (ev.ownerKind === PLAYER_KIND) {
        const cueId = pickCue(RIFLE_FIRE_CUES, next.rifle);
        next.rifle += 1;
        play({ cueId, x: ev.x, y: ev.y, z: ev.z, spatial: true });
      }
      continue;
    }
    if (ev.type === 'impact-wall') {
      const cueId = pickCue(IMPACT_WALL_CUES, next.wall);
      next.wall += 1;
      play({ cueId, x: ev.x, y: ev.y, z: ev.z, spatial: true });
      continue;
    }
    if (ev.type === 'impact-actor') {
      const cueId = pickCue(IMPACT_ACTOR_CUES, next.actor);
      next.actor += 1;
      play({ cueId, x: ev.x, y: ev.y, z: ev.z, spatial: true });
    }
  }
  return next;
}
