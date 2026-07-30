import { ALARM_LEVEL_AL1 } from '../config.js';
import type { SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';

export type AlarmTripReason = 'player-shot' | 'detection' | 'crew-damage';

export function refreshLkpFromPlayer(state: SimState): void {
  const playerId = state.meta.playerId;
  if (playerId === null) return;
  const player = getEntity(state, playerId);
  if (!player?.alive) return;
  state.meta.lkpValid = true;
  state.meta.lkpX = player.x;
  state.meta.lkpZ = player.z;
}

/** AL0→AL1 once; sets LKP from living player; no-op if already AL1. */
export function tripAlarm(state: SimState, _reason: AlarmTripReason): void {
  if (state.meta.alarmLevel >= ALARM_LEVEL_AL1) return;
  state.meta.alarmLevel = ALARM_LEVEL_AL1;
  state.meta.alarmTripTick = state.tick;
  refreshLkpFromPlayer(state);
}
