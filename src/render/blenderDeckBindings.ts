import * as THREE from 'three';
import { APERTURE_SITES, DECK_GLB_ALIGN_EPSILON_M } from '../config.js';
import { listNodes } from '../deck/graph.js';
import type { DeckGraph, DeckNode } from '../deck/types.js';

export class DeckGltfContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeckGltfContractError';
  }
}

export function apertureObjectName(roomId: string, wallSegmentId: string): string {
  return `aperture:${roomId}:${wallSegmentId}`;
}

/** glTF export strips `:` from node names — map engine contract names to shipped GLB names. */
export function gltfExportNodeName(engineName: string): string {
  return engineName.replace(/:/g, '');
}

export function findDeckObject(root: THREE.Object3D, engineName: string): THREE.Object3D | undefined {
  return root.getObjectByName(engineName) ?? root.getObjectByName(gltfExportNodeName(engineName));
}

export function findDeckMesh(root: THREE.Object3D, engineName: string): THREE.Mesh | undefined {
  const obj = findDeckObject(root, engineName);
  return obj instanceof THREE.Mesh ? obj : undefined;
}

function renameIfPresent(root: THREE.Object3D, from: string, to: string): void {
  if (from === to) return;
  const obj = root.getObjectByName(from);
  if (obj) obj.name = to;
}

/** Restore engine contract names after glTF colon stripping. */
export function normalizeImportedDeckNames(root: THREE.Object3D, graph: DeckGraph): void {
  for (const node of listNodes(graph)) {
    renameIfPresent(root, gltfExportNodeName(`room:${node.id}`), `room:${node.id}`);
    renameIfPresent(root, gltfExportNodeName(`floor:${node.id}`), `floor:${node.id}`);
    renameIfPresent(root, gltfExportNodeName(`ceiling:${node.id}`), `ceiling:${node.id}`);
  }
  renameIfPresent(
    root,
    gltfExportNodeName('hull-interstitial:ceiling'),
    'hull-interstitial:ceiling',
  );
  for (const site of APERTURE_SITES) {
    const engine = apertureObjectName(site.roomId, site.wallSegmentId);
    renameIfPresent(root, gltfExportNodeName(engine), engine);
  }
}

function isExportExcludedObject(obj: THREE.Object3D): boolean {
  const n = obj.name;
  return n.startsWith('CAM_') || n.startsWith('key_') || n.startsWith('sign_');
}

export function assertBlenderDeckNodeContract(root: THREE.Object3D, graph: DeckGraph): void {
  for (const node of listNodes(graph)) {
    const ceiling = findDeckMesh(root, `ceiling:${node.id}`);
    if (!ceiling) {
      throw new DeckGltfContractError(`missing ceiling mesh ceiling:${node.id}`);
    }
  }

  const interstitial = findDeckMesh(root, 'hull-interstitial:ceiling');
  if (!interstitial) {
    throw new DeckGltfContractError('missing hull-interstitial:ceiling');
  }

  for (const site of APERTURE_SITES) {
    const name = apertureObjectName(site.roomId, site.wallSegmentId);
    if (!findDeckMesh(root, name)) {
      throw new DeckGltfContractError(`missing aperture mesh ${name}`);
    }
  }
}

function reparentPreserveWorld(child: THREE.Object3D, newParent: THREE.Object3D): void {
  child.updateMatrixWorld(true);
  newParent.updateMatrixWorld(true);
  const world = child.matrixWorld.clone();
  child.parent?.remove(child);
  newParent.add(child);
  newParent.updateMatrixWorld(true);
  const inv = newParent.matrixWorld.clone().invert();
  child.matrix.copy(inv.multiply(world));
  child.matrix.decompose(child.position, child.quaternion, child.scale);
}

export function buildRoomGroupsFromGltf(
  root: THREE.Object3D,
  graph: DeckGraph,
): Map<string, THREE.Group> {
  const map = new Map<string, THREE.Group>();

  for (const node of listNodes(graph)) {
    const roomEngineName = `room:${node.id}`;
    let group = findDeckObject(root, roomEngineName) as THREE.Group | undefined;
    if (!group) {
      group = new THREE.Group();
      group.name = roomEngineName;
      root.add(group);
    }

    const ceiling = findDeckObject(root, `ceiling:${node.id}`);
    if (ceiling) {
      if (ceiling.parent !== group) {
        reparentPreserveWorld(ceiling, group);
      }
    } else if (import.meta.env.DEV) {
      console.warn(`[deckVisual] no ceiling:${node.id} under GLB room group`);
    }

    map.set(node.id, group);
  }

  return map;
}

