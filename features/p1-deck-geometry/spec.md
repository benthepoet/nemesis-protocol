# Technical Specification — p1-deck-geometry

`SPEC v1 | feature p1-deck-geometry | charter v1.13 | design doc v1.11 | design pack v1 | goals: G1..G8 | mechanics: M1..M6`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.11** · design pack **v1** · feature roadmap **v1.3** · visual direction **v1.2** · deck plan mockup **v2.2** (`assets/mockups/cruiser_boarding_deck_plan.svg`, generator `tools/mockups/gen_ship_svg.py`) · scaffold **p1-project-scaffold** accepted (spec v1, PR #1) · clarification log **KIMI RULINGS v1** (2026-07-29) · AGENTS.md current

### Clarification rulings incorporated

All eight questions in `clarification-log.md` are resolved (KIMI RULINGS v1). Design-doc **v1.11** and visual direction **v1.2** are required. Binding effects on this spec:

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| Q1 | Unmarked faces = `wallClass: B`, presentation **interior** (not section bounds); only the 3 bulkhead bands are the gating firewall | Tasks 2–3, 7, 12; WallRole; Unmarked solid interior faces; Validator `ENGINEERING_B_BOUND` |
| Q2 | Binding 18-row accent table from mockup v2.2 / VD §3 extended (rejects provisional Ops-heavy map) | Tasks 2–3, 12; AccentId; **Accent table (binding)** |
| Q3 | P1 critical path = { both airlocks, Main Spine, Engineering }; §7 r8 Class-A check applies to **airlocks only**; spine/Engineering/fore exempt as ruled | Tasks 3, 7, 16; Critical path; Validator `CRITICAL_PATH_SET` + `CRITICAL_PATH_A` |
| Q4 | Spawn = room center shifted **1.0 m** toward spine-side door, facing that door; proxy **0.4 m** + clearance **0.3 m**; `y = 0` | Tasks 1, 9, 16; Constants; Spawn API; E13–E14 |
| Q5 | Ceiling height **3.0 m** constant for all Deck 03 rooms | Tasks 1, 12; `ROOM_HEIGHT_M` |
| Q6 | Bridge footprint = **7-point** SVG polygon (generator canonical) | Task 3; Bridge footprint; E12 |
| Q7 | Three readable blockout treatments (B interior / B bulkhead double-thick / A partition + accent strip) + Class C hull treatment | Tasks 1, 8, 12; Wall thickness; Blockout material treatments |
| Q8 | All 15 non-blast door edges = Class B **interior** (rejects provisional A); blast doors = Class B **bulkhead** | Tasks 2–3, 7; Door edges; DoorEdgeDef `presentation` |

Composer may start Stage 3 on branch `feat/p1-deck-geometry`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Deck definition format | **JSON** (`src/deck/data/deck03.json`) + TypeScript schema in `src/deck/types.ts` | Machine-readable, Vite-importable, hashable as text; no codegen step. Inventory numbers are authored once in JSON — not scattered in code. |
| Coordinate system | SVG px → metric sim: **X right, Y up, Z depth** (three.js). SVG `(sx, sy)` (y-down) → `world = ((sx - ORIGIN_SX) * M_PER_PX, 0, (sy - ORIGIN_SY) * M_PER_PX)` for floor plane. | Matches three.js; floor on XZ; height on Y. |
| Scale | `M_PER_PX = 25 / 120` exactly (`5/24`). No float literals for the scale constant — derive from `SCALE_PX` / `SCALE_M`. | Design pack rule 7; spine length checkable. |
| SVG origin | `ORIGIN_SX = 0`, `ORIGIN_SY = 0` (SVG top-left). | Layout constants live only in the JSON; transform is pure scale. |
| Graph representation | Immutable `DeckGraph` built from definition: nodes Map, door edges array, wall segments array. Query APIs only — no layout literals outside JSON. | G6 / M3 / §12.2. |
| Collision | **No physics engine.** Axis-aligned wall segments (AABB in XZ) + **bridge polygon** edge segments. Actor proxy = circle in XZ. Doorways = open gaps (no collider). | Pack: keep simple; R1 open passages. |
| Wall thickness | Interior / partition / hull base: `WALL_THICKNESS_M = 0.3`. Bulkheads: `BULKHEAD_THICKNESS_M = 2 * WALL_THICKNESS_M` (Q7). Room footprints in JSON are **interior** floor polygons/rects. | Q7 bulkheads must read as law; avoid mockup gap width dominating rooms. |
| Ceiling / wall height | `ROOM_HEIGHT_M = 3.0` (Q5) | Binding. |
| Debug camera | Free-fly PerspectiveCamera, enabled only when `import.meta.env.DEV === true` **and** URL search param `debugCamera=1`. Absent from production player path. | G8. |
| Procgen | **Validator only** — no generator. | Pack non-goal. |

---

## Exact project layout (additions only — do not redesign scaffold)

Composer **adds** these paths under the existing tree. Do not rename/move scaffold files. Do not invent extra top-level packages.

```
/
├── src/
│   ├── config.ts                         # EXTEND: deck + collision + debug constants
│   ├── deck/
│   │   ├── types.ts                      # schema types (WallClass, DeckDefinition, …)
│   │   ├── data/
│   │   │   └── deck03.json               # canonical Deck 03 definition (G1)
│   │   ├── transform.ts                  # SVG px → meters
│   │   ├── loadDeck.ts                   # parse + build DeckGraph
│   │   ├── graph.ts                      # topology-agnostic query APIs (G6)
│   │   ├── validate.ts                   # §7 validation pass (P1 subset) (G2)
│   │   ├── collision.ts                  # volumes + circle vs walls (G4)
│   │   ├── spawn.ts                      # spawn-safe points + validation (G5)
│   │   ├── hashDeck.ts                   # deterministic graph hash (G7)
│   │   └── spawnDeckEntities.ts          # stable marker EntityIds into SimState (G7)
│   ├── render/
│   │   ├── createPlaceholderScene.ts     # KEEP file; stop using as boot scene
│   │   ├── createDeckScene.ts            # blockout from DeckGraph (G3, M6)
│   │   ├── debugFlyCamera.ts             # free-fly (G8)
│   │   └── frameLoop.ts                  # EXTEND: optional debug camera update hook
│   └── app/
│       └── boot.ts                       # EXTEND: load deck, deck scene, debug cam
└── tests/
    ├── deck/
    │   ├── loadDeck.test.ts              # G1 counts + scale
    │   ├── validate.test.ts              # G2
    │   ├── collision.test.ts             # G4
    │   ├── spawn.test.ts                 # G5
    │   ├── graphApi.test.ts              # G6
    │   ├── hashDeck.test.ts              # G7
    │   └── fixtures/
    │       └── minimalInvalidDeck.ts     # tiny invalid decks for validator negatives
    └── helpers/
        └── deckTestUtils.ts              # load deck03, proxy helpers
```

Do **not** edit `docs/`, `assets/`, `tools/mockups/gen_ship_svg.py`, or other feature folders. JSON is hand-authored from the design-pack inventory (coordinates match pack table / generator); do not parse the SVG at runtime.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Extend `src/config.ts` with deck constants exactly as in **Constants** below (`SCALE_PX`, `SCALE_M`, `M_PER_PX`, `ORIGIN_SX`, `ORIGIN_SY`, `WALL_THICKNESS_M`, `BULKHEAD_THICKNESS_M`, `ROOM_HEIGHT_M`, `ACTOR_PROXY_RADIUS_M`, `SPAWN_CLEARANCE_M`, `SPAWN_OFFSET_TOWARD_DOOR_M`, `DEBUG_CAMERA_PARAM`, `ACCENT_HEX`). No other magic numbers for scale/collision/spawn/accents. | `src/config.ts` | G1, G3, G4, G5, G8, M6 |
| 2 | Define TypeScript schema types for the deck definition and runtime graph (`WallClass`, `WallPresentation` / `WallRole`, `DeckSection`, `AccentId`, `BreachProfile`, `Footprint`, `DeckNodeDef`, `DoorEdgeDef`, `WallSegmentDef`, `AndroidRackDef`, `ObjectiveMarkerDef`, `DeckDefinition`, `DeckGraph`, query result types). Export pure types only — no runtime layout data. | `src/deck/types.ts` | G1, G6, M1, M2, M3, M4, M5 |
| 3 | Author `deck03.json` from the design-pack **Canonical deck inventory** (18 nodes, 17 door edges, 9 Class A partitions, 3 Class B bulkheads, Class C hull segments, 2 breach points, 2 android racks, 2 objective markers). Coordinates in SVG px as listed in the pack. Bridge footprint: **7-point** generator polygon (Q6). Unmarked solid interior faces: `wallClass: "B"`, `role: "interior"` (Q1). Blast door edges: `isBlast: true`, `wallClass: "B"`, `presentation: "bulkhead"`. All 15 non-blast door edges: `wallClass: "B"`, `presentation: "interior"` (Q8). Per-node `accentId` exactly as **Accent table (binding)** (Q2). `onCriticalPath: true` only on `port-airlock`, `stbd-airlock`, `main-spine`, `engineering` (Q3). | `src/deck/data/deck03.json` | G1, G2, M1, M2, M4, M5, R1 |
| 4 | Implement `svgToWorld(sx, sy) → { x, z }`, `svgLengthToMeters(px)`, `rectSvgToWorld(rect)`, `polygonSvgToWorld(points)`. Deterministic; no rounding beyond IEEE float. Document that sim units = meters. | `src/deck/transform.ts` | G1, G6 |
| 5 | Implement `loadDeckDefinition(raw): DeckDefinition` (validate JSON shape; throw `DeckLoadError` with path on failure) and `buildDeckGraph(def): DeckGraph` (convert footprints to meters; index nodes by id; freeze/immutable result). Export `loadDeck03(): DeckGraph` that imports `./data/deck03.json`. | `src/deck/loadDeck.ts` | G1, G7, M3 |
| 6 | Implement topology-agnostic graph APIs in `graph.ts` exactly as in **Graph API** (neighbors, path exists, doors between, walls for room, breach nodes, section of, hull flag, accent, racks, objectives, `bordersClassA`, critical-path helpers). **Forbidden:** any function may hard-code room coordinates or SVG literals — all geometry comes from `DeckGraph`. | `src/deck/graph.ts` | G6, M1, M3 |
| 7 | Implement `validateDeckGraph(graph): ValidationReport` for the **P1 validation subset** (see **Validator rules**). Must cover: connected undirected door-graph; every node reachable from both breach points; exactly 2 breach points; every door edge and every wall segment has a `WallClass`; Engineering is Class-B-bounded; `CRITICAL_PATH_SET` exact match to Q3 set; `CRITICAL_PATH_A` — **airlocks only** each border ≥1 Class A wall; hull flags consistent. Rules 1–4 and 6 from §7 are **not** checked at P1. | `src/deck/validate.ts` | G2, M1, M3 |
| 8 | Implement collision: `buildCollisionWorld(graph): CollisionWorld` producing solid segments (AABB in XZ) for all wall segments + hull, **excluding** doorway opening intervals; bridge uses 7-point polygon edge segments; bulkhead segments use `BULKHEAD_THICKNESS_M`, others `WALL_THICKNESS_M` (Q7). `circleHitsWalls(world, x, z, radius): boolean`. Door passages always open at P1 (R1). | `src/deck/collision.ts` | G4, M1, R1 |
| 9 | Implement spawn (Q4): `computeSpawnPoint(graph, roomId)` — geometric center of airlock footprint, shifted `SPAWN_OFFSET_TOWARD_DOOR_M` (1.0 m) toward the center of the spine-side door opening, with yaw facing that door; `validateSpawnPoint` — inside footprint, `!circleHitsWalls(..., ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M)` with clearance **0.3 m**. Map breach profile enum onto node data (M4). `y = 0` for all marker poses. | `src/deck/spawn.ts` | G5, M4 |
| 10 | Implement `hashDeckGraph(graph): Promise<string>` — SHA-256 hex over deterministic JSON of `{ nodes (id-sorted), doorEdges (id-sorted), wallSegments (id-sorted), racks, objectives }` with **meter-space** geometry (not SVG). Stable key order. | `src/deck/hashDeck.ts` | G7 |
| 11 | Implement `spawnDeckEntities(state, graph): void` — spawn marker entities in **fixed order** (sorted objective ids, then rack ids, then breach ids) with kinds `objective-marker` \| `android-rack` \| `breach-point`, poses at marker world positions (`y = 0`). Uses existing `spawnEntity`. Identical loads → identical EntityId sequences. Do not put the full `DeckGraph` into `SimState` (keeps scaffold hash surface unchanged). | `src/deck/spawnDeckEntities.ts` | G7, M5 |
| 12 | Implement `createDeckScene(graph): DeckScene` — three.js blockout: void clear `#05080f`; warm key + cool fill (scaffold Cruise mood); per-room floor + **ceiling** (`ROOM_HEIGHT_M`) + walls from graph; accent tint from binding `accentId` → `ACCENT_HEX` (Q2 / VD §3); materials per **Blockout material treatments** (Q7); doorways leave open gaps. Ceilings on **every** room including spine, connector, bridge. | `src/render/createDeckScene.ts` | G3, M6 |
| 13 | Implement `createDebugFlyCamera(canvas): DebugFlyCamera` — PerspectiveCamera free-fly (WASD + mouse look while pointer locked, Q/E up/down, Shift sprint). Update each frame from real `dt` (render-only — **must not** call `applyCommands` / mutate `SimState`). Enable only when `isDebugFlyCameraEnabled()` is true (`import.meta.env.DEV && URLSearchParams has debugCamera=1`). | `src/render/debugFlyCamera.ts` | G8 |
| 14 | Extend `frameLoop.ts` with optional `onFrame?(dtSec)` callback invoked after sim ticks / before or after render so debug camera can update. Do not change fixed-timestep math. | `src/render/frameLoop.ts` | G8 |
| 15 | Wire `boot.ts`: `loadDeck03()` → `validateDeckGraph` (throw if invalid) → `spawnDeckEntities` → `createDeckScene` (replace `createPlaceholderScene` in boot path) → if debug flag, attach debug fly camera as active camera and `onFrame`. Keep fps overlay, command bus, devices, fixed tick. Leave `createPlaceholderScene.ts` in repo unused by boot (scaffold artifact). | `src/app/boot.ts` | G1, G2, G3, G5, G7, G8 |
| 16 | Write Vitest suite for E1–E20 and goal assertions under **Test / verification**. Use `deck03.json` + tiny invalid fixtures. | `tests/deck/**`, `tests/helpers/deckTestUtils.ts` | G1–G7, M1–M5 |
| 17 | Update root `README.md` with deck feature notes: `npm run dev`, `?debugCamera=1` for fly cam, verification commands. Do not rewrite scaffold sections — append a **Deck 03** subsection. | `README.md` | G1, G8 |
| 18 | Verify `npm run test:run` and `npm run build` green; smoke `npm run dev` shows tinted deck + ceilings; smoke `?debugCamera=1` fly-through. Do not commit. | — | G1–G8 |

*Traceability check: G1→T1–T5,T15,T16,T18; G2→T3,T7,T15,T16; G3→T1,T12,T15,T18; G4→T1,T8,T16; G5→T1,T9,T15,T16; G6→T2,T4,T6,T16; G7→T5,T10,T11,T16; G8→T1,T13–T15,T17,T18. M1↔G1/G2/G4/G6; M2↔G1/G2; M3↔G2/G6; M4↔G5; M5↔G1/G7; M6↔G3; R1↔G4/T3/T8; Q1–Q8 all landed with zero contradictions to KIMI RULINGS v1. All G1–G8 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts` — append)

```ts
/** Mockup scale bar: 120 px = 25 m (design pack rule 7). */
export const SCALE_PX = 120 as const;
export const SCALE_M = 25 as const;
export const M_PER_PX = SCALE_M / SCALE_PX; // 25/120

export const ORIGIN_SX = 0 as const;
export const ORIGIN_SY = 0 as const;

/** Blockout / collision wall thickness for interior, partition, hull (meters). */
export const WALL_THICKNESS_M = 0.3 as const;

/** Class B bulkhead extrusion thickness (meters) — double base (Q7). */
export const BULKHEAD_THICKNESS_M = WALL_THICKNESS_M * 2;

/** Interior floor-to-ceiling height (meters). Binding Q5. */
export const ROOM_HEIGHT_M = 3.0 as const;

/** Horizontal actor proxy radius for collision + spawn tests (meters). Binding Q4. */
export const ACTOR_PROXY_RADIUS_M = 0.4 as const;

/** Extra clearance beyond proxy radius required at spawn (meters). Binding Q4. */
export const SPAWN_CLEARANCE_M = 0.3 as const;

/** Shift from airlock footprint center toward spine-side door (meters). Binding Q4. */
export const SPAWN_OFFSET_TOWARD_DOOR_M = 1.0 as const;

/** Dev-only debug fly camera URL flag (G8). */
export const DEBUG_CAMERA_PARAM = 'debugCamera' as const;

/**
 * Binding accent hex map (Q2 / visual direction §3 v1.2).
 * Keys match AccentId in src/deck/types.ts.
 */
export const ACCENT_HEX = {
  engineering: '#ef5350',
  command: '#7986cb',
  ops: '#ffb74d',
  lifeSupport: '#4dd0e1',
  crew: '#ce93d8',
  hydro: '#81c784',
  armory: '#ff8a65',
  medical: '#80cbc4',
  comms: '#5c7cfa',
  mess: '#a1887f',
  corridor: '#8b949e',
  safe: '#69f0ae',
} as const;
```

### Schema (`src/deck/types.ts`)

```ts
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
  x: number; y: number; w: number; h: number; // SVG px
}

