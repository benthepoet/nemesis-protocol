import type { DeckGraph } from './types.js';

function sortedNodes(graph: DeckGraph) {
  return [...graph.nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function sortedDoorEdges(graph: DeckGraph) {
  return [...graph.doorEdges].sort((a, b) => a.id.localeCompare(b.id));
}

function sortedWallSegments(graph: DeckGraph) {
  return [...graph.wallSegments].sort((a, b) => a.id.localeCompare(b.id));
}

function sortedRacks(graph: DeckGraph) {
  return [...graph.androidRacks].sort((a, b) => a.id.localeCompare(b.id));
}

function sortedObjectives(graph: DeckGraph) {
  return [...graph.objectives].sort((a, b) => a.id.localeCompare(b.id));
}

function serializeFootprint(node: ReturnType<typeof sortedNodes>[number]) {
  if (node.footprint.kind === 'rect') {
    return { kind: 'rect', rect: node.footprint.rect };
  }
  return { kind: 'polygon', points: node.footprint.points };
}

function buildHashPayload(graph: DeckGraph): string {
  const payload = {
    nodes: sortedNodes(graph).map((node) => ({
      accentId: node.accentId,
      breachPoint: node.breachPoint,
      breachProfile: node.breachProfile,
      footprint: serializeFootprint(node),
      hullAdjacent: node.hullAdjacent,
      id: node.id,
      name: node.name,
      onCriticalPath: node.onCriticalPath,
      section: node.section,
      spawnSafe: node.spawnSafe,
    })),
    doorEdges: sortedDoorEdges(graph).map((edge) => ({
      a: edge.a,
      b: edge.b,
      id: edge.id,
      isBlast: edge.isBlast,
      opening: edge.opening,
      presentation: edge.presentation,
      wallClass: edge.wallClass,
    })),
    wallSegments: sortedWallSegments(graph).map((wall) => ({
      id: wall.id,
      rect: wall.rect,
      role: wall.role,
      rooms: wall.rooms,
      wallClass: wall.wallClass,
    })),
    racks: sortedRacks(graph).map((rack) => ({
      capacity: rack.capacity,
      id: rack.id,
      position: rack.position,
      roomId: rack.roomId,
    })),
    objectives: sortedObjectives(graph).map((obj) => ({
      id: obj.id,
      kind: obj.kind,
      position: obj.position,
      roomId: obj.roomId,
    })),
  };

  return JSON.stringify(payload);
}

async function sha256Hex(data: string): Promise<string> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto subtle digest unavailable');
  }
  const encoded = new TextEncoder().encode(data);
  const digest = await cryptoObj.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashDeckGraph(graph: DeckGraph): Promise<string> {
  return sha256Hex(buildHashPayload(graph));
}

export { buildHashPayload as buildHashPayloadForTests };
