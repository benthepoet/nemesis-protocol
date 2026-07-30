import { SHELL_CHROME_HEX, UI_FOCUS_HEX } from '../config.js';
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
  overlay.style.cssText = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:${SHELL_CHROME_HEX};color:#e6edf3;font:16px/1.5 "IBM Plex Sans", "Segoe UI", "Helvetica Neue", sans-serif;z-index:20;pointer-events:none;letter-spacing:0.02em;`;
  host.appendChild(overlay);

  const renderBriefing = (idx: number): void => {
    overlay.replaceChildren();
    const wrap = document.createElement('div');
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0 0 12px;font-size:20px';
    title.textContent = 'Select breach';
    wrap.appendChild(title);

    for (const opt of BREACH_OPTIONS) {
      const row = document.createElement('div');
      const focused = opt.index === idx;
      if (focused) {
        row.style.color = UI_FOCUS_HEX;
        row.dataset.focused = 'true';
      }
      const profile = opt.index === 0 ? BREACH_PROFILE_PORT : BREACH_PROFILE_STARBOARD;
      row.textContent = `${focused ? '▸ ' : '  '}${opt.label} — ${profile}`;
      wrap.appendChild(row);
    }

    const hint = document.createElement('p');
    hint.style.cssText = 'margin-top:16px;opacity:0.7';
    hint.textContent = 'Interact to confirm';
    wrap.appendChild(hint);
    overlay.appendChild(wrap);
  };

  const renderScore = (state: SimState): void => {
    const s = state.meta.score!;
    overlay.replaceChildren();
    const wrap = document.createElement('div');
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0 0 12px';
    title.textContent = s.outcome;
    wrap.appendChild(title);

    const breach = document.createElement('div');
    breach.textContent = `Breach: ${s.breachRoomId}`;
    wrap.appendChild(breach);

    const timeSec = (s.missionEndTick / 60).toFixed(1);
    const timeLine = document.createElement('div');
    timeLine.textContent = `Mission time: ${timeSec}s`;
    wrap.appendChild(timeLine);

    const alarmLine = document.createElement('div');
    alarmLine.textContent = `Alarm: ${s.alarmTripped ? 'yes' : 'no'}${s.alarmTripTick !== null ? ` @ tick ${s.alarmTripTick}` : ''}`;
    wrap.appendChild(alarmLine);

    const crewLine = document.createElement('div');
    crewLine.textContent = `Crew neutralized: ${s.crewNeutralized}/8`;
    wrap.appendChild(crewLine);

    const restart = document.createElement('p');
    restart.style.cssText = 'margin-top:16px';
    restart.style.color = UI_FOCUS_HEX;
    restart.dataset.focused = 'true';
    restart.textContent = 'Interact to restart';
    wrap.appendChild(restart);

    overlay.appendChild(wrap);
  };

  return {
    update(state: SimState): void {
      const phase = state.meta.missionPhase;
      if (phase === 'BRIEFING') {
        overlay.style.display = 'flex';
        renderBriefing(state.meta.breachSelectIndex);
        return;
      }
      if (phase === 'SCORE' && state.meta.score) {
        overlay.style.display = 'flex';
        renderScore(state);
        return;
      }
      overlay.style.display = 'none';
    },
    dispose(): void {
      overlay.remove();
    },
  };
}
