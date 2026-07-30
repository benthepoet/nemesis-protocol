import {
  ACTOR_PROXY_RADIUS_M,
  CREW_POPULATION,
  SPAWN_CLEARANCE_M,
} from '../config.js';
import {
  allReachableFrom,
  bordersClassA,
  breachNodes,
  listDoorEdges,
  listNodes,
  listWallSegments,
  wallsForRoom,
} from './graph.js';
import { buildCollisionWorld, circleHitsWalls } from './collision.js';
import { getNode } from './graph.js';
import { pointInNodeFootprint } from './roomQuery.js';
import type { DeckGraph, DoorEdge, WallClass } from './types.js';

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  issues: ValidationIssue[];
}

/** Exact P1 critical-path id set (Q3). */
export const P1_CRITICAL_PATH_IDS = [
  'port-airlock',
  'stbd-airlock',
  'main-spine',
  'engineering',
] as const;

/** Nodes subject to §7 r8 Class-A adjacency at P1 (Q3) — airlocks only. */
export const P1_CRITICAL_PATH_CLASS_A_CHECK_IDS = [
  'port-airlock',
  'stbd-airlock',
] as const;

const VALID_WALL_CLASSES: readonly WallClass[] = ['A', 'B', 'C'];

/** Logical bulkhead band ids (Q1 — 3 section bounds; gapped segments share a band prefix). */
const BULKHEAD_BAND_PREFIXES = ['wall-b-aft-rear', 'wall-b-mid-aft', 'wall-b-mid-fore'] as const;

function bulkheadBandKey(id: string): string | null {
  for (const prefix of BULKHEAD_BAND_PREFIXES) {
    if (id === prefix || id.startsWith(`${prefix}-`)) return prefix;
  }
  return null;
}

function isValidWallClass(value: string): value is WallClass {
  return (VALID_WALL_CLASSES as readonly string[]).includes(value);
}

function engineeringBoundingWalls(graph: DeckGraph) {
  return wallsForRoom(graph, 'engineering');
}

function hullClassCSegmentsForRoom(graph: DeckGraph, roomId: string) {
  return wallsForRoom(graph, roomId).filter((wall) => wall.wallClass === 'C');
}

