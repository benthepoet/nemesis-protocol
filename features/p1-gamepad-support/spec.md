# Technical Specification — p1-gamepad-support

`SPEC v1 FINAL | feature p1-gamepad-support | charter v1.13 | design doc v1.17 | design pack v1 | goals: G1..G9 | mechanics: M1..M7`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.17** · visual direction **v1.6** · design pack **v1** @ `ae0d8f7` (G1–G9, M1–M7, R1–R8) · feature roadmap **v1.8** (P1 #8) · shipped deps: `p1-player-controller`, `p1-combat-core` (+ readability), `p1-enemy-baseline`, `p1-mission-shell`, `p1-hud` · clarification log **all resolved (no Kimi questions; TL bindings below)** · AGENTS.md current · HEAD surveyed `ae0d8f7`

### Clarification rulings incorporated

No design questions raised to Kimi — pack v1 + design doc v1.17 fully settle G1–G9 / M1–M7 / R1–R8. Pre-answered pack topics (device-origin plumbing, LOS reuse, assist while firing, multi-pad, deadzone) are locked as Technical Lead bindings below. Zero doc bumps required for this spec.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | (none to Kimi) | TL bindings in Technical decisions |

Composer may start Stage 3 on branch `feat/p1-gamepad-support`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Assist module | New pure sim helper `src/sim/aimAssist.ts`: `selectAimAssistTarget(...)` + `applyAimAssistYaw(...)`. No new entity kinds, no crew AI writes. | G1/G2/M1; keeps facing math out of devices |
| Assist tick site | Inside `applyCommands` when processing an `aim` command **and** `ctx.aimAssist === true` **and** `ctx.collisionWorld` is provided. Otherwise yaw = `atan2(axisX, axisZ)` (shipped behavior). | M1/M6 sim-side; preserves sticky when no `aim` command (R5) |
| Device-origin (R4) | **Channel-owner hint, not a command field.** `InputCommand` stays provenance-free (scaffold E14). Live path: `runFixedTimestepSlice` sets `aimAssist = (bus.getChannelOwner('aim') === 'gamepad')` after `drainForTick`. KBM owning `aim` → `aimAssist: false`. Null owner → false. | G3; pack anticipated topic; no provenance on drained commands |
| Replay / scripted paths | Extend `replay` and test tick helpers with optional `aimAssist?: boolean` (default **`false`** so all shipped suites stay bit-identical). G7/G8 gamepad-mapped streams pass `aimAssist: true`. | G8; G3 regression default |
| Magnetism math (R1/G1) | While assisted: `yaw += AIM_ASSIST_MAGNETISM * normalizeAngle(targetYaw - yaw)` (blend from **current** facing toward target). Cone/selection always use **raw stick** yaw `atan2(ax,az)`. When no eligible target: `yaw = rawYaw` bit-exact. | G1 sequence 5°→3.25°→2.1125°…; R1 exponential approach; exit cone = snap to raw (no hysteresis) |
| Cone | Half-angle `AIM_ASSIST_HALF_ANGLE_DEG = 10` → rad via `* Math.PI / 180`. Eligible iff `abs(normalizeAngle(angleToTarget - rawYaw)) ≤ halfAngle`. Boundary: exactly 10° **in**; 10°+ε **out**. | R2; G1 |
| Range | `AIM_ASSIST_RANGE_M = PROJECTILE_MAX_RANGE_M` (**60**). Reuse the combat constant — do not invent a second number. | R3; §10 |
| Eligibility subjects | Living entities with `kind === SECURITY_CREW_KIND` and `alive === true` listed in `meta.crewIds` (or equivalent crew enumeration already used by combat). Ignore player, projectiles, markers, corpses. | G2, M5 |
| LOS | **Reuse** `hasLineOfSight` from `src/ai/perception.ts` (player→crew and crew→player are symmetric segments). All wall classes block via `earliestWallHit`. No parallel LOS model. | R3; pack anticipated topic; rule spec 5 |
| Selection | Among eligible: minimize angular offset from raw yaw; tie → minimize Euclidean XZ distance; remaining tie → lower `EntityId` (stable, deterministic). | G2; G8 |
| Fire held | Assist behavior identical whether `fireHeld` is true or false — aim-channel only. | Pack anticipated topic |
| Neutral stick | No `aim` command emitted (shipped gamepad/bus behavior) → `applyCommands` does not touch yaw → no assist, no drift (R5/G4). | M2 sticky symmetry |
| Hot-swap mechanism | **Unchanged.** Per-channel MRU + synthetic releases already shipped. This feature adds **mission-state verification** only (G5). Do not redesign arbitration. | R7 |
| Bindings | **Freeze.** `ACTION_BINDINGS` / move keys / deadzone must match `ae0d8f7` (empty diff vs master baseline for binding tables). | G6 |
| Presentation | No new DOM/HUD/UI. Aim-direction line already reads `entity.yaw` — assisted facing flows through automatically. Add a telegraph test asserting line direction matches assisted yaw. | G9, M7, R6 |
| Multi-pad / haptics / remap | Out of scope (non-goals). First connected pad only, as shipped. | Pack non-goals |
| Tick order | Unchanged: `applyCommands` → `integrateMissionShell` → `integratePlayerMotion` → `integrateCrewAi` → `integrateCombat` → `fixedStep`. Assist uses crew poses at command-apply time (pre-AI step) — deterministic. | M6 |
| Hash | No new hashed meta fields for assist/origin. Facing changes appear only via existing entity `yaw` in the hash. | G8 |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not invent top-level packages beyond `src/sim/aimAssist.ts` and the listed test files.

```
/
├── src/
│   ├── config.ts                         # EXTEND: AIM_ASSIST_* constants
│   ├── sim/
│   │   ├── aimAssist.ts                  # NEW: select + blend (G1/G2)
│   │   ├── step.ts                       # EXTEND: ApplyCommandsContext; assisted aim
│   │   └── replay.ts                     # EXTEND: optional aimAssist flag
│   ├── ai/
│   │   └── perception.ts                 # KEEP: reuse hasLineOfSight only (import)
│   ├── input/
│   │   ├── commandBus.ts                 # KEEP getChannelOwner (already present); no redesign
│   │   └── bindings.ts                   # KEEP — audit only, no edits
│   ├── render/
│   │   └── frameLoop.ts                  # EXTEND: pass aimAssist from aim-channel owner
│   └── app/
│       └── boot.ts                       # KEEP wiring (both devices already present)
└── tests/
    ├── sim/
    │   └── aimAssist.test.ts             # NEW: G1, G2, G4 unit/sim cases
    ├── player/
    │   └── aim.test.ts                   # EXTEND: KBM/raw path unchanged (G3)
    ├── input/
    │   ├── parity.test.ts                # KEEP green (G6)
    │   ├── hotSwap.test.ts               # KEEP green
    │   ├── gamepadAxes.test.ts           # KEEP green
    │   ├── axesArbitration.test.ts       # KEEP green
    │   ├── fireReloadArbitration.test.ts # KEEP green
    │   ├── mouseAimSticky.test.ts        # KEEP green
    │   ├── bindingsAudit.test.ts         # NEW: binding table freeze vs contract (G6)
    │   └── missionHotSwap.test.ts        # NEW: G5 mission-state swaps
    ├── mission/
    │   └── gamepadOnlyLoop.test.ts       # NEW: G7 full-loop harness
    ├── combat/
    │   ├── determinism.test.ts           # EXTEND or sibling: assist replay (G8)
    │   └── telegraphs.test.ts            # EXTEND: aim line tracks assisted yaw (G9)
    ├── render/
    │   └── hudView.test.ts               # KEEP: still exactly five elements (G9 regression)
    └── helpers/
        ├── missionTestUtils.ts           # EXTEND: aimAssist option on runMissionTicks
        ├── combatTestUtils.ts            # EXTEND: aimAssist option on runTicks
        └── gamepadLoopUtils.ts           # NEW (optional): FakeInputDevice('gamepad') mission driver
```

Do **not** edit `docs/` (except this feature folder’s logs if asked), `assets/` tangible art, `tools/mockups/`, or other features’ design packs. Do not change three.js / Vitest / Vite pins. Do not add audio, HUD elements, bindings, or crew-AI changes.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Add constants to `src/config.ts` exactly: `AIM_ASSIST_MAGNETISM = 0.35`, `AIM_ASSIST_HALF_ANGLE_DEG = 10`, `AIM_ASSIST_HALF_ANGLE_RAD = (10 * Math.PI) / 180`, `AIM_ASSIST_RANGE_M = PROJECTILE_MAX_RANGE_M`. No other magic numbers for assist. | `src/config.ts` | G1, G2, M1, R1–R3, R8 |
| 2 | Implement `src/sim/aimAssist.ts` per **Aim-assist API**: `normalizeAngle`, `selectAimAssistTarget`, `assistedYawFromStick`. Pure functions; import `hasLineOfSight` from perception; enumerate living `SECURITY_CREW_KIND` only. | `src/sim/aimAssist.ts` | G1, G2, G4, M1, M5, R1–R3 |
| 3 | Extend `applyCommands(state, commands, ctx?: ApplyCommandsContext)` per **Commands API**. When `aim` + `ctx.aimAssist` + `ctx.collisionWorld`: write assisted yaw; else shipped raw `atan2`. Omit/`undefined` ctx ⇒ raw path (all existing call sites stay correct). | `src/sim/step.ts` | G1, G3, G4, M1, M2, M6 |
| 4 | Wire live path: after `drainForTick`, `applyCommands(world, cmds, { collisionWorld: collisionRef.current, aimAssist: bus.getChannelOwner('aim') === 'gamepad' })`. | `src/render/frameLoop.ts` | G3, G5, M1, M4, R4 |
| 5 | Extend `replay(..., options?: { aimAssist?: boolean })` (default false). Extend `runMissionTicks` / `runTicks` with the same optional flag; pass `collisionWorld` into `applyCommands` when `aimAssist: true`. | `src/sim/replay.ts`, `tests/helpers/missionTestUtils.ts`, `tests/helpers/combatTestUtils.ts` | G7, G8, M6 |
| 6 | Tests **aim-assist core** (G1/G2/G4): magnetism sequence 5°→3.25°→2.1125°; 10° in / 10.1° out bit-exact raw; no crew → raw; nearest-angle + distance tie-break; wall occludes → no assist; 61 m → no assist; kill mid-hold → retarget or raw; outside cone 45° → zero pull; neutral (no aim cmd) → sticky no drift; sweep through cone no hysteresis. | `tests/sim/aimAssist.test.ts` | G1, G2, G4, M1, M5 |
| 7 | Tests **gamepad-only gate** (G3): scripted streams with `aimAssist: false` and crew in-cone → facing === `atan2` bit-exact; existing `tests/player/aim.test.ts` still green; static/review note: assist unreachable when aim-channel owner is KBM (frameLoop predicate). Optional: FakeInputDevice KBM aim through bus → `getChannelOwner('aim')==='keyboard-mouse'` → apply with false. | `tests/player/aim.test.ts`, `tests/sim/aimAssist.test.ts` | G3, M1, R4 |
| 8 | Tests **mission hot-swap** (G5): using `CommandBus` + `FakeInputDevice` pairs on a real mission world — swap KBM↔pad during BRIEFING, during INSERTION (verbs locked), mid-ACTIVE with `fire` held, and SCORE. After each swap: no phase reset/menu; synthetic release clears departing fire/reload/interact; facing at swap+1 equals facing at swap when neither device emits a new aim that tick; receiving device’s next sample owns its channel. Shipped `hotSwap` / `axesArbitration` suites unmodified and green. | `tests/input/missionHotSwap.test.ts` | G5, M4, R7 |
| 9 | **Parity + binding audit** (G6): all of `tests/input/*` green unmodified in behavior; new `bindingsAudit.test.ts` asserts `ACTION_BINDINGS` equals the §8 v1.12 contract (fire mouse0/RT7, reload R/face-west2, interact E/face-south0, cancel Esc/face-east1) and that confirm/interact never shares fire’s binding. | `tests/input/bindingsAudit.test.ts`, keep existing input tests | G6, M3 |
| 10 | **Gamepad-only E2E harness** (G7): `tests/mission/gamepadOnlyLoop.test.ts` drives a complete loop using **only** `FakeInputDevice('gamepad')` samples through `CommandBus` (KBM device absent or never polled with samples). Flow: BRIEFING breach select (left-stick + face-south) → wait full `AIRLOCK_ENTRY_CYCLE_TICKS` → ACTIVE: place player with harness pose into LOS of one living crew → gamepad aim (in-cone, `aimAssist` true via channel owner) + RT fire until crew dead (alarm may trip) → harness pose to Engineering footprint + one gamepad move tick if needed → SCORE fields populated → face-south restart → BRIEFING. Assert zero `keyboard-mouse` samples in the recorded stream. Companion: KBM-only equivalent still reaches SCORE (regression; may reuse existing mission helpers with `aimAssist: false`). | `tests/mission/gamepadOnlyLoop.test.ts`, optional `tests/helpers/gamepadLoopUtils.ts` | G7, M3, M4, M6 |
| 11 | **Determinism** (G8): identical gamepad-mapped command stream + `aimAssist: true` + crew present, replayed twice → identical yaw trajectories (sample every tick) and identical `hashSimState`; alter one aim axis → hash differs. Assert assist path uses no `Math.random` / `performance.now` / frame-dt (code review + test). | `tests/combat/determinism.test.ts` or `tests/sim/aimAssistDeterminism.test.ts` | G8, M6 |
| 12 | **Presentation** (G9): extend telegraphs test — after assisted aim ticks, `getAimLineEndpointsForTest` direction matches `sin/cos(player.yaw)` (assisted). Assert HUD still five readouts (`hudView` suite green). No new DOM nodes for device/assist. | `tests/combat/telegraphs.test.ts` | G9, M7, R6 |
| 13 | README subsection **Gamepad support (p1-gamepad-support)**: aim-assist numbers, gamepad-only rule, hot-swap note, full-loop claim, verification commands. Do not claim new UI. | `README.md` | G1, G5, G6, G7 |
| 14 | Verify `npm run test:run` and `npm run build` green; smoke twin-stick assist + KBM↔pad hot-swap in ACTIVE. Do not commit. | — | G1–G9 |

*Traceability check: G1→T1,T2,T3,T6; G2→T1,T2,T6; G3→T3,T4,T7; G4→T2,T3,T6; G5→T4,T8; G6→T9; G7→T5,T10; G8→T5,T11; G9→T12,T14. M1↔G1–G4; M2↔G3/G4 sticky; M3↔G6/G7; M4↔G5/G7; M5↔G2; M6↔G7/G8; M7↔G9. All G1–G9 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants

```ts
// src/config.ts
export const AIM_ASSIST_MAGNETISM = 0.35 as const;
export const AIM_ASSIST_HALF_ANGLE_DEG = 10 as const;
export const AIM_ASSIST_HALF_ANGLE_RAD = (AIM_ASSIST_HALF_ANGLE_DEG * Math.PI) / 180;
export const AIM_ASSIST_RANGE_M = PROJECTILE_MAX_RANGE_M; // 60
```

### ApplyCommandsContext

```ts
export interface ApplyCommandsContext {
  collisionWorld: CollisionWorld;
  /** True only when the aim channel is owned by gamepad for this gather (live) or the harness opts in (tests/replay). */
  aimAssist: boolean;
}

export function applyCommands(
  state: SimState,
  commands: readonly InputCommand[],
  ctx?: ApplyCommandsContext,
): void;
```

Rules:
- `InputCommand` **must not** gain device/provenance fields.
- If `ctx` is omitted, or `ctx.aimAssist === false`, aim handling is exactly today’s `entity.yaw = Math.atan2(ax, az)` when `hypot(ax,az) > 0`.
- If `ctx.aimAssist === true`, require `ctx.collisionWorld`; compute assisted yaw via Aim-assist API.
- INSERTION / non-ACTIVE: existing `combatBlocked` already ignores gameplay aim — do not special-case assist.
- Shell phases: aim still ignored for player facing (shipped); hot-swap tests focus on discrete channels + facing sticky across ACTIVE swaps.

### Aim-assist API

```ts
/** Normalize to (-π, π]. */
export function normalizeAngle(rad: number): number;

export function selectAimAssistTarget(
  state: SimState,
  collisionWorld: CollisionWorld,
  originX: number,
  originZ: number,
  rawYaw: number,
): EntityId | null;

/**
 * Returns the yaw to write this tick.
 * - no eligible target → rawYaw (bit-exact)
 * - eligible → currentYaw + AIM_ASSIST_MAGNETISM * normalizeAngle(targetYaw - currentYaw)
 */
export function assistedYawFromStick(
  state: SimState,
  collisionWorld: CollisionWorld,
  originX: number,
  originZ: number,
  currentYaw: number,
  axisX: number,
  axisZ: number,
): number;
```

Selection algorithm (normative):
1. `rawYaw = atan2(axisX, axisZ)`; if `hypot(axisX,axisZ) === 0`, caller must not invoke (no aim command).
2. For each living security-crew id in stable id order:
   - distance `d = hypot(dx,dz)`; skip if `d > AIM_ASSIST_RANGE_M` or `d === 0`
   - `offset = abs(normalizeAngle(atan2(dx,dz) - rawYaw))`; skip if `offset > AIM_ASSIST_HALF_ANGLE_RAD`
   - skip if `!hasLineOfSight(collisionWorld, originX, originZ, crew.x, crew.z)`
3. Choose minimal `offset`; tie → minimal `d`; tie → minimal `EntityId` (numeric/string compare consistent with codebase id type).

Blend (normative):
```
targetYaw = atan2(target.x - originX, target.z - originZ)
return normalizeAngle(currentYaw + AIM_ASSIST_MAGNETISM * normalizeAngle(targetYaw - currentYaw))
```

### Live gather contract

```ts
args.bus.enqueueFromDevices(args.devices);
const cmds = args.bus.drainForTick(args.world.tick);
const aimAssist = args.bus.getChannelOwner('aim') === 'gamepad';
applyCommands(args.world, cmds, {
  collisionWorld: args.collisionRef.current,
  aimAssist,
});
```

### Replay options

```ts
export function replay(
  initial: SimState,
  commands: readonly InputCommand[],
  collisionRef: CollisionWorldRef,
  graph: DeckGraph,
  options?: { aimAssist?: boolean },
): SimState;
```

Default `aimAssist: false`. When true, every tick’s `applyCommands` uses `{ collisionWorld: collisionRef.current, aimAssist: true }`.

### G7 harness notes

- Prefer `CommandBus` + `FakeInputDevice('gamepad')` so `getChannelOwner('aim') === 'gamepad'` naturally enables assist in a small local gather loop **or** pass `aimAssist: true` into `runMissionTicks` when injecting pre-stamped commands that were produced from gamepad samples.
- Record every `DeviceSample.kind` (or drained command source in the harness) and assert none equal `'keyboard-mouse'`.
- Harness may `setEntityPose` for spatial setup (LOS cell / Engineering footprint) — that is world setup, not KBM input. All **verbs** must come from gamepad-mapped samples/commands.
- Restart: existing SCORE interact edge → BRIEFING (mission-shell G8 path).

---

## Edge cases & failure modes

| ID | Case | Expected | Test |
|----|------|----------|------|
| E1 | Stick 5° off living in-cone crew, assist on | Error 5 → 3.25 → 2.1125… per tick | G1 |
| E2 | Offset exactly 10° | Assisted (in cone) | G1 |
| E3 | Offset 10.1° | `yaw === rawYaw` bit-exact | G1 |
| E4 | No living crew | `yaw === rawYaw` | G1 |
| E5 | Two in-cone; different angles | Smaller angle wins | G2 |
| E6 | Equal angles; different distances | Nearer wins | G2 |
| E7 | Wall between player and crew | No assist | G2 |
| E8 | Crew at 61 m in-cone | No assist | G2 |
| E9 | Assisted target dies mid-hold | Next eligible or raw; no NaN | G2 |
| E10 | `aimAssist: false` with crew in-cone | Raw atan2 only | G3 |
| E11 | Stick 45° off target (outside cone) | Raw tracking, zero pull | G4 |
| E12 | Stick → neutral (no aim cmds) with adjacent crew | Facing frozen | G4 |
| E13 | Sweep across cone | Blend only while in-cone; exit = raw; no hysteresis | G4 |
| E14 | Hot-swap BRIEFING / INSERTION / ACTIVE+fire / SCORE | Synthetic releases; no stuck fire; no menu | G5 |
| E15 | Facing across aim-channel swap with no new aim | Unchanged next tick | G5 |
| E16 | Binding table drift | `bindingsAudit` fails | G6 |
| E17 | Gamepad-only full loop | SCORE then BRIEFING; zero KBM samples | G7 |
| E18 | Assist replay twice | Identical hashes + yaw series | G8 |
| E19 | Aim line after assist | Line dir matches assisted yaw | G9 |
| E20 | HUD element count | Still exactly 5 | G9 |

---

## Test / verification requirements

Before opening the PR, Composer must:

1. `npm run test:run` — all suites green, including new aim-assist / missionHotSwap / gamepadOnlyLoop / bindingsAudit / determinism / telegraph extensions.
2. `npm run build` — exit 0.
3. Manual smoke (dev server): gamepad right-stick near a crew → aim line leans onto target; mouse aim unaffected; hot-swap mid-firefight clears RT without stuck autofire; HUD still five readouts; no new chrome.
4. Confirm `src/input/bindings.ts` has **no** intentional edits (audit test is the gate).
5. Confirm no new HUD DOM regions, no crosshair, no device indicator.

PR title/body must cite `G1..G9,M1..M7 @ spec v1` and target `integration`.

---

## Out of scope (Composer must NOT touch)

- Design doc, visual direction, roadmap, other features’ packs/specs.
- HUD skinning / sixth HUD element / device indicator / assist reticle / crosshair (R6; `p1-visual-pass`).
- New UI screens, pause menu, remapping, options.
- KBM aim-assist of any kind.
- New verbs/bindings (sprint, crouch, dodge, weapon-switch, melee).
- Haptics, gyro, touch, multi-pad.
- Crew AI, combat damage/fire-rate numbers, alarm rules, mission phase logic changes (regression: those suites stay green).
- Shell-screen nav redesign (`p1-hud` G7 owns it).
- Audio.
- Binding table changes.
- Command provenance fields on `InputCommand`.
- Redesign of CommandBus arbitration (verify only).

---

*Clarification for this spec: see `clarification-log.md` in this folder.*
