# Technical Specification — p1-enemy-baseline

`SPEC v1 FINAL | feature p1-enemy-baseline | charter v1.13 | design doc v1.14 | design pack v1 | goals: G1..G10 | mechanics: M1..M8`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.14** · visual direction **v1.5** · design pack **v1** (G1–G10, M1–M8, R1–R11) · feature roadmap **v1.7** (P1 #5) · shipped deps: `p1-project-scaffold`, `p1-deck-geometry`, `p1-player-controller`, `p1-combat-core` (+ `p1-combat-readability` telegraphs) · clarification log **all resolved (no questions)** · AGENTS.md current

### Clarification rulings incorporated

None raised — design pack v1 + design doc v1.14 + visual v1.5 fully settle G1–G10 / M1–M8 / R1–R11. Pre-answered pack topics (pathfinding representation, LKP refresh, simultaneous attackers, doorway crowding, dev-overlay) are accepted as Technical Lead bindings below. Gaps below (path algorithm, spawn-table JSON shape, tick order, projectile allegiance filter API, seeded spread PRNG, LKP seed on no-LOS alarm trips) are Technical Lead authority only and are required by pack acceptance language (especially G7).

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | — | — |

Composer may start Stage 3 on branch `feat/p1-enemy-baseline`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Stand-in disposition (R1) | **Delete** `src/combat/spawnStandIns.ts` and all call sites. Replace with deck spawn-table → `spawnCrew(state, graph)`. Rename `meta.standInIds` → `meta.crewIds` (ordered, length 8). | G6, R1 |
| Spawn / patrol data | Author `crewSpawnTable` on `DeckDefinition` / `deck03.json` (SVG waypoint coords, converted via existing `svgToWorld`). Loaded into `DeckGraph.crewSpawnTable`. Spawner is sole crew source. | G2, G6, M5, R2, §12.2 |
| Pathfinding | **Room-graph A\*** over door-edge adjacency (`neighbors` / `doorBetween`), then steer along polyline: current pos → door opening centers → goal. Intra-room / along-spine motion = straight-line steps with wall circle tests (player pattern). No navmesh. | R11, G4, G9 |
| AI state storage | `state.crewAi: Map<EntityId, CrewAiState>` cloned for replay; hashed. Entity pose/HP stay on `Entity`. | G1, G9 |
| Alarm | `meta.alarmLevel: 0 \| 1` (start 0). Shared LKP: `meta.lkpValid`, `meta.lkpX`, `meta.lkpZ`. Never de-escalate. No door/lockdown side effects. | G7, M6, R7 |
| LKP seed on no-LOS trips | On any AL0→AL1 trip, if player alive, set LKP to **player pose that tick** and `lkpValid=true`. While any living crew has LOS, refresh LKP to player pose every tick. | G7 acceptance; pack LKP note |
| Tick order | `applyCommands` → `integratePlayerMotion` → **`integrateCrewAi`** → `integrateCombat` → `fixedStep`. Same in frame loop + replay. | G9; perception after player move; shots after AI wind-up |
| Hostile projectiles (R6) | Shared projectile motion/collision; `earliestSegmentHit` takes target filter from owner kind: player-owned → living `SECURITY_CREW_KIND` only; crew-owned → living `PLAYER_KIND` only; walls always. Damage from owner kind: player `RIFLE_DAMAGE_PER_HIT` (25), crew `CREW_SIDEARM_DAMAGE` (10). | G5, G8, M4, R6 |
| Spread | Deterministic mulberry32-style PRNG: seed = `hashCombine(SIM_SPREAD_SEED, tick, ownerId, shotIndex)`. Half-angle ≤ 4° (`CREW_SIDEARM_SPREAD_HALF_DEG`). No `Math.random`. | G5, G9, R5 |
| Crew fire cadence | On enter ATTACK: `windupTicksRemaining = CREW_ATTACK_WINDUP_TICKS` (30). Fire only when windup===0 and cooldown===0; then spawn + `fireCooldownTicks = CREW_FIRE_INTERVAL_TICKS` (54). Leave ATTACK → clear windup so next engagement re-telegraphs. Infinite ammo. | G5, M4, R5 |
| Movement speeds | PATROL 2.0 / INVESTIGATE 3.5 / CHASE 4.5 / ATTACK 0. Constants in `config.ts`. Facing while moving = travel yaw; ATTACK faces player. | G2, G4, R4 |
| Actor crowding (R11) | Before accepting a crew step, reject if new circle overlaps player or any other living crew (r=0.4). Hold position (no slide). Deterministic unstuck = hold (no random shove). | R11 |
| Perception | Per living crew: if player alive, dist≤20, angle within ±55° of facing, and `earliestWallHit` along crew→player clears full segment → accumulate LOS ticks; else reset. At `CREW_DETECTION_DELAY_TICKS` (15) → detect. | G3, M2, R3 |
| Presentation | Extend telegraphs: hostile tracer halo `#ff5252` by projectile owner; wind-up pre-glow event → render-only light/emissive 0.5 s; muzzle flash reuse combat VFX; `TRACER_MAX_CONCURRENT` → 24. Zero sim writes from render. | G10, M8, R9 |
| DEV overlay | Extend combat DEV readout: `AL0/AL1`, LKP flag, per-crew `id:STATE` list. Still DEV-only; not HUD. | G1, G7; pack non-goal HUD |
| Combat-core regression | All prior combat/input/telegraph suites stay green; stand-in-specific tests rewritten to 8-crew spawner semantics. | G8 |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not rename scaffold/deck/player packages. Do not invent top-level packages beyond `src/ai/` (new) for crew FSM/pathing/perception.

```
/
├── src/
│   ├── config.ts                         # EXTEND: crew / alarm / perception / sidearm constants
│   ├── deck/
│   │   ├── data/deck03.json              # EXTEND: crewSpawnTable (8 posts + waypoints, SVG)
│   │   ├── types.ts                      # EXTEND: CrewSpawnPostDef / table on DeckDefinition + DeckGraph
│   │   ├── loadDeck.ts                   # EXTEND: parse + convert spawn table
│   │   ├── validate.ts                   # EXTEND: validate 8 posts, rooms, clearance, loops
│   │   └── graph.ts                      # EXTEND: shortestPathRooms(graph, from, to) if not colocated with ai/
│   ├── sim/
│   │   ├── types.ts                      # EXTEND: meta alarm/LKP/crewIds; SimState.crewAi
│   │   ├── world.ts                      # EXTEND: defaults; clone crewAi + projectile maps
│   │   ├── hash.ts                       # EXTEND: alarm, LKP, crewIds, crewAi fields
│   │   ├── replay.ts                     # EXTEND: call integrateCrewAi in tick order
│   │   └── step.ts                       # KEEP player verbs; alarm trips may hook via combat/ai
│   ├── combat/
│   │   ├── spawnStandIns.ts              # DELETE (R1)
│   │   ├── spawnCrew.ts                  # NEW: spawn 8 from table (G6)
│   │   ├── integrateCombat.ts            # EXTEND: crew fire; alarm on player shot; damage amount by owner
│   │   ├── projectileCollision.ts        # EXTEND: owner-side target filter (R6)
│   │   ├── applyDamage.ts                # EXTEND: trip AL1 on crew damage (R7)
│   │   └── types.ts                      # EXTEND: CombatEvent windup-glow (optional) / muzzle already exists
│   ├── ai/                               # NEW package
│   │   ├── types.ts                      # CrewAiState, AiState enum
│   │   ├── constants via config          # (no duplicate magic numbers)
│   │   ├── perception.ts                 # LOS cone + delay (M2)
│   │   ├── pathing.ts                    # room A* + steer polyline (R11)
│   │   ├── alarm.ts                      # tripAlarm / LKP helpers (M6)
│   │   └── integrateCrewAi.ts            # FSM + move + ATTACK wind-up bookkeeping (M1/M3)
│   ├── render/
│   │   ├── combatTelegraphs.ts           # EXTEND: hostile tracer halo; wind-up pre-glow sync
│   │   ├── combatVfx.ts                  # EXTEND: ingest wind-up / hostile muzzle if needed
│   │   ├── combatDevReadout.ts           # EXTEND: alarm + AI states
│   │   ├── createStandInMesh.ts          # KEEP (reuse as crew mesh factory; rename optional, not required)
│   │   ├── frameLoop.ts                  # EXTEND: integrateCrewAi in order
│   │   └── …
│   └── app/
│       └── boot.ts                       # EXTEND: spawnCrew; mesh all crewIds; readout
└── tests/
    ├── ai/
    │   ├── fsm.test.ts                   # G1, G4
    │   ├── perception.test.ts            # G3
    │   ├── pathing.test.ts               # G4, R11
    │   ├── patrol.test.ts                # G2
    │   ├── attack.test.ts                # G5
    │   ├── alarm.test.ts                 # G7
    │   └── determinism.test.ts           # G9
    ├── combat/
    │   ├── standIns.test.ts              # REWRITE → spawnCrew.test.ts (G6)
    │   ├── damage.test.ts                # EXTEND: crew→player 10 dmg; no friendly fire (G8, R6)
    │   ├── deathRespawn.test.ts          # KEEP green (player death from crew fire path)
    │   ├── projectiles.test.ts           # EXTEND: crew projectile filter
    │   ├── telegraphs.test.ts            # EXTEND: hostile halo + wind-up
    │   └── …                             # ALL prior combat-core suites green
    ├── deck/
    │   └── crewSpawnTable.test.ts        # NEW: table load/validate (G2, G6)
    └── helpers/
        └── combatTestUtils.ts            # EXTEND: spawnCrew; runTicks includes integrateCrewAi
```

Do **not** edit `docs/`, `assets/` (except if pack assets — none), `tools/mockups/`, or other feature folders’ design packs. Do not change three.js / Vitest / Vite pins.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Extend `src/config.ts` with **Constants** below exactly. No other magic numbers for crew/alarm/perception/sidearm tunables. Raise `TRACER_MAX_CONCURRENT` from 12 → **24**. | `src/config.ts` | G2–G5, G7, G10, M2–M6, M8, R3–R5, R9 |
| 2 | Add deck spawn-table types + JSON for 8 posts per **Spawn table (binding)**. Parse/convert SVG→world in `loadDeck`; expose on `DeckGraph`. | `deck03.json`, `types.ts`, `loadDeck.ts` | G2, G6, M5, R1, R2 |
| 3 | Validate spawn table: exactly 8 posts; ids/rooms per binding; each waypoint/spawn inside authored `homeRoomId` (spine rovers: waypoints in `main-spine`); clearance `ACTOR_PROXY_RADIUS_M + SPAWN_CLEARANCE_M`; loops length ≥ 2; fail deck validate on error. | `src/deck/validate.ts`, tests | G2, G6, M5 |
| 4 | Extend `WorldMeta`: `crewIds` (replace `standInIds`), `alarmLevel`, `lkpValid`, `lkpX`, `lkpZ`. Extend `SimState` with `crewAi: Map<EntityId, CrewAiState>`. Defaults: alarm 0, lkp invalid, crewIds `[]`, empty crewAi. Update `cloneSimState` if present. | `src/sim/types.ts`, `src/sim/world.ts` | G1, G6, G7, G9 |
| 5 | Extend `hash.ts` with alarm/LKP/crewIds + sorted crewAi snapshot (state, timers, waypoint index, facing bookkeeping — all numeric fields listed in **CrewAiState**). | `src/sim/hash.ts` | G9 |
| 6 | Implement `tripAlarm(state, reason)` / LKP helpers in `src/ai/alarm.ts`: AL0→AL1 only once; set LKP from living player; never downgrade. | `src/ai/alarm.ts` | G7, M6, R7 |
| 7 | Implement perception: `hasLineOfSight`, `isInSightCone`, `updateDetectionTimer` per **Perception API**. LOS uses `earliestWallHit` (all wall classes). | `src/ai/perception.ts` | G3, M2, R3 |
| 8 | Implement room-graph pathing: `shortestRoomPath`, `buildSteerPathToPoint`, `steerCrewStep` per **Pathing API**. Door traversal via opening centers; never through walls. | `src/ai/pathing.ts`, optionally `graph.ts` | G4, M3, R11 |
| 9 | Implement `spawnCrew(state, graph): EntityId[]` — delete `spawnStandIns.ts`; spawn order = table order; HP 100; AI PATROL; store `meta.crewIds`. Validate non-overlap at spawn (± clearance between posts). | `src/combat/spawnCrew.ts` (NEW), delete `spawnStandIns.ts` | G2, G6, M5, R1 |
| 10 | Implement `integrateCrewAi(state, collisionWorld, graph): CrewAiEvent[]` per **Crew AI integrate API** (FSM, move, wind-up timers, detection→alarm, AL1 converge). Emit render events for wind-up start/stop only. | `src/ai/integrateCrewAi.ts`, `src/ai/types.ts` | G1–G5, G7, M1–M4, M6, R4, R7, R8 |
| 11 | Extend `projectileCollision.earliestSegmentHit` with owner-kind target filter (R6). Player shots hit crew; crew shots hit player only; both hit walls; skip owner; skip dead. | `src/combat/projectileCollision.ts` | G5, G8, R6 |
| 12 | Extend `integrateCombat`: (a) on player projectile spawn → `tripAlarm`; (b) after player fire, process each living ATTACK crew with windup===0 & cooldown===0 → spawn crew projectile (damage 10, seeded spread yaw); (c) projectile hits apply damage by owner kind; (d) keep respawn/reload/player fire semantics unchanged. | `src/combat/integrateCombat.ts` | G5, G7, G8, M4, R5, R6, R7 |
| 13 | Extend `applyDamage`: when target is living `SECURITY_CREW_KIND` and damage applied → `tripAlarm` (crew-damage trip). Player death/respawn unchanged. | `src/combat/applyDamage.ts` | G7, G8, M7, R7 |
| 14 | Wire tick order in `frameLoop.ts` + `replay.ts`: motion → **crewAi** → combat → fixedStep. Forward `CrewAiEvent` / combat events to VFX/telegraphs only in frame loop. | `src/render/frameLoop.ts`, `src/sim/replay.ts` | G9, G10 |
| 15 | Hostile telegraphs (render-only): tracer halo color by owner (`PLAYER`→allied, `SECURITY_CREW`→`HOSTILE_COLOR_HEX`); wind-up pre-glow `#ff5252` for 0.5 s on crew muzzle while `windupTicksRemaining>0` in ATTACK; enemy muzzle flash via existing VFX family. No sim mutation. | `src/render/combatTelegraphs.ts`, `src/render/combatVfx.ts` | G10, M8, R9 |
| 16 | DEV overlay: show `ALn`, LKP valid + coords (1 decimal), and compact `crewId:STATE` for all `crewIds`. Absent when `!import.meta.env.DEV`. | `src/render/combatDevReadout.ts` | G1, G7 |
| 17 | Boot: replace `spawnStandIns` with `spawnCrew`; create/sync meshes for all `crewIds` (reuse stand-in mesh factory); register VFX actor meshes; keep follow cam / cutaway / telegraphs. | `src/app/boot.ts` | G2, G6, G10 |
| 18 | Update `combatTestUtils` + rewrite `standIns.test.ts` → `spawnCrew.test.ts`; add AI/perception/pathing/patrol/attack/alarm/determinism suites E1–E36 below. Keep **all** prior combat-core + readability + input suites green (update harness to `spawnCrew` / `crewIds`). | `tests/**` | G1–G9, combat-core regression G8 |
| 19 | README subsection **Enemy baseline**: AL0/AL1 stub, 8-crew spawner, DEV overlay fields, verification commands. | `README.md` | G7, G10 |
| 20 | Verify `npm run test:run` and `npm run build` green; smoke two-way firefight + patrol at AL0. Do not commit. | — | G1–G10 |

*Traceability check: G1→T4,T10,T16,T18; G2→T1–T3,T9,T17,T18; G3→T1,T7,T10,T18; G4→T1,T8,T10,T18; G5→T1,T10–T12,T15,T18; G6→T2,T3,T9,T17,T18; G7→T1,T4,T6,T10,T12,T13,T16,T18; G8→T11–T13,T18; G9→T4,T5,T14,T18; G10→T1,T15,T17,T20. M1↔G1; M2↔G3; M3↔G1/G4; M4↔G5; M5↔G2/G6; M6↔G7; M7↔G8; M8↔G10. R1↔T9; R2↔T2; R3↔T7; R4↔T10; R5↔T12; R6↔T11/T12; R7↔T6/T12/T13; R8↔T10; R9↔T15; R11↔T8. All G1–G10 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts` — append / update)

```ts
/** Alarm stub levels (P1). */
export const ALARM_LEVEL_AL0 = 0 as const;
export const ALARM_LEVEL_AL1 = 1 as const;

/** Crew population (Deck 03). Design §10 / pack R2. */
export const CREW_POPULATION = 8 as const;

/** Patrol / investigate / chase speeds (m/s). */
export const CREW_PATROL_SPEED_MPS = 2.0 as const;
export const CREW_INVESTIGATE_SPEED_MPS = 3.5 as const;
export const CREW_CHASE_SPEED_MPS = 4.5 as const;

/** Waypoint pause on PATROL (seconds / ticks). */
export const CREW_WAYPOINT_PAUSE_SEC = 2.0 as const;
export const CREW_WAYPOINT_PAUSE_TICKS = Math.round(CREW_WAYPOINT_PAUSE_SEC * TICK_HZ); // 120

/** Perception. */
export const CREW_SIGHT_RANGE_M = 20 as const;
export const CREW_SIGHT_CONE_DEG = 110 as const;
export const CREW_SIGHT_HALF_ANGLE_RAD = (CREW_SIGHT_CONE_DEG / 2) * (Math.PI / 180);
export const CREW_DETECTION_DELAY_SEC = 0.25 as const;
export const CREW_DETECTION_DELAY_TICKS = Math.round(CREW_DETECTION_DELAY_SEC * TICK_HZ); // 15

/** Attack. */
export const CREW_ATTACK_RANGE_M = 14 as const;
export const CREW_ATTACK_WINDUP_SEC = 0.5 as const;
export const CREW_ATTACK_WINDUP_TICKS = Math.round(CREW_ATTACK_WINDUP_SEC * TICK_HZ); // 30
export const CREW_SIDEARM_DAMAGE = 10 as const;
export const CREW_SIDEARM_INTERVAL_SEC = 0.9 as const;
export const CREW_FIRE_INTERVAL_TICKS = Math.round(CREW_SIDEARM_INTERVAL_SEC * TICK_HZ); // 54
export const CREW_SIDEARM_SPREAD_HALF_DEG = 4 as const;

/** Lost-contact INVESTIGATE scan. */
export const CREW_INVESTIGATE_SCAN_SEC = 4.0 as const;
export const CREW_INVESTIGATE_SCAN_TICKS = Math.round(CREW_INVESTIGATE_SCAN_SEC * TICK_HZ); // 240

/** Arrival tolerance at waypoint / LKP (m). */
export const CREW_ARRIVAL_EPSILON_M = 0.15 as const;

/** Deterministic spread stream seed (sim-only). */
export const SIM_SPREAD_SEED = 0x4e3d15c1 as const;

/** Soft tracer budget — player + crew (R9). Was 12. */
export const TRACER_MAX_CONCURRENT = 24 as const;
```

Assert in tests: `CREW_DETECTION_DELAY_TICKS === 15`, `CREW_ATTACK_WINDUP_TICKS === 30`, `CREW_FIRE_INTERVAL_TICKS === 54`, `CREW_WAYPOINT_PAUSE_TICKS === 120`, `CREW_INVESTIGATE_SCAN_TICKS === 240`, `TRACER_MAX_CONCURRENT === 24`.

### Spawn table (binding)

Author under `deck03.json` root key `crewSpawnTable: CrewSpawnPostDef[]` (length 8). SVG coordinates use the same space as footprints/doors; `loadDeck` converts via `svgToWorld`.

```ts
export interface CrewSpawnPostDef {
  /** Stable post id (spawn order key). */
  id: string;
  /** Room used for containment validation of spawn + waypoints. */
  homeRoomId: string;
  /** 'rover' | 'posted' — documentation + tests; behavior identical (waypoint loop). */
  role: 'rover' | 'posted';
  /** Spawn pose in SVG px (converted to world xz). */
  spawn: { x: number; y: number; yawDeg: number };
  /** Looped patrol waypoints in SVG px (length ≥ 2). */
  waypoints: ReadonlyArray<{ x: number; y: number }>;
}
```

**Binding table (Composer must author these exact SVG values):**

| Order | id | homeRoomId | role | spawn (sx,sy) | yawDeg | waypoints (sx,sy) |
|------:|----|------------|------|---------------|-------:|-------------------|
| 0 | `spine-rover-a` | `main-spine` | rover | (360, 400) | 90 | (360,400) → (570,400) → (780,400) → (570,400) |
| 1 | `spine-rover-b` | `main-spine` | rover | (780, 400) | −90 | (780,400) → (570,400) → (360,400) → (570,400) |
| 2 | `cargo-post` | `cargo-hold` | posted | (497, 335) | toward spine | (497,335) → (497,360) |
| 3 | `armory-post` | `armory` | posted | (623, 335) | toward spine | (623,335) → (623,360) |
| 4 | `med-bay-post` | `med-bay` | posted | (739, 335) | toward spine | (739,335) → (739,360) |
| 5 | `barracks-post` | `barracks` | posted | (527, 465) | toward spine | (527,465) → (527,440) |
| 6 | `life-support-post` | `life-support` | posted | (421, 465) | toward spine | (421,465) → (421,440) |
| 7 | `cic-post` | `cic` | posted | (873.5, 400) | toward connector | (873.5,400) → (840,400) |

Yaw for posted rows: face spine-side door center (`atan2` in world after convert) — compute at spawn time from `doorBetween(home, 'main-spine')` or for CIC `doorBetween('cic','fore-connector')`; do **not** hardcode yaw floats in JSON for posted (JSON `yawDeg` may be `0` placeholder; spawn code overwrites from door). For spine rovers, use table yawDeg (A faces +X/fore, B faces −X/aft) converted to radians: `yawRad = yawDeg * π/180` with the project's yaw convention `atan2(dirX, dirZ)`.

**Former stand-in positions (must match combat-core ±0.01 m):**

| Post | World (x,z) | Notes |
|------|-------------|-------|
| spine mid waypoint | `(570*M_PER_PX, 400*M_PER_PX)` | on both rover loops |
| `cargo-post` spawn | `(497*M_PER_PX, 335*M_PER_PX)` | was stand-in[1] |
| `barracks-post` spawn | `(527*M_PER_PX, 465*M_PER_PX)` | was stand-in[2] |

### CrewAiState

```ts
export type CrewFsmState = 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'DEAD';

export interface CrewAiState {
  fsm: CrewFsmState;
  /** Index into post.waypoints (PATROL). */
  waypointIndex: number;
  pauseTicksRemaining: number;
  /** Continuous LOS detection accumulator (0..CREW_DETECTION_DELAY_TICKS). */
  losTicks: number;
  /** INVESTIGATE scan countdown. */
  investigateTicksRemaining: number;
  /** ATTACK wind-up; 0 means may fire if cooldown allows. */
  windupTicksRemaining: number;
  fireCooldownTicks: number;
  /** Monotonic per-crew shot counter for spread seeding. */
  shotIndex: number;
  /** Post id from spawn table (stable). */
  postId: string;
}
```

### Alarm API

```ts
export type AlarmTripReason = 'player-shot' | 'detection' | 'crew-damage';

/** AL0→AL1 once; sets LKP from living player; no-op if already AL1. */
export function tripAlarm(state: SimState, reason: AlarmTripReason): void;

export function refreshLkpFromPlayer(state: SimState): void;
```

### Perception API

```ts
/** True if segment crew→player has no wall hit before the player (earliestWallHit null or t beyond player). */
export function hasLineOfSight(
  collisionWorld: CollisionWorld,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): boolean;

/** Angle between facing yaw and vector to target ≤ CREW_SIGHT_HALF_ANGLE_RAD; range ≤ CREW_SIGHT_RANGE_M. */
export function canSeePlayer(crew: Entity, player: Entity, collisionWorld: CollisionWorld): boolean;
```

Detection: each tick in integrateCrewAi, if `canSeePlayer` then `losTicks++` else `losTicks=0`. When `losTicks >= CREW_DETECTION_DELAY_TICKS`: `tripAlarm(...,'detection')`, set that crew (and via AL1 converge rules all living crew objectives) into CHASE, refresh LKP.

### Pathing API

```ts
/** BFS/A* on room ids via door edges; deterministic neighbor order (sorted ids). */
export function shortestRoomPath(graph: DeckGraph, fromRoom: string, toRoom: string): string[];

/**
 * Build world-space steer points from crew pose to goal:
 * if same room → [goal];
 * else → door opening centers along shortestRoomPath, then goal.
 */
export function buildSteerPathToPoint(
  graph: DeckGraph,
  fromX: number,
  fromZ: number,
  goalX: number,
  goalZ: number,
): { x: number; z: number }[];

/**
 * Advance entity up to speed*FIXED_DT toward next steer point.
 * Wall block → axis slide like player. Actor overlap → hold (no move).
 * Sets yaw to travel direction when speed>0.
 * Returns distance advanced.
 */
export function steerCrewStep(
  state: SimState,
  id: EntityId,
  collisionWorld: CollisionWorld,
  graph: DeckGraph,
  goalX: number,
  goalZ: number,
  speedMps: number,
): number;
```

### Crew AI integrate API

```ts
export type CrewAiEvent =
  | { type: 'windup-start'; crewId: EntityId; x: number; y: number; z: number; yaw: number }
  | { type: 'windup-end'; crewId: EntityId };

/**
 * Per fixed tick after integratePlayerMotion, before integrateCombat:
 * For each meta.crewIds in order (determinism):
 * 1. If !entity.alive → fsm=DEAD; skip.
 * 2. Perception vs living player; maybe trip detection.
 * 3. If alarmLevel===AL1 && any crew has LOS this tick → refreshLkpFromPlayer.
 * 4. FSM transitions (R8) — see table below.
 * 5. Movement / wind-up bookkeeping (no projectile spawn here).
 * MUST NOT use Math.random / Date.now / frame dt.
 */
export function integrateCrewAi(
  state: SimState,
  collisionWorld: CollisionWorld,
  graph: DeckGraph,
): CrewAiEvent[];
```

#### FSM transitions (binding — M3/R8)

| From | Condition | To |
|------|-----------|-----|
| any (alive) | `hp` hit 0 / `alive===false` | DEAD |
| PATROL | detection event (self) OR (`alarmLevel===AL1` && `lkpValid`) | CHASE |
| CHASE | LOS && dist ≤ 14 m | ATTACK |
| CHASE | arrived LKP (±ε) && !LOS | INVESTIGATE (scan ticks = 240) |
| ATTACK | !LOS \|\| dist > 14 m | CHASE |
| INVESTIGATE | LOS | CHASE (or ATTACK if in range) |
| INVESTIGATE | scan ticks → 0 | remain INVESTIGATE / hold at LKP (alerted; no PATROL) |
| PATROL | AL0 only default | stay PATROL on waypoints |

**PATROL motion:** move toward current waypoint at 2.0 m/s; on arrival start `pauseTicksRemaining=120`; when pause completes advance `waypointIndex = (i+1) % length`. Facing = travel dir (during pause keep last yaw).

**CHASE motion:** steer to LKP (or player pose while any LOS / self LOS) at 4.5 m/s.

**INVESTIGATE motion:** during scan, speed 3.5 m/s only if not yet at LKP; once at LKP, hold and decrement scan ticks; after scan, hold indefinitely at LKP area.

**ATTACK motion:** speed 0; yaw faces player each tick; on enter set windup=30 and emit `windup-start`; decrement windup; decrement fire cooldown; integrateCombat performs the shot.

**AL1 converge:** every living non-DEAD crew that is still PATROL transitions to CHASE toward shared LKP on the tick AL1 becomes active (and subsequently). INVESTIGATE unreachable at AL0.

### Combat integrate extensions

Player fire path unchanged except `tripAlarm(state, 'player-shot')` when a player projectile is spawned.

Crew fire (inside `integrateCombat`, after player fire, before projectile integration), for each `crewIds` in order:

```
ai = crewAi.get(id); entity = …
if (ai.fsm !== 'ATTACK' || !entity.alive) continue
if (ai.windupTicksRemaining > 0) { /* already decremented in AI; do not fire */ continue }
if (ai.fireCooldownTicks > 0) { ai.fireCooldownTicks--; continue } // OR decrement only in AI — pick ONE place: **decrement windup+fireCooldown in integrateCrewAi only**; combat only reads ===0
if (ai.windupTicksRemaining !== 0 || ai.fireCooldownTicks !== 0) continue
yaw = entity.yaw + sampleSpreadRad(state.tick, id, ai.shotIndex)
spawn projectile at muzzle; ownerId=id; traveled=0
ai.shotIndex++; ai.fireCooldownTicks = CREW_FIRE_INTERVAL_TICKS
events.push(muzzle)
```

**Timer ownership (locked):** `integrateCrewAi` decrements `windupTicksRemaining` and `fireCooldownTicks` each tick while in ATTACK (cooldown decrements even during wind-up after first shot’s cooldown is set). `integrateCombat` only spawns when both are 0.

Projectile damage on actor hit:

```
const owner = ownerId && getEntity(state, ownerId)
const amount = owner?.kind === SECURITY_CREW_KIND ? CREW_SIDEARM_DAMAGE : RIFLE_DAMAGE_PER_HIT
applyDamage(state, targetId, amount)
```

### Spread helper

```ts
/** Deterministic signed half-angle in radians, magnitude ≤ 4° in radians. */
export function sampleSpreadYawOffset(tick: number, ownerId: number, shotIndex: number): number;
```

Implementation: 32-bit mulberry32 from `SIM_SPREAD_SEED ^ tick ^ (ownerId*374761393) ^ (shotIndex*668265263)`; map to `[-half,+half]`.

### Tick order (frame loop + replay)

1. Drain commands for `state.tick`  
2. `applyCommands`  
3. `integratePlayerMotion`  
4. **`integrateCrewAi`**  
5. `integrateCombat`  
6. `fixedStep` // tick += 1  

### WorldMeta (extended)

```ts
export interface WorldMeta {
  // … existing combat-core fields …
  /** Ordered living+dead crew entity ids from spawner (length 8 after spawn). */
  crewIds: EntityId[];
  /** P1 stub: 0 or 1. */
  alarmLevel: 0 | 1;
  lkpValid: boolean;
  lkpX: number;
  lkpZ: number;
}
```

Remove `standInIds` entirely (update all references).

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Boot / tick 0 | Exactly 8 crew; `crewIds.length===8`; zero `spawnStandIns`; posts at binding coords ±0.01 | `spawnCrew.test.ts` |
| E2 | Patrol 60 sim-seconds, AL0, no player contact | Bit-identical trajectories across two runs; speed 2.0 m/s between pauses; 2.0 s pauses | `patrol.test.ts` |
| E3 | Player in cone @ 15 m LOS for 15 ticks | Detect → CHASE + AL1 | `perception.test.ts` |
| E4 | Player in cone < 15 ticks then leave | No detection; alarm stays AL0 | `perception.test.ts` |
| E5 | Player @ 25 m in cone | No detection | `perception.test.ts` |
| E6 | Player @ 5 m behind any wall class | No detection | `perception.test.ts` |
| E7 | CHASE cross-room through doors only | Steer path room sequence uses door edges; no wall penetration | `pathing.test.ts` |
| E8 | LOS break mid-chase; reach LKP | INVESTIGATE 240 ticks then hold; no PATROL | `fsm.test.ts` |
| E9 | Chase speed | Measured 4.5 m/s ±1% on clear spine segment | `fsm.test.ts` |
| E10 | ATTACK @ 10 m LOS | Stop; no projectile for 30 ticks; then interval 54 ticks ±1; 10 dmg/hit | `attack.test.ts` |
| E11 | Spread sample 64 shots | All \|offset\| ≤ 4°; identical sequence for same seed inputs | `attack.test.ts` |
| E12 | Wall between crew and player | Projectile despawns on wall; no player dmg | `attack.test.ts` |
| E13 | Lose LOS in ATTACK | → CHASE | `fsm.test.ts` |
| E14 | Kill crew | Corpse persists; untargetable; transparent; never replaced over clear-all replay | `spawnCrew.test.ts` |
| E15 | Player fires 1 shot, no crew sight | AL1; LKP=player pose; all living crew CHASE toward LKP | `alarm.test.ts` |
| E16 | Detection trip | AL1 | `alarm.test.ts` |
| E17 | Damage crew while AL0 | AL1 | `alarm.test.ts` |
| E18 | AL1 for 300 s | No de-escalate; no door changes; no new spawns | `alarm.test.ts` |
| E19 | Crew projectile hits player | HP −10; at 0 → death + 180 tick respawn full (combat-core G4) | `damage.test.ts` |
| E20 | Crew projectile through second crew | No crew dmg; continues to player/wall | `projectiles.test.ts` |
| E21 | Player projectile still damages crew 25 | Unchanged | `damage.test.ts` |
| E22 | Identical command stream ×2 | Identical AI/alarm/projectile/HP + hash | `ai/determinism.test.ts` + combat determinism |
| E23 | Telegraphs on/off | Identical tick + hash | `ai/determinism.test.ts` |
| E24 | No `Math.random`/`Date.now` in `src/ai/**` + crew fire path | Grep/static test | `ai/determinism.test.ts` |
| E25 | Doorway crowding | Trailing crew halt on overlap; no wedge teleport; never enter wall | `pathing.test.ts` |
| E26 | Multiple crew ATTACK same time | Allowed; each fires on own cadence | `attack.test.ts` |
| E27 | Hostile tracer halo `#ff5252` vs allied `#69f0ae` | Distinguishable in sync snapshot / material color test | `telegraphs.test.ts` |
| E28 | Wind-up pre-glow visible duration 0.5 s render; zero sim coupling | Event/render test; hash unchanged with VFX | `telegraphs.test.ts` |
| E29–E36 | **Full combat-core regression** | Existing fireRate, projectiles, damage, deathRespawn, ammo, bindingsParity, determinism, telegraphs, input parity/hotSwap/fireReloadArbitration — all green with `crewIds` harness | prior suites |

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
| G1 | E8, E13, FSM coverage in `fsm.test.ts` |
| G2 | E1, E2 |
| G3 | E3–E6 |
| G4 | E7–E9 |
| G5 | E10–E12, E26 |
| G6 | E1, E14 |
| G7 | E15–E18 |
| G8 | E19–E21, E29–E36 |
| G9 | E22–E24 |
| G10 | E27–E28 + manual screenshots |

### Manual / smoke (required evidence in PR body)

```bash
npm run dev
# AL0: 8 red capsules patrol (2 spine rovers + 6 posts)
# Fire a shot in port airlock with no LOS → AL1; crew converge (DEV readout ALn)
# Enter sight cone → chase/attack; wind-up red pre-glow then hostile tracers
# Take crew fire → HP drops; die → 3 s respawn
# Confirm no static-only trio of stand-ins
```

### PR body must cite

- Spec version (`SPEC v1 FINAL`), goals G1–G10, mechanics M1–M8  
- Link to `features/p1-enemy-baseline/clarification-log.md` (no questions)  
- Design doc **v1.14**, visual direction **v1.5**, design pack **v1**  
- `npm run test:run` + `npm run build` summary  
- Screenshots: AL0 patrol; wind-up + hostile tracers in two-way fire; DEV alarm/AI readout  

Branch: `feat/p1-enemy-baseline` → PR to `integration`.

---

## Out of scope (Composer must NOT touch)

**From design pack (enforce):**

- AL2–AL3/MELTDOWN, reinforcements, spawn budgets, entrenchment, crew rifles — P2  
- Lockdown, blast-door sealing, gating, keys, PA — P2 (doors stay open)  
- Vacuum flee, depressurization, wall damage/breaching — P3  
- Androids, racks, HUNT/SEAL, bosses — P4  
- Squad tactics, cover, morale, melee, grenades, crew ammo/reload  
- Cameras / hull sensors / stealth takedowns  
- Alarm HUD / health HUD — `p1-hud` (DEV overlay only)  
- Mission shell / airlock scripted stealth — `p1-mission-shell`  
- Aim-assist — `p1-gamepad-support`  
- Hero crew models, animation, gore, audio, loot/drops  
- Navmesh libraries, physics engines  

**Also out of scope:**

- Editing `docs/design/**`, `docs/team/**`, this feature’s `design-pack.md`, or other `features/*` packs  
- Changing `TICK_HZ` / player rifle numbers / allied telegraph palette meanings  
- Reintroducing `spawnStandIns` or `standInIds`  
- Committing to `master` / `integration`; Composer uses `feat/p1-enemy-baseline` only  
- Netcode transport / multiplayer  

---

## Composer start blockers

**None.** Spec is FINAL; clarification count = 0. Composer must not invent mechanics outside M1–M8 / R1–R11; on ambiguity stop and ask Grok (charter §1).

---

*Clarification for this spec: see `clarification-log.md` in this folder (all resolved — no questions).*
