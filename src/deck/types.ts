export type WallClass = 'A' | 'B' | 'C';

/**
 * Presentation / structural role (design doc §6.1 v1.11).
 * - bulkhead: section-bounding Class B bands + blast doors (gating firewall)
 * - interior: ordinary Class B solid walls / non-blast door edges (not section bounds)
 * - partition: Class A
 * - hull: Class C
 * - door: reserved if a wall segment is co-authored with an opening; prefer DoorEdgeDef
 */
export type WallRole = 'bulkhead' | 'interior' | 'hull' | 'partition' | 'door';

/** Class B presentation on door edges (Q1 / Q8 / §6.1). */
export type DoorPresentation = 'bulkhead' | 'interior';

export type DeckSection = 'aft' | 'midships' | 'fore';

/** Visual accent key → ACCENT_HEX (Q2 / VD §3 v1.2). */
export type AccentId =
  | 'engineering'
  | 'command'
  | 'ops'
  | 'lifeSupport'
  | 'crew'
  | 'hydro'
  | 'armory'
  | 'medical'
  | 'comms'
  | 'mess'
  | 'corridor'
  | 'safe';

export type BreachProfileId = 'port-cargo-armory' | 'stbd-life-barracks';

export type ObjectiveKind = 'primary' | 'secondary';

export interface RectFootprintSvg {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PolygonFootprintSvg {
  kind: 'polygon';
  points: ReadonlyArray<readonly [number, number]>;
}

export type FootprintSvg = RectFootprintSvg | PolygonFootprintSvg;

export interface DeckNodeDef {
  id: string;
  name: string;
  section: DeckSection;
  footprint: FootprintSvg;
  accentId: AccentId;
  hullAdjacent: boolean;
  spawnSafe: boolean;
  breachPoint: boolean;
  breachProfile: BreachProfileId | null;
  onCriticalPath: boolean;
}

export interface DoorEdgeDef {
  id: string;
  a: string;
  b: string;
  wallClass: WallClass;
  presentation: DoorPresentation;
  isBlast: boolean;
  opening: { x: number; y: number; w: number; h: number };
}

export interface WallSegmentDef {
  id: string;
  wallClass: WallClass;
  role: WallRole;
  x: number;
  y: number;
  w: number;
  h: number;
  rooms: readonly string[];
}

export interface AndroidRackDef {
  id: string;
  roomId: string;
  capacity: 3;
  x: number;
  y: number;
}

export interface ObjectiveMarkerDef {
  id: string;
  roomId: string;
  kind: ObjectiveKind;
  x: number;
  y: number;
}

export interface CrewSpawnPostDef {
  id: string;
  homeRoomId: string;
  role: 'rover' | 'posted';
  spawn: { x: number; y: number; yawDeg: number };
  waypoints: ReadonlyArray<{ x: number; y: number }>;
}

export interface CrewSpawnPost {
  id: string;
  homeRoomId: string;
  role: 'rover' | 'posted';
  spawn: { x: number; z: number; yawRad: number };
  waypoints: ReadonlyArray<{ x: number; z: number }>;
}

export interface DeckDefinition {
  id: 'deck-03';
  name: string;
  version: 1;
  scale: { px: 120; meters: 25 };
  nodes: DeckNodeDef[];
  doorEdges: DoorEdgeDef[];
  wallSegments: WallSegmentDef[];
  androidRacks: AndroidRackDef[];
  objectives: ObjectiveMarkerDef[];
  crewSpawnTable: CrewSpawnPostDef[];
}

export interface WorldRect {
  x: number;
  z: number;
  w: number;
  h: number;
}

export interface WorldVec2 {
  x: number;
  z: number;
}

export interface DeckNode {
  id: string;
  name: string;
  section: DeckSection;
  accentId: AccentId;
  hullAdjacent: boolean;
  spawnSafe: boolean;
  breachPoint: boolean;
  breachProfile: BreachProfileId | null;
  onCriticalPath: boolean;
  footprint: { kind: 'rect'; rect: WorldRect } | { kind: 'polygon'; points: WorldVec2[] };
}

export interface DoorEdge {
  id: string;
  a: string;
  b: string;
  wallClass: WallClass;
  presentation: DoorPresentation;
  isBlast: boolean;
  opening: WorldRect;
}

export interface WallSegment {
  id: string;
  wallClass: WallClass;
  role: WallRole;
  rect: WorldRect;
  rooms: readonly string[];
}

export interface DeckGraph {
  readonly id: 'deck-03';
  readonly nodes: ReadonlyMap<string, DeckNode>;
  readonly doorEdges: readonly DoorEdge[];
  readonly wallSegments: readonly WallSegment[];
  readonly androidRacks: readonly {
    id: string;
    roomId: string;
    capacity: 3;
    position: WorldVec2;
  }[];
  readonly objectives: readonly {
    id: string;
    roomId: string;
    kind: ObjectiveKind;
    position: WorldVec2;
  }[];
  readonly crewSpawnTable: readonly CrewSpawnPost[];
}
