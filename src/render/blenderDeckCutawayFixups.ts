import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ROOM_HEIGHT_M } from '../config.js';
import { listNodes } from '../deck/graph.js';
import type { DeckGraph, DeckNode } from '../deck/types.js';
import { findDeckObject, gltfExportNodeName } from './blenderDeckBindings.js';

/** R-BM9 (pack v2) — head-clearance datum; geometry above this in a room footprint rides ceiling fade. */
const OVERHEAD_MIN_Y_M = 2.15;

const GLB_CUTAWAY_OCCLUDERS = new Set(['spine_haze']);

/** R-BM10 / pack v2 — drop export meshes that are not cutaway-bound and block the corridor. */
export function stripBlenderCutawayOccluders(root: THREE.Object3D): void {
  const toRemove: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (GLB_CUTAWAY_OCCLUDERS.has(obj.name)) {
      toRemove.push(obj);
      return;
    }
    if (obj.name === 'hull-interstitial:ceiling' || obj.name === gltfExportNodeName('hull-interstitial:ceiling')) {
      toRemove.push(obj);
    }
  });
  for (const obj of toRemove) {
    obj.parent?.remove(obj);
    disposeMesh(obj);
  }
}

function disposeMesh(obj: THREE.Object3D): void {
  if (!(obj instanceof THREE.Mesh)) return;
  obj.geometry?.dispose();
  const mat = obj.material;
  if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
  else mat?.dispose();
}

function footprintXZ(node: DeckNode): { minX: number; maxX: number; minZ: number; maxZ: number } {
  if (node.footprint.kind === 'rect') {
    const { x, z, w, h } = node.footprint.rect;
    return { minX: x, maxX: x + w, minZ: z, maxZ: z + h };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of node.footprint.points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  return { minX, maxX, minZ, maxZ };
}

function boxIntersectsFootprintXZ(box: THREE.Box3, fp: ReturnType<typeof footprintXZ>): boolean {
  return box.max.x >= fp.minX && box.min.x <= fp.maxX && box.max.z >= fp.minZ && box.min.z <= fp.maxZ;
}

function shouldSkipOverheadTarget(mesh: THREE.Mesh, ceiling: THREE.Mesh): boolean {
  if (mesh === ceiling) return true;
  const n = mesh.name;
  if (n.startsWith('floor:') || n.startsWith('aperture:') || n.startsWith('wall_')) return true;
  if (n.startsWith('ceiling:') || n.startsWith('ceil_')) return true;
  if (n.startsWith('door') || n.startsWith('hull-interstitial')) return true;
  if (n.startsWith('signage:')) return true;
  return false;
}

function mergeExtraIntoCeiling(ceiling: THREE.Mesh, extra: THREE.Mesh): void {
  extra.updateMatrixWorld(true);
  ceiling.updateMatrixWorld(true);
  const geoB = extra.geometry.clone();
  const rel = new THREE.Matrix4().copy(ceiling.matrixWorld).invert().multiply(extra.matrixWorld);
  geoB.applyMatrix4(rel);
  extra.parent?.remove(extra);
  const merged = mergeGeometries([ceiling.geometry, geoB], false);
  geoB.dispose();
  if (merged) {
    ceiling.geometry.dispose();
    ceiling.geometry = merged;
  }
  disposeMesh(extra);
}

/** Collapse exporter ceiling groups to a single cutaway mesh per room. */
export function flattenRoomCeilingMeshes(root: THREE.Object3D, graph: DeckGraph): void {
  for (const node of listNodes(graph)) {
    const engineName = `ceiling:${node.id}`;
    const obj = findDeckObject(root, engineName);
    if (!obj) continue;

    if (obj instanceof THREE.Mesh) {
      obj.name = engineName;
      continue;
    }

    if (!(obj instanceof THREE.Group)) continue;
    const meshes: THREE.Mesh[] = [];
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
    if (meshes.length === 0) continue;

    const merged = mergeMeshList(meshes, obj);
    merged.name = engineName;
    obj.parent?.add(merged);
    obj.parent?.remove(obj);
    for (const m of meshes) {
      if (m !== merged) disposeMesh(m);
    }
  }
}

function mergeMeshList(meshes: THREE.Mesh[], parent: THREE.Object3D): THREE.Mesh {
  if (meshes.length === 1) {
    const only = meshes[0]!;
    only.parent?.remove(only);
    return only;
  }

  parent.updateMatrixWorld(true);
  const geos: THREE.BufferGeometry[] = [];
  for (const mesh of meshes) {
    mesh.updateMatrixWorld(true);
    const geo = mesh.geometry.clone();
    const rel = new THREE.Matrix4().copy(parent.matrixWorld).invert().multiply(mesh.matrixWorld);
    geo.applyMatrix4(rel);
    geos.push(geo);
  }
  const mergedGeo = mergeGeometries(geos, false)!;
  for (const g of geos) g.dispose();
  const mat = meshes[0]!.material;
  return new THREE.Mesh(mergedGeo, mat);
}

/**
 * R-BM9 — merge overhead GLB dressing (spine lights, pipes, etc.) into each room's
 * `ceiling:<id>` so existing cutaway drives one opacity per room.
 */
export function absorbRoomOverheadIntoCeilings(root: THREE.Object3D, graph: DeckGraph): void {
  root.updateMatrixWorld(true);

  for (const node of listNodes(graph)) {
    const ceiling = findDeckObject(root, `ceiling:${node.id}`);
    if (!(ceiling instanceof THREE.Mesh)) continue;

    const fp = footprintXZ(node);
    const victims: THREE.Mesh[] = [];

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (shouldSkipOverheadTarget(obj, ceiling)) return;

      const box = new THREE.Box3().setFromObject(obj);
      if (box.min.y < OVERHEAD_MIN_Y_M) return;
      if (box.max.y > ROOM_HEIGHT_M + 0.35) return;
      if (!boxIntersectsFootprintXZ(box, fp)) return;
      victims.push(obj);
    });

    for (const extra of victims) {
      mergeExtraIntoCeiling(ceiling, extra);
    }
  }
}
