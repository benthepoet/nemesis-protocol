# Technical Specification — p1-deck-blender-mesh

`SPEC v1 FINAL | feature p1-deck-blender-mesh | charter v1.13 | design doc v1.19 | design pack v1 | goals: G1..G7 | mechanics: M1..M5`
*Owner: Grok 4.5. Status: **FINAL** — Stage 2 complete (charter §3.2). Zero open clarification blockers (Q1–Q12 resolved). Supersedes `spec-outline.md`.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.19** · visual direction **v1.10** · design pack **v1** (G1–G7 / M1–M5; rulings R-BM1–R-BM8) · feature roadmap **v1.9** · assets/AGENTS.md current · `p1-deck-polish` SPEC v2 FINAL (collision freeze / cutaway / aperture contracts preserved) · `p1-ship-blender-viz` exploration pack v0 · baseline `integration` @ **`e38ab8c`** · branch `feat/p1-deck-blender-mesh`

### Clarification rulings incorporated (v1)

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| Q1 | Pack v1 G1–G7 / M1–M5; presentation-only + freeze = G6 / R-BM1 | All tasks |
| Q2 / R-BM4 | **GLB default on merge**; `?deckVisual=procedural` opt-out; omit = blender | T2, T7, T14 |
| Q3 / R-BM5 | Single `assets/models/p1_nemesis_deck03.glb`; Kimi authors; Composer loads only | T1, T3 |
| Q4 | GLB owns architecture + dressing/trim; skip `buildDeckDressing`; engine keeps lighting + signage atlas | T3–T5, T7 |
| Q5 / M2 | Export-time names `room:<id>` / `ceiling:<id>` / `hull-interstitial:ceiling`; cutaway code untouched | T3, T4, T8, T13 |
| Q6 / R-BM6 | Exporter writes engine y-up meters; import no offset/scale; AABB drift ≤ 0.05 m audit | T3, T9 |
| Q7 / M5 | Hybrid retune; lighting 100% engine; `stripOptionalMaterialMaps` optional | T6 |
| Q8 / G4 | Missing/failed GLB → procedural fallback + console error; never hard-fail | T7, T14 |
| Q9 / R-BM8 | Reproducible `export_glb()` in generator required; GLB never hand-edited | T1 (prereq verify) |
| Q10 | Gate 1 B1–B8; R-DP18 luminance bar still binds on GLB path | Verification / Gate 1 |
| Q11 / G6 | `hashSimState` + `hashDeckGraph` + `buildCollisionWorld` bit-identical across paths | T11, T12 |
| Q12 | #11 starfield/glazing deferred; no SIGNAGE in GLB; procedural retirement deferred | Out of scope |

**Stage 3 gate:** Composer implements on **`feat/p1-deck-blender-mesh`**. Presentation only (R-BM1). **Do not** edit `src/deck/collision.ts`, `deck03.json`, wall/door/node data, sim, AI, combat rules, input, or mission logic. `buildCollisionWorld` output must remain **bit-identical**. **Blocking asset dependency:** Kimi must deliver amended generator + committed `.blend` + `assets/models/p1_nemesis_deck03.glb` before Stage 3 load/wiring tasks can green; Composer never authors/edits the GLB (charter §1). Full suite green + new tests before PR.

---

## Mission

