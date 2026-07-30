import {
  HUD_LOW_HEALTH_HP,
  OBJECTIVE_BANNER_TEXT,
  RELOAD_DURATION_TICKS,
} from '../../config.js';
import type { SimState } from '../../sim/types.js';
import { getEntity } from '../../sim/world.js';
import { ALARM_LEVEL_LABELS } from './alarmLabels.js';
import { formatMissionClock } from './formatMissionClock.js';
import type { HudView } from './types.js';

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function buildHudView(state: SimState): HudView | null {
  const phase = state.meta.missionPhase;
  if (phase !== 'INSERTION' && phase !== 'ACTIVE') {
    return null;
  }

  const playerId = state.meta.playerId;
  const hp = playerId !== null ? (getEntity(state, playerId)?.hp ?? 0) : 0;
  const reloading = state.meta.reloadTicksRemaining > 0;
  const reloadProgress = reloading
    ? clamp01(1 - state.meta.reloadTicksRemaining / RELOAD_DURATION_TICKS)
    : 0;

  const level = state.meta.alarmLevel;
  const name = ALARM_LEVEL_LABELS[level] ?? 'UNKNOWN';
  const numeral = `AL${level}`;

  return {
    health: { hp, lowHealth: hp <= HUD_LOW_HEALTH_HP },
    ammo: {
      magazine: state.meta.magazine,
      reserve: state.meta.reserve,
      reloading,
      reloadProgress,
    },
    objective: {
      text: state.meta.objectiveIssued ? OBJECTIVE_BANNER_TEXT : '',
    },
    alarm: {
      level,
      numeral,
      name,
      label: `${numeral} ${name}`,
      hazardous: level >= 1,
    },
    clock: {
      ticks: state.tick,
      text: formatMissionClock(state.tick),
    },
  };
}
