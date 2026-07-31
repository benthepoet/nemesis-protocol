import * as THREE from 'three';
import {
  APERTURE_SITES,
  HULL_ENVELOPE_PAD_M,
  HULL_ENVELOPE_SHELL_THICKNESS_M,
  ROOM_HEIGHT_M,
} from '../config.js';
import { listNodes, listWallSegments } from '../deck/graph.js';
import type { DeckGraph, WorldRect, WorldVec2 } from '../deck/types.js';
import type { DeckMaterialSet } from './deckMaterials.js';

/** Interstitial floor sits slightly below room floors (y=0.05) to reduce z-fight (spec E4). */
const INTERSTITIAL_FLOOR_Y = -0.01 as const;

export interface ApertureFaceUserData {
  apertureReserved: true;
  apertureClass: 'C';
  siteId: string;
  roomId: string;
  wallSegmentId: string;
  aperturePhase: 'reserved';
}

export function computeDeckBounds(graph: DeckGraph): WorldRect {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;

  for (const node of listNodes(graph)) {
    if (node.footprint.kind === 'rect') {
      const { x, z, w, h } = node.footprint.rect;
      minX = Math.min(minX, x);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x + w);
      maxZ = Math.max(maxZ, z + h);
    } else {
      for (const p of node.footprint.points) {
        minX = Math.min(minX, p.x);
        minZ = Math.min(minZ, p.z);
        maxX = Math.max(maxX, p.x);
        maxZ = Math.max(maxZ, p.z);
      }
    }
  }

  const pad = HULL_ENVELOPE_PAD_M;
  return {
    x: minX - pad,
    z: minZ - pad,
    w: maxX - minX + pad * 2,
    h: maxZ - minZ + pad * 2,
  };
}

export function buildRoomFootprintPolygons(graph: DeckGraph): { roomId: string; points: WorldVec2[] }[] {
  const result: { roomId: string; points: WorldVec2[] }[] = [];
  for (const node of listNodes(graph)) {
    if (node.footprint.kind === 'rect') {
      const { x, z, w, h } = node.footprint.rect;
      result.push({
        roomId: node.id,
        points: [
          { x, z },
          { x: x + w, z },
          { x: x + w, z: z + h },
          { x, z: z + h },
        ],
      });
    } else {
      const points = node.footprint.points;
      if (points.length < 3) {
        if (import.meta.env.DEV) {
          console.warn(`[deckHullGeometry] skip degenerate footprint: ${node.id}`);
        }
        continue;
      }
      result.push({ roomId: node.id, points: [...points] });
    }
  }
  return result;
}

