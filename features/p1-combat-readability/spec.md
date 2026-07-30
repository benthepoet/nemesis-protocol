# HOTFIX Technical Specification — p1-combat-readability

`HOTFIX SPEC v1 FINAL | feature p1-combat-readability | parent p1-combat-core | charter v1.13 | design doc v1.13 | design pack v2 | visual direction v1.4 | goals: G10 (+ G1..G9 regression) | mechanics: M10`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability. Charter §7 S2 path (reduced ceremony).*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.13** · parent design pack **v2** (G10/M10/R7/R8 addendum) · visual direction **v1.4** (§6 P1 muzzle/impacts row, §7 rule 7) · feature roadmap **v1.7** · shipped parent: `p1-combat-core` on `master` · clarification log **all resolved (no questions)** · AGENTS.md current

### Clarification rulings incorporated

None raised — R7/R8 + visual v1.4 §6/§7 fully settle G10/M10. Technical dimensions (tracer radius, line Y height, opacity numbers, mesh construction) below are Technical Lead authority only and do not change observable design rules.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | — | — |

Composer may start Stage 3 on branch `feat/p1-combat-readability`.

---

## Mission (charter §7 S2)

Director Gate-2 iteration on shipped combat: visible projectile tracers + persistent in-world aim-direction line. **Render-side only.** Sim projectile model, damage, ammo, bindings, and accepted G1–G9 behavior are **frozen**. A regression of any accepted G# is itself an S1.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Module split | New `src/render/combatTelegraphs.ts` for tracers + aim line; **keep** existing `combatVfx.ts` muzzle/impacts/hit-flash unchanged (G9 frozen) | G10 supplements G9; isolation makes sim-coupling review trivial |
| Tracer lifecycle | Map `EntityId → tracer mesh group`; sync from live `PROJECTILE_KIND` entities each render frame; remove + dispose when entity absent (impact **or** max-range despawn) | R7; G10(b) |
| Tracer geometry | Two coaxial thin cylinders (or boxes) along velocity: core white `#ffffff`, halo `#69f0ae` (`PLAYER_COLOR_HEX`); length `TRACER_LENGTH_M = 1.2`; centered on projectile XZ (Y = `TRACER_Y_M`); oriented by entity `yaw` | R7; VD §3/§6 |
| Tracer materials | `MeshBasicMaterial` additive / high emissive (`blending: AdditiveBlending`, `depthWrite: false`, `transparent: true`) — not a dynamic light; muzzle `PointLight` stays in `combatVfx` | R7; G9 unchanged |
| Aim-line geometry | Thin dual-line (core + halo) from muzzle to wall hit or 60 m clamp; rebuilt/updated each frame via buffer positions or scaled unit segment | R8 |
| Wall termination | **New** read-only `earliestWallHit(ax,az,bx,bz, world)` in `projectileCollision.ts` — AABB + polyEdges only, **no actor tests**. Aim line calls this; projectiles continue using `earliestSegmentHit` (actors + walls) | R8; M2 wall semantics shared |
| Intensity FSM | Alive + `!fireHeld` → dim; alive + `fireHeld` → bright (including during reload); `!alive` → hide | R8; G10(d) |
| Muzzle origin | Same formula as sim spawn: `player.x/z + facing * PROJECTILE_MUZZLE_OFFSET_M` | R8; matches fire origin |
| Interpolation | Optional render-side: may advance tracer along yaw by `accumulator * PROJECTILE_SPEED_MPS` between fixed ticks — **must not write SimState** | R7 permits; not required for acceptance if per-frame entity sample is legible |
| Enable gate | `CombatTelegraphs` always constructed in boot; sync is a no-op when `enabled === false` (test/dev toggle). Default `enabled: true` in production boot | G10(e) |
| Sim coupling | Telegraphs **read** `SimState` + `CollisionWorld` only; never call `applyDamage`, `spawnEntity`, mutate entities/meta/traveled, or enqueue commands | G8, G10(e) |
| Hostile tracers | Not implemented | Pack v2 non-goal; stand-ins don't shoot |

---

## Exact project layout (additions / extensions only)

```
/
├── src/
│   ├── config.ts                         # EXTEND: telegraph presentation constants only
│   ├── combat/
│   │   └── projectileCollision.ts        # EXTEND: export earliestWallHit (walls only, read-only)
│   ├── render/
│   │   ├── combatTelegraphs.ts           # NEW: tracers + aim line (G10)
│   │   ├── combatVfx.ts                  # KEEP — do not change muzzle/impacts/hit-flash behavior
│   │   └── frameLoop.ts                  # KEEP tick order; no sim changes
│   └── app/
│       └── boot.ts                       # EXTEND: create/sync/dispose combatTelegraphs in onFrame
└── tests/
    ├── combat/
    │   ├── telegraphs.test.ts            # NEW: G10 wall query + coupling + lifecycle helpers
    │   ├── determinism.test.ts           # EXTEND: G10(e) telegraphs on/off identical hash
    │   └── *.test.ts                     # KEEP green — full G1–G9 regression (charter §7)
    └── helpers/
        └── combatTestUtils.js            # EXTEND only if needed for telegraph harness (prefer no change)
```

