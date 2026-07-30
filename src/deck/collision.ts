import { BULKHEAD_THICKNESS_M, WALL_THICKNESS_M } from '../config.js';
import { getNode } from './graph.js';
import type { DeckGraph, WorldRect } from './types.js';

export interface CollisionWorld {
  aabbs: readonly WorldRect[];
  polyEdges: readonly { ax: number; az: number; bx: number; bz: number }[];
}

function rectsOverlap(a: WorldRect, b: WorldRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.z < b.z + b.h && a.z + a.h > b.z;
}

function openingOverlapsWall(opening: WorldRect, wall: WorldRect): boolean {
  return rectsOverlap(opening, wall);
}

function expandRect(rect: WorldRect, thickness: number): WorldRect {
  const half = thickness / 2;
  return {
    x: rect.x - half,
    z: rect.z - half,
    w: rect.w + thickness,
    h: rect.h + thickness,
  };
}

function subtractOpeningFromWall(wall: WorldRect, opening: WorldRect): WorldRect[] {
  if (!openingOverlapsWall(opening, wall)) {
    return [wall];
  }

  const result: WorldRect[] = [];
  const wallRight = wall.x + wall.w;
  const wallBottom = wall.z + wall.h;
  const openRight = opening.x + opening.w;
  const openBottom = opening.z + opening.h;

  if (opening.x > wall.x) {
    result.push({ x: wall.x, z: wall.z, w: opening.x - wall.x, h: wall.h });
  }
  if (openRight < wallRight) {
    result.push({ x: openRight, z: wall.z, w: wallRight - openRight, h: wall.h });
  }

  const clipLeft = Math.max(wall.x, opening.x);
  const clipRight = Math.min(wallRight, openRight);
  const clipW = clipRight - clipLeft;
  if (clipW > 0) {
    if (opening.z > wall.z) {
      result.push({ x: clipLeft, z: wall.z, w: clipW, h: opening.z - wall.z });
    }
    if (openBottom < wallBottom) {
      result.push({ x: clipLeft, z: openBottom, w: clipW, h: wallBottom - openBottom });
    }
  }

  return result.filter((r) => r.w > 0 && r.h > 0);
}

function getBridgePolygonPoints(graph: DeckGraph): { x: number; z: number }[] {
  const bridge = getNode(graph, 'bridge');
  if (bridge.footprint.kind !== 'polygon') {
    return [];
  }
  return bridge.footprint.points;
}

export function buildCollisionWorld(
  graph: DeckGraph,
  options?: { closedDoorEdgeIds?: readonly string[] },
): CollisionWorld {
  const closed = new Set(options?.closedDoorEdgeIds ?? []);
  const openings = graph.doorEdges
    .filter((edge) => !closed.has(edge.id))
    .map((edge) => edge.opening);
  const aabbs: WorldRect[] = [];

  for (const wall of graph.wallSegments) {
    const thickness = wall.role === 'bulkhead' ? BULKHEAD_THICKNESS_M : WALL_THICKNESS_M;
    let segments: WorldRect[] = [expandRect(wall.rect, thickness)];

    for (const opening of openings) {
      const next: WorldRect[] = [];
      for (const seg of segments) {
        next.push(...subtractOpeningFromWall(seg, opening));
      }
      segments = next;
    }

    aabbs.push(...segments);
  }

  const polyPoints = getBridgePolygonPoints(graph);
  const polyEdges: { ax: number; az: number; bx: number; bz: number }[] = [];
  for (let i = 0; i < polyPoints.length; i++) {
    const a = polyPoints[i]!;
    const b = polyPoints[(i + 1) % polyPoints.length]!;
    polyEdges.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
  }

  return { aabbs: Object.freeze(aabbs), polyEdges: Object.freeze(polyEdges) };
}

function circleIntersectsAabb(x: number, z: number, radius: number, rect: WorldRect): boolean {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestZ = Math.max(rect.z, Math.min(z, rect.z + rect.h));
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz <= radius * radius;
}

function circleIntersectsSegment(
  x: number,
  z: number,
  radius: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  halfThickness: number,
): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) {
    const distSq = (x - ax) ** 2 + (z - az) ** 2;
    return distSq <= (radius + halfThickness) ** 2;
  }
  let t = ((x - ax) * dx + (z - az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = ax + t * dx;
  const closestZ = az + t * dz;
  const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;
  return distSq <= (radius + halfThickness) ** 2;
}

export function circleHitsWalls(
  world: CollisionWorld,
  x: number,
  z: number,
  radius: number,
): boolean {
  for (const aabb of world.aabbs) {
    if (circleIntersectsAabb(x, z, radius, aabb)) {
      return true;
    }
  }
  const halfHull = WALL_THICKNESS_M / 2;
  for (const edge of world.polyEdges) {
    if (circleIntersectsSegment(x, z, radius, edge.ax, edge.az, edge.bx, edge.bz, halfHull)) {
      return true;
    }
  }
  return false;
}

export function doorPassageClear(
  graph: DeckGraph,
  world: CollisionWorld,
  doorId: string,
): boolean {
  const door = graph.doorEdges.find((d) => d.id === doorId);
  if (!door) return false;
  const cx = door.opening.x + door.opening.w / 2;
  const cz = door.opening.z + door.opening.h / 2;
  return !circleHitsWalls(world, cx, cz, 0.05);
}
