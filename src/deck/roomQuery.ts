import { listNodes } from './graph.js';
import type { DeckGraph, DeckNode } from './types.js';

function pointInRect(x: number, z: number, rect: { x: number; z: number; w: number; h: number }): boolean {
  return x >= rect.x && x <= rect.x + rect.w && z >= rect.z && z <= rect.z + rect.h;
}

function pointInPolygon(x: number, z: number, points: { x: number; z: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const pi = points[i]!;
    const pj = points[j]!;
    const intersect =
      pi.z > z !== pj.z > z && x < ((pj.x - pi.x) * (z - pi.z)) / (pj.z - pi.z) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInNodeFootprint(node: DeckNode, x: number, z: number): boolean {
  if (node.footprint.kind === 'rect') {
    return pointInRect(x, z, node.footprint.rect);
  }
  return pointInPolygon(x, z, node.footprint.points);
}

/** Returns node id containing (x,z), or null if none. If multiple, smallest id. */
export function roomAtPosition(graph: DeckGraph, x: number, z: number): string | null {
  const matches = listNodes(graph)
    .filter((node) => pointInNodeFootprint(node, x, z))
    .map((node) => node.id)
    .sort();
  return matches[0] ?? null;
}
