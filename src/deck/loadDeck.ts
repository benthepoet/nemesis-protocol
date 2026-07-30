import { polygonSvgToWorld, rectSvgToWorld, svgToWorld } from './transform.js';
import type {
  CrewSpawnPost,
  CrewSpawnPostDef,
  DeckDefinition,
  DeckGraph,
  DeckNode,
  DeckNodeDef,
  DoorEdge,
  DoorEdgeDef,
  FootprintSvg,
  WallSegment,
  WallSegmentDef,
} from './types.js';

export class DeckLoadError extends Error {
  constructor(message: string, readonly path?: string) {
    super(path ? `${path}: ${message}` : message);
    this.name = 'DeckLoadError';
  }
}

function assertField(obj: unknown, key: string, path: string): unknown {
  if (obj === null || typeof obj !== 'object' || !(key in obj)) {
    throw new DeckLoadError(`missing required field "${key}"`, path);
  }
  return (obj as Record<string, unknown>)[key];
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new DeckLoadError('expected string', path);
  }
  return value;
}

function assertNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new DeckLoadError('expected number', path);
  }
  return value;
}

function assertBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new DeckLoadError('expected boolean', path);
  }
  return value;
}

function parseFootprint(raw: unknown, path: string): FootprintSvg {
  if (raw === null || typeof raw !== 'object') {
    throw new DeckLoadError('expected footprint object', path);
  }
  const kind = assertString(assertField(raw, 'kind', path), `${path}.kind`);
  if (kind === 'rect') {
    return {
      kind: 'rect',
      x: assertNumber(assertField(raw, 'x', path), `${path}.x`),
      y: assertNumber(assertField(raw, 'y', path), `${path}.y`),
      w: assertNumber(assertField(raw, 'w', path), `${path}.w`),
      h: assertNumber(assertField(raw, 'h', path), `${path}.h`),
    };
  }
  if (kind === 'polygon') {
    const pointsRaw = assertField(raw, 'points', path);
    if (!Array.isArray(pointsRaw)) {
      throw new DeckLoadError('expected points array', `${path}.points`);
    }
    const points = pointsRaw.map((pt, i) => {
      if (!Array.isArray(pt) || pt.length !== 2) {
        throw new DeckLoadError('expected [sx,sy] pair', `${path}.points[${i}]`);
      }
      return [assertNumber(pt[0], `${path}.points[${i}][0]`), assertNumber(pt[1], `${path}.points[${i}][1]`)] as const;
    });
    return { kind: 'polygon', points };
  }
  throw new DeckLoadError(`unknown footprint kind "${kind}"`, `${path}.kind`);
}

function parseNode(raw: unknown, path: string): DeckNodeDef {
  if (raw === null || typeof raw !== 'object') {
    throw new DeckLoadError('expected node object', path);
  }
  return {
    id: assertString(assertField(raw, 'id', path), `${path}.id`),
    name: assertString(assertField(raw, 'name', path), `${path}.name`),
    section: assertString(assertField(raw, 'section', path), `${path}.section`) as DeckNodeDef['section'],
    footprint: parseFootprint(assertField(raw, 'footprint', path), `${path}.footprint`),
    accentId: assertString(assertField(raw, 'accentId', path), `${path}.accentId`) as DeckNodeDef['accentId'],
    hullAdjacent: assertBoolean(assertField(raw, 'hullAdjacent', path), `${path}.hullAdjacent`),
    spawnSafe: assertBoolean(assertField(raw, 'spawnSafe', path), `${path}.spawnSafe`),
    breachPoint: assertBoolean(assertField(raw, 'breachPoint', path), `${path}.breachPoint`),
    breachProfile: (() => {
      const v = assertField(raw, 'breachProfile', path);
      if (v === null) return null;
      return assertString(v, `${path}.breachProfile`) as DeckNodeDef['breachProfile'];
    })(),
    onCriticalPath: assertBoolean(assertField(raw, 'onCriticalPath', path), `${path}.onCriticalPath`),
  };
}