export interface PolygonFootprintSvg {
  kind: 'polygon';
  points: ReadonlyArray<readonly [number, number]>; // SVG px [sx, sy]
}

export type FootprintSvg = RectFootprintSvg | PolygonFootprintSvg;

export interface DeckNodeDef {
  id: string;                 // stable slug, e.g. "port-airlock"
  name: string;               // display label from pack
  section: DeckSection;
  footprint: FootprintSvg;
  accentId: AccentId;
  hullAdjacent: boolean;
  spawnSafe: boolean;         // true only for both airlocks
  breachPoint: boolean;       // true only for both airlocks
  breachProfile: BreachProfileId | null;
  /** Authored false for all nodes — spawn pose is computed (Q4), not stored as SVG. */
  onCriticalPath: boolean;    // Q3 set only
}

export interface DoorEdgeDef {
  id: string;                 // e.g. "door-spine-cargo"
  a: string;                  // node id
  b: string;                  // node id
  wallClass: WallClass;       // §7 r7 — every edge typed; all doors are B (Q8)
  presentation: DoorPresentation; // blast → bulkhead; others → interior (Q8)
  isBlast: boolean;           // true for Engineering↔spine and spine↔connector
  /** Door opening in SVG px (axis-aligned rect of the passage). */
  opening: { x: number; y: number; w: number; h: number };
}

