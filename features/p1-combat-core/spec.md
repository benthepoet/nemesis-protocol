# Technical Specification — p1-combat-core

`SPEC v1 | feature p1-combat-core | charter v1.13 | design doc v1.12 | design pack v1 | goals: G1..G9 | mechanics: M1..M9`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.12** · design pack **v1** · feature roadmap **v1.5** (P1 #4) · visual direction **v1.2** · shipped deps: `p1-project-scaffold`, `p1-deck-geometry`, `p1-player-controller` (SPEC v1 FINAL, Gate 2) · clarification log **all resolved (no questions)** · AGENTS.md current

### Clarification rulings incorporated

None raised — design pack v1 + design doc v1.12 fully settle G1–G9 / M1–M9 / R1–R6. Technical gaps below (muzzle offset, channels, debug command shape, stand-in yaw, VFX durations, event bus) are Technical Lead authority only.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | — | — |

Composer may start Stage 3 on branch `feat/p1-combat-core`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Command vocabulary | Extend `ActionId` with `'fire' \| 'reload' \| 'debugDamage'`. Discrete `value: 0 \| 1`. Axis actions unchanged. | G1, G5, G7, M1, M8, R5 |
| Fire intent | Press/release digital commands set `meta.fireHeld`; **rate gated in sim** at 10 rps (`FIRE_INTERVAL_TICKS = 6`). Devices never auto-repeat fire. | M1; device repeat must not control rate |
| Reload intent | `reload` value `1` attempts start; value `0` is no-op. Auto-reload: when `fireHeld` and magazine empty and not reloading and reserve > 0, start reload (same path as explicit reload). | G5, M6 |
| Input channels (M4) | Add channels `'fire'` and `'reload'` beside `move` / `aim` / `interact`. `cancel` still shares `interact`. `debugDamage` maps to channel `'debug'` (never device-owned). Synthetic digital releases on **fire** / **reload** / **interact** channel flips only. | Pack M4/M8; must not break scaffold/player E7/E8/E9/E13/E14 |
| Bindings (R1) | Fire: mouse-0 / gamepad button **7** (RT). Reload: `KeyR` / gamepad button **2** (face west). Interact: `KeyE` only + face south (**drop mouse-0**). Cancel unchanged. | §8 v1.12 |
| Dead / input inert | When player `alive === false`, `applyCommands` ignores `move`/`aim`/`fire`/`reload`/`interact`/`cancel` player effects; `integratePlayerMotion` already no-ops. `debugDamage` no-ops if player missing/dead. | G4, M5 |
| Actor HP | Extend `Entity` with `hp: number` (default `0` on `spawnEntity`). Player + stand-ins start at `ACTOR_MAX_HP` (100). Markers stay `hp: 0` and are never damage targets. | G3, M4 |
| Weapon / fire state | Live on `WorldMeta` (solo local player): `fireHeld`, `magazine`, `reserve`, `reloadTicksRemaining`, `fireCooldownTicks`, `respawnTicksRemaining`. | G1, G5, M6 |
| Projectile entities | `kind: PROJECTILE_KIND`; fields use pose + `yaw` as flight direction; `ownerId` stored in parallel `Map` on combat module state **or** encoded via entity extension `ownerId: EntityId \| null` (prefer **Entity.ownerId** default `null`). Despawn = `entities.delete`. | G2, M2 |
| Muzzle / self-hit | Spawn at player XZ + facing * `PROJECTILE_MUZZLE_OFFSET_M` (`0.45`). Hit tests **always skip** `ownerId`. Satisfies pack: never collides with firer on spawn tick. | Pack open note; TL |
| Swept collision | Each tick move `speed * FIXED_DT` along yaw; test segment vs wall AABBs/poly-edges and vs living actor circles (`ACTOR_PROXY_RADIUS_M`). First hit wins (wall or actor by distance along segment). Walls: despawn + impact event, **no wall HP**. | G2, M2, R3 |
| Fire cadence | On spawn shot: set `fireCooldownTicks = FIRE_INTERVAL_TICKS`. While held, each combat integrate: if cooldown > 0 decrement; else if can fire, spawn and reset cooldown. First eligible tick after press fires immediately when cooldown is 0. | G1 — exactly 10 shots in 60 ticks of continuous eligible fire |
| Reload timer | `RELOAD_DURATION_TICKS = 120` (2.0 s @ 60 Hz). Uninterruptible; blocks fire; on zero, `moved = min(MAGAZINE_SIZE - magazine, reserve)`; magazine += moved; reserve -= moved. | G5, M6, R2 |
| Stand-in placement | Footprint geometric center of `main-spine`, `cargo-hold`, `barracks` via shared helper (same math as spawn footprint center). Spawn order fixed: spine → cargo → barracks. Yaw: face toward `main-spine` center (cargo/barracks); spine faces port-airlock spawn point. | G6, M7 |
| Debug damage (R5) | `debugDamage` value `1` applies `RIFLE_DAMAGE_PER_HIT` (25) to player through **identical** `applyDamage` path. No device binding. DEV/tests enqueue only; production `applyCommands` ignores if `!import.meta.env.DEV`. | G3, G4, R5 |
| Tick order | `applyCommands` → `integratePlayerMotion` → `integrateCombat` → `fixedStep`. Same in frame loop + replay. | G8; extends player-controller order |
| Presentation events | `integrateCombat` returns `CombatEvent[]`; frame loop forwards to VFX; **never** stored in `SimState` / hash. Replay discards return value. | G9; zero sim coupling |
| VFX | Render-only: muzzle `PointLight`, wall impact sparks, actor hit flash. Palette: hostile `#ff5252`; impacts spark on steel; no red/green meaning collision with allied `#69f0ae`. | G9, M9, VD §3/§4.2/§6/§7 |
| DEV readout | Thin DEV-only text overlay: player HP, mag, reserve, reload flag — not a HUD (pack non-goal). | G4/G5 observability |
| World hash | Extend entity payload with `hp`, `ownerId`; extend meta with weapon/respawn/fireHeld fields (stable key order). | G8 |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not rename/move scaffold, deck, or player packages. Do not invent extra top-level packages beyond `src/combat/`.

```
/
├── src/
│   ├── config.ts                         # EXTEND: combat constants
│   ├── sim/
│   │   ├── commands.ts                   # EXTEND: fire/reload/debugDamage
│   │   ├── types.ts                      # EXTEND: Entity.hp/ownerId; WorldMeta combat fields
│   │   ├── world.ts                      # EXTEND: spawn defaults; clone
│   │   ├── step.ts                       # EXTEND: apply fire/reload/debugDamage; dead inert
│   │   ├── hash.ts                       # EXTEND: combat fields
│   │   ├── replay.ts                     # EXTEND: call integrateCombat each tick
│   │   └── playerMotion.ts               # KEEP (already skips !alive)
│   ├── input/
│   │   ├── types.ts                      # EXTEND: InputChannel fire/reload/debug
│   │   ├── bindings.ts                   # EXTEND: R1 bindings; drop interact mouse-0
│   │   ├── keyboardMouse.ts              # EXTEND: KeyR reload; mouse-0 → fire
│   │   ├── gamepad.ts                    # EXTEND: RT fire, face-west reload
│   │   ├── commandBus.ts                 # EXTEND: fire/reload channel owners + synthetic flush
│   │   └── mapper.ts                     # KEEP pattern (discrete map)
│   ├── combat/
│   │   ├── types.ts                      # NEW: CombatEvent, damage helpers types
│   │   ├── constants usage via config    # (no duplicate magic numbers)
│   │   ├── applyDamage.ts                # NEW: shared HP pipeline (G3)
│   │   ├── integrateCombat.ts            # NEW: fire rate, reload, projectiles, death/respawn
│   │   ├── projectileMotion.ts           # NEW: sweep move + first hit
│   │   ├── projectileCollision.ts        # NEW: segment vs walls/actors
│   │   └── spawnStandIns.ts              # NEW: 3 crew stand-ins (G6)
│   ├── deck/
│   │   └── spawn.ts                      # EXTEND: export footprintCenter(node) for stand-ins OR add roomCenter(graph,id) in graph/roomQuery
│   ├── render/
│   │   ├── createStandInMesh.ts          # NEW: hostile capsule blockout (M7/M9)
│   │   ├── createRifleBlockout.ts        # NEW: optional kit-bash on player (blockout)
│   │   ├── combatVfx.ts                  # NEW: muzzle light + impacts + hit flash (G9)
│   │   ├── combatDevReadout.ts           # NEW: DEV HP/ammo text
│   │   ├── frameLoop.ts                  # EXTEND: integrateCombat + VFX ingest
│   │   └── createPlayerMesh.ts           # EXTEND: optional rifle child OK
│   └── app/
│       └── boot.ts                       # EXTEND: spawn stand-ins, meshes, VFX, readout
└── tests/
    ├── combat/
    │   ├── fireRate.test.ts              # G1
    │   ├── projectiles.test.ts           # G2
    │   ├── damage.test.ts                # G3
    │   ├── deathRespawn.test.ts          # G4
    │   ├── ammo.test.ts                  # G5
    │   ├── standIns.test.ts              # G6
    │   ├── bindingsParity.test.ts        # G7
    │   └── determinism.test.ts           # G8
    ├── input/
    │   ├── parity.test.ts                # KEEP green; update interact≠mouse-0 expectations if any
    │   ├── hotSwap.test.ts               # KEEP; ADD fire channel swap cases
    │   └── fireReloadArbitration.test.ts # M4 fire/reload channels
    └── helpers/
        ├── fakeDevices.ts                # EXTEND if needed
        └── combatTestUtils.ts            # NEW: deck+player+stand-ins harness
```

Do **not** edit `docs/`, `assets/`, `tools/mockups/`, or other feature folders’ design packs. Do not change three.js / Vitest / Vite pins.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Extend `src/config.ts` with **Constants** below exactly. No other magic numbers for combat tunables. | `src/config.ts` | G1–G6, M1–M7, R2 |
| 2 | Extend `ActionId` / `InputCommand` with `fire`, `reload`, `debugDamage`. Update `commandsEqualForParity` (discrete still omit axes). | `src/sim/commands.ts` | G1, G5, G7, M1, M8, R5 |
| 3 | Extend `Entity` with `hp`, `ownerId` (`null` default). Extend `WorldMeta` with combat fields per **WorldMeta combat**. Update `spawnEntity` / `cloneSimState` defaults (`hp: 0`, `ownerId: null`; meta weapon fields at mission start values when creating world — see spawn player task). | `src/sim/types.ts`, `src/sim/world.ts` | G3, G5, G8 |
| 4 | Extend `hash.ts` entity + meta serialization with combat fields (stable alphabetical / existing key order discipline). | `src/sim/hash.ts` | G8 |
| 5 | Export `footprintCenter` (or `roomFootprintCenter(graph, roomId)`) from deck for reuse — **no duplicated center math**. | `src/deck/spawn.ts` and/or `src/deck/roomQuery.ts` | G6 |
| 6 | Implement `applyDamage(state, targetId, amount): void` — clamp HP at 0; on transition to 0 set `alive = false`; if target is player set `respawnTicksRemaining = RESPAWN_DELAY_TICKS`; if stand-in, leave corpse (`alive false`, still in map). Shared path for projectiles + debugDamage. | `src/combat/applyDamage.ts` | G3, G4, M4, M5 |
| 7 | Implement projectile collision helpers: segment vs `CollisionWorld` (AABB + poly edges), segment vs actor circle; return earliest hit along segment. | `src/combat/projectileCollision.ts` | G2, M2, R3 |
| 8 | Implement `integrateCombat(state, collisionWorld, graph): CombatEvent[]` per **Combat integrate API** (fire, reload, projectiles, death/respawn). | `src/combat/integrateCombat.ts`, `src/combat/projectileMotion.ts`, `src/combat/types.ts` | G1–G5, G8, M1–M6 |
| 9 | Extend `applyCommands`: fire held edges; reload start attempt; debugDamage (DEV); **ignore player verbs when player dead**; keep move/aim/interact/cancel behavior for living player. | `src/sim/step.ts` | G1, G4, G5, G7, M1, M6, M8, R5 |
| 10 | Wire `integrateCombat` into `frameLoop.ts` + `replay.ts` **after** `integratePlayerMotion`, before `fixedStep`. Forward events to VFX only in frame loop. | `src/render/frameLoop.ts`, `src/sim/replay.ts` | G8, G9 |
| 11 | Extend input channels + `channelForAction`; extend `CommandBus` owners for `fire`/`reload`/`debug`; synthetic releases on fire/reload/interact flips; `resetSession` clears new owners. Keep axis flip behavior. Scaffold/player parity tests stay green. | `src/input/types.ts`, `src/input/commandBus.ts` | G7, M4, M8 |
| 12 | Update `ACTION_BINDINGS` per R1; remove interact `mouseButton: 0`; add fire/reload bindings. Keyboard/mouse + gamepad devices pick up via existing find* helpers (ensure RT index 7 and west index 2 are polled). | `src/input/bindings.ts`, `src/input/keyboardMouse.ts`, `src/input/gamepad.ts` | G7, M8, R1 |
| 13 | Implement `spawnStandIns(state, graph): EntityId[]` — exactly 3, kinds `SECURITY_CREW_KIND`, HP 100, alive, positions per **Stand-in placement (binding)**, after `spawnPlayer`. Store ids in `meta.standInIds` (ordered). | `src/combat/spawnStandIns.ts` | G6, M7 |
| 14 | On `spawnPlayer` (or boot immediately after): init player `hp = ACTOR_MAX_HP`; init meta magazine/reserve/cooldowns/respawn/fireHeld per constants. | `src/player/spawnPlayer.ts` and/or boot | G3, G5 |
| 15 | Render stand-in meshes (capsule `#ff5252` hostile accent) + sync poses; corpses stay visible. Optional rifle blockout on player. | `src/render/createStandInMesh.ts`, boot | G6, M7, M9 |
| 16 | Implement `combatVfx.ts`: consume `CombatEvent[]` — muzzle dynamic light (VD §4.2), wall impact sparks (VD §6), actor hit flash; update/expire on render dt only; never write `SimState`. | `src/render/combatVfx.ts` | G9, M9 |
| 17 | DEV combat readout (HP / mag / reserve / reloading). Absent from production path when `!import.meta.env.DEV`. | `src/render/combatDevReadout.ts` | G4, G5 |
| 18 | Wire `boot.ts`: after player spawn → `spawnStandIns`; add meshes; VFX + readout in `onFrame`; keep follow cam / cutaway / debug fly behavior. | `src/app/boot.ts` | G1, G6, G9 |
| 19 | Write Vitest suite E1–E28 below; keep all prior suites green (update any test that assumed interact↔mouse-0). | `tests/combat/**`, `tests/input/**`, helpers | G1–G8, M1–M8 |
| 20 | Append README **Combat core** subsection: bindings (R1), fire/reload, DEV debugDamage enqueue note, verification commands. | `README.md` | G7, G8 |
| 21 | Verify `npm run test:run` and `npm run build` green; smoke default boot combat + VFX. Do not commit. | — | G1–G9 |

*Traceability check: G1→T1,T2,T8,T9,T12,T19; G2→T1,T7,T8,T19; G3→T1,T3,T6,T9,T14,T19; G4→T6,T8,T9,T17,T19; G5→T1,T3,T8,T9,T14,T17,T19; G6→T1,T5,T13,T15,T18,T19; G7→T2,T11,T12,T19,T20; G8→T3,T4,T8,T10,T19; G9→T10,T16,T18,T21. M1↔G1; M2↔G2; M3↔G1/G3; M4↔G3; M5↔G4; M6↔G5; M7↔G6; M8↔G7; M9↔G9. R1↔T12; R3↔T7/T8; R5↔T2/T6/T9; R6↔no RNG. All G1–G9 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts` — append)

```ts
/** Security-crew stand-in entity kind (M7). */
export const SECURITY_CREW_KIND = 'security-crew' as const;

/** Projectile entity kind (M2). */
export const PROJECTILE_KIND = 'projectile' as const;

/** Shared actor max HP (player + crew). Design §10 / pack R2. */
export const ACTOR_MAX_HP = 100 as const;

/** Rifle damage per actor hit. Design §10. */
export const RIFLE_DAMAGE_PER_HIT = 25 as const;

/** Automatic fire rate (rounds/s). Design §10. */
export const RIFLE_FIRE_RATE_RPS = 10 as const;

/** Ticks between shots at TICK_HZ. Must equal TICK_HZ / RIFLE_FIRE_RATE_RPS (= 6). */
export const FIRE_INTERVAL_TICKS = TICK_HZ / RIFLE_FIRE_RATE_RPS;

/** Magazine capacity. */
export const MAGAZINE_SIZE = 30 as const;

/** Reserve ammo at mission start. */
export const RESERVE_AMMO_START = 120 as const;

/** Reload duration (seconds) — uninterruptible. */
export const RELOAD_DURATION_SEC = 2.0 as const;

/** Reload duration in ticks (= 120 at 60 Hz). */
export const RELOAD_DURATION_TICKS = Math.round(RELOAD_DURATION_SEC * TICK_HZ);

/** Projectile speed (m/s). */
export const PROJECTILE_SPEED_MPS = 60 as const;

/** Projectile max range (m). */
export const PROJECTILE_MAX_RANGE_M = 60 as const;

/** Spawn offset along facing from actor center (m) — outside proxy radius. */
export const PROJECTILE_MUZZLE_OFFSET_M = 0.45 as const;

/** Player respawn delay (seconds). Placeholder §10. */
export const RESPAWN_DELAY_SEC = 3.0 as const;

/** Respawn delay in ticks (= 180). */
export const RESPAWN_DELAY_TICKS = Math.round(RESPAWN_DELAY_SEC * TICK_HZ);

/** Hostile stand-in blockout color (VD §3 alarm/hazard). */
export const HOSTILE_COLOR_HEX = '#ff5252' as const;

/** Stand-in capsule height (m). */
export const STAND_IN_MESH_HEIGHT_M = 1.6 as const;

/** Muzzle flash point-light intensity (render-only). */
export const MUZZLE_FLASH_INTENSITY = 4.0 as const;

/** Muzzle flash light range (m). */
export const MUZZLE_FLASH_RANGE_M = 6.0 as const;

/** Muzzle flash lifetime (seconds, render-only). */
export const MUZZLE_FLASH_DURATION_SEC = 0.06 as const;

/** Actor hit-flash duration (seconds, render-only). */
export const HIT_FLASH_DURATION_SEC = 0.1 as const;
```

Assert in tests: `FIRE_INTERVAL_TICKS === 6`, `RELOAD_DURATION_TICKS === 120`, `RESPAWN_DELAY_TICKS === 180`.

### Commands API (`src/sim/commands.ts`)

```ts
export type ActionId =
  | 'interact'
  | 'cancel'
  | 'move'
  | 'aim'
  | 'fire'
  | 'reload'
  | 'debugDamage';

/**
 * - interact/cancel/fire/reload/debugDamage: value 0|1; axis omitted
 * - move/aim: axisX/axisZ; value 0
 * NO device provenance (scaffold Q3 still binding).
 */
export interface InputCommand {
  tick: number;
  sequence: number;
  action: ActionId;
  value: 0 | 1;
  axisX?: number;
  axisZ?: number;
}
```

### Entity / WorldMeta

```ts
export interface Entity {
  id: EntityId;
  kind: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  moveIntentX: number;
  moveIntentZ: number;
  alive: boolean;
  /** Actor hit points; 0 for non-actors / markers. */
  hp: number;
  /** Projectile owner; null for non-projectiles. */
  ownerId: EntityId | null;
}

export interface WorldMeta {
  interactCount: number;
  cancelCount: number;
  lastAction: ActionId | null;
  interactHeld: boolean;
  cancelHeld: boolean;
  playerId: EntityId | null;
  /** Ordered stand-in ids: spine, cargo, barracks. */
  standInIds: EntityId[];
  fireHeld: boolean;
  magazine: number;
  reserve: number;
  reloadTicksRemaining: number;
  fireCooldownTicks: number;
  respawnTicksRemaining: number;
}
```

`createWorld` / defaults: `standInIds: []`, `fireHeld: false`, `magazine: MAGAZINE_SIZE`, `reserve: RESERVE_AMMO_START`, `reloadTicksRemaining: 0`, `fireCooldownTicks: 0`, `respawnTicksRemaining: 0`.

### Input channels

```ts
export type InputChannel = 'move' | 'aim' | 'interact' | 'fire' | 'reload' | 'debug';

export function channelForAction(action: ActionId): InputChannel {
  if (action === 'move') return 'move';
  if (action === 'aim') return 'aim';
  if (action === 'fire') return 'fire';
  if (action === 'reload') return 'reload';
  if (action === 'debugDamage') return 'debug';
  return 'interact'; // interact | cancel
}
```

### Bindings (R1) — replace `ACTION_BINDINGS`

```ts
export const ACTION_BINDINGS: readonly ActionBinding[] = [
  { action: 'fire', mouseButton: 0, gamepadButton: 7 },
  { action: 'reload', keyboard: 'KeyR', gamepadButton: 2 },
  { action: 'interact', keyboard: 'KeyE', gamepadButton: 0 }, // NO mouseButton
  { action: 'cancel', keyboard: 'Escape', gamepadButton: 1 },
];
```

### Stand-in placement (binding)

Algorithm (Composer **must** compute from `DeckGraph`, not paste floats as the sole source):

1. `center = footprintCenter(getNode(graph, roomId))` for roomIds in order:
   - `'main-spine'`
   - `'cargo-hold'`
   - `'barracks'`
2. `y = 0`
3. Validate `!circleHitsWalls(world, x, z, ACTOR_PROXY_RADIUS_M)` (centers are clear on deck03).
4. Yaw:
   - `cargo-hold` / `barracks`: `atan2(spineCenter.x - x, spineCenter.z - z)`
   - `main-spine`: `atan2(portSpawn.x - x, portSpawn.z - z)` where `portSpawn = computeSpawnPoint(graph, 'port-airlock')`

**Expected meter positions on shipped `deck03` (tests ±0.01):**

| Order | Room id | x (m) | z (m) | SVG center (sx, sy) |
|------:|---------|-------|-------|---------------------|
| 0 | `main-spine` | `570 * M_PER_PX` (= 118.75) | `400 * M_PER_PX` (= 83.333…) | (570, 400) |
| 1 | `cargo-hold` | `497 * M_PER_PX` (= 103.5416…) | `335 * M_PER_PX` (= 69.7916…) | (497, 335) |
| 2 | `barracks` | `527 * M_PER_PX` (= 109.7916…) | `465 * M_PER_PX` (= 96.875) | (527, 465) |

### applyCommands extensions

| Action | Living player | Dead player |
|--------|---------------|-------------|
| `fire` value 1 | `meta.fireHeld = true`; `lastAction = 'fire'` | ignore |
| `fire` value 0 | `meta.fireHeld = false` | ignore (also clear held if needed on death — set `fireHeld=false` when entering death) |
| `reload` value 1 | try `tryBeginReload(state)` | ignore |
| `reload` value 0 | no-op | ignore |
| `debugDamage` value 1 | if DEV: `applyDamage(player, RIFLE_DAMAGE_PER_HIT)` | ignore |
| `move`/`aim`/`interact`/`cancel` | existing behavior | ignore |

`tryBeginReload`: if `reloadTicksRemaining > 0` return; if `reserve <= 0` return; if `magazine >= MAGAZINE_SIZE` return; else `reloadTicksRemaining = RELOAD_DURATION_TICKS`.

### Combat integrate API

```ts
export type CombatEvent =
  | { type: 'muzzle'; x: number; y: number; z: number; yaw: number }
  | { type: 'impact-wall'; x: number; y: number; z: number }
  | { type: 'impact-actor'; x: number; y: number; z: number; targetId: EntityId }
  | { type: 'hit-flash'; targetId: EntityId };

/**
 * Per fixed tick after integratePlayerMotion:
 * 1. Player respawn countdown if !alive && respawnTicksRemaining > 0;
 *    at 0 → restore pose via computeSpawnPoint(port-airlock), hp/ammo full, alive true.
 * 2. If reloading: decrement; on 0 move rounds reserve→magazine.
 * 3. Auto-reload: if fireHeld && magazine===0 && reserve>0 && !reloading → tryBeginReload.
 * 4. Fire: if player alive && fireHeld && !reloading && magazine>0 && fireCooldownTicks===0
 *    → spawn projectile at muzzle, magazine−1, fireCooldownTicks=FIRE_INTERVAL_TICKS, muzzle event.
 *    Else if fireCooldownTicks>0 → decrement.
 * 5. Integrate all projectiles (sweep); on actor hit applyDamage; on wall/range despawn; emit events.
 * MUST NOT use Math.random / Date.now / frame dt.
 */
export function integrateCombat(
  state: SimState,
  collisionWorld: CollisionWorld,
  graph: DeckGraph,
): CombatEvent[];
```

Projectile spawn:

```ts
dirX = sin(yaw); dirZ = cos(yaw); // match yaw = atan2(dirX, dirZ)
x = player.x + dirX * PROJECTILE_MUZZLE_OFFSET_M;
z = player.z + dirZ * PROJECTILE_MUZZLE_OFFSET_M;
// entity: kind PROJECTILE_KIND, yaw=player.yaw, ownerId=playerId, hp=0, alive=true
```

Per-tick travel distance = `PROJECTILE_SPEED_MPS * FIXED_DT` (= 1 m). Accumulate range; delete when traveled ≥ `PROJECTILE_MAX_RANGE_M` or on hit.

Actor targets: entities with `kind === PLAYER_KIND || kind === SECURITY_CREW_KIND`, `alive === true`, id ≠ ownerId. (Player is not friendly-fired by self; solo has no second player.)

### Tick order (frame loop + replay)

1. `bus.enqueueFromDevices` / scripted commands ready  
2. `cmds = drainForTick(state.tick)`  
3. `applyCommands(state, cmds)`  
4. `integratePlayerMotion(state, collisionWorld)`  
5. `integrateCombat(state, collisionWorld, graph)`  
6. `fixedStep(state)` // tick += 1

Replay signature must accept `graph` (or collision+graph) in addition to existing `collisionWorld`.

### VFX API (render-only)

```ts
export interface CombatVfx {
  /** Ingest sim events; must not mutate SimState. */
  push(events: readonly CombatEvent[]): void;
  /** Advance lights/particles by render dt. */
  update(dtSec: number): void;
  dispose(): void;
}

export function createCombatVfx(scene: THREE.Scene): CombatVfx;
```

Muzzle: real `THREE.PointLight` (not emissive sprite alone). Impacts: short-lived spark points/bursts. Hit flash: temporary emissive or color pulse on stand-in/player mesh.

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Hold fire 60 ticks, full ammo, not reloading | Exactly **10** projectiles spawned; magazine 20 | `fireRate.test.ts` |
| E2 | Fire during reload | Zero spawns; magazine unchanged by fire | `fireRate.test.ts` / `ammo.test.ts` |
| E3 | Fire with magazine 0 (no auto path blocked if reserve 0) | Zero spawns | `ammo.test.ts` |
| E4 | Projectile speed / range | Advances 1 m/tick along yaw; deleted at ≥60 m traveled with no hit | `projectiles.test.ts` |
| E5 | Point-blank into Class A, B interior, B bulkhead, C hull | Projectile removed; no wall HP/state; impact-wall event | `projectiles.test.ts` |
| E6 | Sweep: projectile would tunnel through thin wall in one tick | Still hits wall (segment test); no tunnel | `projectiles.test.ts` |
| E7 | Hit living stand-in | HP 100→75; shared `applyDamage`; impact-actor + hit-flash events | `damage.test.ts` |
| E8 | Four hits on stand-in | HP 0, alive false; further projectiles pass through (no collide) | `damage.test.ts` / `deathRespawn.test.ts` |
| E9 | HP never negative | applyDamage(999) → hp 0 | `damage.test.ts` |
| E10 | Player debugDamage ×4 (DEV) | Dead; fire/move inert; after 180 ticks respawn at port spawn ±0.01; hp 100; mag 30; reserve 120 | `deathRespawn.test.ts` |
| E11 | Stand-in corpse persists | Entity still in map after death; kind unchanged | `deathRespawn.test.ts` |
| E12 | 30 shots then hold fire with reserve | 31st fire attempt starts reload; completes at 120 ticks; magazine refilled min(30,reserve) | `ammo.test.ts` |
| E13 | Reload with reserve 0 | No-op | `ammo.test.ts` |
| E14 | Explicit reload mid-mag | Starts if reserve>0 and mag<30; uninterruptible | `ammo.test.ts` |
| E15 | Exactly 3 stand-ins at binding positions ±0.01; stable order ids | `standIns.test.ts` |
| E16 | End-to-end kill each stand-in via scripted fire | All three dead | `standIns.test.ts` |
| E17 | KBM vs gamepad fire/reload command streams parity (`commandsEqualForParity`) | Identical drained commands for matched press streams | `bindingsParity.test.ts` |
| E18 | mouse-0 / RT → fire only (never interact); E / south → interact only (never fire) | `bindingsParity.test.ts` |
| E19 | Identical combat command stream replayed twice | Identical HP/ammo/projectile trajectories + hash | `determinism.test.ts` |
| E20 | Different fire stream | Different hash | `determinism.test.ts` |
| E21 | VFX push enabled vs discarded | Identical `tick` + `hashSimState` | `determinism.test.ts` |
| E22 | Scaffold/player interact parity E7/E9/E14 | Still green | `parity.test.ts` |
| E23 | Scaffold/player hot-swap E8/E13 | Still green | `hotSwap.test.ts` |
| E24 | Pad emits `fire` while KBM holds `fire` | Synthetic fire release then pad owns fire channel | `fireReloadArbitration.test.ts` |
| E25 | Pad emits `move` while KBM holds `fire` | Fire remains held; **no** synthetic fire release | `fireReloadArbitration.test.ts` |
| E26 | Projectile skips owner | Spawning at muzzle never damages firer | `projectiles.test.ts` |
| E27 | Production path ignores `debugDamage` when `import.meta.env.DEV === false` (guard test / branch) | No HP change | `deathRespawn.test.ts` |
| E28 | No `Math.random` / `Date.now` in `src/combat/**` | Static review or grep in test harness | `determinism.test.ts` |

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
| G2 | E4–E6, E26 pass |
| G3 | E7–E9 pass |
| G4 | E10–E11 pass |
| G5 | E12–E14 pass |
| G6 | E15–E16 pass |
| G7 | E17–E18 pass |
| G8 | E19–E21, E28 pass |
| Prior input | E22–E25 pass |
| R5 | E10, E27 pass |

### Manual / smoke (required evidence in PR body)

```bash
npm run dev
# LMB / RT hold-to-fire; R / west reload; E interact (not LMB)
# Kill three red stand-ins; observe muzzle light + wall sparks + hit flash
# DEV readout shows HP/ammo
```

1. Fire 10 rps feel; reload 2 s lockout — G1/G5.  
2. Walls block bullets, no chipping — G2/R3.  
3. Three hostile capsules at spine/cargo/barracks — G6.  
4. Muzzle lights geometry (not sprite-only) — G9.  
5. mouse-0 does not interact — G7/R1.

### PR body must cite

- Spec version (`SPEC v1`), goals G1–G9, mechanics M1–M9  
- Link to `features/p1-combat-core/clarification-log.md` (no questions)  
- Design doc **v1.12**, visual direction **v1.2**, design pack **v1**  
- `npm run test:run` + `npm run build` summary  
- Screenshots: muzzle light + stand-in hit; binding note for R1  

Branch: `feat/p1-combat-core` → PR to `integration`.

---

## Out of scope (Composer must NOT touch)

**From design pack (enforce):**

- Enemy AI, patrol/chase/attack, spawners, alarm — `p1-enemy-baseline`  
- HUD bars / hit markers — `p1-hud` (DEV readout only)  
- Wall HP, chip, breach, depressurization — P3 (R3)  
- Explosives, AoE, melee, weapon swap  
- Aim-assist — `p1-gamepad-support` (R4)  
- Ammo pickups / Armory resupply  
- Audio  
- Mission fail/restart beyond 3 s respawn placeholder  
- Animation, gore, hero weapon/crew models  

**Also out of scope:**

- Editing `docs/design/**`, `docs/team/**`, this feature’s `design-pack.md`, or other `features/*` packs  
- Changing `TICK_HZ`, adding physics engines  
- Reintroducing interact↔mouse-0  
- Committing to `master` / `integration`; Composer uses `feat/p1-combat-core` only  
- Netcode transport / multiplayer  

---

## Composer start blockers

**None.** Spec is FINAL; clarification count = 0. Composer must not invent mechanics outside M1–M9; on ambiguity stop and ask Grok (charter §1).

---

*Clarification for this spec: see `clarification-log.md` in this folder (all resolved — no questions).*