function footprintWorldAabb(node: DeckNode): THREE.Box3 {
  const box = new THREE.Box3();
  if (node.footprint.kind === 'rect') {
    const { x, z, w, h } = node.footprint.rect;
    box.min.set(x, -1, z);
    box.max.set(x + w, 1, z + h);
    return box;
  }
  for (const p of node.footprint.points) {
    box.expandByPoint(new THREE.Vector3(p.x, 0, p.z));
  }
  box.min.y = -1;
  box.max.y = 1;
  return box;
}

function roomPresentationAabb(root: THREE.Object3D, nodeId: string): THREE.Box3 {
  const box = new THREE.Box3();
  const floor = findDeckObject(root, `floor:${nodeId}`);
  if (floor) {
    box.setFromObject(floor);
    return box;
  }
  const floorLegacy = root.getObjectByName(`floor_${nodeId}`);
  if (floorLegacy) {
    box.setFromObject(floorLegacy);
    return box;
  }
  const ceiling = findDeckObject(root, `ceiling:${nodeId}`);
  if (ceiling) {
    box.setFromObject(ceiling);
  }
  return box;
}

function aabbDriftM(expected: THREE.Box3, actual: THREE.Box3): number {
  if (actual.isEmpty()) return Infinity;
  const dx = Math.max(
    Math.abs(actual.min.x - expected.min.x),
    Math.abs(actual.max.x - expected.max.x),
  );
  const dz = Math.max(
    Math.abs(actual.min.z - expected.min.z),
    Math.abs(actual.max.z - expected.max.z),
  );
  return Math.max(dx, dz);
}

function gltfPlanToEngineBox(box: THREE.Box3): THREE.Box3 {
  const out = box.clone();
  out.min.z = -box.max.z;
  out.max.z = -box.min.z;
  return out;
}

export function assertBlenderDeckAlignment(root: THREE.Object3D, graph: DeckGraph): void {
  root.updateMatrixWorld(true);
  let worst = 0;
  let worstId = '';

  for (const node of listNodes(graph)) {
    const expected = footprintWorldAabb(node);
    const actual = gltfPlanToEngineBox(roomPresentationAabb(root, node.id));
    const drift = aabbDriftM(expected, actual);
    if (drift > worst) {
      worst = drift;
      worstId = node.id;
    }
    if (drift > DECK_GLB_ALIGN_EPSILON_M) {
      throw new Error(
        `deck GLB alignment drift ${drift.toFixed(4)} m for room ${node.id} (max ${DECK_GLB_ALIGN_EPSILON_M})`,
      );
    }
  }

  if (worstId && worst > DECK_GLB_ALIGN_EPSILON_M) {
    throw new Error(`deck GLB alignment worst room ${worstId}: ${worst}`);
  }
}

export function countDeckMeshes(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && !isExportExcludedObject(obj)) n += 1;
  });
  return n;
}

export function resolveHullEnvelope(root: THREE.Object3D): THREE.Group {
  let hull = findDeckObject(root, 'hullEnvelope') as THREE.Group | undefined;
  if (!hull) {
    hull = new THREE.Group();
    hull.name = 'hullEnvelope';
    root.add(hull);
  }

  const interstitial = findDeckObject(root, 'hull-interstitial:ceiling');
  if (interstitial && interstitial.parent !== hull) {
    reparentPreserveWorld(interstitial, hull);
  }

  return hull;
}

/** Remove imported lights — engine owns lighting (R-BM7). */
export function stripImportedLights(root: THREE.Object3D): void {
  const toRemove: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (obj instanceof THREE.Light) toRemove.push(obj);
  });
  for (const obj of toRemove) {
    obj.parent?.remove(obj);
    if (obj instanceof THREE.Light) obj.dispose();
  }
}