export interface WallSegmentDef {
  id: string;
  wallClass: WallClass;
  role: WallRole;
  /** Axis-aligned segment in SVG px (box). */
  x: number; y: number; w: number; h: number;
  /** Rooms this segment bounds (1–2 node ids). */
  rooms: readonly string[];
}

export interface AndroidRackDef {
  id: string;                 // "rack-armory" | "rack-engineering"
  roomId: string;
  capacity: 3;                // literal 3 per pack M5
  /** Marker position SVG px. */
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

export interface DeckDefinition {
  id: 'deck-03';
  name: string;
  version: 1;
  scale: { px: 120; meters: 25 };
  nodes: DeckNodeDef[];       // length 18
  doorEdges: DoorEdgeDef[];   // length 17
  wallSegments: WallSegmentDef[];
  androidRacks: AndroidRackDef[]; // length 2
  objectives: ObjectiveMarkerDef[]; // length 2
}
```

Runtime graph uses the same ids with **meter-space** footprints:

```ts
export interface WorldRect { x: number; z: number; w: number; h: number } // x→X, y_svg→Z
export interface WorldVec2 { x: number; z: number }

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
  opening: WorldRect; // open passage — no collider
}

export interface WallSegment {
  id: string;
  wallClass: WallClass;
  role: WallRole;
  rect: WorldRect; // solid collider footprint in XZ (thickness applied at build)
  rooms: readonly string[];
}