Swap the deck's static architectural presentation from procedural `createDeckScene` builders to a single Blender-exported GLB (`M1`), while preserving ceiling-cutaway bindings (`M2`), Class C aperture tags (`M3`), engine signage/lighting, and zero functional drift (`G6`). GLB path is the **default** experience (`G4` / R-BM4); procedural remains the opt-out and load-failure fallback.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Authority surface | **Render/boot/assets-URL only.** Zero writes to `SimState`, `CollisionWorld`, `DeckGraph` data, or `deck03.json`. | G6, R-BM1 |
| Mode resolver | `resolveDeckVisualMode()` mirrors `resolveHeroMaterialMode`: URL `?deckVisual=blender\|procedural`, optional `VITE_DECK_VISUAL`, default **`blender`** when omit/invalid. | G4, Q2 |
| Scene builders | Keep sync `createDeckScene` = procedural. NEW async `createBlenderDeckScene`. Boot (or thin `createDeckPresentation`) selects path + fallback. | Q4, R-BM2 |
| GLB URL | `P1_NEMESIS_DECK03_GLB` in `src/render/assets/urls.ts` → `/assets/models/p1_nemesis_deck03.glb` via existing `ASSET_BASE_URL`. | Q3, vite plugin |
| Vite assets | **No `vite.config.ts` change required** — `nemesisAssetsPlugin` already serves/copies `assets/models` (incl. `.glb`). Verify GLB is under `assets/models/` so dev + `dist/assets/models` pick it up. | T1 |
| Export pipeline | Kimi amends `tools/blender/build_p1_nemesis_deck03_viz.py` with `export_glb()` writing the committed GLB (pack §pipeline 1–6). Composer verifies hook + file presence; does not regenerate in CI unless a documented optional script exists. | R-BM8, Q9 |
| Node contract | Import assumes export-time names (no rename pass in engine): `room:<id>`, `ceiling:<id>`, `floor:<id>` (optional), `aperture:<roomId>:<wallSegmentId>`, `hull-interstitial:ceiling`. | M2, M3, Q5 |
| `roomGroups` | Built by finding `room:<id>` groups (or constructing groups that parent matching children) for every `listNodes(graph)` id — same `Map` shape as procedural. | G2, R-BM2 |
| `hullEnvelope` | On blender path, set `DeckScene.hullEnvelope` to an `Object3D`/`Group` that **contains** `hull-interstitial:ceiling` so existing `boot.ts` `getObjectByName` binding works unchanged. | M2 |
| Dressing | **Do not** call `buildDeckDressing` on blender path (GLB carries M4). | Q4 |
| Signage | After GLB assemble, attach engine `signage:<roomId>` atlas planes (extract shared helper from procedural `addSectionSign`). GLB SIGNAGE excluded. | R-BM3 |
| Materials | M5 retune on load: ceiling mats `transparent`-ready for cutaway; optional trim emissive intensity; optional remap to `p1_*` texture sets where untextured; optional `stripOptionalMaterialMaps` if TU pressure — VD §3 meanings locked. | Q7 |
| Lighting | Unchanged `createDeckLighting` + AL0/AL1. GLB has no lights. | R-BM7 |
| Transform | Import applies **no** extra offset/scale (exporter emits engine y-up meters, R-BM6). | Q6 |
| Fallback | On load/reject/contract-fail when mode is blender: `console.error` with asset URL + reason, then procedural `createDeckScene`. Never throw out of boot. | G4, Q8 |
| Draw-call bar (G5) | `DECK_VISUAL_MESH_RATIO_MAX = 1.5`: blender-path `Mesh` count ≤ `ceil(1.5 × procedural Mesh count)` at construction (proxy; materials merged per R-BM5). Gate 1 B6 still requires 60 fps @1080p mid-tier evidence. | G5 |
| Collision freeze | `buildCollisionWorld` snapshot identical; never register GLB meshes as collision. | G6, Q11 |
| Cutaway | **Do not modify** `updateCeilingCutaway` behavior/API — only supply conforming geometry. | R-BM2, Q5 |

---

## Exact project layout (additions / extensions)

```
/
├── assets/
│   ├── blender/p1_nemesis_deck03_viz.blend    # Kimi source of record (commit)
│   └── models/p1_nemesis_deck03.glb           # NEW shipped export (Kimi; Composer loads)
├── tools/blender/
│   └── build_p1_nemesis_deck03_viz.py         # Kimi: + export_glb() + naming/merge (R-BM8)
├── src/
│   ├── config.ts                              # EXTEND: DECK_VISUAL_MODE default + audit ε + ratio
│   ├── app/boot.ts                            # EXTEND: resolve mode → presentation + fallback; cutaway bind unchanged
│   └── render/
│       ├── assets/urls.ts                     # EXTEND: P1_NEMESIS_DECK03_GLB
│       ├── assets/loadGltf.ts                 # REUSE loadGltf / stripOptionalMaterialMaps
│       ├── assets/preloadDeckGltf.ts          # NEW (or extend preload): load deck GLB template
│       ├── deckVisualMode.ts                  # NEW: ?deckVisual= / VITE_DECK_VISUAL resolver
│       ├── createDeckScene.ts                 # KEEP procedural; EXTRACT shared signage helper
│       ├── createBlenderDeckScene.ts          # NEW: GLB → DeckScene (roomGroups, hullEnvelope)
│       ├── blenderDeckBindings.ts             # NEW: node contract parse + alignment AABB audit helpers
│       ├── ceilingCutaway.ts                  # NO behavior change (R-BM2)
│       └── deckHullGeometry.ts                # procedural-only (not used on blender path)
└── tests/
    ├── deck/collisionDrift.test.ts            # EXTEND: blender presentation path
    ├── render/
    │   ├── deckVisualMode.test.ts             # NEW: flag defaults / values
    │   ├── blenderDeckScene.test.ts           # NEW: bindings, apertures, interstitial, fallback
    │   ├── blenderDeckAlignment.test.ts       # NEW: R-BM6 ≤0.05 m AABB
    │   ├── ceilingCutaway.test.ts             # EXTEND: S10/S11 on blender roomGroups
    │   └── visualPassDeterminism.test.ts      # EXTEND: hash guards with blender path
```