function parseDoorEdge(raw: unknown, path: string): DoorEdgeDef {
  if (raw === null || typeof raw !== 'object') {
    throw new DeckLoadError('expected door edge object', path);
  }
  const openingRaw = assertField(raw, 'opening', path);
  if (openingRaw === null || typeof openingRaw !== 'object') {
    throw new DeckLoadError('expected opening object', `${path}.opening`);
  }
  return {
    id: assertString(assertField(raw, 'id', path), `${path}.id`),
    a: assertString(assertField(raw, 'a', path), `${path}.a`),
    b: assertString(assertField(raw, 'b', path), `${path}.b`),
    wallClass: assertString(assertField(raw, 'wallClass', path), `${path}.wallClass`) as DoorEdgeDef['wallClass'],
    presentation: assertString(assertField(raw, 'presentation', path), `${path}.presentation`) as DoorEdgeDef['presentation'],
    isBlast: assertBoolean(assertField(raw, 'isBlast', path), `${path}.isBlast`),
    opening: {
      x: assertNumber(assertField(openingRaw, 'x', `${path}.opening`), `${path}.opening.x`),
      y: assertNumber(assertField(openingRaw, 'y', `${path}.opening`), `${path}.opening.y`),
      w: assertNumber(assertField(openingRaw, 'w', `${path}.opening`), `${path}.opening.w`),
      h: assertNumber(assertField(openingRaw, 'h', `${path}.opening`), `${path}.opening.h`),
    },
  };
}

function parseWallSegment(raw: unknown, path: string): WallSegmentDef {
  if (raw === null || typeof raw !== 'object') {
    throw new DeckLoadError('expected wall segment object', path);
  }
  const roomsRaw = assertField(raw, 'rooms', path);
  if (!Array.isArray(roomsRaw)) {
    throw new DeckLoadError('expected rooms array', `${path}.rooms`);
  }
  return {
    id: assertString(assertField(raw, 'id', path), `${path}.id`),
    wallClass: assertString(assertField(raw, 'wallClass', path), `${path}.wallClass`) as WallSegmentDef['wallClass'],
    role: assertString(assertField(raw, 'role', path), `${path}.role`) as WallSegmentDef['role'],
    x: assertNumber(assertField(raw, 'x', path), `${path}.x`),
    y: assertNumber(assertField(raw, 'y', path), `${path}.y`),
    w: assertNumber(assertField(raw, 'w', path), `${path}.w`),
    h: assertNumber(assertField(raw, 'h', path), `${path}.h`),
    rooms: roomsRaw.map((r, i) => assertString(r, `${path}.rooms[${i}]`)),
  };
}

function parseCrewSpawnPost(raw: unknown, path: string): CrewSpawnPostDef {
  if (raw === null || typeof raw !== 'object') {
    throw new DeckLoadError('expected crew spawn post object', path);
  }
  const waypointsRaw = assertField(raw, 'waypoints', path);
  if (!Array.isArray(waypointsRaw)) {
    throw new DeckLoadError('expected waypoints array', `${path}.waypoints`);
  }
  const spawnRaw = assertField(raw, 'spawn', path);
  if (spawnRaw === null || typeof spawnRaw !== 'object') {
    throw new DeckLoadError('expected spawn object', `${path}.spawn`);
  }
  return {
    id: assertString(assertField(raw, 'id', path), `${path}.id`),
    homeRoomId: assertString(assertField(raw, 'homeRoomId', path), `${path}.homeRoomId`),
    role: assertString(assertField(raw, 'role', path), `${path}.role`) as CrewSpawnPostDef['role'],
    spawn: {
      x: assertNumber(assertField(spawnRaw, 'x', `${path}.spawn`), `${path}.spawn.x`),
      y: assertNumber(assertField(spawnRaw, 'y', `${path}.spawn`), `${path}.spawn.y`),
      yawDeg: assertNumber(assertField(spawnRaw, 'yawDeg', `${path}.spawn`), `${path}.spawn.yawDeg`),
    },
    waypoints: waypointsRaw.map((wp, i) => {
      if (wp === null || typeof wp !== 'object') {
        throw new DeckLoadError('expected waypoint object', `${path}.waypoints[${i}]`);
      }
      return {
        x: assertNumber(assertField(wp, 'x', `${path}.waypoints[${i}]`), `${path}.waypoints[${i}].x`),
        y: assertNumber(assertField(wp, 'y', `${path}.waypoints[${i}]`), `${path}.waypoints[${i}].y`),
      };
    }),
  };
}