export interface DeckGraph {
  readonly id: 'deck-03';
  readonly nodes: ReadonlyMap<string, DeckNode>;
  readonly doorEdges: readonly DoorEdge[];
  readonly wallSegments: readonly WallSegment[];
  readonly androidRacks: readonly { id: string; roomId: string; capacity: 3; position: WorldVec2 }[];
  readonly objectives: readonly { id: string; roomId: string; kind: ObjectiveKind; position: WorldVec2 }[];
}
```

### Canonical node ids (exact strings in JSON)

| Pack # | `id` | Notes |
|--------|------|-------|
| 1 | `port-engine` | hullAdjacent |
| 2 | `stbd-engine` | hullAdjacent |
| 3 | `engineering` | primary objective; rack; Class-B bounded; **onCriticalPath** (Q3) |
| 4 | `main-spine` | pacing axis; **onCriticalPath** (Q3) |
| 5 | `port-airlock` | breach; spawnSafe; profile `port-cargo-armory`; **onCriticalPath** (Q3); r8-checked |
| 6 | `cargo-hold` | hullAdjacent |
| 7 | `armory` | rack; hullAdjacent |
| 8 | `med-bay` | hullAdjacent |
| 9 | `life-support` | hullAdjacent |
| 10 | `barracks` | hullAdjacent |
| 11 | `stbd-airlock` | breach; spawnSafe; profile `stbd-life-barracks`; **onCriticalPath** (Q3); r8-checked |
| 12 | `hydroponics` | hullAdjacent |
| 13 | `mess` | hullAdjacent |
| 14 | `fore-connector` | off-path at P1 (Q3) |
| 15 | `officer-qtrs` | off-path at P1 (Q3) |
| 16 | `cic` | off-path at P1 (Q3) |
| 17 | `comms-nav` | off-path at P1 (Q3) |
| 18 | `bridge` | secondary objective; hullAdjacent; polygon; off-path at P1 (Q3) |

### Door edges (17 — exact pairs)

**Non-blast (15)** — open at P1 (R1); `wallClass: "B"`, `presentation: "interior"` (Q8):  
`main-spine`↔`port-airlock`, `cargo-hold`, `armory`, `med-bay`, `life-support`, `barracks`, `stbd-airlock`, `hydroponics`, `mess`;  
`engineering`↔`port-engine`, `engineering`↔`stbd-engine`;  
`cic`↔`officer-qtrs`, `cic`↔`comms-nav`, `cic`↔`bridge`;  
`fore-connector`↔`cic`.

**Blast (2)** — open at P1 (R1); `wallClass: "B"`, `presentation: "bulkhead"`, `isBlast: true` (Q8 / §6.1):  
`engineering`↔`main-spine` (aft); `main-spine`↔`fore-connector` (fore).

Opening rects: take from `gen_ship_svg.py` door placements (px), e.g. spine top-row doors centered at x ∈ {401,497,623,739}, y=381, 14×8; bottom-row {421,527,613,686,761}, y=411; etc. Composer copies those numbers into JSON — do not invent new openings.

### Class A partitions (9) — `wallClass: "A"`, `role: "partition"`

From pack / generator `part_gaps` + fore partitions:

| id | SVG box (x,y,w,h) | rooms |
|----|-------------------|-------|
| `wall-a-port-airlock-cargo` | 430, 288, 8, 94 | port-airlock, cargo-hold |
| `wall-a-cargo-armory` | 556, 288, 8, 94 | cargo-hold, armory |
| `wall-a-armory-med` | 682, 288, 8, 94 | armory, med-bay |
| `wall-a-life-barracks` | 470, 418, 8, 94 | life-support, barracks |
| `wall-a-barracks-stbd-airlock` | 576, 418, 8, 94 | barracks, stbd-airlock |
| `wall-a-stbd-airlock-hydro` | 642, 418, 8, 94 | stbd-airlock, hydroponics |
| `wall-a-hydro-mess` | 722, 418, 8, 94 | hydroponics, mess |
| `wall-a-officer-cic` | 822, 327, 103, 8 | officer-qtrs, cic |
| `wall-a-cic-comms` | 822, 465, 103, 8 | cic, comms-nav |

### Class B bulkhead bands (3) — `wallClass: "B"`, `role: "bulkhead"` (Q1 — only these are section bounds)

| id | SVG box | notes |
|----|---------|-------|
| `wall-b-aft-rear` | 117, 296, 7, 208 | aft rear |
| `wall-b-mid-aft` | 349, 268, 7, 264 | midships \| aft |
| `wall-b-mid-fore` | 812, 268, 7, 264 | midships \| fore |

### Class C hull

Author wall segments along the outer perimeter of hull-adjacent rooms (port/stbd outer long edges + engine aft face + bridge nose edges) with `wallClass: "C"`, `role: "hull"`. Exact segment list must cover every `hullAdjacent` room with ≥1 Class C segment. Prefer one segment per exterior face (axis-aligned), plus bridge polygon exterior edges as dedicated polygon-edge colliders in `collision.ts` (bridge only).

### Unmarked solid interior faces (Q1 — binding)

All remaining inter-room / room-to-spine faces that are not door openings and not in the A / bulkhead-B / C lists above: author as `wallClass: "B"`, `role: "interior"`. Identical immunity to bulkheads; **not** section bounds / gating firewall. Only the three `role: "bulkhead"` bands (plus blast door edges) are the §7 r7 firewall.

### Accent table (binding — Q2)

| Node id | `accentId` | Hex |
|---------|------------|-----|
| `port-engine` | `engineering` | `#ef5350` |
| `stbd-engine` | `engineering` | `#ef5350` |
| `engineering` | `engineering` | `#ef5350` |
| `main-spine` | `corridor` | `#8b949e` |
| `port-airlock` | `safe` | `#69f0ae` |
| `cargo-hold` | `ops` | `#ffb74d` |
| `armory` | `armory` | `#ff8a65` |
| `med-bay` | `medical` | `#80cbc4` |
| `life-support` | `lifeSupport` | `#4dd0e1` |
| `barracks` | `crew` | `#ce93d8` |
| `stbd-airlock` | `safe` | `#69f0ae` |
| `hydroponics` | `hydro` | `#81c784` |
| `mess` | `mess` | `#a1887f` |
| `fore-connector` | `corridor` | `#8b949e` |
| `officer-qtrs` | `crew` | `#ce93d8` |
| `cic` | `command` | `#7986cb` |
| `comms-nav` | `comms` | `#5c7cfa` |
| `bridge` | `command` | `#7986cb` |

