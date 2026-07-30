import { SHELL_CHROME_HEX } from '../config.js';
import {
  BREACH_OPTIONS,
  BREACH_PROFILE_PORT,
  BREACH_PROFILE_STARBOARD,
} from '../mission/breachSelect.js';
import type { SimState } from '../sim/types.js';

export interface MissionShellUi {
  update(state: SimState): void;
  dispose(): void;
}

export function createMissionShellUi(host: HTMLElement): MissionShellUi {
  const overlay = document.createElement('div');
  overlay.id = 'mission-shell-ui';
  overlay.style.cssText = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:${SHELL_CHROME_HEX};color:#e0e0e0;font:16px/1.5 sans-serif;z-index:20;pointer-events:none;`;
  host.appendChild(overlay);

  return {
    update(state: SimState): void {
      const phase = state.meta.missionPhase;
      if (phase === 'BRIEFING') {
        const idx = state.meta.breachSelectIndex;
        const lines = BREACH_OPTIONS.map((opt) => {
          const sel = opt.index === idx ? '▸ ' : '  ';
          const profile =
            opt.index === 0 ? BREACH_PROFILE_PORT : BREACH_PROFILE_STARBOARD;
          return `${sel}${opt.label} — ${profile}`;
        });
        overlay.style.display = 'flex';
        overlay.innerHTML = `<div><h2 style="margin:0 0 12px;font-size:20px">Select breach</h2>${lines.map((l) => `<div>${l}</div>`).join('')}<p style="margin-top:16px;opacity:0.7">Interact to confirm</p></div>`;
        return;
      }
      if (phase === 'SCORE' && state.meta.score) {
        const s = state.meta.score;
        const timeSec = (s.missionEndTick / 60).toFixed(1);
        overlay.style.display = 'flex';
        overlay.innerHTML = `<div><h2 style="margin:0 0 12px">${s.outcome}</h2>
<div>Breach: ${s.breachRoomId}</div>
<div>Mission time: ${timeSec}s</div>
<div>Alarm: ${s.alarmTripped ? 'yes' : 'no'}${s.alarmTripTick !== null ? ` @ tick ${s.alarmTripTick}` : ''}</div>
<div>Crew neutralized: ${s.crewNeutralized}/8</div>
<p style="margin-top:16px;opacity:0.7">Interact to restart</p></div>`;
        return;
      }
      overlay.style.display = 'none';
    },
    dispose(): void {
      overlay.remove();
    },
  };
}