export function loadDeckDefinition(raw: unknown): DeckDefinition {
  if (raw === null || typeof raw !== 'object') {
    throw new DeckLoadError('expected deck definition object');
  }
  const nodesRaw = assertField(raw, 'nodes', 'root');
  const doorsRaw = assertField(raw, 'doorEdges', 'root');
  const wallsRaw = assertField(raw, 'wallSegments', 'root');
  const racksRaw = assertField(raw, 'androidRacks', 'root');
  const objectivesRaw = assertField(raw, 'objectives', 'root');
  const crewSpawnRaw = assertField(raw, 'crewSpawnTable', 'root');

  if (!Array.isArray(nodesRaw)) throw new DeckLoadError('expected nodes array', 'nodes');
  if (!Array.isArray(doorsRaw)) throw new DeckLoadError('expected doorEdges array', 'doorEdges');
  if (!Array.isArray(wallsRaw)) throw new DeckLoadError('expected wallSegments array', 'wallSegments');
  if (!Array.isArray(racksRaw)) throw new DeckLoadError('expected androidRacks array', 'androidRacks');
  if (!Array.isArray(objectivesRaw)) throw new DeckLoadError('expected objectives array', 'objectives');
  if (!Array.isArray(crewSpawnRaw)) throw new DeckLoadError('expected crewSpawnTable array', 'crewSpawnTable');

  const scaleRaw = assertField(raw, 'scale', 'root');
  if (scaleRaw === null || typeof scaleRaw !== 'object') {
    throw new DeckLoadError('expected scale object', 'scale');
  }

  return {
    id: assertString(assertField(raw, 'id', 'root'), 'id') as 'deck-03',
    name: assertString(assertField(raw, 'name', 'root'), 'name'),
    version: assertNumber(assertField(raw, 'version', 'root'), 'version') as 1,
    scale: {
      px: assertNumber(assertField(scaleRaw, 'px', 'scale'), 'scale.px') as 120,
      meters: assertNumber(assertField(scaleRaw, 'meters', 'scale'), 'scale.meters') as 25,
    },
    nodes: nodesRaw.map((n, i) => parseNode(n, `nodes[${i}]`)),
    doorEdges: doorsRaw.map((d, i) => parseDoorEdge(d, `doorEdges[${i}]`)),
    wallSegments: wallsRaw.map((w, i) => parseWallSegment(w, `wallSegments[${i}]`)),
    androidRacks: racksRaw.map((r, i) => {
      if (r === null || typeof r !== 'object') throw new DeckLoadError('expected rack object', `androidRacks[${i}]`);
      return {
        id: assertString(assertField(r, 'id', `androidRacks[${i}]`), `androidRacks[${i}].id`),
        roomId: assertString(assertField(r, 'roomId', `androidRacks[${i}]`), `androidRacks[${i}].roomId`),
        capacity: assertNumber(assertField(r, 'capacity', `androidRacks[${i}]`), `androidRacks[${i}].capacity`) as 3,
        x: assertNumber(assertField(r, 'x', `androidRacks[${i}]`), `androidRacks[${i}].x`),
        y: assertNumber(assertField(r, 'y', `androidRacks[${i}]`), `androidRacks[${i}].y`),
      };
    }),
    objectives: objectivesRaw.map((o, i) => {
      if (o === null || typeof o !== 'object') throw new DeckLoadError('expected objective object', `objectives[${i}]`);
      return {
        id: assertString(assertField(o, 'id', `objectives[${i}]`), `objectives[${i}].id`),
        roomId: assertString(assertField(o, 'roomId', `objectives[${i}]`), `objectives[${i}].roomId`),
        kind: assertString(assertField(o, 'kind', `objectives[${i}]`), `objectives[${i}].kind`) as 'primary' | 'secondary',
        x: assertNumber(assertField(o, 'x', `objectives[${i}]`), `objectives[${i}].x`),
        y: assertNumber(assertField(o, 'y', `objectives[${i}]`), `objectives[${i}].y`),
      };
    }),
    crewSpawnTable: crewSpawnRaw.map((p, i) => parseCrewSpawnPost(p, `crewSpawnTable[${i}]`)),
  };
}