Render: floor/ceiling/wall trim use hull-steel base with accent from `ACCENT_HEX[accentId]` as emissive intensity ~0.15–0.35 or a second material on a trim band — enough that room identity is readable in screenshots (G3). Corridor-neutral spine/connector must read muted against section/function accents.

### Bridge footprint (Q6 — binding)

Canonical polygon (SVG px), exact generator points — use for definition, floor, ceiling, and collision:

```
[933,352], [1044,374], [1104,395], [1112,400], [1104,405], [1044,426], [933,448]
```

Do **not** use the pack’s 3-point wedge shorthand.

### Critical path (Q3 — binding)

| Flag / check | Nodes |
|--------------|-------|
| `onCriticalPath: true` | **exactly** `{ port-airlock, stbd-airlock, main-spine, engineering }` |
| `onCriticalPath: false` | all other 14 nodes (incl. entire fore: connector, CIC, officer qtrs, comms/nav, bridge) |
| §7 r8 Class-A adjacency (`CRITICAL_PATH_A`) | **airlocks only** — `port-airlock` and `stbd-airlock` each must `bordersClassA` (each borders ≥1 Class A partition — satisfied by `wall-a-port-airlock-cargo` and `wall-a-barracks-stbd-airlock` / `wall-a-stbd-airlock-hydro`) |
| Exempt from r8 check | `main-spine` (pacing axis; flanking via room-row Class A chains), `engineering` (Class-B-bounded objective heart), all fore nodes (off-path at P1) |

