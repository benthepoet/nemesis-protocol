import type { BreachOption, BreachRoomId } from './types.js';

export const BREACH_OPTIONS: readonly BreachOption[] = [
  {
    index: 0,
    roomId: 'port-airlock',
    label: 'Port',
  },
  {
    index: 1,
    roomId: 'stbd-airlock',
    label: 'Starboard',
  },
] as const;

/** Render-only profile copy (design pack §3 Phase 0). */
export const BREACH_PROFILE_PORT =
  'loot-rich route, heavier patrol density' as const;
export const BREACH_PROFILE_STARBOARD =
  'softer initial resistance, fewer resources' as const;

export function breachRoomIdFromIndex(index: 0 | 1): BreachRoomId {
  return BREACH_OPTIONS[index]!.roomId;
}

export function profileTextForIndex(index: 0 | 1): string {
  return index === 0 ? BREACH_PROFILE_PORT : BREACH_PROFILE_STARBOARD;
}
