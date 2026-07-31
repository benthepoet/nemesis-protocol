import * as THREE from 'three';
import {
  ACCENT_HEX,
  SIGNAGE_PLANE_HEIGHT_M,
  SIGNAGE_PLANE_WIDTH_M,
} from '../config.js';
import { listNodes } from '../deck/graph.js';
import type { AccentId, DeckGraph, DeckNode } from '../deck/types.js';
import type { DeckMaterialSet } from './deckMaterials.js';

function addSectionSign(
  group: THREE.Group,
  nodeId: string,
  accentId: AccentId,
  cx: number,
  cz: number,
  width: number,
  mats: DeckMaterialSet,
): void {
  if (accentId === 'corridor') return;
  const bandIndex = Object.keys(ACCENT_HEX).indexOf(accentId);
  const vOffset = Math.max(0, bandIndex) / 12;
  const mat = new THREE.MeshBasicMaterial({
    map: mats.signageAtlas,
    transparent: true,
    depthWrite: false,
  });
  if (mat.map) {
    mat.map.offset.set(0, vOffset);
    mat.map.repeat.set(1, 1 / 12);
  }
  const planeW = Math.min(SIGNAGE_PLANE_WIDTH_M, width * 0.35);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, SIGNAGE_PLANE_HEIGHT_M),
    mat,
  );
  plane.position.set(cx, 1.6, cz);
  plane.rotation.y = Math.PI;
  plane.name = `signage:${nodeId}`;
  plane.castShadow = false;
  plane.receiveShadow = false;
  group.add(plane);
}

function signagePlacement(
  node: DeckNode,
): { cx: number; cz: number; width: number } | null {
  if (node.footprint.kind === 'rect') {
    const { x, z, w } = node.footprint.rect;
    return { cx: x + w * 0.5, cz: z + 0.15, width: w };
  }
  const points = node.footprint.points;
  if (points.length < 3) return null;
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cz = points.reduce((s, p) => s + p.z, 0) / points.length;
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  return { cx, cz: cz - 0.2, width: maxX - minX };
}

/** Engine atlas signage — R-BM3. Attach into each non-corridor room group. */
export function attachEngineSignage(
  roomGroups: ReadonlyMap<string, THREE.Group>,
  graph: DeckGraph,
  mats: DeckMaterialSet,
): void {
  for (const node of listNodes(graph)) {
    const group = roomGroups.get(node.id);
    if (!group) continue;
    const place = signagePlacement(node);
    if (!place) continue;
    addSectionSign(group, node.id, node.accentId, place.cx, place.cz, place.width, mats);
  }
}