Re-evaluate this set when `p2-lockdown` lands (out of scope here).

### Blockout material treatments (Q7 — binding)

| Kind | Material / geometry |
|------|---------------------|
| **B interior** | Hull-steel `#1a232e`–`#2a3644` (use `#1f2a36` default), single thickness `WALL_THICKNESS_M` |
| **B bulkhead** | Base `#2c3947` + trim `#5c7186` (rivet-band motif), thickness `BULKHEAD_THICKNESS_M` |
| **A partition** | Hull-steel body + `#39434e` cap/trim + thin section/function-accent edge strip from the adjacent room’s `accentId` |
| **C hull** | Hull-steel gradient within `#1a232e`–`#2a3644` + armor-trim `#5c7186` inset motif |

No new colors outside mockup v2.2 / VD §3. `MeshStandardMaterial` metalness/roughness; no authored textures.

### Transform (`src/deck/transform.ts`)

```ts
export function svgToWorld(sx: number, sy: number): WorldVec2;
export function svgLengthToMeters(px: number): number;
export function rectSvgToWorld(r: RectFootprintSvg): WorldRect;
export function polygonSvgToWorld(points: ReadonlyArray<readonly [number, number]>): WorldVec2[];
```

Formulas:
- `x = (sx - ORIGIN_SX) * M_PER_PX`
- `z = (sy - ORIGIN_SY) * M_PER_PX`
- rect: `{ x, z, w: w*M_PER_PX, h: h*M_PER_PX }` where `h` is SVG height → world Z extent

### Graph API (`src/deck/graph.ts`) — G6 contract

```ts
export function getNode(graph: DeckGraph, id: string): DeckNode;
export function listNodes(graph: DeckGraph): readonly DeckNode[];
export function neighbors(graph: DeckGraph, id: string): readonly string[];
export function doorBetween(graph: DeckGraph, a: string, b: string): DoorEdge | undefined;
export function listDoorEdges(graph: DeckGraph): readonly DoorEdge[];
export function wallsForRoom(graph: DeckGraph, roomId: string): readonly WallSegment[];
export function listWallSegments(graph: DeckGraph): readonly WallSegment[];
export function breachNodes(graph: DeckGraph): readonly DeckNode[]; // length 2
export function sectionOf(graph: DeckGraph, id: string): DeckSection;
export function isHullRoom(graph: DeckGraph, id: string): boolean;
export function accentOf(graph: DeckGraph, id: string): AccentId;
export function pathExists(graph: DeckGraph, from: string, to: string): boolean; // BFS on door edges
export function allReachableFrom(graph: DeckGraph, from: string): ReadonlySet<string>;
export function bordersClassA(graph: DeckGraph, roomId: string): boolean;
export function criticalPathNodes(graph: DeckGraph): readonly DeckNode[];
export function androidRacks(graph: DeckGraph): DeckGraph['androidRacks'];
export function objectives(graph: DeckGraph): DeckGraph['objectives'];
```

Mission-logic and render/collision **must** call these (or `DeckGraph` fields populated only via `buildDeckGraph`). Stage 4 will grep for numeric SVG layout literals under `src/render/` and `src/deck/collision.ts` — only `deck03.json` + transform tests may contain the canonical coordinates.

### Validator (`src/deck/validate.ts`)

```ts
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

export function validateDeckGraph(graph: DeckGraph): ValidationReport;
```

**P1 checks (all must pass for `deck03`):**

| Code | Rule |
|------|------|
| `NODE_COUNT` | `nodes.size === 18` |
| `DOOR_COUNT` | `doorEdges.length === 17` |
| `CLASS_A_COUNT` | count wallSegments with A === 9 |
| `CLASS_B_BULKHEAD_COUNT` | count role `bulkhead` === 3 |
| `CONNECTED` | undirected door graph is a single connected component |
| `REACH_FROM_BREACH` | every node reachable from each of the 2 breach nodes |
| `BREACH_COUNT` | exactly 2 nodes with `breachPoint === true` |
| `EDGE_TYPED` | every door edge has wallClass A\|B\|C |
| `DOOR_CLASS_B` | every door edge has `wallClass === 'B'`; non-blast ⇒ `presentation === 'interior'`; blast ⇒ `presentation === 'bulkhead'` (Q8) |
| `WALL_TYPED` | every wall segment has wallClass A\|B\|C |
| `ENGINEERING_B_BOUND` | Engineering’s bounding wall segments are all B (roles bulkhead/interior); blast doors touching Engineering are B + bulkhead presentation |
| `CRITICAL_PATH_SET` | nodes with `onCriticalPath === true` are exactly `P1_CRITICAL_PATH_IDS` (Q3) |
| `CRITICAL_PATH_A` | for each id in `P1_CRITICAL_PATH_CLASS_A_CHECK_IDS`, `bordersClassA(graph, id) === true` (Q3 / §7 r8). Do **not** require Class A adjacency for spine or Engineering |
| `HULL_FLAGS` | every `hullAdjacent` node has ≥1 incident Class C wall segment; no non-flagged node has Class C |

