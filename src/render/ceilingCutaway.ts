import * as THREE from 'three';
import {
  CEILING_FADE_ALPHA,
  CEILING_FADE_LERP_PER_SEC,
  ROOM_HEIGHT_M,
} from '../config.js';
import { getNode, listAdjacentRooms } from '../deck/graph.js';
import { roomAtPosition } from '../deck/roomQuery.js';
import type { DeckGraph, DeckNode } from '../deck/types.js';

export interface CutawayState {
  lastRoomId: string | null;
  opacityByRoom: Map<string, number>;
  interstitialOpacity: number;
}

function findCeilingMesh(group: THREE.Group, roomId: string): THREE.Mesh | undefined {
  const obj = group.getObjectByName(`ceiling:${roomId}`);
  return obj instanceof THREE.Mesh ? obj : undefined;
}

function roomFootprintAabb(node: DeckNode): THREE.Box3 {
  if (node.footprint.kind === 'rect') {
    const { x, z, w, h } = node.footprint.rect;
    return new THREE.Box3(
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(x + w, ROOM_HEIGHT_M, z + h),
    );
  }
  const pts = node.footprint.points;
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minZ = Math.min(minZ, p.z);
    maxX = Math.max(maxX, p.x);
    maxZ = Math.max(maxZ, p.z);
  }
  return new THREE.Box3(
    new THREE.Vector3(minX, 0, minZ),
    new THREE.Vector3(maxX, ROOM_HEIGHT_M, maxZ),
  );
}

function roomIntersectsFrustum(graph: DeckGraph, roomId: string, frustum: THREE.Frustum): boolean {
  const node = getNode(graph, roomId);
  return frustum.intersectsBox(roomFootprintAabb(node));
}

function applyCeilingOpacity(mesh: THREE.Mesh, opacity: number): void {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const raw of materials) {
    if (!(raw instanceof THREE.MeshStandardMaterial)) continue;
    raw.transparent = true;
    raw.opacity = opacity;
    raw.depthWrite = opacity > 0.99;
    raw.needsUpdate = true;
  }
  mesh.visible = opacity > 0.01;
}

function applyObjectOpacity(obj: THREE.Object3D, opacity: number): void {
  if (obj instanceof THREE.Mesh) {
    applyCeilingOpacity(obj, opacity);
  }
}

function lerpOpacity(current: number, target: number, dtSec: number): number {
  const t = Math.min(1, CEILING_FADE_LERP_PER_SEC * dtSec);
  return current + (target - current) * t;
}

export function updateCeilingCutaway(
  roomGroups: ReadonlyMap<string, THREE.Group>,
  graph: DeckGraph,
  x: number,
  z: number,
  state: CutawayState,
  camera: THREE.Camera,
  dtSec: number,
  interstitialCeiling?: THREE.Object3D | null,
): void {
  const roomId = roomAtPosition(graph, x, z);
  if (roomId !== null) {
    state.lastRoomId = roomId;
  }

  const activeId = state.lastRoomId;
  const adjacent = activeId !== null ? new Set(listAdjacentRooms(graph, activeId)) : new Set<string>();

  const projScreenMatrix = new THREE.Matrix4();
  camera.updateMatrixWorld();
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  const frustum = new THREE.Frustum();
  frustum.setFromProjectionMatrix(projScreenMatrix);

  for (const [id, group] of roomGroups) {
    const ceiling = findCeilingMesh(group, id);
    if (!ceiling) continue;

    let target = 1;
    if (activeId !== null) {
      if (id === activeId) {
        target = 0;
      } else if (adjacent.has(id)) {
        target = CEILING_FADE_ALPHA;
      } else if (roomIntersectsFrustum(graph, id, frustum)) {
        target = CEILING_FADE_ALPHA;
      }
    }

    const prev = state.opacityByRoom.get(id) ?? 1;
    const next = lerpOpacity(prev, target, dtSec);
    state.opacityByRoom.set(id, next);
    applyCeilingOpacity(ceiling, next);
  }

  let interTarget = 1;
  if (activeId !== null) {
    interTarget = CEILING_FADE_ALPHA;
  }
  state.interstitialOpacity = lerpOpacity(state.interstitialOpacity, interTarget, dtSec);
  if (interstitialCeiling) {
    applyObjectOpacity(interstitialCeiling, state.interstitialOpacity);
  }
}

/** Initialize cutaway render state (boot / tests). */
export function createCutawayState(): CutawayState {
  return {
    lastRoomId: null,
    opacityByRoom: new Map(),
    interstitialOpacity: 1,
  };
}

/** Room ids for tests — sorted node ids with ceiling meshes. */
export function listCeilingRoomIds(roomGroups: ReadonlyMap<string, THREE.Group>): string[] {
  const ids: string[] = [];
  for (const id of roomGroups.keys()) {
    if (roomGroups.get(id)!.getObjectByName(`ceiling:${id}`)) ids.push(id);
  }
  return ids.sort();
}

export function getCeilingOpacity(mesh: THREE.Mesh): number {
  const mat = mesh.material;
  if (mat instanceof THREE.MeshStandardMaterial) return mat.opacity;
  return 1;
}

export { roomFootprintAabb, roomIntersectsFrustum };
