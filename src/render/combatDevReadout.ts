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
    'position:fixed;left:8px;bottom:8px;font:12px/1.4 monospace;color:#e0e0e0;pointer-events:none;z-index:10;';
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
      el.textContent = `HP ${hp} | mag ${state.meta.magazine} | res ${state.meta.reserve}${reloading ? ' | RELOAD' : ''} | ${alarm} | ${lkp} | ${crewStates}`;
    },
    dispose(): void {
      el.remove();
    },
  };
}
