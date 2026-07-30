import type { SimState } from '../sim/types.js';

export interface CombatDevReadout {
  update(state: SimState): void;
  dispose(): void;
}

export function createCombatDevReadout(host: HTMLElement): CombatDevReadout | null {
  if (!import.meta.env.DEV) return null;

  const el = document.createElement('div');
  el.id = 'combat-dev-readout';
  el.style.cssText =
    'position:fixed;top:8px;left:50%;transform:translateX(-50%);font:11px/1.3 monospace;color:#888;pointer-events:none;z-index:10;white-space:pre;text-align:center;';
  host.appendChild(el);

  return {
    update(state: SimState): void {
      const playerId = state.meta.playerId;
      const player = playerId !== null ? state.entities.get(playerId) : undefined;
      const hp = player?.hp ?? 0;
      const reloading = state.meta.reloadTicksRemaining > 0;
      const alarm = `AL${state.meta.alarmLevel}`;
      const lkp = state.meta.lkpValid
        ? `LKP ${state.meta.lkpX.toFixed(1)},${state.meta.lkpZ.toFixed(1)}`
        : 'LKP —';
      const crewStates = state.meta.crewIds
        .map((id) => {
          const ai = state.crewAi.get(id);
          return `${id}:${ai?.fsm ?? '?'}`;
        })
        .join(' ');
      el.textContent = `[DEV] phase ${state.meta.missionPhase} | HP ${hp} | mag ${state.meta.magazine} | res ${state.meta.reserve}${reloading ? ' | RELOAD' : ''} | ${alarm} | ${lkp} | ${crewStates}`;
    },
    dispose(): void {
      el.remove();
    },
  };
}
