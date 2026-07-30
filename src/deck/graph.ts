import type { AccentId, DeckGraph, DeckNode, DeckSection, DoorEdge, WallSegment } from './types.js';

export function getNode(graph: DeckGraph, id: string): DeckNode {
  const node = graph.nodes.get(id);
  if (!node) {
    throw new Error(`unknown node id: ${id}`);
  }
  return node;
}

export function listNodes(graph: DeckGraph): readonly DeckNode[] {
  return [...graph.nodes.values()];
}

export function neighbors(graph: DeckGraph, id: string): readonly string[] {
  const result = new Set<string>();
  for (const edge of graph.doorEdges) {
    if (edge.a === id) result.add(edge.b);
    if (edge.b === id) result.add(edge.a);
  }
  return [...result].sort();
}

export function doorBetween(graph: DeckGraph, a: string, b: string): DoorEdge | undefined {
  return graph.doorEdges.find(
    (edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a),
  );
}

export function listDoorEdges(graph: DeckGraph): readonly DoorEdge[] {
  return graph.doorEdges;
}

export function wallsForRoom(graph: DeckGraph, roomId: string): readonly WallSegment[] {
  return graph.wallSegments.filter((wall) => wall.rooms.includes(roomId));
}

export function listWallSegments(graph: DeckGraph): readonly WallSegment[] {
  return graph.wallSegments;
}

export function breachNodes(graph: DeckGraph): readonly DeckNode[] {
  return listNodes(graph).filter((node) => node.breachPoint);
}

export function sectionOf(graph: DeckGraph, id: string): DeckSection {
  return getNode(graph, id).section;
}

export function isHullRoom(graph: DeckGraph, id: string): boolean {
  return getNode(graph, id).hullAdjacent;
}

export function accentOf(graph: DeckGraph, id: string): AccentId {
  return getNode(graph, id).accentId;
}

export function pathExists(graph: DeckGraph, from: string, to: string): boolean {
  if (from === to) return true;
  const visited = new Set<string>();
  const queue = [from];
  visited.add(from);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of neighbors(graph, current)) {
      if (next === to) return true;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

export function allReachableFrom(graph: DeckGraph, from: string): ReadonlySet<string> {
  const reachable = new Set<string>();
  const queue = [from];
  reachable.add(from);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of neighbors(graph, current)) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }
  return reachable;
}

export function bordersClassA(graph: DeckGraph, roomId: string): boolean {
  return wallsForRoom(graph, roomId).some((wall) => wall.wallClass === 'A');
}

export function criticalPathNodes(graph: DeckGraph): readonly DeckNode[] {
  return listNodes(graph).filter((node) => node.onCriticalPath);
}

export function androidRacks(graph: DeckGraph): DeckGraph['androidRacks'] {
  return graph.androidRacks;
}

export function objectives(graph: DeckGraph): DeckGraph['objectives'] {
  return graph.objectives;
}
