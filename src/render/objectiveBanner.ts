import { OBJECTIVE_BANNER_TEXT } from '../config.js';
import type { SimState } from '../sim/types.js';

export interface ObjectiveBanner {
  sync(state: SimState, tick: number): void;
  dispose(): void;
}

const BANNER_TICKS = 180;

export function createObjectiveBanner(host: HTMLElement): ObjectiveBanner {
  const el = document.createElement('div');
  el.id = 'objective-banner';
  el.style.cssText =
    'position:fixed;top:18%;left:50%;transform:translateX(-50%);font:22px sans-serif;color:#69f0ae;pointer-events:none;z-index:15;opacity:0;transition:opacity 0.2s;';
  host.appendChild(el);
  el.textContent = OBJECTIVE_BANNER_TEXT;

  let issueTick: number | null = null;

  return {
    sync(state: SimState, tick: number): void {
      if (state.meta.objectiveIssued && issueTick === null) {
        issueTick = tick;
      }
      if (issueTick !== null && tick - issueTick < BANNER_TICKS && state.meta.missionPhase === 'ACTIVE') {
        el.style.opacity = '1';
      } else {
        el.style.opacity = '0';
      }
    },
    dispose(): void {
      el.remove();
    },
  };
}
