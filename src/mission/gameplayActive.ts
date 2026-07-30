import type { SimState } from '../sim/types.js';

export function isGameplayActive(state: SimState): boolean {
  return state.meta.missionPhase === 'ACTIVE';
}