### Collision (`src/deck/collision.ts`)

```ts
export interface CollisionWorld {
  /** Solid AABB segments in XZ (walls + hull). */
  aabbs: readonly WorldRect[];
  /** Extra solid segments for bridge polygon edges (line-expanded by thickness/2). */
  polyEdges: readonly { ax: number; az: number; bx: number; bz: number }[];
}

export function buildCollisionWorld(graph: DeckGraph): CollisionWorld;
export function circleHitsWalls(world: CollisionWorld, x: number, z: number, radius: number): boolean;
/** Returns true if the open passage for this door has no solid collider covering its opening center. */
export function doorPassageClear(graph: DeckGraph, world: CollisionWorld, doorId: string): boolean;
```

Rules:
- Door `opening` rects (expanded slightly inward) are **subtracted** / omitted from solid walls — actors may pass (R1), including both blast doors.
- Class A partitions are **solid** at P1 (no damage).
- Bulkhead wall segments / blast presentations use `BULKHEAD_THICKNESS_M`; other solids use `WALL_THICKNESS_M` (Q7).
- Test proxy uses `ACTOR_PROXY_RADIUS_M`.

### Spawn (`src/deck/spawn.ts`) — Q4 binding

```ts
export interface SpawnPoint {
  roomId: string;
  profile: BreachProfileId;
  x: number;
  z: number;
  /** Radians, Y-up world: facing the spine-side door center from the spawn point. */
  yaw: number;
}

export interface SpawnValidation {
  ok: boolean;
  issues: string[];
}

/**
 * Compute spawn for a spawn-safe airlock (Q4):
 * 1. Footprint geometric center (XZ).
 * 2. Find door edge between this airlock and `main-spine`.
 * 3. Shift center by SPAWN_OFFSET_TOWARD_DOOR_M (1.0 m) toward that opening's center.
 * 4. yaw = atan2 toward that opening center (squad faces ship interior; hull breach at backs).
 */
export function computeSpawnPoint(
  graph: DeckGraph,
  roomId: 'port-airlock' | 'stbd-airlock',
): SpawnPoint;

export function validateSpawnPoint(
  graph: DeckGraph,
  world: CollisionWorld,
  spawn: SpawnPoint,
): SpawnValidation;
```

`validateSpawnPoint` requires: room is `spawnSafe`; point inside footprint; `!circleHitsWalls(..., ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M)` (0.4 + 0.3). Do not store spawn SVG in JSON — compute from graph.

### Hash (`src/deck/hashDeck.ts`)

```ts
export function hashDeckGraph(graph: DeckGraph): Promise<string>;
```

### Deck scene (`src/render/createDeckScene.ts`)

```ts
export interface DeckScene {
  scene: THREE.Scene;
  /** Default review camera (static elevated view of midships) — NOT gameplay ~60° rig. */
  camera: THREE.PerspectiveCamera;
  /** Room mesh groups keyed by node id (ceilings named `ceiling:<id>`). */
  roomGroups: ReadonlyMap<string, THREE.Group>;
}

export function createDeckScene(graph: DeckGraph): DeckScene;
```

Static default camera: position above midships looking at spine center — for Gate 1 screenshots when debug fly is off. When debug fly is on, boot uses the fly camera instead.

### Debug fly camera (`src/render/debugFlyCamera.ts`)

```ts
export function isDebugFlyCameraEnabled(): boolean;
export function createDebugFlyCamera(canvas: HTMLCanvasElement): {
  camera: THREE.PerspectiveCamera;
  update(dtSec: number): void;
  dispose(): void;
};
```

### Boot integration