**Forbidden paths:** `src/deck/data/deck03.json` (mutate), `src/deck/collision.ts` (mutate), `src/sim/**` logic, `src/combat/**` rules, `src/ai/**`, `src/input/**`, mission rule modules, design docs / VD. Boot may only call presentation builders. Composer must not edit `.blend` / regenerate GLB.

---

## Constants (append in `src/config.ts`)

```ts
/** R-BM4 / G4 — default deck presentation. Override with ?deckVisual= or VITE_DECK_VISUAL. */
export const DECK_VISUAL_MODE: 'blender' | 'procedural' = 'blender';

/** R-BM6 — max room footprint AABB drift (m) vs deck03 graph; audit-only. */
export const DECK_GLB_ALIGN_EPSILON_M = 0.05 as const;

/** G5 — blender Mesh count ≤ ceil(ratio × procedural Mesh count) at construction. */
export const DECK_VISUAL_MESH_RATIO_MAX = 1.5 as const;
```

URL constant (in `src/render/assets/urls.ts`):

```ts
export const P1_NEMESIS_DECK03_GLB = `${models}/p1_nemesis_deck03.glb` as const;
```

Keep existing `CEILING_FADE_*`, `APERTURE_SITES`, `ASSET_BASE_URL`, signage constants unchanged.

---

## Data structures & APIs

### `resolveDeckVisualMode` — `src/render/deckVisualMode.ts`

```ts
export type DeckVisualMode = 'blender' | 'procedural';

/**
 * Priority: URL ?deckVisual= → VITE_DECK_VISUAL → DECK_VISUAL_MODE.
 * Accepted: blender | procedural. Omit / invalid → blender (R-BM4).
 */
export function resolveDeckVisualMode(options?: {
  searchParams?: URLSearchParams;
}): DeckVisualMode;
```

### `createBlenderDeckScene` — `src/render/createBlenderDeckScene.ts`

```ts
export interface CreateBlenderDeckSceneOptions {
  /** Preloaded GLB scene root from loadGltf(P1_NEMESIS_DECK03_GLB). */
  glbRoot: THREE.Group;
  materials: DeckMaterialSet;
}

/**
 * Builds DeckScene from GLB. Throws DeckGltfContractError on missing
 * room/ceiling/aperture/interstitial nodes (caller falls back).
 * Does NOT call buildDeckDressing / buildHullEnvelope / buildWalls.
 * DOES attach engine signage planes into room groups (R-BM3).
 */
export function createBlenderDeckScene(
  graph: DeckGraph,
  options: CreateBlenderDeckSceneOptions,
): DeckScene;
```

Normative `DeckScene` fields on success:
- `scene` — contains GLB architecture + engine signage; background `#05080f` as today
- `camera` — same midships bootstrap as procedural (`computeMidshipsCameraTarget` equivalent)
- `roomGroups` — `Map` with an entry per `listNodes(graph)` id; each value is (or wraps) `room:<id>` and contains `ceiling:<id>` mesh
- `hullEnvelope` — object that can resolve `getObjectByName('hull-interstitial:ceiling')`
- `dressing` — omit or empty; GLB props live inside the imported graph (do not double-add)
- `disposeMaterials()` — dispose owned cloned mats / geometries created by retune/signage; do not dispose shared preload template if instances share it (document ownership: prefer clone template once per boot)