export function validateDeckGraph(graph: DeckGraph): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (graph.nodes.size !== 18) {
    issues.push({ code: 'NODE_COUNT', message: `expected 18 nodes, got ${graph.nodes.size}` });
  }

  if (graph.doorEdges.length !== 17) {
    issues.push({ code: 'DOOR_COUNT', message: `expected 17 door edges, got ${graph.doorEdges.length}` });
  }

  const classACount = listWallSegments(graph).filter((w) => w.wallClass === 'A').length;
  if (classACount !== 9) {
    issues.push({ code: 'CLASS_A_COUNT', message: `expected 9 Class A walls, got ${classACount}` });
  }

  const bulkheadBands = new Set(
    listWallSegments(graph)
      .filter((w) => w.role === 'bulkhead')
      .map((w) => bulkheadBandKey(w.id))
      .filter((k): k is string => k !== null),
  );
  if (bulkheadBands.size !== 3) {
    issues.push({
      code: 'CLASS_B_BULKHEAD_COUNT',
      message: `expected 3 bulkhead bands, got ${bulkheadBands.size}`,
    });
  }

  const allNodeIds = listNodes(graph).map((n) => n.id);
  if (allNodeIds.length > 0) {
    const reference = allReachableFrom(graph, allNodeIds[0]!);
    const allConnected = allNodeIds.every((id) => reference.has(id));
    if (!allConnected) {
      issues.push({ code: 'CONNECTED', message: 'door graph is not a single connected component' });
    }
  }

  const breaches = breachNodes(graph);
  if (breaches.length !== 2) {
    issues.push({ code: 'BREACH_COUNT', message: `expected 2 breach points, got ${breaches.length}` });
  } else {
    for (const breach of breaches) {
      const reachable = allReachableFrom(graph, breach.id);
      if (reachable.size !== graph.nodes.size) {
        issues.push({
          code: 'REACH_FROM_BREACH',
          message: `not all nodes reachable from breach ${breach.id}`,
        });
      }
    }
  }

  for (const edge of listDoorEdges(graph)) {
    if (!isValidWallClass(edge.wallClass)) {
      issues.push({ code: 'EDGE_TYPED', message: `door ${edge.id} has invalid wallClass` });
    }
  }

  for (const edge of listDoorEdges(graph)) {
    if (edge.wallClass !== 'B') {
      issues.push({ code: 'DOOR_CLASS_B', message: `door ${edge.id} must be Class B` });
      continue;
    }
    if (edge.isBlast) {
      if (edge.presentation !== 'bulkhead') {
        issues.push({
          code: 'DOOR_CLASS_B',
          message: `blast door ${edge.id} must have bulkhead presentation`,
        });
      }
    } else if (edge.presentation !== 'interior') {
      issues.push({
        code: 'DOOR_CLASS_B',
        message: `non-blast door ${edge.id} must have interior presentation`,
      });
    }
  }

  for (const wall of listWallSegments(graph)) {
    if (!isValidWallClass(wall.wallClass)) {
      issues.push({ code: 'WALL_TYPED', message: `wall ${wall.id} has invalid wallClass` });
    }
  }

  const engWalls = engineeringBoundingWalls(graph);
  const engBlastDoors = listDoorEdges(graph).filter(
    (edge: DoorEdge) =>
      edge.isBlast && (edge.a === 'engineering' || edge.b === 'engineering'),
  );
  for (const wall of engWalls) {
    if (wall.wallClass !== 'B') {
      issues.push({
        code: 'ENGINEERING_B_BOUND',
        message: `engineering wall ${wall.id} must be Class B`,
      });
    } else if (wall.role !== 'bulkhead' && wall.role !== 'interior') {
      issues.push({
        code: 'ENGINEERING_B_BOUND',
        message: `engineering wall ${wall.id} must be bulkhead or interior role`,
      });
    }
  }
  for (const door of engBlastDoors) {
    if (door.wallClass !== 'B' || door.presentation !== 'bulkhead') {
      issues.push({
        code: 'ENGINEERING_B_BOUND',
        message: `engineering blast door ${door.id} must be Class B bulkhead`,
      });
    }
  }

  const criticalSet = new Set(
    listNodes(graph).filter((n) => n.onCriticalPath).map((n) => n.id),
  );
  const expectedCritical = new Set(P1_CRITICAL_PATH_IDS);
  const criticalMatch =
    criticalSet.size === expectedCritical.size &&
    [...expectedCritical].every((id) => criticalSet.has(id));
  if (!criticalMatch) {
    issues.push({
      code: 'CRITICAL_PATH_SET',
      message: 'onCriticalPath nodes do not match P1_CRITICAL_PATH_IDS',
    });
  }

  for (const id of P1_CRITICAL_PATH_CLASS_A_CHECK_IDS) {
    if (!bordersClassA(graph, id)) {
      issues.push({
        code: 'CRITICAL_PATH_A',
        message: `critical path node ${id} must border Class A`,
      });
    }
  }

  for (const node of listNodes(graph)) {
    const hullSegments = hullClassCSegmentsForRoom(graph, node.id);
    if (node.hullAdjacent && hullSegments.length === 0) {
      issues.push({
        code: 'HULL_FLAGS',
        message: `hull-adjacent node ${node.id} lacks Class C wall segment`,
      });
    }
    if (!node.hullAdjacent && hullSegments.length > 0) {
      issues.push({
        code: 'HULL_FLAGS',
        message: `non-hull node ${node.id} has Class C wall segment`,
      });
    }
  }

  issues.push(...validateCrewSpawnTable(graph));

  return { ok: issues.length === 0, issues };
}

export function validateCrewSpawnTable(graph: DeckGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const table = graph.crewSpawnTable;
  if (table.length !== CREW_POPULATION) {
    issues.push({
      code: 'CREW_SPAWN_COUNT',
      message: `expected ${CREW_POPULATION} crew spawn posts, got ${table.length}`,
    });
    return issues;
  }

  const world = buildCollisionWorld(graph);
  const clearanceR = ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M;
  const positions: { x: number; z: number }[] = [];

  for (const post of table) {
    if (!graph.nodes.has(post.homeRoomId)) {
      issues.push({ code: 'CREW_SPAWN_ROOM', message: `post ${post.id} unknown homeRoomId` });
    }
    if (post.waypoints.length < 2) {
      issues.push({ code: 'CREW_SPAWN_LOOP', message: `post ${post.id} needs ≥2 waypoints` });
    }

    const { x, z } = post.spawn;
    const home = getNode(graph, post.homeRoomId);
    if (!pointInNodeFootprint(home, x, z)) {
      issues.push({ code: 'CREW_SPAWN_CONTAIN', message: `post ${post.id} spawn outside ${post.homeRoomId}` });
    }
    if (circleHitsWalls(world, x, z, clearanceR)) {
      issues.push({ code: 'CREW_SPAWN_CLEAR', message: `post ${post.id} spawn clearance blocked` });
    }
    for (const wp of post.waypoints) {
      if (!pointInNodeFootprint(home, wp.x, wp.z)) {
        issues.push({
          code: 'CREW_WAYPOINT_CONTAIN',
          message: `post ${post.id} waypoint outside ${post.homeRoomId}`,
        });
      }
    }
    for (const prev of positions) {
      const minDist = 2 * clearanceR;
      if (Math.hypot(x - prev.x, z - prev.z) < minDist) {
        issues.push({ code: 'CREW_SPAWN_OVERLAP', message: `post ${post.id} overlaps another spawn` });
      }
    }
    positions.push({ x, z });
  }

  return issues;
}