export function buildInterstitialShape(bounds: WorldRect, roomPolys: { points: WorldVec2[] }[]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(bounds.x, bounds.z);
  shape.lineTo(bounds.x + bounds.w, bounds.z);
  shape.lineTo(bounds.x + bounds.w, bounds.z + bounds.h);
  shape.lineTo(bounds.x, bounds.z + bounds.h);
  shape.closePath();

  for (const poly of roomPolys) {
    if (poly.points.length < 3) continue;
    const hole = new THREE.Path();
    hole.moveTo(poly.points[0]!.x, poly.points[0]!.z);
    for (let i = 1; i < poly.points.length; i++) {
      hole.lineTo(poly.points[i]!.x, poly.points[i]!.z);
    }
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

function addShellBox(
  group: THREE.Group,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  name: string,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
  mesh.name = name;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  group.add(mesh);
}

function deckBoundsCenter(bounds: WorldRect): { x: number; z: number } {
  return { x: bounds.x + bounds.w / 2, z: bounds.z + bounds.h / 2 };
}

function outwardNormalForWall(
  wallRect: WorldRect,
  bounds: WorldRect,
): { nx: number; nz: number; outward: 'north' | 'south' | 'east' | 'west' } {
  const center = deckBoundsCenter(bounds);
  const wx = wallRect.x + wallRect.w / 2;
  const wz = wallRect.z + wallRect.h / 2;
  const isHorizontal = wallRect.w >= wallRect.h;
  if (isHorizontal) {
    return wz < center.z
      ? { nx: 0, nz: -1, outward: 'north' }
      : { nx: 0, nz: 1, outward: 'south' };
  }
  return wx < center.x
    ? { nx: -1, nz: 0, outward: 'west' }
    : { nx: 1, nz: 0, outward: 'east' };
}

function buildApertureFaces(
  group: THREE.Group,
  graph: DeckGraph,
  bounds: WorldRect,
  mat: THREE.MeshStandardMaterial,
): void {
  const wallById = new Map(listWallSegments(graph).map((w) => [w.id, w]));
  const thickness = HULL_ENVELOPE_SHELL_THICKNESS_M;
  const faceDepth = 0.05;

  for (const site of APERTURE_SITES) {
    const wall = wallById.get(site.wallSegmentId);
    if (!wall) {
      throw new Error(`APERTURE_SITES wall missing: ${site.wallSegmentId}`);
    }
    const { rect } = wall;
    const { nx, nz } = outwardNormalForWall(rect, bounds);
    const hullMat = mat.clone();
    let x = rect.x;
    let z = rect.z;
    let w = rect.w;
    let d = rect.h;
    if (rect.w >= rect.h) {
      w = rect.w;
      d = faceDepth;
      x = rect.x;
      z = rect.z + (nz < 0 ? -faceDepth : rect.h);
    } else {
      w = faceDepth;
      d = rect.h;
      x = rect.x + (nx < 0 ? -faceDepth : rect.w);
      z = rect.z;
    }
    if (nx !== 0) {
      x += nx * (thickness * 0.5);
    }
    if (nz !== 0) {
      z += nz * (thickness * 0.5);
    }

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, ROOM_HEIGHT_M, d), hullMat);
    mesh.position.set(x + w / 2, ROOM_HEIGHT_M / 2, z + d / 2);
    mesh.name = `hull-envelope:aperture:${site.siteId}`;
    const userData: ApertureFaceUserData = {
      apertureReserved: true,
      apertureClass: 'C',
      siteId: site.siteId,
      roomId: site.roomId,
      wallSegmentId: site.wallSegmentId,
      aperturePhase: 'reserved',
    };
    mesh.userData = userData;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
  }
}

export function buildHullEnvelope(graph: DeckGraph, mats: DeckMaterialSet): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hull-envelope';

  const bounds = computeDeckBounds(graph);
  const roomPolys = buildRoomFootprintPolygons(graph);
  const shape = buildInterstitialShape(bounds, roomPolys);

  const floorGeo = new THREE.ShapeGeometry(shape);
  const floorMat = mats.floor.clone();
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = INTERSTITIAL_FLOOR_Y;
  floor.name = 'hull-interstitial:floor';
  floor.receiveShadow = true;
  group.add(floor);

  const ceilingGeo = floorGeo.clone();
  const ceilingMat = mats.ceiling.clone();
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = ROOM_HEIGHT_M;
  ceiling.name = 'hull-interstitial:ceiling';
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const shellMat = mats.hullWall.clone();
  const t = HULL_ENVELOPE_SHELL_THICKNESS_M;
  const { x, z, w, h } = bounds;

  addShellBox(group, x, 0, z - t, w, ROOM_HEIGHT_M, t, shellMat.clone(), 'hull-envelope:shell:north');
  addShellBox(group, x, 0, z + h, w, ROOM_HEIGHT_M, t, shellMat.clone(), 'hull-envelope:shell:south');
  addShellBox(group, x - t, 0, z, t, ROOM_HEIGHT_M, h, shellMat.clone(), 'hull-envelope:shell:west');
  addShellBox(group, x + w, 0, z, t, ROOM_HEIGHT_M, h, shellMat.clone(), 'hull-envelope:shell:east');

  buildApertureFaces(group, graph, bounds, mats.hullWall);

  return group;
}