Do **not** edit `docs/`, `assets/`, `tools/mockups/`, other feature design packs, or change three.js / Vitest / Vite pins. Do **not** alter sim fire rate, projectile speed/range/damage, ammo, HP, bindings, or `integrateCombat` spawn/despawn logic.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Append **Telegraph constants** to `src/config.ts` exactly as listed below. No magic numbers for telegraph tunables in render code. | `src/config.ts` | G10, M10, R7, R8 |
| 2 | Extract/export `earliestWallHit(ax, az, bx, bz, world): WallHit \| null` from existing wall AABB + polyEdge tests in `projectileCollision.ts`. Must **ignore actors**. Must not mutate `SimState` (signature takes no state, or state unused). Refactor `earliestSegmentHit` to reuse the wall pass so semantics stay identical for projectiles. | `src/combat/projectileCollision.ts` | G10(c), R8, M2 |
| 3 | Implement `createCombatTelegraphs(scene, opts?)` per **Telegraphs API**: tracer map by stable `EntityId`; aim-line mesh; `sync(state, collisionWorld)`; `setEnabled(bool)`; `dispose()`. Materials/colors per R7/R8. | `src/render/combatTelegraphs.ts` | G10(a)–(d), M10, R7, R8 |
| 4 | Tracer sync rules: for each live `PROJECTILE_KIND` entity, ensure tracer exists; pose at entity XZ (Y=`TRACER_Y_M`), rotate to `yaw`, length=`TRACER_LENGTH_M` along velocity; on missing entity, remove tracer same frame (covers wall impact, actor impact, max-range). Cap concurrent tracers at `TRACER_MAX_CONCURRENT` (assert/dev warn only — do not drop sim projectiles). | `src/render/combatTelegraphs.ts` | G10(a)(b), R7 |
| 5 | Aim-line sync rules: if player missing or `!alive` → hide line. Else origin = muzzle; end = `earliestWallHit` along facing for segment length `PROJECTILE_MAX_RANGE_M`, or full 60 m if no hit; intensity dim/bright from `meta.fireHeld`; visible while `reloadTicksRemaining > 0` (still dim/bright by fireHeld). Actors must not shorten the line. | `src/render/combatTelegraphs.ts` | G10(c)(d), R8 |
| 6 | Wire boot: construct telegraphs; in both follow and debug-fly `onFrame` paths call `telegraphs.sync(world, collisionWorld)` **after** mesh pose sync, **before or after** `combatVfx.update` (order free); dispose on shutdown. Do not pass telegraphs into sim/replay. | `src/app/boot.ts` | G10, G9 |
| 7 | Extend determinism suite: identical command stream with telegraphs `sync` invoked vs skipped (or `enabled` false) → identical `tick`, `hashSimState`, projectile/HP/ammo. Add unit tests for `earliestWallHit` (hits wall, ignores actor, clamps at range). | `tests/combat/determinism.test.ts`, `tests/combat/telegraphs.test.ts` | G10(e), G8 |
| 8 | Full G1–G9 regression: `npm run test:run` must keep all existing combat + input + scaffold tests green (E1–E28 from parent spec + prior suites). No weakening of assertions. | `tests/**` | G1–G9, charter §7 |
| 9 | Verify `npm run build` green. Smoke / screenshot evidence notes for G10(a)–(d) and G9 still-holds (f) in PR body — muzzle light + impacts unchanged. Do not commit. | — | G10(a)–(d)(f), G9 |
| 10 | Append README subsection **Combat readability telegraphs**: aim line + tracers are world-space (not HUD); branch name; link parent pack v2. | `README.md` | G10, M10 |

*Traceability check: G10(a)→T3,T4,T6,T9; G10(b)→T4,T7; G10(c)→T2,T5,T7,T9; G10(d)→T5,T9; G10(e)→T3,T6,T7; G10(f)/G9→T6,T8,T9; G1–G9 regression→T8; M10↔G10; R7↔T1,T3,T4; R8↔T1,T2,T5. Zero orphan tasks. Zero goals without tasks.*

---

## Data structures & APIs

### Telegraph constants (`src/config.ts` — append)

