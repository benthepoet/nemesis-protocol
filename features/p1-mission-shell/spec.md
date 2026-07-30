# Technical Specification — p1-mission-shell

`SPEC v1 FINAL | feature p1-mission-shell | charter v1.13 | design doc v1.15 | design pack v1 | goals: G1..G10 | mechanics: M1..M9`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.15** · visual direction **v1.5** · design pack **v1** @ `056dd6c` or newer (G1–G10, M1–M9, R1–R8) · feature roadmap **v1.7** (P1 #6) · shipped deps: `p1-deck-geometry`, `p1-player-controller`, `p1-combat-core` (+ readability), `p1-enemy-baseline` · clarification log **all resolved (no questions)** · AGENTS.md current

### Clarification rulings incorporated

None raised — design pack v1 + design doc v1.15 + visual v1.5 fully settle G1–G10 / M1–M9 / R1–R8. Pre-answered pack topics (shell input plumbing, closed-door representation, stbd spawn, score counters, end-state sim, banner/beacon layer) are accepted as Technical Lead bindings below.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | — | — |

Composer may start Stage 3 on branch `feat/p1-mission-shell`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Mission phase storage | `meta.missionPhase: MissionPhase` with exactly `BRIEFING \| INSERTION \| ACTIVE \| COMPLETE \| FAILED \| SCORE`. Illegal transitions are no-ops (rejected). | G1, M1–M7 |
| Tick order | `applyCommands` → **`integrateMissionShell`** → `integratePlayerMotion` → `integrateCrewAi` → `integrateCombat` → `fixedStep`. Same in frame loop + replay. | G9; shell before gameplay so INSERTION lock / SCORE restart apply same tick |
| Shell inputs | Reuse existing `ActionId` verbs only — **no new bindings**. BRIEFING/SCORE route `move` / `interact` / `cancel` inside `integrateMissionShell` (and `applyCommands` must not apply gameplay effects in those phases). Fire/reload never affect shell screens. | G2, G8, M8, R8, §12.1 |
| Breach select mapping | Absolute stick/keys: dominant vertical move axis — `axisZ > +SHELL_SELECT_DEADZONE` → Port (index 0); `axisZ < −SHELL_SELECT_DEADZONE` → Starboard (index 1); otherwise hold current. Interact `value===1` rising edge (not held previous tick) confirms. Cancel is no-op at BRIEFING (no back). | G2, M8, R8 |
| Boot / BRIEFING world | `createMissionWorld(graph)`: empty actors except deck markers + **8 crew at posts**, AL0, objective unissued, `missionPhase=BRIEFING`, `tick=0`, **no player entity yet** (`playerId=null`). Player spawns only on BRIEFING→INSERTION confirm. | G3, G8, M7 |
| INSERTION spawn | On confirm: `spawnPlayerAtAirlock(state, graph, roomId)` at **footprint center** (not `SPAWN_OFFSET_TOWARD_DOOR_M`), yaw toward spine-side door opening center. Full HP / 30+120. Room = `port-airlock` or `stbd-airlock` from selection. | G3, M2; pack “room center” |
| Cycle timer | `meta.insertionTicksRemaining` starts at `AIRLOCK_ENTRY_CYCLE_TICKS` (300). Decrements once per tick in INSERTION inside `integrateMissionShell`. At 0 → open door, issue objective, `ACTIVE`. | G3, M2 |
| Closed inner door | Sim flag `meta.closedDoorEdgeId: string \| null` = spine door edge id for selected airlock while INSERTION (and null when open). `buildCollisionWorld(graph, { closedDoorEdgeIds })` **does not subtract** those openings from walls → solid barrier for motion, projectiles, and LOS (`earliestWallHit`). Pathing: `neighbors` / `shortestRoomPath` / `buildSteerPathToPoint` take optional closed-door set and omit those edges. Opens permanently for the session at cycle end (flag cleared; never re-closes). | G3, G4, M2; forward-compatible for P2 doors |
| Collision world holder | Boot/frameLoop/replay hold a **mutable** `CollisionWorld` rebuilt whenever `closedDoorEdgeId` changes (INSERTION enter / ACTIVE enter / mission reset). Do not rebuild every tick if unchanged. | G3, G9 |
| Verb lock | While `INSERTION` (or `BRIEFING`/`SCORE`/`COMPLETE`/`FAILED`): gameplay verbs produce **zero** player/combat state change. `applyCommands` treats non-ACTIVE like dead for move/aim/fire/reload/interact/cancel gameplay; shell consumes move/interact before that for BRIEFING/SCORE. | G3, M2 |
| Alarm integration | **No change** to trip rules or AL1 converge. Extend `tripAlarm` to set `meta.alarmTripTick = state.tick` on the AL0→AL1 edge only (null until then). INSERTION guarantees no trip (verbs locked + closed door). | G4, M3, R5 |
| Objective | `meta.objectiveIssued` / `meta.objectiveComplete` booleans. Issue at door-open tick. Complete check in `integrateMissionShell` while ACTIVE: living player and `roomAtPosition(graph, x,z) === 'engineering'`. Beacon/banner are render-only from these flags + `obj-primary-reactor` world pose. `obj-secondary-bridge` never issued. | G5, M4, R3 |
| Fail vs complete | In ACTIVE, each tick after commands: if player HP 0 / `!alive` → `FAILED`; else if objective complete condition → `COMPLETE`. **FAILED wins** same tick. | G7, M6, R4 |
| End → SCORE | On the tick phase becomes `COMPLETE` or `FAILED`, record `meta.score` snapshot, then **same tick** set phase to `SCORE` (outcome retained in `meta.score.outcome`). COMPLETE/FAILED are legal transition sources and must appear in transition tests (assert via helper that captures phase before SCORE promotion, or assert `score.outcome`). | G1, G6, G7 |
| End-state freeze | While phase ∈ {`COMPLETE`,`FAILED`,`SCORE`}: no player motion, no crew AI advances, no combat integrate side effects (skip or early-return those integrators when phase ≠ `ACTIVE` and ≠ `INSERTION` — INSERTION still runs cycle timer only; crew/combat frozen in INSERTION too). Tableau (poses, corpses, alarm) held. Tick still advances via `fixedStep` for command-stream determinism. | Rule spec 4; G9 |
| Respawn removal | **Delete** player respawn path: no `respawnTicksRemaining` countdown in `integrateCombat`; `applyDamage` must not set it; remove `RESPAWN_DELAY_*` constants; drop field from `WorldMeta` + hash (or keep always-0 unused — **prefer delete**). Death → FAILED only. Rewrite combat-core G4 respawn tests to fail-flow semantics. | G7, M6, R4 |
| Restart | SCORE + interact rising edge → `resetMission(state, graph)` → BRIEFING bit-identical to fresh `createMissionWorld` at tick 0 (hash compare). Rebuild collision (all doors open). Clear projectiles/score/objective/alarm trip. | G8, M7, R7 |
| Score fields | Snapshot exactly: `outcome: 'COMPLETE' \| 'FAILED'`, `breachRoomId`, `missionEndTick`, `alarmTripped`, `alarmTripTick`, `crewNeutralized` (dead among `crewIds`). Mission time display = `missionEndTick / TICK_HZ` seconds. No composite score. No `localStorage` / persistence. | G6, M5, R6 |
| Presentation | Shell overlays DOM or canvas text on `#05080f`; beacon emissive primitive `#69f0ae` at objective world xz; banner transient render-only on issue. Zero sim writes from render. | G10, M9 |
| Regression harness | `createCombatTestHarness` / AI tests use `bootstrapMissionActive(state, graph, 'port-airlock')` (or equivalent) so combat/AI suites exercise ACTIVE without shell ceremony. Full lifecycle covered by mission-shell tests. | charter §7 regression |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not invent top-level packages beyond `src/mission/`.

```
/
├── src/
│   ├── config.ts                         # EXTEND: airlock cycle, shell deadzone, void chrome, beacon color; REMOVE RESPAWN_DELAY_*
│   ├── mission/                          # NEW package
│   │   ├── types.ts                      # MissionPhase, ScoreSnapshot, BreachOption
│   │   ├── constants via config          # (no duplicate magic numbers)
│   │   ├── createMissionWorld.ts         # BRIEFING bootstrap + resetMission
│   │   ├── integrateMissionShell.ts      # state machine, cycle, objective, end/score, restart
│   │   ├── breachSelect.ts               # selection index helpers + profile text constants
│   │   └── closedDoors.ts                # resolve spine door edge id; closed set helpers
│   ├── deck/
│   │   ├── collision.ts                  # EXTEND: buildCollisionWorld(graph, opts?) closed openings
│   │   ├── spawn.ts                      # EXTEND: computeInsertSpawn (center + yaw); keep computeSpawnPoint
│   │   ├── graph.ts                      # EXTEND: neighbors(..., closedDoorEdgeIds?) OR filter helper
│   │   └── roomQuery.ts                  # KEEP (objective room check)
│   ├── player/
│   │   └── spawnPlayer.ts                # EXTEND: spawnPlayerAtAirlock(state, graph, roomId); no auto-port at boot
│   ├── ai/
│   │   ├── alarm.ts                      # EXTEND: record alarmTripTick on first trip
│   │   ├── pathing.ts                    # EXTEND: honor closed door edges
│   │   ├── integrateCrewAi.ts            # EXTEND: no-op unless ACTIVE (INSERTION frozen)
│   │   └── perception.ts                 # KEEP (LOS via collision world)
│   ├── combat/
│   │   ├── applyDamage.ts                # EXTEND: remove respawn timer set
│   │   └── integrateCombat.ts            # EXTEND: remove respawn block; no-op unless ACTIVE
│   ├── sim/
│   │   ├── types.ts                      # EXTEND: mission meta fields; REMOVE respawnTicksRemaining
│   │   ├── world.ts                      # EXTEND: defaults; clone mission fields
│   │   ├── hash.ts                       # EXTEND: mission/score/alarmTrip; drop respawn
│   │   ├── step.ts                       # EXTEND: gameplay verbs only in ACTIVE
│   │   ├── replay.ts                     # EXTEND: integrateMissionShell + collision rebuild hook
│   │   └── playerMotion.ts               # KEEP (already skips !alive); also no-op if phase≠ACTIVE
│   ├── render/
│   │   ├── missionShellUi.ts             # NEW: BRIEFING + SCORE overlays (#05080f)
│   │   ├── objectiveBeacon.ts            # NEW: allied beacon mesh; sync from sim flags
│   │   ├── objectiveBanner.ts            # NEW: transient “Reach Engineering” banner
│   │   ├── combatDevReadout.ts           # EXTEND: missionPhase (DEV)
│   │   ├── frameLoop.ts                  # EXTEND: mission integrate order; collision rebuild
│   │   └── …
│   └── app/
│       └── boot.ts                       # EXTEND: createMissionWorld; shell UI; no immediate ACTIVE
└── tests/
    ├── mission/
    │   ├── stateMachine.test.ts          # G1
    │   ├── breachSelect.test.ts          # G2, M8
    │   ├── insertionCycle.test.ts        # G3
    │   ├── alarmIntegration.test.ts      # G4
    │   ├── objective.test.ts             # G5
    │   ├── scoreScreen.test.ts           # G6
    │   ├── failFlow.test.ts              # G7
    │   ├── restart.test.ts               # G8
    │   └── determinism.test.ts           # G9
    ├── combat/
    │   ├── deathRespawn.test.ts          # REWRITE → fail flow (no respawn)
    │   ├── damage.test.ts                # UPDATE: death → no 180-tick respawn
    │   └── …                             # harness via bootstrapMissionActive
    └── helpers/
        ├── combatTestUtils.ts            # EXTEND: bootstrapMissionActive; runTicks includes mission shell
        └── missionTestUtils.ts           # NEW: shell command helpers, phase advance
```

Do **not** edit `docs/` (except this feature folder’s logs if Director asks), `assets/` tangible art, `tools/mockups/`, or other features’ design packs. Do not change three.js / Vitest / Vite pins. Do not add audio, HUD skinning, or persistence.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Extend `config.ts`: add **Constants** below; **remove** `RESPAWN_DELAY_SEC` / `RESPAWN_DELAY_TICKS`. | `src/config.ts` | G3, G7, G10, M2, M9 |
| 2 | Add `src/mission/types.ts`: `MissionPhase`, `ScoreSnapshot`, breach option ids. | `src/mission/types.ts` | G1, G6 |
| 3 | Extend `WorldMeta` with mission fields per **Data structures**; remove `respawnTicksRemaining`. Defaults for BRIEFING. Update `cloneSimState` / `defaultMeta`. | `src/sim/types.ts`, `src/sim/world.ts` | G1, G5–G9 |
| 4 | Extend `hash.ts` with missionPhase, breachSelectIndex, breachRoomId, insertionTicksRemaining, closedDoorEdgeId, objective flags, alarmTripTick, score snapshot fields (stable key order). Drop respawn. | `src/sim/hash.ts` | G9 |
| 5 | `buildCollisionWorld(graph, options?: { closedDoorEdgeIds?: readonly string[] })` — closed doors keep wall solid through opening. | `src/deck/collision.ts` | G3, G4, M2 |
| 6 | Closed-door helpers: resolve `door-spine-port-airlock` / `door-spine-stbd-airlock` from selected room; pathing `neighbors`/`shortestRoomPath`/`buildSteerPathToPoint` skip closed edges. | `src/mission/closedDoors.ts`, `src/deck/graph.ts`, `src/ai/pathing.ts` | G3, G4, M2 |
| 7 | `computeInsertSpawn(graph, roomId)` → footprint center + yaw to spine door. `spawnPlayerAtAirlock`. Deprecate boot-time port-only `spawnPlayer` or make it call insert spawn for port (tests may keep name). | `src/deck/spawn.ts`, `src/player/spawnPlayer.ts` | G2, G3, M2 |
| 8 | Extend `tripAlarm` to set `meta.alarmTripTick = state.tick` on AL0→AL1 only; leave null otherwise. Never clear except mission reset. | `src/ai/alarm.ts` | G4, G6, M3 |
| 9 | Implement `createMissionWorld` / `resetMission`: BRIEFING, crew×8, AL0, no player, doors open, tick 0, score null, objective false. Bit-identical across calls. | `src/mission/createMissionWorld.ts` | G8, M7 |
| 10 | Implement `integrateMissionShell(state, graph, collisionRef)`: BRIEFING select/confirm → INSERTION (spawn, close door, rebuild collision, start cycle); cycle → ACTIVE (open door, issue objective); ACTIVE fail/complete → SCORE snapshot; SCORE restart → reset. Reject illegal transitions. | `src/mission/integrateMissionShell.ts`, `breachSelect.ts` | G1–G8, M1–M7 |
| 11 | Gate gameplay: `applyCommands` gameplay effects only in `ACTIVE`; `integratePlayerMotion` / `integrateCrewAi` / `integrateCombat` no-op unless `ACTIVE` (INSERTION: shell timer only). Remove respawn block from `integrateCombat`; remove respawn set from `applyDamage`. | `src/sim/step.ts`, `playerMotion.ts`, `integrateCrewAi.ts`, `integrateCombat.ts`, `applyDamage.ts` | G3, G7, M2, M6 |
| 12 | Wire tick order in `frameLoop.ts` + `replay.ts`: commands → **missionShell** → motion → crewAi → combat → fixedStep. Rebuild collision when door flag changes. | `src/render/frameLoop.ts`, `src/sim/replay.ts` | G1, G9 |
| 13 | Shell UI (render-only): BRIEFING two options + §3 profile strings; SCORE five fields; chrome `#05080f`; palette text. Operable via sim state only (no DOM→sim). | `src/render/missionShellUi.ts` | G2, G6, G8, G10, M8, M9 |
| 14 | Objective presentation: transient banner on issue; in-world beacon at `obj-primary-reactor` world xz, color `#69f0ae`, extinguish on complete; never `#ffd54f` / `#ff5252`. | `src/render/objectiveBanner.ts`, `objectiveBeacon.ts` | G5, G10, M4, M9 |
| 15 | Boot: `createMissionWorld`; mesh crew; shell UI + beacon/banner sync; collision holder; DEV readout shows `missionPhase`. No auto-ACTIVE. | `src/app/boot.ts`, `combatDevReadout.ts` | G1, G2, G10 |
| 16 | Test utils: `runTicks` includes mission shell + collision rebuild; `bootstrapMissionActive` for combat/AI regression; shell command helpers. | `tests/helpers/*` | G1–G9 |
| 17 | Mission test suites E1–E40 below; rewrite `deathRespawn` / death assertions in `damage.test.ts` to FAILED (no 180-tick revive). Keep enemy-baseline + combat-core suites green under ACTIVE bootstrap. | `tests/mission/**`, `tests/combat/**` | G1–G9, regression |
| 18 | README subsection **Mission shell**: states, breach select, 5 s cycle, death=fail, score fields, restart. Verification commands. | `README.md` | G1, G6, G7 |
| 19 | Verify `npm run test:run` and `npm run build` green; smoke BRIEFING→Port→cycle→Engineering→COMPLETE→restart and death→FAILED. Do not commit. | — | G1–G10 |

*Traceability check: G1→T2,T3,T10,T12,T17; G2→T7,T10,T13,T15,T17; G3→T1,T5–T7,T10,T11,T17; G4→T5,T6,T8,T10,T17; G5→T3,T10,T14,T17; G6→T2,T3,T10,T13,T17; G7→T1,T3,T10,T11,T17; G8→T9,T10,T13,T17; G9→T3,T4,T12,T16,T17; G10→T1,T13–T15,T19. M1↔G2; M2↔G3; M3↔G4; M4↔G5; M5↔G6; M6↔G7; M7↔G8; M8↔G2/G8; M9↔G10. All G1–G10 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts`)

```ts
/** Airlock entry cycle (seconds / ticks). Design §10 / pack R2. */
export const AIRLOCK_ENTRY_CYCLE_SEC = 5.0 as const;
export const AIRLOCK_ENTRY_CYCLE_TICKS = Math.round(AIRLOCK_ENTRY_CYCLE_SEC * TICK_HZ); // 300

/** Vertical move-axis deadzone for breach select (normalized). */
export const SHELL_SELECT_DEADZONE = 0.5 as const;

/** Shell screen void chrome (visual direction §3). */
export const SHELL_CHROME_HEX = '#05080f' as const;

/** Objective beacon allied color (VD §3 player-aligned). */
export const OBJECTIVE_BEACON_HEX = '#69f0ae' as const;

/** Objective banner copy (pack R3). */
export const OBJECTIVE_BANNER_TEXT = 'Reach Engineering' as const;
```

Assert in tests: `AIRLOCK_ENTRY_CYCLE_TICKS === 300`. **Remove** `RESPAWN_DELAY_SEC` / `RESPAWN_DELAY_TICKS`.

### Breach profile copy (render-only constants in `breachSelect.ts`)

Exactly two options, order Port then Starboard:

| Index | Room id | Label | Profile text (§3 Phase 0) |
|------:|---------|-------|---------------------------|
| 0 | `port-airlock` | Port | loot-rich route, heavier patrol density |
| 1 | `stbd-airlock` | Starboard | softer initial resistance, fewer resources |

Wording may be lightly formatted for UI but must carry those meanings; do not invent new asymmetry claims.

### WorldMeta extensions

```ts
export type MissionPhase =
  | 'BRIEFING'
  | 'INSERTION'
  | 'ACTIVE'
  | 'COMPLETE'
  | 'FAILED'
  | 'SCORE';

export interface ScoreSnapshot {
  outcome: 'COMPLETE' | 'FAILED';
  breachRoomId: 'port-airlock' | 'stbd-airlock';
  missionEndTick: number;
  alarmTripped: boolean;
  alarmTripTick: number | null;
  crewNeutralized: number; // 0..8
}

// On WorldMeta (add):
missionPhase: MissionPhase;
breachSelectIndex: 0 | 1;          // BRIEFING selection; default 0
breachRoomId: 'port-airlock' | 'stbd-airlock' | null; // set on confirm
insertionTicksRemaining: number;   // 0 when not INSERTION
closedDoorEdgeId: string | null;
objectiveIssued: boolean;
objectiveComplete: boolean;
alarmTripTick: number | null;
score: ScoreSnapshot | null;
shellInteractPrev: boolean;        // rising-edge helper for confirm/restart (sim-hashed)
```

Remove `respawnTicksRemaining`.

### Mission integrate API

```ts
export interface CollisionWorldRef {
  current: CollisionWorld;
}

/** Command-driven shell + mission rules. Mutates state; may rebuild collisionRef.current. */
export function integrateMissionShell(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
): void;
```

**Transition table (only these are legal):**

| From | Event | To |
|------|-------|-----|
| BRIEFING | interact rising edge | INSERTION |
| INSERTION | `insertionTicksRemaining` hits 0 after decrement | ACTIVE |
| ACTIVE | player dead | FAILED → SCORE (same tick) |
| ACTIVE | living player in `engineering` | COMPLETE → SCORE (same tick) |
| SCORE | interact rising edge | BRIEFING (`resetMission`) |

All other attempted transitions: no-op.

**INSERTION enter (confirm):** set `breachRoomId` from select index; `spawnPlayerAtAirlock`; `closedDoorEdgeId = spineDoorId(breachRoomId)`; rebuild collision; `insertionTicksRemaining = AIRLOCK_ENTRY_CYCLE_TICKS`; `missionPhase = INSERTION`; AL0 unchanged; objective still unissued.

**ACTIVE enter (cycle end):** clear `closedDoorEdgeId`; rebuild collision; `objectiveIssued = true`; `missionPhase = ACTIVE`.

**SCORE enter:** build `score` from current sim (`crewNeutralized = count !alive among crewIds`, `alarmTripped = alarmLevel===1`, times from ticks); set `missionPhase = SCORE`.

### Spawn API

```ts
export function computeInsertSpawn(
  graph: DeckGraph,
  roomId: 'port-airlock' | 'stbd-airlock',
): SpawnPoint; // x/z = footprint center; yaw → spine door center

export function spawnPlayerAtAirlock(
  state: SimState,
  graph: DeckGraph,
  roomId: 'port-airlock' | 'stbd-airlock',
): EntityId;
```

### Collision API

```ts
export function buildCollisionWorld(
  graph: DeckGraph,
  options?: { closedDoorEdgeIds?: readonly string[] },
): CollisionWorld;
```

When `closedDoorEdgeIds` contains a door edge id, that edge’s `opening` is **not** subtracted from wall AABBs.

### Gameplay freeze helper

```ts
export function isGameplayActive(state: SimState): boolean {
  return state.meta.missionPhase === 'ACTIVE';
}
```

Use in motion / crewAi / combat early-returns. INSERTION is **not** gameplay-active.

### Bootstrap for regression tests

```ts
/** Test-only: BRIEFING→confirm room→skip to ACTIVE with door open + objective issued. */
export function bootstrapMissionActive(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  roomId: 'port-airlock' | 'stbd-airlock' = 'port-airlock',
): void;
```

Must leave AL0, full HP/ammo, 8 crew, objective issued+incomplete, phase ACTIVE — bit-stable for a given roomId.

---

## Edge cases & failure modes

| ID | Case | Expected |
|----|------|----------|
| E-a | Illegal transition (e.g. BRIEFING→ACTIVE direct) | No-op; phase unchanged |
| E-b | Fire/reload during BRIEFING/INSERTION/SCORE | No shots, no reload, no alarm |
| E-c | Move during INSERTION | Zero pose change |
| E-d | Crew path/LOS through closed inner door | Blocked (collision + pathing) |
| E-e | Cycle length | Door opens at tick where remaining hits 0; duration 300±1 ticks from INSERTION enter |
| E-f | Same-tick death + engineering entry | FAILED / score outcome FAILED |
| E-g | Dead player already in engineering | No COMPLETE |
| E-h | Secondary objective room / marker | No issue, no complete, no beacon |
| E-i | Alarm already AL1 | `alarmTripTick` unchanged on further trips |
| E-j | SCORE with 0 kills, never alarmed | `0/8`, alarm no |
| E-k | Two restarts | Identical hash at BRIEFING tick 0 |
| E-l | Interact held across SCORE enter | Rising edge required — no instant restart |
| E-m | Stbd breach | Spawn in `stbd-airlock` center, facing its spine door; closed edge = `door-spine-stbd-airlock` |
| E-n | Banner/beacon disabled | Sim tick count + hash unchanged (render-only) |
| E-o | Existing combat death soak >180 ticks | Player stays dead; no revive |

---

## Test / verification requirements

Composer must add/pass the following (names advisory). Harness always runs full tick order including `integrateMissionShell`.

| Suite | Coverage |
|-------|----------|
| `stateMachine.test.ts` | Legal transitions; illegal rejected; phase readable each tick |
| `breachSelect.test.ts` | Port/Starboard select + profile presence; KBM-mapped and gamepad-mapped command streams confirm same room; spawn room matches |
| `insertionCycle.test.ts` | Center spawn + facing; 300-tick lock; closed door blocks player/crew/LOS; open permanent; verbs unlock |
| `alarmIntegration.test.ts` | Full cycle → AL0; post-open trip via shot / detection / damage → AL1 converge; enemy-baseline alarm tests still green |
| `objective.test.ts` | Unissued until door-open; complete on living engineering entry; beacon flag; secondary inert |
| `scoreScreen.test.ts` | COMPLETE fields match scripted run; no composite; no storage writes |
| `failFlow.test.ts` | Death → FAILED score; no respawn at 180; contention FAILED; HP/ammo unrestored until restart |
| `restart.test.ts` | From COMPLETE and FAILED → BRIEFING hash == fresh world; two restarts identical |
| `determinism.test.ts` | Identical command streams (incl. shell) → identical hashes/trajectories; differ when commands differ |

**Regression:** `npm run test:run` green for prior combat/AI/deck/input suites after harness ACTIVE bootstrap + respawn→fail rewrites. `npm run build` green.

**Manual smoke:** Port path to Engineering → COMPLETE score → restart; death → FAILED score; gamepad breach select.

---

## Out of scope (Composer must NOT touch)

- Phase 2–6 systems: lockdown, blast seals, CIC, coolant, two-key, reactor arm/hold-out, escape timer, sealed-breach, repopulation, manual-crank, off-path incentives
- HUD feature (`p1-hud`) — no persistent objective/alarm/HP chrome beyond DEV readout + transient banner
- Briefing polish: map art, schematic, cinematics, difficulty screens
- Ship PA (`p2-ship-pa`)
- Composite score, grades, persistence, unlocks, meta-progression
- Co-op downed/revive/extraction rules
- Reactor/charge interaction; beacon is non-interactable
- Airlock gameplay (outer door, venting, manual cycle, depressurization)
- Combat/AI/alarm **rule** changes or retunes (integrate only); enemy-baseline G1–G10 and combat-core G1–G10 minus respawn clause must keep passing
- Secondary objectives
- Audio
- Hero art / animated screen transitions beyond blockout text
- Design doc / visual direction / other feature packs (unless Director orders a doc-first bump — not this PR)

---

*Clarification for this spec: see `clarification-log.md` in this folder — **zero open questions**.*
