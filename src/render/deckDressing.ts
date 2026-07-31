import * as THREE from 'three';
import {
  DRESSING_PROPS_PER_ROOM_MAX,
  DRESSING_WALL_FACE_TOLERANCE_M,
  ROOM_HEIGHT_M,
} from '../config.js';
import { getNode, listNodes, wallsForRoom } from '../deck/graph.js';
import type { DeckGraph, WorldRect } from '../deck/types.js';
import { pointInNodeFootprint } from '../deck/roomQuery.js';
import type { DeckMaterialSet } from './deckMaterials.js';

const DRESSING_KINDS = ['pipe', 'conduit', 'panel', 'vent'] as const;
type DressingKind = (typeof DRESSING_KINDS)[number];

const DOOR_INSET_M = 0.3 as const;
const WALL_FACE_INSET_M = 0.35 as const;

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function distancePointToRect(x: number, z: number, rect: WorldRect): number {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cz = Math.max(rect.z, Math.min(z, rect.z + rect.h));
  const dx = x - cx;
  const dz = z - cz;
  return Math.hypot(dx, dz);
}

export function isDressingOriginAllowed(graph: DeckGraph, x: number, z: number): boolean {
  for (const node of listNodes(graph)) {
    if (!pointInNodeFootprint(node, x, z)) continue;
    const roomId = node.id;
    for (const wall of wallsForRoom(graph, roomId)) {
      if (distancePointToRect(x, z, wall.rect) <= DRESSING_WALL_FACE_TOLERANCE_M) {
        return true;
      }
    }
    return false;
  }
  return false;
}

function nearDoorOpening(
  graph: DeckGraph,
  roomId: string,
  x: number,
  z: number,
): boolean {
  for (const door of graph.doorEdges) {
    if (door.a !== roomId && door.b !== roomId) continue;
    const o = door.opening;
    const cx = o.x + o.w / 2;
    const cz = o.z + o.h / 2;
    const half = Math.max(o.w, o.h) / 2 + DOOR_INSET_M;
    if (Math.abs(x - cx) <= half && Math.abs(z - cz) <= half) return true;
  }
  return false;
}

function addProp(
  group: THREE.Group,
  kind: DressingKind,
  roomId: string,
  index: number,
  x: number,
  y: number,
  z: number,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
): void {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.name = `dressing:${kind}:${roomId}:${index}`;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);
}

type WallFace = 'north' | 'south' | 'east' | 'west';

function wallFacePosition(
  rect: WorldRect,
  face: WallFace,
  along: number,
): { x: number; z: number } {
  const { x, z, w, h } = rect;
  switch (face) {
    case 'north':
      return { x: x + w * along, z: z + WALL_FACE_INSET_M };
    case 'south':
      return { x: x + w * along, z: z + h - WALL_FACE_INSET_M };
    case 'west':
      return { x: x + WALL_FACE_INSET_M, z: z + h * along };
    case 'east':
      return { x: x + w - WALL_FACE_INSET_M, z: z + h * along };
  }
}

const WALL_FACES: WallFace[] = ['north', 'south', 'east', 'west'];

function dressRectRoom(
  group: THREE.Group,
  graph: DeckGraph,
  roomId: string,
  rect: WorldRect,
  mats: DeckMaterialSet,
  propBudget: { count: number },
): void {
  const seed = fnv1a(roomId);
  const max = Math.min(DRESSING_PROPS_PER_ROOM_MAX, 3 + (seed % 4));
  const { w, h } = rect;
  if (w <= 0.8 || h <= 0.8) return;

  for (let i = 0; i < max && propBudget.count < 500; i++) {
    const kind = DRESSING_KINDS[(seed + i * 7) % DRESSING_KINDS.length]!;
    const face = WALL_FACES[(seed + i) % WALL_FACES.length]!;
    const t = ((seed >>> (i % 16)) & 0xffff) / 0xffff;
    const along = 0.2 + t * 0.6;
    const { x: px, z: pz } = wallFacePosition(rect, face, along);
    if (nearDoorOpening(graph, roomId, px, pz)) continue;
    if (!isDressingOriginAllowed(graph, px, pz)) continue;

    const mat =
      kind === 'panel' ? mats.partitionWall.clone() : mats.hullSteel.clone();
    let geo: THREE.BufferGeometry;
    const yBase = kind === 'vent' ? ROOM_HEIGHT_M - 0.25 : 1.1;
    if (kind === 'pipe') {
      geo = new THREE.CylinderGeometry(0.06, 0.06, Math.min(w, h) * 0.5, 8);
      addProp(group, kind, roomId, i, px, yBase, pz, geo, mat);
    } else if (kind === 'conduit') {
      geo = new THREE.BoxGeometry(Math.min(w, h) * 0.35, 0.12, 0.1);
      addProp(group, kind, roomId, i, px, yBase, pz, geo, mat);
    } else if (kind === 'panel') {
      geo = new THREE.BoxGeometry(0.08, 0.9, 0.55);
      addProp(group, kind, roomId, i, px, 0.45, pz, geo, mat);
    } else {
      geo = new THREE.BoxGeometry(0.5, 0.08, 0.35);
      addProp(group, kind, roomId, i, px, yBase, pz, geo, mat);
    }
    propBudget.count += 1;
  }
}

function dressSpineRun(group: THREE.Group, graph: DeckGraph, mats: DeckMaterialSet): void {
  const spine = getNode(graph, 'main-spine');
  if (spine.footprint.kind !== 'rect') return;
  const rect = spine.footprint.rect;
  const { x: px, z: pz } = wallFacePosition(rect, 'west', 0.5);
  if (!isDressingOriginAllowed(graph, px, pz)) return;

  const mat = mats.hullSteel.clone();
  const runLen = rect.h * 0.85;
  const geo = new THREE.CylinderGeometry(0.08, 0.08, runLen, 10);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(px, 1.4, rect.z + rect.h / 2);
  mesh.name = 'dressing:pipe:main-spine:0';
  mesh.castShadow = false;
  group.add(mesh);

  const { x: px2, z: pz2 } = wallFacePosition(rect, 'east', 0.5);
  if (isDressingOriginAllowed(graph, px2, pz2)) {
    const conduitGeo = new THREE.BoxGeometry(rect.w * 0.35, 0.14, 0.12);
    const conduit = new THREE.Mesh(conduitGeo, mats.hullSteel.clone());
    conduit.position.set(px2, 2.5, rect.z + rect.h / 2);
    conduit.name = 'dressing:conduit:main-spine:1';
    conduit.castShadow = false;
    group.add(conduit);
  }
}

export function buildDeckDressing(graph: DeckGraph, mats: DeckMaterialSet): THREE.Group {
  const group = new THREE.Group();
  group.name = 'dressing';
  const propBudget = { count: 0 };

  dressSpineRun(group, graph, mats);

  for (const node of listNodes(graph)) {
    if (node.id === 'main-spine') continue;
    if (node.footprint.kind === 'rect') {
      dressRectRoom(group, graph, node.id, node.footprint.rect, mats, propBudget);
    } else if (node.footprint.points.length >= 3) {
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
      dressRectRoom(
        group,
        graph,
        node.id,
        { x: minX, z: minZ, w: maxX - minX, h: maxZ - minZ },
        mats,
        propBudget,
      );
    }
  }

  return group;
}
