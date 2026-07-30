# Technical Specification — p1-visual-pass

`SPEC v1 FINAL | feature p1-visual-pass | charter v1.13 | design doc v1.17 | design pack v1 | goals: G1..G15 | mechanics: M1..M9`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3 once prereq assets land at contracted paths. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.17** · visual direction **v1.6** · design pack **v1** @ `0e07d81` (G1–G15, M1–M9, R1–R12; 11 prereq assets) · feature roadmap **v1.8** (P1 #9 terminal visual-pass; milestone **M-P1**) · shipped deps: `p1-deck-geometry` … `p1-gamepad-support` · clarification log **all resolved (no Kimi questions; TL bindings below)** · assets/AGENTS.md current · HEAD surveyed `0e07d81` · baseline suite **200** tests green

### Clarification rulings incorporated

No design questions raised to Kimi — pack v1 + VD §3–§8 / §11 M-P1 + design doc v1.17 fully settle G1–G15 / M1–M9 / R1–R12. Asset-delivery timing, LOD policy, haze densities, floor-impact presentation, shadow counts, and HUD chrome details are Technical Lead bindings below (presentation/integration only; zero doc bumps).

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | (none to Kimi) | TL bindings in Technical decisions |

**Stage 3 gate (charter §3):** Kimi must deliver the 11 prereq assets (pack table) under `assets/` before Composer implements load/bind tasks. Composer **never authors or edits** asset binaries (charter §1 / agent hard constraint). Composer **may** add reproducible generators under `tools/` (R3); Kimi runs them and commits emitted PNGs/GLBs. Until assets exist at contracted paths, Composer may land scaffolding (loaders, lighting modules, tests that skip/fixture when files absent) but must not open the PR as complete.

Composer implements on branch `feat/p1-visual-pass`.

---

## Mission

Phase visual milestone **M-P1** (VD §11): presentation-only uplift of the shipped P1 core loop. **No new mechanics, no tuning, no sim edits** (pack R1 / G15). Replace blockout actors/weapons with hero GLBs; uplift deck materials; light AL0/AL1 rows; complete muzzle/impacts VFX; skin HUD/shell chrome. Existing automated suite stays green; `hashSimState` / `hashDeckGraph` / replay determinism bit-identical.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Asset root | Serve from repo `assets/` via Vite (`publicDir` **or** import URLs under `/assets/…`). Canonical paths = pack table verbatim (`assets/models/p1_*.glb`, `assets/textures/p1_*.png`). | Pack prereq table; assets/AGENTS.md naming |
| GLB load | `THREE.GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`. Shared helper `loadGltf(url) → THREE.Group` (cloneable). Boot becomes async-await asset prep before mesh attach. | VD §8; three r178 already pinned |
| Hero pose / animation | **Rigid single-pose** meshes only (R8). No AnimationMixer, no skinning runtime, no locomotion. If GLB contains extra nodes/animations, ignore animations; use first scene root. | R8; M-P1 scoped |
| LOD | **LOD0 only required** at P1. If GLB embeds `LOD1+`, may attach `THREE.LOD` with silhouette-safe distances — optional, not a G# gate. Do not invent LODs in code from primitives. | VD §8 vs R8; Gate 1 judges gameplay-distance silhouette |
| Player identity (G2) | Hero albedo is hull-steel-neutral per board A; allied `#69f0ae` via **authored accent emissives** on the GLB (spine/shoulder strips). Do **not** flood entire mesh with `PLAYER_COLOR_HEX`. Remove debug facing wedge (R5). | G2, board A, R5 |
| Crew identity (G3) | Hostile silhouette first; `#ff5252` **small accents only** (never full-body flood). Replace `createStandInMesh` capsule. | G3, VD §7 r2 |
| Rifle / muzzle (G4, R6) | Attach rifle GLB under player group. Muzzle world origin for telegraphs/VFX **must** stay pixel-equivalent to sim: `player.x/z + facing * PROJECTILE_MUZZLE_OFFSET_M` (Y presentation height unchanged from telegraphs — `TRACER_Y_M` / flash ~1.2). Prefer an authored empty named `muzzle` / `muzzleAnchor`; if absent, place a local offset empty so world XZ after player pose equals the sim formula within **0.02 m**. Mismatch = `[blocker]`. | R6; G4 |
| Hit-flash (R7) | Retarget white emissive flash onto hero materials (traverse meshes with `MeshStandardMaterial` / PBR mats under the actor root). Duration stays `HIT_FLASH_DURATION_SEC`. Do not change sim `hit-flash` events. | R7; M7 |
| Deck geometry | **Do not** change room-graph geometry, wall thicknesses, collision, or ceiling cutaway logic. Material + non-colliding dressing only (R2). | R2; G5, G15 |
| Deck PBR | Replace flat `MeshStandardMaterial` colors with map-backed PBR (`map`, `metalnessMap`, `roughnessMap`, `normalMap`) from pack texture sets. Wear via `p1_wear_masks.png` (multiply/overlay on roughness/albedo — TL: mask channel R=hand-height band, G=threshold, B=door-frame; document in generator). Corridor spine accent stays `#8b949e`. | G5, G6, M4, VD §5 |
| Signage / trim | Non-colliding planes/strips parented to room groups; section/function tints from `ACCENT_HEX` + `p1_section_signage_atlas.png`. No collision-world writes. | G6, R2, R4 |
| Lighting architecture | New `src/render/lighting/` (or `createDeckLighting.ts`): owns per-room keys, practicals, beacons, haze. `createDeckScene` keeps geometry build; **remove** the current single DirectionalLight + HemisphereLight from `createDeckScene` once lighting module attaches equivalent/better coverage. | G7, G8, M5, M6 |
| Shadows | Enable `renderer.shadowMap.enabled = true` (WebGL2 path; PCFSoft or VSM — TL picks `PCFSoftShadowMap`). Contact-hardening read via tight shadow bias + adequate map size (TL: 2048 default, tunable). ≥2 shadow-casting lights **per gameplay space** = each room node + each corridor segment of `main-spine` / `fore-connector` has ≥2 lights with `castShadow=true` among its key+practicals (shared lights that cover a space count). Actors `castShadow`; floors `receiveShadow`. | G7, VD §8 |
| AL0 Cruise | Warm-neutral key per room (`#fff2e0` family, intensity TL-tunable); practical fixtures from `p1_corridor_light_fixture.glb` (~80% of authored fixture slots live); gentle idle flicker on a subset (phase-offset sine on intensity, amplitude ≤8%, render dt only). | G7, VD §4.1 |
| AL1 Alerted | On `meta.alarmLevel === ALARM_LEVEL_AL1`, activate rotating amber beacons (`p1_amber_beacon.glb` + `PointLight`/`SpotLight` amber) **in corridors only** (`accentId === 'corridor'` and/or node ids `main-spine`, `fore-connector`). Room keys/practicals in non-corridor spaces **unchanged**. No reverse transition (alarm never de-escalates). | G8, design §4 v1.14 |
| Haze (M6, R11) | Corridor-only `THREE.FogExp2` (or height-banded shader fog) with density AL0 < AL1 (TL constants below). Must keep gameplay mid-plane legible (VD §7 r1) — bias fog to low/high bands; never a dense mid-plane soup. Sync density from `meta.alarmLevel` in presentation tick. | G9, R11 |
| Muzzle flash | Already real `PointLight` for player + crew (`combatVfx`). Keep constants; ensure lights still cast (shadow optional for muzzle — TL: muzzle lights **do not** castShadow — too noisy; they still light materials). | G10; already shipped |
| Per-surface impacts (R10) | Two render presets: **metal-wall** (spark burst) on `impact-wall`; **deck-plate** (spark + brief dust/scorch) co-located at floor Y≈0.05 under the same wall-hit XZ (P1 has no floor collider — projectiles terminate on walls only; composing floor response at the impact footprint satisfies R10 without sim edits). `impact-actor` keeps hit-flash only (no new floor family required). Do **not** add `impact-floor` sim events. | G10, R10, G15 |
| Telegraphs (M9) | Verify-only + optional restyle within VD §7 r7. Tracers (allegiance halos), aim line, wind-up pre-glow stay; origins remain muzzle-parity. No sim changes. | G10, M9 |
| HUD / shell skin (M8, R12) | DOM structure, readout set, visibility lifecycle, bindings **frozen**. Restyle chrome: typography (non-default stack via `@font-face` or system-ui industrial stack TL-locked below), panel treatment, void `#05080f`, palette meanings verbatim (allied/hazard/interactive). Apply same skin language to `missionShellUi` BRIEFING/SCORE. | G11, G12, R12 |
| Performance (G14) | Hold 60 fps @1080p mid-tier with full AL1 + VFX. Existing `fpsOverlay` is evidence path (S9). Cap concurrent muzzle lights / impact emitters (soft budgets in config). | G14, VD §8 |
| Determinism (G15) | Zero writes to `SimState` / deck graph / collision from new render modules. Replay + hash suites must stay bit-identical. No new hashed meta fields. | G15 |
| Screenshot harness | **Optional.** If landed: DEV-only helper under `src/render/dev/` or `tools/screenshots/` that positions camera / alarm for S1–S9 captures. Not required for PR merge; Gate 1 screenshot evidence may be manual. | Pack acceptance table; Director note |
| License | Only CC BY 4.0 original assets under shipped `assets/models|textures`. No third-party refs in build output. | G15 |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not invent top-level packages beyond those listed.

```
/
├── assets/                                 # KIMI-OWNED binaries (Composer: read/load only)
│   ├── models/
│   │   ├── p1_player_boarder.glb
│   │   ├── p1_security_crew.glb
│   │   ├── p1_rifle.glb
│   │   ├── p1_corridor_light_fixture.glb
│   │   └── p1_amber_beacon.glb
│   └── textures/
│       ├── p1_hull_steel_trim_{albedo,metal,rough,normal}.png
│       ├── p1_deck_plate_{albedo,metal,rough,normal}.png
│       ├── p1_wall_panel_{albedo,metal,rough,normal}.png
│       ├── p1_ceiling_panel_{albedo,metal,rough,normal}.png
│       ├── p1_wear_masks.png
│       └── p1_section_signage_atlas.png
├── tools/
│   └── textures/                           # NEW (optional R3): generators emitting the PNG sets
│       └── README.md                       # how to regenerate; inputs; license note
├── src/
│   ├── config.ts                           # EXTEND: lighting / haze / VFX / asset URL constants
│   ├── render/
│   │   ├── assets/
│   │   │   ├── urls.ts                     # NEW: contracted asset URL constants
│   │   │   └── loadGltf.ts                 # NEW: GLTFLoader wrapper + clone helper
│   │   ├── createPlayerMesh.ts             # EXTEND/REPLACE: hero GLB; no wedge; rifle attach
│   │   ├── createStandInMesh.ts            # EXTEND/REPLACE: crew hero GLB (rename ok if exported API stable)
│   │   ├── createRifleBlockout.ts          # REPLACE or retire: rifle GLB attach + muzzle empty
│   │   ├── createDeckScene.ts              # EXTEND: PBR materials, trim/signage hooks; strip old global lights
│   │   ├── createDeckLighting.ts           # NEW: AL0/AL1 keys, practicals, beacons, haze; update(alarmLevel)
│   │   ├── createRenderer.ts               # EXTEND: shadowMap enable (WebGL2)
│   │   ├── combatVfx.ts                    # EXTEND: per-surface impacts; hit-flash retarget; registerActorMesh
│   │   ├── combatTelegraphs.ts             # KEEP behavior; restyle only if needed for G13 (verify)
│   │   ├── hud/createHud.ts                # EXTEND: chrome skin only (R12)
│   │   ├── missionShellUi.ts               # EXTEND: matching chrome skin
│   │   └── (optional) dev/screenshotHarness.ts
│   └── app/
│       └── boot.ts                         # EXTEND: await assets; lighting.update; dispose
└── tests/
    ├── render/
    │   ├── heroAssets.test.ts              # NEW: GLB load / muzzle parity / no wedge
    │   ├── deckMaterials.test.ts           # NEW: maps present on floor/wall/ceiling mats
    │   ├── deckLighting.test.ts            # NEW: AL0 fixtures; AL1 corridor beacons; haze density
    │   ├── combatVfxSurfaces.test.ts       # NEW: metal vs deck-plate presets on impact-wall
    │   ├── visualPassDeterminism.test.ts   # NEW: hash unchanged with lighting/VFX/HUD skin updates
    │   └── hud*.test.ts                    # KEEP green — view-model contract frozen
    └── **                                # KEEP: full 200-test regression green
```

Do **not** edit `docs/` (except this feature folder’s logs if directed), `tools/mockups/`, other features’ packs/specs, three.js / Vitest / Vite pins (Vite config may set `publicDir` / static asset copy only). Do **not** alter sim integrators, AI, input bindings, mission shell state machine, ammo/HP/alarm rules, or deck JSON topology.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | **Asset pipeline wiring.** Add `src/render/assets/urls.ts` with pack-path URL constants. Configure Vite so `/assets/…` resolves in dev + production build (prefer `publicDir: 'assets'` **or** explicit static copy — pick one; document in README). Add `loadGltf(url): Promise<THREE.Group>` using `GLTFLoader`. Unit-test: loader rejects missing URL with clear error; succeeds against fixture/stub when present. | `urls.ts`, `loadGltf.ts`, `vite.config.ts`, tests | G1, G15, M1–M3 |
| 2 | **Config constants** for lighting, haze, flicker, impact budgets, asset scale — exactly as **Constants** below. No magic numbers for these tunables in render code. | `src/config.ts` | G7–G10, G14, M5–M7 |
| 3 | **Player hero mesh (M1).** Replace capsule + wedge with `p1_player_boarder.glb`. Preserve `createPlayerMesh` / `syncPlayerMeshPose` call sites (async factory `createPlayerMeshAsync` OK if boot awaits). Facing = group yaw only (R5 — delete wedge). Allied accents from authored materials. | `createPlayerMesh.ts`, `boot.ts` | G1, G2, M1, R5 |
| 4 | **Rifle hero + muzzle anchor (M3, R6).** Replace `attachRifleBlockout` box with `p1_rifle.glb`. Ensure muzzle empty world XZ matches `PROJECTILE_MUZZLE_OFFSET_M` formula within 0.02 m after pose sync. Telegraphs continue using sim formula (do not switch telegraphs to mesh bone unless parity test proves identical). | `createRifleBlockout.ts` (or `attachRifle.ts`), tests | G4, M3, R6 |
| 5 | **Security-crew hero (M2).** Replace stand-in capsule with `p1_security_crew.glb`. Keep `syncStandInMeshPose` / registration with VFX. Hostile accents only. | `createStandInMesh.ts`, `boot.ts` | G1, G3, M2 |
| 6 | **Deck PBR materials + wear (M4).** Apply hull-steel / deck-plate / wall / ceiling map sets; authored wear masks at hand height, thresholds, door frames; colder hull-adjacent tone on `role === 'hull'` walls. Geometry/graph untouched. | `createDeckScene.ts`, optional `deckMaterials.ts` | G5, M4, R2, R3 |
| 7 | **Accent trim + signage (G6).** Live section/function tint navigation via trim + `p1_section_signage_atlas.png` planes; corridor spine neutral `#8b949e`. Dressing non-colliding. | `createDeckScene.ts` | G6, M4, R2, R4 |
| 8 | **Renderer shadows.** Enable shadow maps on WebGL2 renderer; set cast/receive flags on lights/meshes as lighting tasks land. | `createRenderer.ts` | G7, VD §8 |
| 9 | **AL0 lighting row (M5).** Implement `createDeckLighting(scene, graph)`: per-room warm-neutral key + practical fixtures (~80% live) from corridor fixture GLB; ≥2 shadow-casting lights per gameplay space; gentle idle flicker; remove obsolete global key/fill from `createDeckScene`. `update(dt, alarmLevel)` for flicker. | `createDeckLighting.ts`, `createDeckScene.ts`, `boot.ts` | G7, M5 |
| 10 | **AL1 amber beacons (M5).** On AL0→AL1, activate rotating amber beacons in corridors only; rooms unchanged. Drive from `meta.alarmLevel` each presentation frame — no sim writes. | `createDeckLighting.ts` | G8, M5 |
| 11 | **Corridor volumetric haze (M6).** Fog/haze baseline; density scales AL0→AL1 via constants; mid-plane legibility (R11). | `createDeckLighting.ts` | G9, M6, R11 |
| 12 | **VFX completion (M7).** Extend `combatVfx`: metal-wall spark burst + deck-plate dust/scorch co-located on `impact-wall`; retarget hit-flash across hero materials; keep muzzle real lights for both `ownerKind`s. Soft emitter budgets. | `combatVfx.ts`, tests | G10, M7, R7, R10 |
| 13 | **Telegraph conformance (M9).** Confirm tracers / aim line / wind-up still pass existing `telegraphs.test.ts`; adjust materials only if G13 readability requires (no origin drift). | `combatTelegraphs.ts`, tests | G10, G13, M9 |
| 14 | **HUD + shell chrome skin (M8).** Restyle `createHud` + `missionShellUi` to void chrome + palette-exact meanings; industrial typography; no DOM structure / readout / binding changes. Low-HP pulse + AL1 hazard unchanged in semantics. | `createHud.ts`, `missionShellUi.ts`, hud tests | G11, G12, M8, R12 |
| 15 | **Boot integration.** Await asset load; construct lighting; `lighting.update(dt, world.meta.alarmLevel)` in `onFrame`; dispose all new GPU resources. Player/crew invisible until meshes ready (or block first frame until loaded — TL: **await before startFrameLoop**). | `boot.ts` | G1–G12, G15 |
| 16 | **Regression & determinism.** Full suite green — **≥200 tests**, zero binding drift vs `0e07d81` `ACTION_BINDINGS`. New `visualPassDeterminism.test.ts`: identical command streams → identical `hashSimState` with lighting/VFX/HUD updates invoked. Deck `hashDeckGraph` unchanged. | `tests/**` | G15 |
| 17 | **Material / lighting / muzzle unit tests** for map presence, AL1 corridor-only beacons, haze density monotonicity, muzzle-anchor parity. | `tests/render/*.test.ts` | G4–G10, G15 |
| 18 | **Optional screenshot harness** for pack S1–S9 (DEV-only). If skipped, PR body notes manual capture plan. | optional `dev/screenshotHarness.ts` or `tools/screenshots/` | Gate 1 evidence (non-blocking) |
| 19 | **README** subsection **Visual pass (p1-visual-pass / M-P1):** asset paths, AL0/AL1 notes, no-functional-change guarantee, verification commands, FPS overlay for G14. | `README.md` | G14, G15 |
| 20 | Verify `npm run test:run` (200+ green) and `npm run build`. Smoke: no capsules/wedge/rifle-box in frame; AL1 beacons; HUD skinned. Do not commit to master. | — | G1–G15 |

*Traceability check: G1→T1,T3,T5,T15,T20; G2→T3; G3→T5; G4→T4,T17; G5→T6; G6→T7; G7→T2,T8,T9; G8→T10; G9→T11; G10→T12,T13; G11→T14; G12→T7,T14; G13→T13,T20; G14→T2,T19,T20; G15→T1,T16,T20. M1↔G2; M2↔G3; M3↔G4; M4↔G5/G6; M5↔G7/G8; M6↔G9; M7↔G10; M8↔G11; M9↔G10/G13. All G1–G15 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants (`src/config.ts` — append)

```ts
/** Asset base URL prefix (must match Vite static serving). */
export const ASSET_BASE_URL = '/assets' as const;

/** Muzzle-anchor parity tolerance (m) — pack R6. */
export const MUZZLE_ANCHOR_TOLERANCE_M = 0.02 as const;

/** AL0 corridor FogExp2 density (presentation). */
export const HAZE_DENSITY_AL0 = 0.012 as const;

/** AL1 corridor FogExp2 density (presentation; must be > AL0). */
export const HAZE_DENSITY_AL1 = 0.02 as const;

/** Fraction of practical fixture slots lit at AL0 (~80%). */
export const PRACTICAL_LIVE_FRACTION_AL0 = 0.8 as const;

/** Idle flicker amplitude as fraction of base intensity. */
export const PRACTICAL_FLICKER_AMPLITUDE = 0.08 as const;

/** Soft cap concurrent muzzle PointLights. */
export const MUZZLE_LIGHT_MAX_CONCURRENT = 12 as const;

/** Soft cap concurrent impact emitter groups. */
export const IMPACT_VFX_MAX_CONCURRENT = 24 as const;

/** Deck-plate impact scorch/dust lifetime (s). */
export const DECK_IMPACT_DURATION_SEC = 0.18 as const;

/** Metal-wall spark lifetime (s) — may keep existing ~0.08 if already legible. */
export const METAL_IMPACT_DURATION_SEC = 0.1 as const;
```

Asset filename constants live in `src/render/assets/urls.ts` (pack paths).

### GLTF helper

```ts
/** Load a GLB/glTF and return a cloneable Group (scene root). */
export function loadGltf(url: string): Promise<THREE.Group>;

/** Deep-clone a loaded template for per-instance meshes (shared geometry OK). */
export function cloneGltfTemplate(template: THREE.Group): THREE.Group;
```

### Player / crew factories

```ts
/** Async hero player group — no capsule, no wedge, rifle attached, muzzle empty present. */
export function createPlayerMeshAsync(): Promise<THREE.Group>;

/** Async security-crew hero group. */
export function createStandInMeshAsync(): Promise<THREE.Group>;

// syncPlayerMeshPose / syncStandInMeshPose signatures UNCHANGED
```

If Composer prefers keeping sync names with internal cache after preload, that is acceptable **iff** boot awaits `preloadHeroAssets()` first.

### Deck lighting API

```ts
export interface DeckLighting {
  /** Call each presentation frame; alarmLevel from world.meta.alarmLevel only. */
  update(dtSec: number, alarmLevel: 0 | 1): void;
  dispose(): void;
}

export function createDeckLighting(
  scene: THREE.Scene,
  graph: DeckGraph,
  fixtures: { corridorLight: THREE.Group; amberBeacon: THREE.Group },
): DeckLighting;
```

### Combat VFX extensions

```ts
// Existing CombatVfx push/update/dispose retained.
// impact-wall → spawnMetalWallImpact + spawnDeckPlateImpact at (x, 0.05, z)
// hit-flash → traverse actor root materials; white emissive HIT_FLASH_DURATION_SEC
// registerActorMesh(id, root) — required for hero hierarchy (not children[0] only)
```

### HUD skin (chrome-only)

Frozen contracts from `p1-hud` spec remain: `buildHudView`, five readouts, phase visibility, low-HP ≤25, alarm labels, `M:SS` clock. Skin may change CSS / fonts / panel chrome only.

**Typography (TL-locked):** `font-family: "IBM Plex Sans", "Segoe UI", "Helvetica Neue", sans-serif` (or bundled OFL font under `assets/fonts/` if Kimi/Composer adds a license-clean face — optional). No Inter/Roboto/Arial-only default stack as the sole family.

---

## Edge cases & failure modes

| ID | Case | Expected | Test |
|----|------|----------|------|
| E1 | Missing GLB at URL | Boot fails fast with path in error; no silent capsule fallback in production path | `heroAssets.test.ts` |
| E2 | GLB without `muzzle` empty | Code installs compensatory empty so world XZ parity ≤ tolerance | muzzle parity test |
| E3 | AL0 gameplay | No amber beacons active; haze at `HAZE_DENSITY_AL0` | `deckLighting.test.ts` |
| E4 | AL0→AL1 trip | Beacons activate same presentation frame as `alarmLevel===1`; non-corridor rooms unchanged | `deckLighting.test.ts` |
| E5 | AL1 never reverses | Forcing presentation update with level 1 then reading state still shows beacons if meta stays 1; no code path turns them off while level=1 | lighting test |
| E6 | Hit-flash on hero | Flash restores prior emissive after duration; works when body is nested | `combatVfxSurfaces.test.ts` |
| E7 | Wall impact | Metal spark + deck-plate dust both spawn; emitter soft-cap respected | VFX test |
| E8 | Hash / replay | Lighting+VFX+HUD skin updates do not change `hashSimState` | `visualPassDeterminism.test.ts` |
| E9 | Bindings audit | `ACTION_BINDINGS` identical to pre-feature baseline | existing audit test green |
| E10 | Ceiling cutaway | Still fades room ceilings; materials survive opacity/visibility toggles | existing cutaway test + smoke |
| E11 | WebGPU path | Shadows/lighting degrade gracefully if WebGPU lacks shadow feature — WebGL2 is acceptance path | manual / build |
| E12 | License tree | No files under `assets/` from third-party copyrighted refs | Gate 1 S10 (manual) |

---

## Test / verification requirements

Composer must run and pass before opening the PR:

1. `npm run test:run` — **all existing tests green** (baseline **200** at `0e07d81`; new tests may raise the count; never delete/weaken prior assertions).
2. `npm run build` — clean.
3. Determinism: `visualPassDeterminism.test.ts` + existing combat/mission/ai/hud determinism suites.
4. Binding audit unchanged.
5. PR body lists Gate 1 screenshot plan (S1–S10) — harness optional; FPS overlay note for G14.
6. Explicit statement: no sim/tuning/binding changes (G15).

---

## Out of scope (Composer must NOT touch)

- Design docs, charter, visual_direction, roadmap, other feature packs/specs/clarification logs
- Asset binary authoring (GLB/PNG content) — Kimi-owned; Composer loads only
- Sim: `integrateCombat`, AI, alarm trip rules, mission shell phases, aim-assist, input devices/bindings
- New HUD readouts or DOM structure changes (R12)
- Animation / ragdoll / locomotion systems (R8)
- AL2+/Meltdown/Vacuum/Reactor lighting rows; P2–P4 VFX families; android racks (R9)
- Wall damage states / composite dust (P3)
- KTX2 compression (optional only if G14 fails — escalate before adding deps)
- Commits to `master` / `integration`; merges

---

## Gate 1 evidence mapping (for PR body)

| Shot / check | Goals |
|--------------|-------|
| S1 full-deck + per-section | G1, G6 |
| S2 AL0 corridor/room | G7 |
| S3 AL0→AL1 pair | G8 |
| S4 densest combat | G10, G13 |
| S5 hero close-ups | G2–G4 |
| S6 material wear | G5, G12 |
| S7 HUD states | G11, G12 |
| S8 before/after vs `75675b4`/`0e07d81` blockout | G1 |
| S9 FPS overlay | G14 |
| S10 license listing | G15 |
| Automated suite | G15 |

---

*Clarification for this spec: see `clarification-log.md` in this folder (no open questions).*