```ts
/** Visual tracer slug length (m) — R7: ≈ 2 sim ticks at 60 m/s. */
export const TRACER_LENGTH_M = 1.2 as const;

/** Tracer height above floor (m) — presentation only. */
export const TRACER_Y_M = 0.55 as const;

/** Tracer core radius (m). */
export const TRACER_CORE_RADIUS_M = 0.035 as const;

/** Tracer halo radius (m). */
export const TRACER_HALO_RADIUS_M = 0.07 as const;

/** Hot-white tracer core (R7 / VD §3). */
export const TRACER_CORE_COLOR_HEX = '#ffffff' as const;

/** Allied halo — must equal PLAYER_COLOR_HEX (#69f0ae). */
export const TRACER_HALO_COLOR_HEX = PLAYER_COLOR_HEX;

/** Soft budget for concurrent tracer meshes (R7). */
export const TRACER_MAX_CONCURRENT = 12 as const;

/** Aim-line height above floor (m). */
export const AIM_LINE_Y_M = 0.5 as const;

/** Aim-line dim opacity at rest (alive, fire not held). */
export const AIM_LINE_DIM_OPACITY = 0.28 as const;

/** Aim-line bright opacity while fire held. */
export const AIM_LINE_BRIGHT_OPACITY = 0.9 as const;

/** Aim-line core / halo half-widths (m) for tube or fat-line presentation. */
export const AIM_LINE_CORE_RADIUS_M = 0.02 as const;
export const AIM_LINE_HALO_RADIUS_M = 0.045 as const;

/** Aim-line colors — same allied treatment as tracers (R8). */
export const AIM_LINE_CORE_COLOR_HEX = TRACER_CORE_COLOR_HEX;
export const AIM_LINE_HALO_COLOR_HEX = TRACER_HALO_COLOR_HEX;
```

Reuse existing: `PROJECTILE_KIND`, `PROJECTILE_MUZZLE_OFFSET_M`, `PROJECTILE_MAX_RANGE_M`, `PROJECTILE_SPEED_MPS`, `PLAYER_KIND`, `PLAYER_COLOR_HEX`. Do **not** change those values.

### Wall-only hit (`src/combat/projectileCollision.ts`)

```ts
export interface WallHit {
  t: number; // 0..1 along segment
  x: number;
  z: number;
}

/**
 * First wall obstruction along segment (AABB + polyEdges).
 * Actors ignored. Read-only vs CollisionWorld.
 */
export function earliestWallHit(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  world: CollisionWorld,
): WallHit | null;
```

`earliestSegmentHit` must continue to return the earliest of wall **or** actor hits (refactor wall loop to call `earliestWallHit` then compare actors).

### Telegraphs API (`src/render/combatTelegraphs.ts`)

```ts
export interface CombatTelegraphsOptions {
  /** Default true. When false, sync is a no-op (meshes hidden / not created). */
  enabled?: boolean;
}

export interface CombatTelegraphs {
  /** Read-only sync from sim + collision. Must not mutate SimState. */
  sync(state: SimState, collisionWorld: CollisionWorld): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

export function createCombatTelegraphs(
  scene: THREE.Scene,
  opts?: CombatTelegraphsOptions,
): CombatTelegraphs;
```

**`sync` algorithm (normative):**

1. If `!enabled`: hide all telegraph meshes; return.
2. **Tracers:**  
   - Collect ids of entities with `kind === PROJECTILE_KIND && alive`.  
   - Remove tracers whose ids are not in the set.  
   - For each id: create if missing; set position `(x, TRACER_Y_M, z)`; set quaternion/rotation from `yaw` so long axis = velocity direction `(sin yaw, 0, cos yaw)`; scale/length = `TRACER_LENGTH_M`.
3. **Aim line:**  
   - Resolve `playerId` / player entity. If missing or `!alive`: hide aim line; return from aim branch.  
   - `dirX = sin(yaw)`, `dirZ = cos(yaw)`.  
   - `ox = x + dirX * PROJECTILE_MUZZLE_OFFSET_M`, `oz = z + dirZ * PROJECTILE_MUZZLE_OFFSET_M`.  
   - `ex = ox + dirX * PROJECTILE_MAX_RANGE_M`, `ez = oz + dirZ * PROJECTILE_MAX_RANGE_M`.  
   - `hit = earliestWallHit(ox, oz, ex, ez, collisionWorld)`.  
   - End point = hit ? `(hit.x, hit.z)` : `(ex, ez)`.  
   - Show line from `(ox, AIM_LINE_Y_M, oz)` to `(endX, AIM_LINE_Y_M, endZ)`.  
   - Opacity = `meta.fireHeld ? AIM_LINE_BRIGHT_OPACITY : AIM_LINE_DIM_OPACITY`.

**Palette / readability (Gate 1):** white core + `#69f0ae` only; never `#ff5252` on player telegraphs; never `#ffd54f` (interactable). Subordinate to future enemy telegraphs (no competing hero bloom).