```ts
// boot.ts (conceptual order)
const graph = loadDeck03();
const report = validateDeckGraph(graph);
if (!report.ok) throw new Error(...);
const world = createWorld();
spawnDeckEntities(world, graph);
const deckScene = createDeckScene(graph);
let camera = deckScene.camera;
let onFrame: ((dt: number) => void) | undefined;
if (isDebugFlyCameraEnabled()) {
  const fly = createDebugFlyCamera(canvas);
  camera = fly.camera;
  onFrame = (dt) => fly.update(dt);
}
startFrameLoop({ ..., scene: deckScene.scene, camera, onFrame });
```

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Load `deck03.json` | 18 nodes, 17 door edges, 9×A, 3× bulkhead B; all 15 non-blast doors B/interior; 2 blast B/bulkhead | `loadDeck.test.ts` |
| E2 | Spine length in meters | `main-spine` footprint `w` → `95.8 ± 0.5` m | `loadDeck.test.ts` |
| E3 | Scale round-trip | `svgLengthToMeters(120) === 25` | `loadDeck.test.ts` |
| E4 | Validator on deck03 | `report.ok === true` | `validate.test.ts` |
| E5 | Fixture: remove one door edge | `CONNECTED` or `REACH_FROM_BREACH` fails | `validate.test.ts` |
| E6 | Fixture: third breach flag | `BREACH_COUNT` fails | `validate.test.ts` |
| E7 | Fixture: untyped / Class-A door edge | `EDGE_TYPED` or `DOOR_CLASS_B` fails | `validate.test.ts` |
| E8 | Fixture: Engineering gains Class A outer wall | `ENGINEERING_B_BOUND` fails | `validate.test.ts` |
| E9 | Circle centered inside cargo, pushed into Class A wall | `circleHitsWalls` true | `collision.test.ts` |
| E10 | Circle swept through every door opening center (all 17, incl. both blast) | never hits walls at opening centers; `doorPassageClear` true | `collision.test.ts` |
| E11 | Circle outside hull (beyond Class C) | hits hull collider | `collision.test.ts` |
| E12 | Bridge interior point vs exterior point (7-point polygon) | interior clear; exterior hits poly edge | `collision.test.ts` |
| E13 | `computeSpawnPoint` both airlocks | inside room; offset 1.0 m toward spine door; yaw faces door; profiles match M4; validate ok | `spawn.test.ts` |
| E14 | Spawn moved onto wall | `ok === false` | `spawn.test.ts` |
| E15 | Graph API: `pathExists(port-airlock, engineering)` true; `neighbors` matches door list; `graph.ts` contains no SVG layout numeric literals | `graphApi.test.ts` |
| E16 | Two `loadDeck03` + `hashDeckGraph`; two `createWorld`+`spawnDeckEntities` | identical hashes; identical EntityId sequences for markers | `hashDeck.test.ts` |
| E17 | `isDebugFlyCameraEnabled` without DEV or without param | false | unit test with mocked `import.meta.env` / location if feasible; else document manual |
| E18 | Boot without debug flag | uses static deck camera; fly controls inactive | manual smoke |
| E19 | Critical path set | `onCriticalPath` ids === `P1_CRITICAL_PATH_IDS` exactly | `validate.test.ts` |
| E20 | §7 r8 at P1 | both airlocks `bordersClassA`; spine and Engineering may fail `bordersClassA` without failing validator | `validate.test.ts` |

---

## Test / verification requirements

Composer must run **all** of the following before opening the PR.

### Automated (required green)

```bash
npm install
npm run test:run
npm run build
```

| Goal | Assertion (minimum) |
|------|---------------------|
| G1 | E1–E3 pass |
| G2 | E4–E8, E19–E20 pass |
| G4 | E9–E12 pass |
| G5 | E13–E14 pass |
| G6 | E15 pass; Stage 4 will also manually confirm collision/render consume graph APIs |
| G7 | E16 pass |
| G8 | E17 pass or documented; smoke E18 |

### Manual / smoke (required evidence in PR body)

```bash
npm run dev
# then open with ?debugCamera=1
```

1. Deck blockout visible: floors, walls, **ceilings** (orbit/fly below a room to confirm ceiling meshes) — G3 / M6.
2. Per-room accent tints readable per binding table (Engineering red, Armory coral, Med medical teal, corridor-neutral spine, Safe airlocks, etc.) — G3 / Q2.
3. Bulkheads read thicker/darker than interior B; Class A shows accent edge strip — G3 / Q7.
4. Without `?debugCamera=1`, static review camera; with flag, free-fly works and does not require gameplay controller — G8.
5. Screenshot(s) attached to PR for Gate 1.

### PR body must cite

- Spec version (`SPEC v1`), goals G1–G8, mechanics M1–M6, ruling R1
- Link to `features/p1-deck-geometry/clarification-log.md` (KIMI RULINGS v1)
- Design doc **v1.11**, visual direction **v1.2**
- `npm run test:run` + `npm run build` summary
- Screenshots: tinted deck + ceiling evidence + debug fly note

Branch: `feat/p1-deck-geometry` → PR to `integration`.

---

## Out of scope (Composer must NOT touch)

**From design pack non-goals (enforce):**

- No player movement, aim, or ~60° gameplay camera rig — `p1-player-controller`. Debug fly camera (G8) is review scaffolding only.
- No combat, enemies, AI, spawners, alarm.
- No door open/close, lockdown, gating, keys — R1: all doorways are open passages; blast doors are geometry + Class-B bulkhead-typed edges only.
- No wall damage/HP/destruction, breaching, depressurization — Class A walls are **solid** at P1.
- No procedural layout generator — validator only.
- No android unit behavior — rack **markers/data only** (M5).
- No mission objectives logic, PA, or gameplay HUD (fps overlay remains scaffold Gate evidence only).

**Also out of scope:**

- Editing `docs/design/**`, `docs/team/**`, this feature’s `design-pack.md`, or other `features/*` packs.
- Runtime SVG parsing of `assets/mockups/*.svg` or editing `tools/mockups/gen_ship_svg.py`.
- Physics engines (Rapier, cannon, etc.), navmeshes, pathfinding beyond BFS for validation.
- Networking / multiplayer.
- Replacing Vitest, Vite, or three.js version pins from the scaffold.
- Changing scaffold command vocabulary, hash surface fields, or tick rate.
- Committing to `master` / `integration`; Composer uses `feat/p1-deck-geometry` only.
- Implementing P2/P3/P4 mechanics “because the data is there.”
- Re-expanding the P1 critical path to fore nodes (deferred to `p2-lockdown` per Q3).

---

*Clarification for this spec: see `clarification-log.md` in this folder (KIMI RULINGS v1 — all resolved).*