### Binding helpers — `src/render/blenderDeckBindings.ts`

```ts
export class DeckGltfContractError extends Error {}

/** Assert all 18 rooms have room:<id> + ceiling:<id>; interstitial; six apertures. */
export function assertBlenderDeckNodeContract(root: THREE.Object3D, graph: DeckGraph): void;

/** Populate roomGroups from GLB node names. */
export function buildRoomGroupsFromGltf(
  root: THREE.Object3D,
  graph: DeckGraph,
): Map<string, THREE.Group>;

/** Per-room AABB drift vs graph footprints; throws if any > DECK_GLB_ALIGN_EPSILON_M. */
export function assertBlenderDeckAlignment(root: THREE.Object3D, graph: DeckGraph): void;

/** Expected aperture object name for a site. */
export function apertureObjectName(roomId: string, wallSegmentId: string): string;
// → `aperture:${roomId}:${wallSegmentId}`
```

Aperture names (all six must exist as meshes under the GLB root):

| roomId | wallSegmentId |
|--------|----------------|
| `port-airlock` | `wall-c-port-airlock-top` |
| `port-airlock` | `wall-c-port-airlock-left` |
| `stbd-airlock` | `wall-c-stbd-airlock-bottom` |
| `cargo-hold` | `wall-c-cargo-top` |
| `med-bay` | `wall-c-med-top` |
| `bridge` | `wall-c-bridge-nose` |

### Shared signage helper

Extract from `createDeckScene.ts` (procedural keeps calling it):

```ts
/** Engine atlas signage — R-BM3. Attach into each non-corridor room group. */
export function attachEngineSignage(
  roomGroups: ReadonlyMap<string, THREE.Group>,
  graph: DeckGraph,
  mats: DeckMaterialSet,
): void;
```

### Boot wiring (normative)

```ts
const mode = resolveDeckVisualMode();
let deckScene: DeckScene;
if (mode === 'blender') {
  try {
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    deckScene = createBlenderDeckScene(graph, { glbRoot, materials: deckMaterials });
  } catch (err) {
    console.error('[deckVisual] blender path failed; falling back to procedural', P1_NEMESIS_DECK03_GLB, err);
    deckScene = createDeckScene(graph, deckMaterials);
  }
} else {
  deckScene = createDeckScene(graph, deckMaterials);
}
// lighting / env / cutaway unchanged:
updateCeilingCutaway(
  deckScene.roomGroups, graph, x, z, cutawayState, camera, dt,
  deckScene.hullEnvelope?.getObjectByName('hull-interstitial:ceiling') ?? null,
);
```

### Export pipeline hook (Kimi prereq — Composer verifies)

`tools/blender/build_p1_nemesis_deck03_viz.py` must expose a callable `export_glb()` (or CLI flag documented in script docstring) that:
1. Applies naming / collection export set / merge / transform lock / material hygiene / aperture opacity per pack §pipeline amendments 1–6.
2. Writes **`assets/models/p1_nemesis_deck03.glb`**.
3. Excludes `SIGNAGE`, `LIGHTS`, `CAMERAS`, world (R-BM3, R-BM7).

Composer Stage 3: confirm file exists at the URL path and loads via `loadGltf`; do not invent a parallel exporter.

---

## Material / luminance policy (blender path)

