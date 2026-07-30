# Technical Specification — p1-visual-pass

`SPEC v2 FINAL | feature p1-visual-pass | charter v1.13 | design doc v1.17 | design pack v2 | goals: G1..G17 | mechanics: M1..M11`
*Owner: Grok 4.5. Status: **FINAL** — Stage 3 iteration for G16–G17 / M10–M11 / R13–R15 + PBR restoration path. Zero open clarification blockers; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.17** · visual direction **v1.7** · design pack **v2** (G1–G17, M1–M11, R1–R7 + R9–R15; R8 superseded by R13) · feature roadmap **v1.8** (P1 #9 terminal visual-pass; milestone **M-P1**) · clarification log (TL bindings below; no open Kimi blockers) · assets/AGENTS.md current · `integration` @ `afec5c6` (pack v2) / heroes tune-4 Basic hotfix landed · baseline suite **209+** tests green

### Clarification rulings incorporated

No design questions require Kimi before Stage 3. Pack v2 + VD v1.7 fully settle G16–G17 / M10–M11 / R13–R15. Technical Lead bindings cover grip-bone fallback, move-clip reference speeds, clip priority, and staged Basic→PBR sequencing (R15).

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | (none to Kimi — TL bindings) | Technical decisions + Constants |

**Stage 3 gate:** Kimi re-delivers rigged + animated player/crew GLBs at the same contracted paths (`assets/models/p1_player_boarder.glb`, `p1_security_crew.glb`) per pack prereq table / R14. Rifle GLB unchanged. Composer **never authors or edits** asset binaries. Until rigged GLBs land, Composer may land scaffolding + tests that skip/fixture when clips/`hand_r_grip` are absent, but must not open the PR as complete for G16/G17.

Composer implements on branch **`feat/p1-visual-pass-anim`** cut from current `integration` (do **not** reopen merged `feat/p1-visual-pass`).

---

## Mission

Phase visual milestone **M-P1** (VD §11 v1.7): presentation-only uplift. **No new mechanics, no tuning, no sim edits** (pack R1 / G15). Spec v1 delivered hero GLBs, deck PBR, AL0/AL1 lighting, VFX, HUD skin on `integration`. **This iteration** adds render-side skeletal animation (G16–G17, M10–M11, R13/R14), keeps R7 hit-flash working through skinned/Basic materials during staged R15 acceptance, and restores hero PBR (G2–G4) by exiting the tune-4 `MeshBasicMaterial` hotfix within the WebGL texture-unit budget before Gate 2.

---

## Supersession of SPEC v1

| v1 item | v2 status |
|---------|-----------|
| Technical decision: “Rigid single-pose only (R8). No AnimationMixer…” | **SUPERSEDED** by R13/R14 — AnimationMixer + skinned meshes required (G16/G17) |
| Out of scope: “Animation / ragdoll / locomotion systems (R8)” | **SUPERSEDED** — minimum set in scope; reload / hit-react / player death / ragdoll / facial remain out |
| Hit-flash: “MeshStandardMaterial / PBR mats only” | **SUPERSEDED** — dual-path Basic color flash **and** Standard emissive (R7 + R15 staged) |
| Tasks T1–T20 | **SHIPPED** on `integration` — do **not** re-implement. Extend/replace only as listed in T21+ |
| G7 “≥2 shadow-casting lights per gameplay space” | **Still scene-capped** at `SHADOW_CASTING_DIRECTIONAL_MAX=2` (S1 hotfix). Keys remain 2/room; only 2 cast scene-wide. Do not re-enable unbounded shadow maps — that regresses white heroes |
| Branch `feat/p1-visual-pass` | Closed/merged — use **`feat/p1-visual-pass-anim`** |

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Animation ownership | **Render-only.** `THREE.AnimationMixer` per actor instance. Reads existing sim fields (`moveIntent*`, `meta.fireHeld`, `crewAi.fsm`, `entity.alive`). **Zero** writes to `SimState` / AI / combat / input. No root motion — mixer never translates the actor root; `sync*MeshPose` still owns `position`/`yaw` from sim. | G15, G16, M10, R13, R14, VD §7 r8 |
| Clip names | Exact: `idle`, `move`, `aim_fire`, `death` (crew only). Resolve by `AnimationClip.name`. Missing required clip after rigged delivery = boot/test hard fail. | R14 |
| Clip priority (exclusive; no blends) | `death` (crew, once) > `aim_fire` > `move` > `idle`. Player: `aim_fire` iff `meta.fireHeld`; `move` iff horizontal intent magnitude > ε; else `idle`. No player death clip (G17e). Crew: `death` on `!entity.alive` or `fsm==='DEAD'`; `aim_fire` for entire `ATTACK` (incl. wind-up); `move` when presentation speed > ε; else `idle`. | G17, M10 |
| Presentation speed (m/s) | **Player:** `hypot(moveIntentX,moveIntentZ) > MOVE_INTENT_EPS` → `PLAYER_MOVE_SPEED_MPS` (6), else 0. **Crew:** `PATROL`→`CREW_PATROL_SPEED_MPS` (2.0), `INVESTIGATE`→3.5, `CHASE`→4.5; `ATTACK`/`DEAD`/alive pause (`pauseTicksRemaining>0` on PATROL) → 0. Do **not** invent velocity fields in sim. | G17b; design §10; config constants already shipped |
| `move` playback rate | `rate = speedMps / MOVE_CLIP_REF_*_MPS` (player ref **6**, crew ref **2.0**). Clamp to `[0.05, 3.0]`. Idle / aim_fire / death at rate `1.0`. | G17b, R14, VD §7 r8 (±10% foot-slide is Gate 1 / S14 evidence) |
| Skinned clone | Use `SkeletonUtils.clone` from `three/examples/jsm/utils/SkeletonUtils.js` for player/crew instances. Plain `Group.clone(true)` is **insufficient** for skinned meshes. | three.js skinned-mesh requirement; G16 |
| GLB load + clips | Extend loader to retain `gltf.animations`. Templates carry `{ root, clips }`. Fixtures (rifle/lights/beacons) may keep clip-less path. | R14 |
| Rifle grip (M11) | Parent rigid rifle GLB to bone `hand_r_grip` when present. **Fallback (TL):** if bone missing (interim rigid GLB), parent to player root and keep current `attachRifleHero` XZ correction — DEV `console.warn` once. When clips are present (rigged delivery), unit test **asserts** `hand_r_grip` exists (G16 Gate). | M11, R6, R14 |
| Muzzle parity (R6) | Telegraphs/VFX continue using sim formula (`PROJECTILE_MUZZLE_OFFSET_M`). Mesh muzzle empty must stay within `MUZZLE_ANCHOR_TOLERANCE_M` (0.02 m) after pose sync **and** after mixer update for sampled frames of `idle` / `move` / `aim_fire`. | G4, G16, M11, R6 |
| Hit-flash (R7 / R15) | Keep `flashMaterialForHit`: Basic → white `color`; Standard/Physical → white `emissive`. Duration `HIT_FLASH_DURATION_SEC`. Works on skinned mesh materials after `cloneHeroMaterials`. No sim event changes. | R7, M7, R15 |
| Staged materials (R15) | `HERO_MATERIAL_MODE`: `'basic'` (default for anim Gate 1) \| `'pbr'` (required before feature Gate 2). Anim tasks verified on Basic; PBR tasks flip mode and restore maps. | R15, G2–G4 |
| PBR restore path | Exit tune-4 full-Basic conversion when mode=`pbr`. Keep **all** of: `SHADOW_CASTING_DIRECTIONAL_MAX=2`, point lights `castShadow=false`, `stripOptionalMaterialMaps` (ao/light/bump/displacement/alpha only — **never** strip `map` / `metalnessMap` / `roughnessMap` / `normalMap` in pbr mode), `attachSceneEnvironment` IBL, heroes may `castShadow=true`. Do **not** raise shadow-casting directional count. | G2–G4, R15; round-trip S1 root cause |
| Determinism (G15) | Mixer/`update` presentation-only. No `src/sim/**`, `src/combat/**`, `src/ai/**`, `src/input/**`, `src/mission/**`, `src/deck/**` edits except if a type-only import is needed from render (prefer reading fields already exported). Hash/replay suites bit-identical. | G15 |

---

## Exact project layout (additions / extensions for this iteration)

```
/
├── assets/models/
│   ├── p1_player_boarder.glb          # KIMI re-delivery: skinned + clips (R14)
│   ├── p1_security_crew.glb           # KIMI re-delivery: skinned + clips + death
│   └── p1_rifle.glb                   # unchanged rigid
├── src/
│   ├── config.ts                      # EXTEND: anim + HERO_MATERIAL_MODE constants
│   └── render/
│       ├── assets/
│       │   ├── loadGltf.ts            # EXTEND: return animations; SkeletonUtils clone helper
│       │   └── preloadHeroAssets.ts   # EXTEND: store clips on templates
│       ├── heroAnimation.ts           # NEW: mixer bind, state machine, update
│       ├── createPlayerMesh.ts        # EXTEND: skinned clone, grip attach, anim handle
│       ├── createStandInMesh.ts       # EXTEND: skinned clone, anim handle, death
│       ├── createRifleBlockout.ts     # EXTEND: parent to hand_r_grip (+ fallback)
│       ├── heroMaterialTune.ts        # EXTEND: basic | pbr modes; hit-flash dual (keep)
│       ├── combatVfx.ts               # KEEP hit-flash path; verify skinned roots
│       ├── sceneEnvironment.ts        # KEEP for pbr mode IBL
│       ├── createDeckLighting.ts      # KEEP shadow cap; do not raise SHADOW_CASTING_DIRECTIONAL_MAX
│       └── boot.ts                    # EXTEND: anim.update(dt, world) in onFrame
└── tests/render/
    ├── heroAnimation.test.ts          # NEW: state machine, rates, death one-shot
    ├── heroMuzzleParityAnim.test.ts   # NEW: R6 through idle/move/aim_fire samples
    ├── heroPbrRestore.test.ts         # NEW: pbr mode maps + shadow budget invariants
    ├── heroAssets.test.ts             # EXTEND: grip bone / Basic counts when mode=basic
    └── visualPassDeterminism.test.ts  # EXTEND: anim updates do not drift hash
```

---

## Task breakdown (in order) — v2 iteration only

v1 T1–T20 remain shipped. Composer executes **T21–T36** on `feat/p1-visual-pass-anim`.

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 21 | **Config — animation + material mode.** Append constants exactly as **Constants** below (`HERO_MATERIAL_MODE`, move refs, intent ε, playback clamp, clip name literals). No magic numbers in anim code. | `src/config.ts` | G16, G17, M10, R15 |
| 22 | **GLTF load retains clips + skinned clone.** Change `loadGltf` (or add `loadGltfWithAnimations`) to return `{ scene: Group, animations: AnimationClip[] }`. Add `cloneSkinnedGltf(template) → Group` via `SkeletonUtils.clone`. Keep `stripOptionalMaterialMaps` behavior for optional maps only. Update `preloadHeroAssets` / `HeroAssetTemplates` to carry `playerClips` / `crewClips` (rifle/fixtures: empty arrays OK). | `loadGltf.ts`, `preloadHeroAssets.ts`, call sites | G16, M10, R14 |
| 23 | **`heroAnimation.ts` — mixer API.** Implement bind/update per **Data structures** below. Clip lookup by exact name. Exclusive clip priority. `move.timeScale = rate`. Death: `LoopOnce` + `clampWhenFinished`; never restart after finished while still dead. Idle/move/aim_fire: loop. Root translation from clips must be ignored/zeroed if present (assert or strip track on `root`/`.position` — prefer fail test if root motion tracks exist). | `heroAnimation.ts` | G16, G17, M10, R13, R14 |
| 24 | **Player mesh + anim bind (M1/M10).** `createPlayerMeshFromTemplates`: skinned clone; bind mixer with player clips; attach rifle (T25); material tune per mode; expose anim handle on `userData` or return tuple — TL: store `userData.heroAnim: HeroAnimHandle`. Extend `syncPlayerMeshPose` **or** add `updatePlayerHeroPresentation(mesh, player, meta, dt)` called from boot that: (1) sync pose from sim, (2) `heroAnim.update(dt, inputs)`. | `createPlayerMesh.ts`, `boot.ts` | G1, G2, G16, G17, M1, M10 |
| 25 | **Rifle → `hand_r_grip` (M11) + R6.** Extend `attachRifleHero`: find bone `hand_r_grip` (traverse / `getBoneByName` on skinned meshes); parent rifle to that bone; re-run muzzle XZ correction after attach. Fallback if missing: current root-parent path + one DEV warn. After mixer updates, muzzle world XZ vs sim formula ≤ 0.02 m for sampled clip times. | `createRifleBlockout.ts`, tests | G4, G16, M3, M11, R6 |
| 26 | **Crew mesh + anim bind (M2/M10).** Same as player for clone/mixer; clips include `death`. `updateStandInHeroPresentation(mesh, entity, ai, dt)` drives state from FSM + alive. Corpses remain visible; hold final death frame. | `createStandInMesh.ts`, `boot.ts` | G1, G3, G16, G17, M2, M10 |
| 27 | **Boot presentation tick.** In `onFrame` / `syncPresentation`: after pose sync, update all hero mixers with `dt` and current sim snapshot fields. Dispose mixers on teardown. **No** sim module edits. | `boot.ts` | G15, G16, G17, M10 |
| 28 | **Hit-flash on skinned + Basic (R7).** Verify `combatVfx` / `flashMaterialForHit` flashes all materials under skinned roots (incl. nested `SkinnedMesh`). Extend tests: Basic color restore + Standard emissive restore; duration unchanged. Works in both `HERO_MATERIAL_MODE`s. | `heroMaterialTune.ts`, `combatVfx.ts`, tests | G10, M7, R7, R15 |
| 29 | **Animation unit tests.** State machine transitions (idle↔move↔aim_fire; crew death one-shot); player rate at 6 m/s ≈ 1.0; crew rates at 2.0 / 3.5 / 4.5 vs ref 2.0; no root position drift from mixer; missing-clip behavior documented. Use fixture clips in test if authored GLB absent in CI — but PR complete path requires real clips. | `tests/render/heroAnimation.test.ts` | G16, G17, M10, G15 |
| 30 | **Muzzle parity through poses.** Sample ≥3 normalized times in `idle`, `move`, `aim_fire`; after `mixer.update` + `updateMatrixWorld`, assert muzzle XZ parity ≤ tolerance. | `tests/render/heroMuzzleParityAnim.test.ts` | G4, G16, M11, R6 |
| 31 | **PBR mode path (exit tune-4).** Refactor `tuneHeroMaterials(root, role, mode)`: `'basic'` = current MeshBasicMaterial palette (unchanged); `'pbr'` = retain `MeshStandardMaterial`/`MeshPhysicalMaterial`, keep albedo/metal/rough/normal maps, apply glow accent colors only where needed (`p1_allied_glow` / `p1_hostile_glow`), do not convert body mats to Basic. `preloadHeroAssets` / create* honor `HERO_MATERIAL_MODE`. DEV: `dataset.nemesisHeroTune = mode === 'pbr' ? 'pbr' : '4'`. | `heroMaterialTune.ts`, `preloadHeroAssets.ts`, create* | G2, G3, G4, R15 |
| 32 | **Shadow / TU budget lock for PBR.** Tests assert: `countShadowCastingDirectionals(scene) === SHADOW_CASTING_DIRECTIONAL_MAX` (2); every `PointLight.castShadow === false`; `stripOptionalMaterialMaps` still clears ao/light/bump/displacement/alpha. **Do not** increase `SHADOW_CASTING_DIRECTIONAL_MAX`. In pbr mode heroes `castShadow = true` (grounding); `receiveShadow` TL: `true` on heroes only if mid-tier FPS holds — default **true** for cast, receive **false** if G14 risk (document choice in PR). Keep `attachSceneEnvironment`. | `createDeckLighting.ts` (no cap raise), `createPlayerMesh.ts`, `createStandInMesh.ts`, tests | G2–G4, G7 (capped), G14, R15 |
| 33 | **PBR restore verification tests.** With `HERO_MATERIAL_MODE='pbr'`: hero meshes have `MeshStandardMaterial` (or Physical) with non-null `map` on ≥1 body slot; Basic count for body slots is 0 (glow may stay unlit Basic if needed — TL: glow may remain Basic emissive-read); no test requires raising shadow cap. | `tests/render/heroPbrRestore.test.ts` | G2, G3, G4, R15 |
| 34 | **Determinism regression.** Extend `visualPassDeterminism.test.ts`: construct heroes, run N frames of `heroAnim.update` + lighting/VFX — `hashSimState` unchanged vs control. Full suite green. Confirm git diff has **no** files under `src/sim`, `src/combat`, `src/ai`, `src/input`, `src/mission` (deck JSON/collision untouched). | tests, PR checklist | G15 |
| 35 | **README note.** Document animation presentation (clips, no root motion), `HERO_MATERIAL_MODE`, staged R15 (anim on Basic → PBR before Gate 2), shadow cap rationale. | `README.md` | G14, G15, R15 |
| 36 | **Verify.** `npm run test:run` + `npm run build` green. Smoke: idle/move/aim_fire visible; crew death; muzzle telegraphs unchanged; with mode=`pbr` heroes textured not white (no TU console error). Do not merge to master. | — | G1–G17, G15 |

*Traceability check (v2 tasks): G16→T22–T27,T29,T30,T36; G17→T21,T23–T27,T29,T36; M10→T23–T27,T29; M11→T25,T30; R6→T25,T30; R7→T28; R13/R14→T22–T26; R15→T21,T28,T31–T33,T35; G2–G4→T24–T26,T31–T33,T36; G15→T27,T34,T36. G1–G15 from v1 remain covered by shipped code + regression. Zero orphan v2 tasks. Zero goals without tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts` — append)

```ts
/** R15 staged hero shading: 'basic' = tune-4 unlit (anim Gate 1); 'pbr' = VD §5 restore (pre–Gate 2). */
export const HERO_MATERIAL_MODE: 'basic' | 'pbr' = 'basic';

/** Clip names — must match R14 export exactly. */
export const HERO_CLIP_IDLE = 'idle' as const;
export const HERO_CLIP_MOVE = 'move' as const;
export const HERO_CLIP_AIM_FIRE = 'aim_fire' as const;
export const HERO_CLIP_DEATH = 'death' as const;

/** Bone / socket — R14 / M11. */
export const HERO_GRIP_BONE = 'hand_r_grip' as const;

/** Player move-clip authored reference speed (m/s) → rate 1.0 at PLAYER_MOVE_SPEED_MPS. */
export const MOVE_CLIP_REF_PLAYER_MPS = 6 as const;

/** Crew move-clip authored reference speed (m/s) → rate 1.0 at patrol. */
export const MOVE_CLIP_REF_CREW_MPS = 2.0 as const;

/** Intent magnitude above this counts as moving (player). */
export const MOVE_INTENT_EPS = 1e-4 as const;

/** Presentation speed above this counts as moving (crew). */
export const MOVE_SPEED_EPS_MPS = 0.05 as const;

export const ANIM_RATE_MIN = 0.05 as const;
export const ANIM_RATE_MAX = 3.0 as const;
```

### Loader / templates

```ts
export interface GltfLoadResult {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

export function loadGltfWithAnimations(url: string): Promise<GltfLoadResult>;

/** Skinned-safe instance clone (SkeletonUtils.clone). */
export function cloneSkinnedGltf(template: THREE.Object3D): THREE.Group;

export interface HeroAssetTemplates {
  player: THREE.Group;
  playerClips: THREE.AnimationClip[];
  crew: THREE.Group;
  crewClips: THREE.AnimationClip[];
  rifle: THREE.Group;
  corridorLight: THREE.Group;
  amberBeacon: THREE.Group;
}
```

Prefer keeping `loadGltf(url) → Group` as a thin wrapper for fixtures if call sites need it; heroes must use the animations-preserving path.

### Hero animation API

```ts
export type HeroAnimRole = 'player' | 'crew';

export interface HeroAnimInputs {
  /** Horizontal speed for move rate (m/s), already resolved from sim mirror rules. */
  speedMps: number;
  /** Player: meta.fireHeld. Crew: fsm === 'ATTACK'. */
  aimFire: boolean;
  /** Crew only — triggers death one-shot. */
  dead: boolean;
}

export interface HeroAnimHandle {
  update(dtSec: number, inputs: HeroAnimInputs): void;
  dispose(): void;
  /** Test/debug: active clip name or null. */
  activeClipName(): string | null;
}

export function bindHeroAnimation(
  root: THREE.Object3D,
  clips: readonly THREE.AnimationClip[],
  role: HeroAnimRole,
): HeroAnimHandle;

/** Pure helpers for tests / boot — no sim writes. */
export function playerPresentationSpeedMps(moveIntentX: number, moveIntentZ: number): number;
export function crewPresentationSpeedMps(
  fsm: 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'DEAD',
  pauseTicksRemaining: number,
): number;
```

### Rifle attach (extended)

```ts
/** Parent rifle to hand_r_grip when present; else root fallback. Returns muzzle anchor. */
export function attachRifleHero(playerGroup: THREE.Group, rifleTemplate: THREE.Group): THREE.Object3D;
```

### Material tune (extended)

```ts
export function tuneHeroMaterials(
  root: THREE.Object3D,
  role: 'player' | 'crew',
  mode: 'basic' | 'pbr' = HERO_MATERIAL_MODE,
): void;

// flashMaterialForHit — KEEP dual-path Basic color + Standard emissive
```

### Boot wiring (illustrative)

```ts
// inside onFrame / syncPresentation — read-only from world:
updatePlayerHeroPresentation(playerMesh, entity, world.meta, dt);
for (const [id, mesh] of standInMeshes) {
  const e = getEntity(world, id);
  const ai = world.crewAi.get(id);
  if (e) updateStandInHeroPresentation(mesh, e, ai, dt);
}
```

---

## Edge cases & failure modes

| ID | Case | Expected | Test |
|----|------|----------|------|
| E1 | Rigged GLB missing a required clip | Fail fast with clip name + asset path (complete PR path) | `heroAnimation.test.ts` |
| E2 | `hand_r_grip` missing, no clips (interim rigid) | Root-parent rifle + DEV warn; existing muzzle test still passes | heroAssets / attach |
| E3 | `hand_r_grip` missing **with** clips present | Test failure / assert — rigged delivery incomplete | grip assert test |
| E4 | Player fireHeld while moving | `aim_fire` wins (no blend) | state machine test |
| E5 | Crew ATTACK (wind-up or firing) | `aim_fire`; speed 0 | state machine test |
| E6 | Crew death | `death` plays once, clamps; mesh stays; neutralized count unchanged (sim) | anim + G15 |
| E7 | Player death | No death clip; mesh hide / score route unchanged | no new player death path |
| E8 | Root-motion tracks in clip | Reject or strip; actor world XZ equals sim after update | anim test |
| E9 | Hit-flash Basic + skinned | White flash then restore prior colors | VFX / material test |
| E10 | Hit-flash PBR mode | White emissive then restore | material test |
| E11 | PBR mode + shadow cap | No TU exceeded; heroes textured; shadow directionals === 2 | `heroPbrRestore.test.ts` |
| E12 | Hash / replay | Anim + PBR presentation updates do not change `hashSimState` | `visualPassDeterminism.test.ts` |
| E13 | Raising `SHADOW_CASTING_DIRECTIONAL_MAX` | **Forbidden** without new S1 investigation — regresses G2/G3 | review / test lock |

---

## Test / verification requirements

Composer must run and pass before opening the PR:

1. `npm run test:run` — all existing tests green (baseline **209+**; never weaken prior assertions).
2. `npm run build` — clean.
3. New: animation state machine, muzzle-through-poses, PBR restore + shadow budget, determinism with anim ticks.
4. PR body states: **no** `src/sim|combat|ai|input|mission` edits; G15 holds.
5. Gate 1 evidence plan adds pack shots **S11–S15** (animation); R15: anim acceptance may use `HERO_MATERIAL_MODE='basic'`; **full Gate 1 including G2–G4 PBR** requires mode=`pbr` before Gate 2 presentation.
6. Explicit: telegraphs still sim-muzzle formula; mesh muzzle parity within 0.02 m through poses.

---

## Out of scope (Composer must NOT touch)

- Design docs, charter, visual_direction, roadmap, other feature packs (except this folder’s logs if directed)
- Asset binary authoring (GLB/PNG) — Kimi-owned re-delivery
- Sim / combat / AI / input / mission / deck topology or rules (G15)
- New HUD readouts or DOM structure (R12)
- Reload animation, skeletal hit-react, player death animation, ragdoll, facial/finger animation (R13 deferred)
- Advanced locomotion blends / strafe / turn-in-place beyond single `move` cycle
- Independently animated rifle parts
- Raising scene shadow-casting light count above `SHADOW_CASTING_DIRECTIONAL_MAX`
- AL2+ lighting rows; P2–P4 VFX families; android racks
- Commits to `master`; merges (Grok)

---

## Gate 1 evidence mapping (PR body)

| Shot / check | Goals |
|--------------|-------|
| S1–S10 | As v1 (shipped baseline) |
| S11 anim locomotion rates | G16, G17a/b |
| S12 sustained fire + muzzle parity | G17c, M11, R6 |
| S13 crew death | G17d, G15 |
| S14 foot-slide ±10% | G17e, VD §7 r8 |
| S15 silhouette across clips | G3, G17 |
| PBR mode smoke (pre–Gate 2) | G2, G3, G4, R15 |
| Automated suite + determinism | G15 |

---

## Integration inventory (already on `integration` — do not regress)

Composer must preserve these S1-hotfix invariants while adding animation/PBR:

| Mechanism | Location | Role |
|-----------|----------|------|
| `SHADOW_CASTING_DIRECTIONAL_MAX = 2` | `config.ts`, `createDeckLighting.ts` | Caps shadow samplers (root cause of white heroes) |
| Point lights never `castShadow` | `createDeckLighting.ts`, muzzle in `combatVfx.ts` | TU budget |
| `stripOptionalMaterialMaps` | `loadGltf.ts` / preload | Drops ao/light/bump/displacement/alpha |
| `tuneHeroMaterials` → Basic (tune-4) | `heroMaterialTune.ts` | Interim R15 `'basic'` path |
| `flashMaterialForHit` dual-path | `heroMaterialTune.ts` | R7 on Basic + Standard |
| `attachSceneEnvironment` RoomEnvironment IBL | `sceneEnvironment.ts` | Factor/PBR lighting support |
| `preloadHeroAssets` + create*FromTemplates | `preloadHeroAssets.ts`, createPlayer/StandIn | Boot await path |
| `attachRifleHero` + muzzle tolerance | `createRifleBlockout.ts` | R6 |
| DEV `nemesisHeroTune === '4'` | `boot.ts` | Extend for `'pbr'` |

---

*Clarification for this spec: see `clarification-log.md` in this folder (no open blockers).*
