import type * as THREE from 'three';
import { roomAtPosition } from '../deck/roomQuery.js';
import type { DeckGraph } from '../deck/types.js';

export interface CutawayState {
  lastRoomId: string | null;
}

function findCeilingMesh(group: THREE.Group, roomId: string): THREE.Object3D | undefined {
  return group.getObjectByName(`ceiling:${roomId}`);
}

export function updateCeilingCutaway(
  roomGroups: ReadonlyMap<string, THREE.Group>,
  graph: DeckGraph,
  x: number,
  z: number,
  state: CutawayState,
): void {
  const roomId = roomAtPosition(graph, x, z);
  if (roomId !== null) {
    state.lastRoomId = roomId;
  }

  const activeId = state.lastRoomId;
  for (const [id, group] of roomGroups) {
    const ceiling = findCeilingMesh(group, id);
    if (ceiling) {
      ceiling.visible = id !== activeId;
    }
  }
}