| Surface | Required | Forbidden |
|---------|----------|-----------|
| Ceilings `ceiling:<id>` | Unique `MeshStandardMaterial` clones; `transparent` ready; cutaway drives opacity | Binary visibility as sole mechanism |
| Interstitial / envelope family | After M5 retune, linear luminance ≥ deck-polish `INTERSTITIAL_MIN_LINEAR_LUMINANCE` (R-DP18 still binds — Q10) | Void-family `#05080f` read inside silhouette |
| Aperture faces | Opaque hull-steel; tags present | Transparency / glazing (#11) |
| Trim / gels | Emissive accents only; M5 may retune intensity | Area-light emissive that breaks VD §3 neutrality |
| Signage | Engine atlas planes only | Relying on GLB Blender text |

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | **Asset URL + vite presence.** Add `P1_NEMESIS_DECK03_GLB`. Confirm GLB lives under `assets/models/` so existing vite plugin serves/copies it (no config edit unless copy list regresses). Document regenerate: run amended Blender script `export_glb()`. Verify `export_glb` hook exists in `tools/blender/build_p1_nemesis_deck03_viz.py` (fail Stage 3 if missing). | `urls.ts`, `assets/models/…`, `tools/blender/…` (verify only) | G1, G7, M1, R-BM5, R-BM8, Q3, Q9 |
| 2 | **Mode resolver + constants.** Implement `resolveDeckVisualMode`, `DECK_VISUAL_MODE='blender'`, align ε, mesh ratio max. Unit-test omit/invalid → blender; `procedural` / `blender` honored; env override. | `config.ts`, `deckVisualMode.ts`, `deckVisualMode.test.ts` | G4, R-BM4, Q2 |
| 3 | **`createBlenderDeckScene` + load path.** `loadGltf(P1_NEMESIS_DECK03_GLB)` → clone/instance → `createBlenderDeckScene`. No procedural hull/walls/dressing. Set scene background; bootstrap camera like procedural. | `loadGltf.ts` (reuse), `preloadDeckGltf.ts` (optional), `createBlenderDeckScene.ts` | G1, M1, M4, Q4, Q6 |
| 4 | **`roomGroups` + interstitial + aperture contract.** `buildRoomGroupsFromGltf` / `assertBlenderDeckNodeContract`: all 18 ids; `ceiling:<id>`; `hull-interstitial:ceiling` reachable via `hullEnvelope`; six `aperture:<roomId>:<wallSegmentId>`. Throw `DeckGltfContractError` on miss. | `blenderDeckBindings.ts`, `createBlenderDeckScene.ts` | G2, G3, M2, M3, R-BM2, Q5 |
| 5 | **Engine signage on blender path.** Extract `attachEngineSignage`; call from procedural and blender builders. | `createDeckScene.ts`, `createBlenderDeckScene.ts` | R-BM3, Q4 |
| 6 | **M5 material retune.** Ceiling transparency setup; optional trim emissive / `p1_*` map assign / `stripOptionalMaterialMaps`. No palette meaning changes. | `createBlenderDeckScene.ts` (+ small helper OK) | M5, G1, Q7 |
| 7 | **Boot branch + fallback.** Wire mode → blender try/catch → procedural; cutaway interstitial bind unchanged; dispose on teardown. Force-missing path logs error and boots procedural. | `boot.ts` | G4, G6, M2, Q8 |
| 8 | **Cutaway unchanged.** No edits to fade math/API; smoke that blender `roomGroups` work with existing `updateCeilingCutaway`. | `ceilingCutaway.ts` (verify no change), tests | G2, M2, R-BM2 |
| 9 | **Alignment audit.** `assertBlenderDeckAlignment` ≤ `DECK_GLB_ALIGN_EPSILON_M` vs graph footprints (floor/`room:` AABB). | `blenderDeckBindings.ts`, `blenderDeckAlignment.test.ts` | G1, R-BM6, Q6 |
| 10 | **Mesh-ratio / G5 proxy.** Count meshes on both constructed scenes; assert blender ≤ `ceil(DECK_VISUAL_MESH_RATIO_MAX * procedural)`. | `blenderDeckScene.test.ts` | G5 |
| 11 | **Collision drift.** Extend `collisionDrift.test.ts`: after `createBlenderDeckScene` (with fixture/root), `buildCollisionWorld` + `hashDeckGraph` identical to pre-build snapshot. | `collisionDrift.test.ts` | G6, Q11 |
| 12 | **Sim/deck hash determinism.** Extend `visualPassDeterminism.test.ts`: blender presentation build + cutaway ticks do not change `hashSimState` / `hashDeckGraph`. | `visualPassDeterminism.test.ts` | G6, Q11 |
| 13 | **Cutaway S10/S11 on blender path.** Re-run opacity band tests against blender-built `roomGroups` (+ interstitial). | `ceilingCutaway.test.ts` | G2, M2 |
| 14 | **Flag + fallback tests.** Resolver tests (T2); contract-fail / load-fail → procedural scene type; aperture/signage presence checks on success path. | `deckVisualMode.test.ts`, `blenderDeckScene.test.ts` | G3, G4, M3 |
| 15 | **License / path hygiene check (automated light).** Test or script assert: shipped GLB path has no `references/` payload; filename phase-prefixed; (Gate 1 still does human license scan G7). | test or comment in PR checklist | G7 |

**Traceability check:** G1←T1,T3,T6,T9; G2←T4,T8,T13; G3←T4,T14; G4←T2,T7,T14; G5←T10; G6←T7,T11,T12; G7←T1,T15; M1←T1,T3; M2←T4,T7,T8,T13; M3←T4,T14; M4←T3; M5←T6. No orphan tasks; no goals without tasks.

---

## Edge cases & failure modes

| Case | Required behavior |
|------|-------------------|
| GLB 404 / network reject | Fallback procedural + `console.error` with URL |
| GLB loads but missing `ceiling:bridge` (or any room) | `DeckGltfContractError` → same fallback |
| Missing `hull-interstitial:ceiling` | Contract fail → fallback (cutaway must not NPE on null interstitial — already optional) |
| `?deckVisual=procedural` | Skip GLB load; procedural only |
| `?deckVisual=nope` | Treat as default blender |
| Double dressing | Must not call `buildDeckDressing` on blender success path |
| GLB contains lights/cameras | Prefer export exclusion; if present, do not enable as engine lights — ignore/remove on import |
| Alignment drift > 0.05 m | Fail CI audit test (not silent) when blender fixture present |
| Vitest URL | `loadGltf` already rewrites `/…` under Vitest — use same helper |

---

## Test / verification requirements

1. **Collision drift (G6):** `buildCollisionWorld` AABB/polyEdges JSON snapshot identical before/after blender scene construction; graph hash unchanged.
2. **Hash determinism (G6/Q11):** `hashSimState` + `hashDeckGraph` unchanged across blender presentation + cutaway updates.
3. **Binding audit (G2/G3/M2/M3):** every deck03 room id → `room:<id>` + `ceiling:<id>`; six aperture names; `hull-interstitial:ceiling` present.
4. **Alignment (R-BM6):** per-room AABB drift ≤ 0.05 m.
5. **Cutaway (G2):** active→0; adjacent∪frustum→`CEILING_FADE_ALPHA` ∈ [0.25,0.4]; else→1; interstitial fades; lerp/no-pop — on blender `roomGroups`.
6. **Flag/fallback (G4):** default blender; procedural opt-out; forced failure falls back.
7. **Mesh ratio (G5):** ≤ 1.5× procedural mesh count.
8. **Full existing suite green** with default mode = blender when GLB fixture available in test env; if a unit test lacks WebGL/file, use committed GLB via vitest local URL rewrite.

**Gate 1 evidence (Kimi — not Composer invent):** pack B1–B8 screenshots + license scan. Composer supplies automated greens + FPS overlay path for B6.

---

## Out of scope

- Starfield backdrop; aperture **glazing**/transparency (`p1-hull-exterior-view` #11 — Director hold)
- Procedural-path retirement (deferred to #11 kickoff, R-BM4)
- GLB-derived collision or gameplay raycasts
- Engine lighting-rig redesign; AL matrix changes; HUD/audio/actors/door anim/damage states
- GLB `SIGNAGE` text objects; multi-deck / per-room GLB split
- Design-doc or VD version bumps (none required — pack)
- Hand-editing the GLB; Composer regenerating art assets

---

## Stage 3 submission checklist (Composer)

- [ ] Kimi GLB + `export_glb` hook present; `P1_NEMESIS_DECK03_GLB` loads
- [ ] Default boot uses blender path; `?deckVisual=procedural` works
- [ ] Fallback on missing GLB never hard-fails
- [ ] `roomGroups` + interstitial + six apertures bind; cutaway S10/S11 green on blender path
- [ ] Engine signage present; no double dressing
- [ ] Collision drift + hash tests green
- [ ] Alignment ≤ 0.05 m; mesh ratio ≤ 1.5×
- [ ] No forbidden-path edits; PR cites G#/M# in commits

---

## Open clarification blockers

**None.** Q1–Q12 resolved. Remaining non-spec dependency: Kimi Blender export amendments (pack §pipeline) before Stage 3 can fully green against the real GLB.