### Boot wiring

```ts
const telegraphs = createCombatTelegraphs(deckScene.scene);
// inside onFrame (both camera paths), after mesh sync:
telegraphs.sync(world, collisionWorld);
// on dispose:
telegraphs.dispose();
```

Do not feed telegraphs into `startFrameLoop` / `replay` / `integrateCombat`.

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test / evidence |
|----|------|-------------------|-----------------|
| H1 | Held-fire burst | Distinct moving tracer slugs along facing; white/`#69f0ae`; legible on hull-steel | G10(a) smoke/screenshot |
| H2 | Wall impact despawn | Tracer removed same render frame entity is gone | G10(b) unit: sync after integrate removes tracer id |
| H3 | Max-range despawn (60 m) | Tracer removed; no orphan | G10(b) |
| H4 | Aim line vs wall | Terminates at first wall class A/B/C; open spine reaches ~60 m | G10(c); `earliestWallHit` unit |
| H5 | Aim line vs living stand-in | Line **passes through** actor; length unchanged by actor presence | G10(c); unit compare with/without stand-in on ray |
| H6 | Dim / bright / reload / dead | Rest=dim; fireHeld=bright; reload+alive=visible; dead=hidden | G10(d) unit on sync visibility/opacity |
| H7 | Telegraphs enabled vs disabled | Identical tick + `hashSimState` + G1–G8 outcomes | G10(e); extend E21 pattern |
| H8 | `sync` does not mutate state | `hashSimState` before/after sync identical; entity fields unchanged | `telegraphs.test.ts` |
| H9 | G9 muzzle + impacts | Unchanged after this hotfix | G10(f); no `combatVfx` behavior edits; smoke |
| H10 | Existing E1–E28 + prior suites | All green | charter §7 regression |
| H11 | Zero sim RNG coupling | No `Math.random`/`Date.now` in new telegraph module | grep / static |
| H12 | Player respawn | Aim line returns (dim) when alive again | G10(d) |

---

## Test / verification requirements

Composer must run **all** of the following before opening the PR.

### Automated (required green)

```bash
npm run test:run
npm run build
```

**New / extended cases (minimum):**

| Test | Asserts |
|------|---------|
| `earliestWallHit` hits expanded wall AABB | `t` in [0,1]; point on segment |
| `earliestWallHit` ignores actors | Same end with/without living stand-in on segment |
| Tracer lifecycle helper | After combat tick that despawns projectile, `sync` leaves no tracer for that id (expose `__debugTracerCount` **or** test via scene children count / exported test hook — prefer a package-private `getTracerIdsForTest()` only under `import.meta.env.DEV` or `vitest`) |
| Aim FSM | dead→hidden; alive !fireHeld→dim opacity; fireHeld→bright |
| Coupling | clone state → sync → hash equal; replay with/without sync → hash equal |
| Regression | Full existing `tests/combat/**` + `tests/input/**` + scaffold suites |

### Manual / PR evidence (G10)

PR body must include:

1. Note that G10(a)–(d) were verified at the 60° follow camera (screenshot optional but preferred).  
2. Confirmation G9 still holds (muzzle light lights geometry; wall sparks; hit flash).  
3. `npm run test:run` count + `npm run build` exit 0.  
4. Statement: no sim constant or `integrateCombat` logic changes.

---

## Out of scope (Composer must NOT touch)

**From design pack v2 non-goals:**

- Any sim change: projectile speed/range/damage/fire-rate, collision vs actors, HP, ammo, reload, bindings (R2/M1–M6 frozen).
- Hostile/enemy tracers (`p1-enemy-baseline`).
- Spread/recoil visualization, ricochets, bullet drop (R6 — none in sim).
- HUD / crosshair / screen-space overlays (`p1-hud` #7).
- Laser-sight attachment fiction or hero weapon models.

**Also out of scope:**

- Edits to `docs/design/**`, parent `design-pack.md` content (already landed).
- Audio, AI, wall damage, aim-assist, ammo pickups.
- Refactors of unrelated render/sim modules beyond the wall-hit extract.
- Changing `combatVfx.ts` muzzle/impact/hit-flash behavior (G9 freeze) — drive-by cleanup forbidden.

---

## Branch / PR

- **Branch:** `feat/p1-combat-readability` (from latest `master`).
- **PR target:** `integration`.
- **Commit message pattern:** `G10,M10 @ hotfix spec v1 — <summary>`.
- **Review budget:** fresh 5-round Stage 4 budget (§3.5a); this is not counted against the closed `p1-combat-core` PR.

---

*Clarification for this spec: see `clarification-log.md` in this folder (zero questions).*
