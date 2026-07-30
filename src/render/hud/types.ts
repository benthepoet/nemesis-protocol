import type { SimState } from '../../sim/types.js';

export interface AlarmLabelEntry {
  level: number;
  name: string;
}

export interface HudView {
  health: { hp: number; lowHealth: boolean };
  ammo: {
    magazine: number;
    reserve: number;
    reloading: boolean;
    /** 0..1 when reloading; 0 when not. */
    reloadProgress: number;
  };
  objective: { text: string };
  alarm: {
    level: 0 | 1;
    numeral: string;
    name: string;
    label: string;
    hazardous: boolean;
  };
  clock: { ticks: number; text: string };
}

export interface MissionHud {
  update(state: SimState): void;
  dispose(): void;
}