function convertNode(def: DeckNodeDef): DeckNode {
  const base = {
    id: def.id,
    name: def.name,
    section: def.section,
    accentId: def.accentId,
    hullAdjacent: def.hullAdjacent,
    spawnSafe: def.spawnSafe,
    breachPoint: def.breachPoint,
    breachProfile: def.breachProfile,
    onCriticalPath: def.onCriticalPath,
  };
  if (def.footprint.kind === 'rect') {
    return { ...base, footprint: { kind: 'rect', rect: rectSvgToWorld(def.footprint) } };
  }
  return {
    ...base,
    footprint: { kind: 'polygon', points: polygonSvgToWorld(def.footprint.points) },
  };
}

function convertDoor(def: DoorEdgeDef): DoorEdge {
  return {
    id: def.id,
    a: def.a,
    b: def.b,
    wallClass: def.wallClass,
    presentation: def.presentation,
    isBlast: def.isBlast,
    opening: rectSvgToWorld({ kind: 'rect', ...def.opening }),
  };
}

function convertWall(def: WallSegmentDef): WallSegment {
  return {
    id: def.id,
    wallClass: def.wallClass,
    role: def.role,
    rect: rectSvgToWorld({ kind: 'rect', x: def.x, y: def.y, w: def.w, h: def.h }),
    rooms: def.rooms,
  };
}

function convertCrewSpawnPost(def: CrewSpawnPostDef): CrewSpawnPost {
  return {
    id: def.id,
    homeRoomId: def.homeRoomId,
    role: def.role,
    spawn: {
      x: svgToWorld(def.spawn.x, def.spawn.y).x,
      z: svgToWorld(def.spawn.x, def.spawn.y).z,
      yawRad: (def.spawn.yawDeg * Math.PI) / 180,
    },
    waypoints: def.waypoints.map((wp) => svgToWorld(wp.x, wp.y)),
  };
}

export function buildDeckGraph(def: DeckDefinition): DeckGraph {
  const nodes = new Map<string, DeckNode>();
  for (const nodeDef of def.nodes) {
    nodes.set(nodeDef.id, convertNode(nodeDef));
  }

  const graph: DeckGraph = {
    id: def.id,
    nodes,
    doorEdges: Object.freeze(def.doorEdges.map(convertDoor)),
    wallSegments: Object.freeze(def.wallSegments.map(convertWall)),
    androidRacks: Object.freeze(
      def.androidRacks.map((rack) => ({
        id: rack.id,
        roomId: rack.roomId,
        capacity: rack.capacity,
        position: svgToWorld(rack.x, rack.y),
      })),
    ),
    objectives: Object.freeze(
      def.objectives.map((obj) => ({
        id: obj.id,
        roomId: obj.roomId,
        kind: obj.kind,
        position: svgToWorld(obj.x, obj.y),
      })),
    ),
    crewSpawnTable: Object.freeze(def.crewSpawnTable.map(convertCrewSpawnPost)),
  };

  return Object.freeze(graph);
}

import deck03Raw from './data/deck03.json';

export function loadDeck03(): DeckGraph {
  const def = loadDeckDefinition(deck03Raw);
  return buildDeckGraph(def);
}
