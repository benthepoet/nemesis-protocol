import type { BreachRoomId } from './types.js';

const SPINE_DOOR_BY_ROOM: Record<BreachRoomId, string> = {
  'port-airlock': 'door-spine-port-airlock',
  'stbd-airlock': 'door-spine-stbd-airlock',
};

export function spineDoorEdgeId(roomId: BreachRoomId): string {
  return SPINE_DOOR_BY_ROOM[roomId];
}

export function closedDoorEdgeIdSet(closedDoorEdgeId: string | null): ReadonlySet<string> | undefined {
  if (closedDoorEdgeId === null) return undefined;
  return new Set([closedDoorEdgeId]);
}
