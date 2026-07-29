import {
  ACTOR_PROXY_RADIUS_M,
  SPAWN_CLEARANCE_M,
  SPAWN_OFFSET_TOWARD_DOOR_M,
} from '../config.js';
import { buildCollisionWorld, circleHitsWalls } from './collision.js';
import type { CollisionWorld } from './collision.js';
import { doorBetween, getNode } from './graph.js';
import type { BreachProfileId, DeckGraph } from './types.js';

export interface SpawnPoint {
  roomId: string;
  profile: BreachProfileId;
  x: number;
  z: number;
  yaw: number;
}

export interface SpawnValidation {
  ok: boolean;
  issues: string[];
}

function rectCenter(rect: { x: number; z: number; w: number; h: number }): { x: number; z: number } {
  return { x: rect.x + rect.w / 2, z: rect.z + rect.h / 2 };
}

function polygonCenter(points: { x: number; z: number }[]): { x: number; z: number } {
  let sx = 0;
  let sz = 0;
  for (const p of points) {
    sx += p.x;
    sz += p.z;
  }
  return { x: sx / points.length, z: sz / points.length };
}

function footprintCenter(node: ReturnType<typeof getNode>): { x: number; z: number } {
  if (node.footprint.kind === 'rect') {
    return rectCenter(node.footprint.rect);
  }
  return polygonCenter(node.footprint.points);
}

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

function pointInFootprint(graph: DeckGraph, roomId: string, x: number, z: number): boolean {
  const node = getNode(graph, roomId);
  if (node.footprint.kind === 'rect') {
    return pointInRect(x, z, node.footprint.rect);
  }
  return pointInPolygon(x, z, node.footprint.points);
}

export function computeSpawnPoint(
  graph: DeckGraph,
  roomId: 'port-airlock' | 'stbd-airlock',
): SpawnPoint {
  const node = getNode(graph, roomId);
  if (!node.breachProfile) {
    throw new Error(`room ${roomId} missing breach profile`);
  }

  const center = footprintCenter(node);
  const spineDoor = doorBetween(graph, roomId, 'main-spine');
  if (!spineDoor) {
    throw new Error(`no spine door for ${roomId}`);
  }

  const doorCenter = rectCenter(spineDoor.opening);
  const dx = doorCenter.x - center.x;
  const dz = doorCenter.z - center.z;
  const dist = Math.hypot(dx, dz);
  const offset = dist > 0 ? SPAWN_OFFSET_TOWARD_DOOR_M / dist : 0;

  const x = center.x + dx * offset;
  const z = center.z + dz * offset;
  const yaw = Math.atan2(doorCenter.x - x, doorCenter.z - z);

  return {
    roomId,
    profile: node.breachProfile,
    x,
    z,
    yaw,
  };
}

export function validateSpawnPoint(
  graph: DeckGraph,
  world: CollisionWorld,
  spawn: SpawnPoint,
): SpawnValidation {
  const issues: string[] = [];
  const node = getNode(graph, spawn.roomId);

  if (!node.spawnSafe) {
    issues.push('room is not spawn-safe');
  }
  if (!pointInFootprint(graph, spawn.roomId, spawn.x, spawn.z)) {
    issues.push('spawn point outside room footprint');
  }
  const clearanceRadius = ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M;
  if (circleHitsWalls(world, spawn.x, spawn.z, clearanceRadius)) {
    issues.push('spawn point collides with walls');
  }

  return { ok: issues.length === 0, issues };
}

export function buildDefaultCollisionWorld(graph: DeckGraph): CollisionWorld {
  return buildCollisionWorld(graph);
}
