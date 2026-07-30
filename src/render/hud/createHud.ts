import {
  HOSTILE_COLOR_HEX,
  PLAYER_COLOR_HEX,
  SHELL_CHROME_HEX,
} from '../../config.js';
import type { SimState } from '../../sim/types.js';
import { buildHudView } from './buildHudView.js';
import type { MissionHud } from './types.js';

const ALARM_DIM_HEX = '#8b949e';
const PANEL_STYLE = `background:${SHELL_CHROME_HEX}cc;padding:8px 12px;border-radius:4px;`;

export function createHud(host: HTMLElement): MissionHud {
  const root = document.createElement('div');
  root.id = 'mission-hud';
  root.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:12;font:14px/1.4 sans-serif;color:#e0e0e0;';

  const style = document.createElement('style');
  style.textContent = `@keyframes hud-low-hp-pulse {
  0%, 100% { color: ${HOSTILE_COLOR_HEX}; opacity: 1; }
  50% { color: ${HOSTILE_COLOR_HEX}; opacity: 0.55; }
}`;
  host.appendChild(style);

  const healthPanel = document.createElement('div');
  healthPanel.style.cssText = `position:absolute;left:12px;bottom:12px;${PANEL_STYLE}`;
  const healthEl = document.createElement('div');
  healthEl.dataset.readout = 'health';
  healthPanel.appendChild(healthEl);

  const ammoPanel = document.createElement('div');
  ammoPanel.style.cssText = `position:absolute;left:12px;bottom:52px;${PANEL_STYLE}`;
  const ammoEl = document.createElement('div');
  ammoEl.dataset.readout = 'ammo';
  const reloadEl = document.createElement('div');
  reloadEl.dataset.readout = 'reload';
  reloadEl.style.fontSize = '12px';
  reloadEl.style.marginTop = '4px';
  ammoPanel.appendChild(ammoEl);
  ammoPanel.appendChild(reloadEl);

  const objectivePanel = document.createElement('div');
  objectivePanel.style.cssText = `position:absolute;left:12px;top:12px;${PANEL_STYLE}`;
  const objectiveEl = document.createElement('div');
  objectiveEl.dataset.readout = 'objective';
  objectivePanel.appendChild(objectiveEl);

  const alarmPanel = document.createElement('div');
  alarmPanel.style.cssText = `position:absolute;right:12px;top:12px;${PANEL_STYLE}text-align:right;`;
  const alarmEl = document.createElement('div');
  alarmEl.dataset.readout = 'alarm';
  alarmPanel.appendChild(alarmEl);

  const clockPanel = document.createElement('div');
  clockPanel.style.cssText = `position:absolute;right:12px;top:52px;${PANEL_STYLE}text-align:right;`;
  const clockEl = document.createElement('div');
  clockEl.dataset.readout = 'clock';
  clockPanel.appendChild(clockEl);

  root.append(healthPanel, ammoPanel, objectivePanel, alarmPanel, clockPanel);
  host.appendChild(root);

  return {
    update(state: SimState): void {
      const view = buildHudView(state);
      if (!view) {
        root.style.display = 'none';
        return;
      }
      root.style.display = 'block';

      healthEl.textContent = `HP ${view.health.hp}`;
      healthEl.style.color = view.health.lowHealth ? HOSTILE_COLOR_HEX : PLAYER_COLOR_HEX;
      healthEl.style.animation = view.health.lowHealth ? 'hud-low-hp-pulse 1s ease-in-out infinite' : 'none';

      ammoEl.textContent = `${view.ammo.magazine} / ${view.ammo.reserve}`;
      ammoEl.style.color = PLAYER_COLOR_HEX;
      if (view.ammo.reloading) {
        reloadEl.style.display = 'block';
        reloadEl.textContent = `RELOADING ${view.ammo.reloadProgress.toFixed(2)}`;
        reloadEl.style.color = PLAYER_COLOR_HEX;
      } else {
        reloadEl.style.display = 'none';
        reloadEl.textContent = '';
      }

      objectiveEl.textContent = view.objective.text;
      objectiveEl.style.color = PLAYER_COLOR_HEX;

      alarmEl.textContent = view.alarm.label;
      if (view.alarm.hazardous) {
        alarmEl.style.color = HOSTILE_COLOR_HEX;
        alarmEl.style.opacity = '1';
      } else {
        alarmEl.style.color = ALARM_DIM_HEX;
        alarmEl.style.opacity = '0.85';
      }

      clockEl.textContent = view.clock.text;
      clockEl.style.color = PLAYER_COLOR_HEX;
    },
    dispose(): void {
      root.remove();
      style.remove();
    },
  };
}
