# Technical Specification — p1-player-controller

`SPEC v1 | feature p1-player-controller | charter v1.13 | design doc v1.11 | design pack v1 | goals: G1..G8 | mechanics: M1..M8`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.11** · design pack **v1** · feature roadmap **v1.4** · visual direction **v1.2** · scaffold **p1-project-scaffold** accepted (spec v1, PR #1) · deck **p1-deck-geometry** accepted (spec v1, Gate 2) · clarification log **all resolved (no questions)** · AGENTS.md current

### Clarification rulings incorporated

None — design pack v1 fully settles G1–G8 / M1–M8. No §3.2a questions were raised. Technical gaps below (bindings, command shape, camera tunables, deadzone constant, KeyE precedence, cutaway occupancy) are Technical Lead authority only.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | — | — |

Composer may start Stage 3 on branch `feat/p1-player-controller`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Command vocabulary | Extend `ActionId` with `'move' \| 'aim'` alongside existing `'interact' \| 'cancel'`. Discrete actions keep `value: 0 \| 1`. Axis actions carry `axisX`/`axisZ` in `[-1, 1]` (no provenance). | Pack extends scaffold vocabulary; G2/G3/G6; preserves G5 parity shape for interact/cancel |
| Axis command cadence | Each fixed tick, devices report **current** move/aim axes; bus emits one `move` and/or one `aim` command per winning channel when that channel has a sample this gather. Idle move = `(0,0)` still emitted when the move-channel device is polled and keys/stick read zero (so intent clears). Aim below deadzone = **no** `aim` command (facing unchanged). | Netcode-ready; facing sticky on stick release (M3) |
| Device arbitration (M4) | Replace single `activeDeviceKind` with **per-channel** owners: `move`, `aim`, `interact` (`cancel` shares the `interact` channel). Most-recent-input-wins **per channel**. Synthetic releases only for **digital** actions held on the departing device when the **interact** channel flips. Axis channel flips do **not** flush interact/cancel. | Pack M4; must not break scaffold E7/E9/E14; E8/E13 still hold for button-channel swaps |
| Move bindings | KBM: `KeyW/A/S/D` → move intent on XZ (W=−Z, S=+Z, A=−X, D=+X). Gamepad: left stick `axes[0]`=X, `axes[1]`=Z (standard mapping; invert Y→Z so forward stick = −Z). | Design doc §8 twin-stick; keyboard equivalent of left stick |
| Aim bindings | KBM: mouse position → raycast onto `y=0` plane via active gameplay camera → direction from player XZ to hit XZ. Gamepad: right stick `axes[2]`/`axes[3]` → direction (after deadzone). | M3 |
| Gamepad deadzone | `GAMEPAD_AXIS_DEADZONE = 0.24` in `config.ts` (scaffold omitted the constant the pack referenced; this feature adds it). Apply independently to left and right sticks (radial magnitude). | M3; P1-checkpoint tunable |
| Player entity | `kind: 'player'`; fields `x,y,z,yaw,moveIntentX,moveIntentZ,alive`. Spawn **after** `spawnDeckEntities` so marker EntityIds stay stable vs deck feature. `y = 0`. Initial pose from `computeSpawnPoint(graph, 'port-airlock')`. | G1; non-breaking vs deck G7 marker IDs |
| Motion integration | `applyCommands` writes intents/facing/meta; `integratePlayerMotion(state, collisionWorld)` runs every tick after commands (frame loop + replay). Velocity = `normalize(intent) * PLAYER_MOVE_SPEED_MPS` when `‖intent‖ > 0`, else 0. Uses `FIXED_DT` only. | G2, G7; no frame-dt in sim |
| Collision response | No physics engine. Attempt full XZ step; on hit, try X-only then Z-only (slide). Reject axis if `circleHitsWalls(world, x, z, ACTOR_PROXY_RADIUS_M)`. | G4, M5; deck APIs only |
| Yaw convention | Radians, Y-up; `yaw = atan2(dirX, dirZ)` matching spawn.ts (0 faces +Z). | Consistent with deck spawn |
| World hash | Extend entity serialization with `yaw`, `moveIntentX`, `moveIntentZ` (sorted key order). Markers carry `yaw: 0`, intents `0`. | G7 |
| Camera | New `createFollowCamera` — PerspectiveCamera, pitch **60°** down from horizontal, **fixed yaw** (north-up: camera sits on +Z side of focus, looking toward −Z), FOV `FOLLOW_CAMERA_FOV_DEG = 50`, distance `FOLLOW_CAMERA_DISTANCE_M = 18`. Damped follow + aim bias on **render side only**. | G5, M6 |
| Aim bias | Focus = lerp(playerXZ, aimPointXZ, t) clamped so ‖focus − player‖ ≤ `FOLLOW_AIM_BIAS_M` (2.0). Aim point = player + facingDir * `FOLLOW_AIM_BIAS_M` (same for KBM/gamepad once facing is known). | M6 |
| Ceiling cutaway | Render-only: find room whose footprint contains player XZ; hide that room’s `ceiling:<id>` mesh (`visible = false`); show all others. If outside every footprint (doorway gap), keep **last occupied** room id (render state, not sim). | G5; VD §7 r6 |
| KeyE conflict | When `isDebugFlyCameraEnabled()` is true: fly camera owns `KeyE` (rise). `KeyboardMouseDevice` **must not** emit `interact` for `KeyE` while debug fly is enabled (mouse button 0 + gamepad south still emit interact). When debug fly is off: `KeyE` → interact as today; fly camera absent. | G8 + bindings conflict |
| Default boot | Without `?debugCamera=1`: player spawned, follow camera active, ceiling cutaway on. With flag (DEV only): fly camera replaces follow camera as active render camera; player still spawns and sim still runs (commands still apply) but follow cam / cutaway updates are skipped. | G8 |
| Player mesh | Capsule radius `0.4`, height `1.6`, color `#69f0ae`; facing wedge (triangular prism / cone tip) along +local forward, darker green or emissive so facing reads at 60°. | M8, VD §3 |
| Interact trace | On `interact` press (`value === 1`) inside `applyCommands`, if `import.meta.env.DEV`, `console.debug('[interact]', { tick: state.tick, value: 1 })`. Release does not trace. | Pack rule 5 / G6 |
| Cancel | Unchanged from scaffold (still in vocabulary; shares interact arbitration channel). | Scaffold parity |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not rename/move scaffold or deck packages. Do not invent extra top-level packages.

```
/
├── src/
│   ├── config.ts                         # EXTEND: player + camera + deadzone constants
│   ├── sim/
│   │   ├── commands.ts                   # EXTEND: ActionId + InputCommand axis fields
│   │   ├── types.ts                      # EXTEND: Entity yaw/intents; WorldMeta.playerId
│   │   ├── world.ts                      # EXTEND: spawnEntity default yaw/intents; clone
│   │   ├── step.ts                       # EXTEND: apply move/aim; interact DEV trace
│   │   ├── hash.ts                       # EXTEND: hash yaw + move intents
│   │   ├── replay.ts                     # EXTEND: call integratePlayerMotion each tick
│   │   └── playerMotion.ts               # NEW: integratePlayerMotion (G2/G4)
│   ├── input/
│   │   ├── types.ts                      # EXTEND: axis samples / channel types
│   │   ├── bindings.ts                   # EXTEND: document move keys; KeyE gating helper
│   │   ├── keyboardMouse.ts              # EXTEND: WASD + mouse aim + KeyE debug gate
│   │   ├── gamepad.ts                    # EXTEND: left/right sticks + deadzone
│   │   ├── commandBus.ts                 # EXTEND: per-channel M4 arbitration
│   │   └── mapper.ts                     # EXTEND: map axis samples → intents
│   ├── player/
│   │   ├── spawnPlayer.ts                # NEW: spawn at port-airlock (G1)
│   │   └── types.ts                      # NEW: PlayerSpawnResult (optional thin types)
│   ├── deck/
│   │   └── roomQuery.ts                  # NEW: roomAtPosition / pointInFootprint export (G5)
│   ├── render/
│   │   ├── createPlayerMesh.ts           # NEW: capsule + wedge (M8)
│   │   ├── createFollowCamera.ts         # NEW: 60° follow + aim bias (G5/M6)
│   │   ├── ceilingCutaway.ts             # NEW: hide occupied-room ceiling (G5)
│   │   ├── debugFlyCamera.ts             # KEEP gating; no behavior change except documented KeyE ownership when active
│   │   └── frameLoop.ts                  # EXTEND: integratePlayerMotion; optional render hooks
│   └── app/
│       └── boot.ts                       # EXTEND: spawn player, mesh, follow cam vs fly
└── tests/
    ├── player/
    │   ├── spawnPlayer.test.ts           # G1
    │   ├── motion.test.ts                # G2, G4
    │   ├── aim.test.ts                   # G3
    │   ├── interact.test.ts              # G6
    │   └── determinism.test.ts           # G7
    ├── input/
    │   ├── parity.test.ts                # KEEP scaffold E7/E9/E14 green
    │   ├── hotSwap.test.ts               # KEEP E8/E13; ADD per-channel cases
    │   └── axesArbitration.test.ts       # M4 channels
    ├── render/
    │   ├── followCamera.test.ts          # G5 rig assertions
    │   └── ceilingCutaway.test.ts        # G5 cutaway
    └── helpers/
        ├── fakeDevices.ts                # EXTEND: axis sample helpers
        └── playerTestUtils.ts            # NEW: load deck, collision, spawn player harness
```

Do **not** edit `docs/`, `assets/`, `tools/mockups/`, or other feature folders’ design packs. Do not change three.js / Vitest / Vite pins.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Extend `src/config.ts` with **Constants** below exactly (`PLAYER_MOVE_SPEED_MPS`, `GAMEPAD_AXIS_DEADZONE`, follow-camera tunables, mesh sizes, `PLAYER_KIND`, `PLAYER_COLOR_HEX`). No other magic numbers for speed/camera/deadzone/mesh. | `src/config.ts` | G2, G5, M1, M3, M6, M8 |
| 2 | Extend `ActionId` and `InputCommand` per **Commands API**. Update `commandsEqualForParity` to deep-compare all fields including `axisX`/`axisZ` when present. Discrete commands must omit axis fields (or set them `undefined`) so scaffold interact/cancel parity objects stay equal. | `src/sim/commands.ts` | G2, G3, G5, G6, M2, M3, M7 |
| 3 | Extend `Entity` with `yaw`, `moveIntentX`, `moveIntentZ` (defaults `0` on spawn). Extend `WorldMeta` with `playerId: EntityId \| null`. Update `spawnEntity` / `cloneSimState` / `setEntityPose` accordingly (`setEntityYaw` helper allowed). | `src/sim/types.ts`, `src/sim/world.ts` | G1, G7 |
| 4 | Extend `hash.ts` entity payload with `yaw`, `moveIntentX`, `moveIntentZ` (stable key order). | `src/sim/hash.ts` | G7 |
| 5 | Implement `roomAtPosition(graph, x, z): string \| null` (and export footprint containment) in `src/deck/roomQuery.ts` using graph footprints only — no SVG literals. | `src/deck/roomQuery.ts` | G5 |
| 6 | Implement `spawnPlayer(state, graph): EntityId` — `computeSpawnPoint(graph, 'port-airlock')`, `spawnEntity` kind `PLAYER_KIND`, set pose + yaw from spawn, clear intents, set `meta.playerId`. Validate spawn with existing `validateSpawnPoint` + `buildCollisionWorld` (throw if invalid). Call **after** `spawnDeckEntities` in boot. | `src/player/spawnPlayer.ts` | G1, M5 |
| 7 | Implement `integratePlayerMotion(state, collisionWorld)` per **Motion API**; call from frame loop and replay after `applyCommands`, before/with `fixedStep` as specified. | `src/sim/playerMotion.ts`, `src/sim/replay.ts`, `src/render/frameLoop.ts` | G2, G4, G7, M1, M2, M5 |
| 8 | Extend `applyCommands`: handle `move` (write intents), `aim` (write yaw from `atan2(axisX, axisZ)` when ‖axis‖ > 0), `interact`/`cancel` as today + DEV `console.debug` on interact press. Ignore unknown actions. | `src/sim/step.ts` | G2, G3, G6, M2, M3, M7 |
| 9 | Extend input types + mapper for axis samples; extend bindings with move key codes helper and `isInteractKeyboardSuppressed()` for debug KeyE gate. | `src/input/types.ts`, `src/input/mapper.ts`, `src/input/bindings.ts` | G2, G3, G6, M3, M4 |
| 10 | Extend `KeyboardMouseDevice`: WASD held-state → move axis each `poll`; mouse client position stored; `sampleAim(playerX, playerZ, camera, canvas)` or boot-provided aim sampler produces aim axis; suppress `KeyE`→interact when `isDebugFlyCameraEnabled()`. | `src/input/keyboardMouse.ts` | G2, G3, G6, G8, M3 |
| 11 | Extend `GamepadDevice`: read left/right sticks each poll with radial deadzone; emit move/aim axis samples; keep button edge behavior for interact/cancel. | `src/input/gamepad.ts` | G2, G3, G6, M3, M4 |
| 12 | Rewrite `CommandBus` arbitration to **per-channel** M4 per **CommandBus API**. Preserve: no provenance on drained commands; synthetic digital releases on interact-channel flip / `notifyDeviceDeparting`; `resetSession`; scaffold E7/E8/E9/E13/E14 green. | `src/input/commandBus.ts` | G5 scaffold, M4 |
| 13 | Implement `createPlayerMesh(): THREE.Group` — capsule `#69f0ae` + facing wedge; sync pose from entity each frame (render-only). | `src/render/createPlayerMesh.ts` | M8 |
| 14 | Implement `createFollowCamera` + update: pitch 60°±0.1°, perspective, fixed yaw, damping, aim-bias ≤2 m; **never** writes `SimState`. | `src/render/createFollowCamera.ts` | G5, M6 |
| 15 | Implement `updateCeilingCutaway(deckScene, graph, playerX, playerZ, renderState)` — hide only current/last room ceiling. | `src/render/ceilingCutaway.ts` | G5 |
| 16 | Wire `boot.ts`: after deck validate + `spawnDeckEntities`, `spawnPlayer`; add player mesh to scene; if debug fly → fly cam + KeyE ownership (no follow update); else follow cam + cutaway + aim sampler wiring. Pass `collisionWorld` into frame loop. Keep fps overlay, devices, bus. | `src/app/boot.ts` | G1, G5, G8 |
| 17 | Extend `frameLoop.ts`: after `applyCommands`, call `integratePlayerMotion`; invoke `onFrame` for follow/cutaway/mesh sync (render-only). Assert path: sim tick count independent of camera (G5). | `src/render/frameLoop.ts` | G5, G7 |
| 18 | Write Vitest suite E1–E22 + keep scaffold/deck suites green. Extend `fakeDevices` for axes. | `tests/player/**`, `tests/input/**`, `tests/render/**`, helpers | G1–G8, M1–M8 |
| 19 | Append README subsection **Player controller**: controls (WASD, mouse aim, gamepad sticks, E/south interact), `?debugCamera=1` KeyE note, verification commands. | `README.md` | G8 |
| 20 | Verify `npm run test:run` and `npm run build` green; smoke default boot + debug fly. Do not commit. | — | G1–G8 |

*Traceability check: G1→T1,T3,T6,T16,T18; G2→T1,T2,T7,T8,T9,T10,T11,T18; G3→T2,T8–T11,T18; G4→T7,T18; G5→T1,T5,T14–T17,T18; G6→T2,T8–T11,T18; G7→T3,T4,T7,T17,T18; G8→T10,T16,T19,T20. M1↔G2; M2↔G2; M3↔G3; M4↔T12; M5↔G4; M6↔G5; M7↔G6; M8↔T13. All G1–G8 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts` — append)

```ts
/** Player move speed (m/s). Design pack M1 — P1 checkpoint tunable. */
export const PLAYER_MOVE_SPEED_MPS = 6 as const;

/** Entity kind string for the local player. */
export const PLAYER_KIND = 'player' as const;

/** Allied / player blockout color (visual direction §3 safe/allied). */
export const PLAYER_COLOR_HEX = '#69f0ae' as const;

/** Visual capsule radius (m) — matches ACTOR_PROXY_RADIUS_M. */
export const PLAYER_MESH_RADIUS_M = ACTOR_PROXY_RADIUS_M;

/** Visual capsule height (m), excluding artistic wedge. */
export const PLAYER_MESH_HEIGHT_M = 1.6 as const;

/** Facing wedge length along forward (m). */
export const PLAYER_WEDGE_LENGTH_M = 0.35 as const;

/** Radial deadzone for gamepad sticks (M3). P1 checkpoint tunable. */
export const GAMEPAD_AXIS_DEADZONE = 0.24 as const;

/** Follow camera pitch below horizontal (degrees). Pack M6 / VD §7. */
export const FOLLOW_CAMERA_PITCH_DEG = 60 as const;

/** Perspective FOV (degrees). */
export const FOLLOW_CAMERA_FOV_DEG = 50 as const;

/** Distance from focus point to camera along the pitched view ray (m). */
export const FOLLOW_CAMERA_DISTANCE_M = 18 as const;

/** Max aim-bias shift of frame center toward aim point (m). Pack M6. */
export const FOLLOW_AIM_BIAS_M = 2.0 as const;

/** Render-side follow position smoothing rate (higher = snappier). Not sim state. */
export const FOLLOW_CAMERA_POS_SMOOTH = 12 as const;

/** Render-side focus smoothing rate. */
export const FOLLOW_CAMERA_FOCUS_SMOOTH = 10 as const;
```

### Commands API (`src/sim/commands.ts`)

```ts
/** Closed set for this feature: scaffold verbs + move/aim axes. */
export type ActionId = 'interact' | 'cancel' | 'move' | 'aim';

/**
 * Sim-facing command. NO device provenance field (scaffold Q3 — still binding).
 * - interact/cancel: value 0|1; axis fields omitted
 * - move/aim: axisX/axisZ in [-1, 1]; value unused (set 0)
 */
export interface InputCommand {
  tick: number;
  sequence: number;
  action: ActionId;
  value: 0 | 1;
  axisX?: number;
  axisZ?: number;
}

export function commandsEqualForParity(a: InputCommand, b: InputCommand): boolean;
```

Parity for discrete actions unchanged: reset bus → one device press → drain; compare full objects (no `source`/`device`/`kind`).

### Entity / world (`src/sim/types.ts`, `world.ts`)

```ts
export interface Entity {
  id: EntityId;
  kind: string;
  x: number;
  y: number;
  z: number;
  /** Radians; atan2(dirX, dirZ). */
  yaw: number;
  moveIntentX: number;
  moveIntentZ: number;
  alive: boolean;
}

export interface WorldMeta {
  interactCount: number;
  cancelCount: number;
  lastAction: ActionId | null;
  interactHeld: boolean;
  cancelHeld: boolean;
  playerId: EntityId | null;
}
```

`spawnEntity` initializes `yaw = 0`, `moveIntentX = 0`, `moveIntentZ = 0`. Markers keep zeros.

### Spawn player

```ts
/** Spawns exactly one player at port-airlock spawn; sets meta.playerId. */
export function spawnPlayer(state: SimState, graph: DeckGraph): EntityId;
```

### Motion API

```ts
/**
 * Integrates player position for one fixed tick from moveIntent* speed * FIXED_DT.
 * Slide: full step → else X → else Z; each tested with circleHitsWalls(..., ACTOR_PROXY_RADIUS_M).
 * No-op if meta.playerId is null or entity missing/dead.
 * MUST NOT use frame delta or Date.now / Math.random.
 */
export function integratePlayerMotion(state: SimState, world: CollisionWorld): void;
```

Call order per tick (frame loop + replay):

1. `bus.enqueueFromDevices` / scripted commands ready  
2. `cmds = drainForTick(state.tick)`  
3. `applyCommands(state, cmds)`  
4. `integratePlayerMotion(state, collisionWorld)`  
5. `fixedStep(state)` // tick += 1

### applyCommands extensions

| Action | Behavior |
|--------|----------|
| `move` | `entity.moveIntentX = axisX`; `entity.moveIntentZ = axisZ` (player only) |
| `aim` | if `hypot(axisX,axisZ) > 0`: `entity.yaw = atan2(axisX, axisZ)` |
| `interact` value 1 | existing counters + `console.debug` in DEV |
| `interact` value 0 | `interactHeld = false` |
| `cancel` | unchanged |

### Room query

```ts
export function pointInNodeFootprint(node: DeckNode, x: number, z: number): boolean;
/** Returns node id containing (x,z), or null if none. If multiple (should not), smallest id. */
export function roomAtPosition(graph: DeckGraph, x: number, z: number): string | null;
```

### Input channels & bus

```ts
export type InputChannel = 'move' | 'aim' | 'interact';

export function channelForAction(action: ActionId): InputChannel;
// move → move; aim → aim; interact|cancel → interact
```

`DeviceSample` extension:

```ts
export interface DeviceSample {
  kind: DeviceKind;
  action: ActionId;
  value: 0 | 1;
  axisX?: number;
  axisZ?: number;
}
```

`CommandBus` behavior:

- Track `owner: Record<InputChannel, DeviceKind | null>`.
- On real sample for action A from device D: if `owner[channel(A)]` is set and ≠ D.kind, and channel is `interact`, flush synthetic releases for digital held actions on departing device that map to `interact` channel; then set owner to D.kind.
- Axis samples (`move`/`aim`) update channel owner without flushing interact holds.
- `drainForTick` still stamps monotonic `sequence` with **no** provenance fields.
- `getActiveDeviceKind()` may return interact-channel owner for backward compat, or be replaced by `getChannelOwner(channel)` — if removed, update tests accordingly but keep E7/E8/E13 semantics.

### Follow camera

```ts
export interface FollowCamera {
  camera: THREE.PerspectiveCamera;
  /** Render-only update; reads player pose + yaw; must not mutate SimState. */
  update(dtSec: number, player: { x: number; y: number; z: number; yaw: number }): void;
}

export function createFollowCamera(): FollowCamera;
```

Rig invariants (tests):

- `camera.isPerspectiveCamera === true`
- pitch angle from horizontal = `FOLLOW_CAMERA_PITCH_DEG` ± 0.1°
- yaw fixed (camera does not orbit with player yaw)
- aim-bias offset magnitude ≤ `FOLLOW_AIM_BIAS_M` + 1e-3

### Ceiling cutaway

```ts
export interface CutawayState {
  lastRoomId: string | null;
}

export function updateCeilingCutaway(
  roomGroups: ReadonlyMap<string, THREE.Group>,
  graph: DeckGraph,
  x: number,
  z: number,
  state: CutawayState,
): void;
```

Hide mesh named `ceiling:<roomId>` (or the ceiling child inside `room:<id>` group — match `createDeckScene` naming `ceiling:${node.id}`).

### Debug KeyE precedence

```ts
// keyboardMouse.ts onKeyDown for KeyE:
if (findKeyboardBinding('KeyE') === 'interact' && isDebugFlyCameraEnabled()) {
  return; // fly camera owns KeyE
}
```

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Fresh world + `spawnDeckEntities` + `spawnPlayer` | Exactly one `kind===player'`; pose within ±0.01 m of `computeSpawnPoint(..., 'port-airlock')`; yaw matches spawn; `meta.playerId` set | `spawnPlayer.test.ts` |
| E2 | Scripted `move` intent `(1,0)` for 60 ticks | Δx ≈ `6 * 1.0` ±0.05; z unchanged aside from collision | `motion.test.ts` |
| E3 | Scripted diagonal intent `(1,1)` for 60 ticks | Speed ‖Δ‖/t ≈ 6 (normalized); no √2 boost | `motion.test.ts` |
| E4 | KBM-mapped vs gamepad-mapped identical move command streams | Identical final pose (parity of commands via `commandsEqualForParity` on axis cmds from reset buses) | `motion.test.ts` / `axesArbitration.test.ts` |
| E5 | Aim-only commands; move intent zero | Position unchanged; yaw matches `atan2` | `aim.test.ts` |
| E6 | Move-only commands (no aim) | Yaw unchanged from spawn | `aim.test.ts` |
| E7 | Drive into Class A / B interior / B bulkhead / C hull | No penetration (`!circleHitsWalls` at final pose with r=0.4); slide along wall | `motion.test.ts` |
| E8 | Scripted path through all 17 door openings at r=0.4 | Completes without stuck penetration (extends deck E10 to live player) | `motion.test.ts` |
| E9 | FollowCamera rig | Pitch 60±0.1°; perspective; bias cap 2 m | `followCamera.test.ts` |
| E10 | Ceiling cutaway | Occupied room ceiling hidden; other rooms’ ceilings visible; doorway gap keeps last room | `ceilingCutaway.test.ts` |
| E11 | Sim ticks with follow cam on vs off (headless: call/no-call update) | Identical `state.tick` and `hashSimState` after N ticks with same commands | `followCamera.test.ts` / `determinism.test.ts` |
| E12 | Interact press/release KBM + gamepad through bus | `interactHeld` edges; counts increment on press only | `interact.test.ts` |
| E13 | DEV interact press | `console.debug` invoked once (spy); no throw in production build path when DEV false | `interact.test.ts` |
| E14 | Same command stream replayed twice with player + collision | Identical positions, yaws, hash | `determinism.test.ts` |
| E15 | Different command stream | Different hash | `determinism.test.ts` |
| E16 | Scaffold E7/E9/E14 | Still pass (interact/cancel parity, repeat, no provenance) | `parity.test.ts` |
| E17 | Scaffold E8/E13 | Still pass (interact-channel synthetic releases) | `hotSwap.test.ts` |
| E18 | Pad emits `move` while KBM holds `interact` | Interact remains held; move channel owner = gamepad; **no** synthetic interact release | `axesArbitration.test.ts` |
| E19 | Pad emits `interact` while KBM holds `interact` | Synthetic release then pad owns interact channel | `axesArbitration.test.ts` |
| E20 | Right stick inside deadzone | No aim command / yaw unchanged | `aim.test.ts` |
| E21 | `isDebugFlyCameraEnabled` true | KeyE does not enqueue interact from KBM; fly still rises (manual OK for rise) | unit: device poll; smoke for fly |
| E22 | Boot without debug flag | Follow camera active (not fly); player mesh visible | manual smoke |

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
| G1 | E1 pass |
| G2 | E2–E4 pass |
| G3 | E5–E6, E20 pass |
| G4 | E7–E8 pass |
| G5 | E9–E11 pass |
| G6 | E12–E13 pass |
| G7 | E14–E15 pass |
| G8 | E21–E22; scaffold debug gating unchanged |
| Scaffold G5 | E16–E17 pass |
| M4 | E18–E19 pass |

### Manual / smoke (required evidence in PR body)

```bash
npm run dev
# default: player at port airlock, follow cam, WASD move, mouse aim, E interact (console)
# then ?debugCamera=1: fly cam; KeyE rises; no KeyE interact
```

1. Player green capsule + facing wedge readable at ~60° — G1/M8.  
2. Move 6 m/s feel; diagonals not faster — G2/M1/M2.  
3. Aim independent of move (twin-stick) — G3/M3.  
4. Walls block/slide; can cross all doorways — G4.  
5. Occupied room ceiling hidden — G5.  
6. Interact logs in DEV console — G6.  
7. Debug fly flag behavior + KeyE precedence — G8.

### PR body must cite

- Spec version (`SPEC v1`), goals G1–G8, mechanics M1–M8  
- Link to `features/p1-player-controller/clarification-log.md` (no questions)  
- Design doc **v1.11**, visual direction **v1.2**, design pack **v1**  
- `npm run test:run` + `npm run build` summary  
- Screenshots: default follow-cam player on deck + ceiling cutaway; optional debug-fly note  

Branch: `feat/p1-player-controller` → PR to `integration`.

---

## Out of scope (Composer must NOT touch)

**From design pack (enforce):**

- Combat, firing, health, enemies, AI  
- Sprint, crouch, jump, dodge  
- Aim-assist (0.35 / 10° — deferred to `p1-gamepad-support`)  
- HUD / UI navigation  
- Interaction consumers (doors, keys, patches, vents, objectives)  
- Netcode / multiplayer transport  
- Player flashlight or authored lighting changes  
- Animation beyond static capsule/wedge  

**Also out of scope:**

- Editing `docs/design/**`, `docs/team/**`, this feature’s `design-pack.md`, or other `features/*` packs  
- Changing tick rate (`TICK_HZ`), adding physics engines  
- Removing scaffold `cancel` verb  
- Changing deck JSON layout or wall classes  
- Committing to `master` / `integration`; Composer uses `feat/p1-player-controller` only  
- Implementing P2+ hold-duration interaction semantics beyond press/release plumbing  

---

*Clarification for this spec: see `clarification-log.md` in this folder (all resolved — no questions).*
