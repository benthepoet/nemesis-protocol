import { ALARM_BED_CROSSFADE_SEC } from '../config.js';

export interface AmbientBedLogicState {
  alarmLevel: 0 | 1;
  crossfadeElapsedSec: number;
  crossfading: boolean;
}

export function createAmbientBedLogicState(): AmbientBedLogicState {
  return { alarmLevel: 0, crossfadeElapsedSec: 0, crossfading: false };
}

export function syncAmbientBedAlarmLevel(
  state: AmbientBedLogicState,
  alarmLevel: 0 | 1,
): AmbientBedLogicState {
  if (alarmLevel === state.alarmLevel) return state;
  if (state.alarmLevel === 0 && alarmLevel === 1) {
    return { alarmLevel: 1, crossfadeElapsedSec: 0, crossfading: true };
  }
  if (alarmLevel === 0) {
    return { alarmLevel: 0, crossfadeElapsedSec: 0, crossfading: false };
  }
  return { ...state, alarmLevel };
}

export function tickAmbientBedCrossfade(
  state: AmbientBedLogicState,
  dtSec: number,
): { state: AmbientBedLogicState; calmGain: number; alertGain: number } {
  if (state.crossfading) {
    const elapsed = state.crossfadeElapsedSec + dtSec;
    const t = Math.min(1, elapsed / ALARM_BED_CROSSFADE_SEC);
    const calmGain = Math.cos(t * (Math.PI / 2));
    const alertGain = Math.sin(t * (Math.PI / 2));
    const done = t >= 1;
    return {
      state: {
        alarmLevel: state.alarmLevel,
        crossfadeElapsedSec: elapsed,
        crossfading: !done,
      },
      calmGain,
      alertGain,
    };
  }
  if (state.alarmLevel === 1) {
    return { state, calmGain: 0, alertGain: 1 };
  }
  return { state, calmGain: 1, alertGain: 0 };
}
