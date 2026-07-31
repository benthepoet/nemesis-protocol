# Technical Specification — p1-deck-polish

`SPEC v2 FINAL | feature p1-deck-polish | charter v1.13 | design doc v1.18 | design pack v2 | goals: G1..G12 | mechanics: M1..M8`
*Owner: Grok 4.5. Status: **FINAL** — Stage 2 v2 complete (charter §3.5a Gate-2 iteration on PR #14 + Director 2026-07-31 ceilings). Supersedes SPEC v1 FINAL. Zero open clarification blockers.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.18** · visual direction **v1.10** · design pack **v2** (G1–G12 / M1–M8; rulings R-DP1–R-DP13, R-DP15; R-DP3 re-affirmed) · feature roadmap **v1.9** (P1 #10; #12 adjacency fade pulled into this PR per R-DP15) · assets/AGENTS.md current · baseline: Composer SPEC v1 tree on `feat/p1-deck-polish` (PR #14)

### Clarification rulings incorporated (v2)

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| K-v2-1 / R-DP9 | G1 luminance bar: no `#05080f`-family pixel inside hull silhouette at AL0+AL1; mask/threshold = TL | T1, T2, T10 |
| K-v2-2 / R-DP10 | Wall seal = extend bodies **or** skirt meshes; collision frozen | T3 (skirts — preferred) |
| K-v2-3 / R-DP11 | AABB perimeter OK if closure + connectivity pass; stepped silhouette not required | T4 |
| R-DP12 | Kit-bash only; Blender contingency not triggered | Out of scope |
| R-DP13 | Trim emissive retune down (still trim, not area light) | T1 |
| R-DP15 / Director | Ceilings in scope — G9–G12 / M8 this PR | T7–T9, T12 |
| TL-v2-1 | Adjacency = door `neighbors` ∪ wall-segment co-members | T7 |
| TL-v2-2 | Frustum = room AABB ∩ `THREE.Frustum` (“substantially inside”) | T8 |
| TL-v2-3 | Pixel audit CI = material luminance + silhouette-mask sampler (WebGL optional) | T10 |
| TL-v2-4 | Skirt meshes preferred over mutating wall body Y extents | T3 |

**Stage 3 gate:** Composer revises on existing branch **`feat/p1-deck-polish`** (same PR #14). Presentation only (G7). **Do not** edit `src/deck/collision.ts`, `deck03.json`, wall/door/node data, sim, AI, combat, input, or mission logic. `buildCollisionWorld` output must remain **bit-identical**. Full suite green + new v2 tests before revision push.

---

## Mission

Gate-2 iteration on PR #14 (*"It doesn't look good."*) plus Director ceiling pull-in: close G1/G2/G5 failures (interstitial luminance, wall skirts, envelope closure, dressing bounds, material continuity) and ship M8 ceiling adjacency fade (G9–G12). **Collision world, deck graph, wall segments, spawn data, and room footprints stay frozen (R-DP3).**

SPEC v1 deliverables that **remain binding** (do not regress): neutral retint (G3/M3), aperture reserved faces (M6/R-DP2), signage planes, kit-bash dressing existence (placement domain amended by G5 v2), collision/graph freeze tests, dispose hygiene.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Authority surface | **Render-only.** Geometry/materials under `src/render/**` (+ read-only helpers in `src/deck/graph.ts`). Zero writes to `SimState`, `CollisionWorld`, `DeckGraph` data, or `deck03.json`. | G7, R-DP3 |
| Interstitial luminance (R-DP9) | Interstitial floor/ceiling use dedicated clones of hull-steel / deck-plate with **emissive floor** `INTERSTITIAL_EMISSIVE_HEX` + `INTERSTITIAL_EMISSIVE_INTENSITY` so sampled linear RGB never matches void family under AL0 fog dens + AL1. Floor plate remains at `y = -0.01`; ceiling plate at `ROOM_HEIGHT_M`. | G1 v2, M1, VD §7 r4/r9 |
| Wall seal (R-DP10) | **Skirt meshes** named `hull-skirt:<wallId>` (and doorway corner caps `hull-skirt:door:<doorId>:<i>` as needed) from `INTERSTITIAL_FLOOR_Y` up to wall body bottom (`y=0`). Do **not** change wall segment data or collision AABBs. | G8, M1(b) |
| Envelope closure (R-DP11) | Keep AABB perimeter shells; **add** (1) sealed corner pillars at four `deckBounds` corners, (2) continuous top-band rim at `ROOM_HEIGHT_M`, (3) pad-ring vertical faces bridging outermost room exterior walls → envelope inner face so no void ring. Aperture tags unchanged. | G2 v2, M2 |
| Material continuity (M7) | Shared `HULL_UV_REPEAT` / `HULL_UV_ROTATION` on envelope, interstitial, skirt, and pad-ring mats of the same family; transitions use thin trim/edge boxes — never raw mismatched butt UVs. | G8, VD §5 v1.10 |
| Dressing domain (G5 v2) | Props **only** on room interior wall faces + spine wall faces (inset along wall, never free-float in interstitial / envelope / pad ring). Origin XZ must lie inside a room footprint **or** within `DRESSING_WALL_FACE_TOLERANCE_M` of a spine/partition wall segment. | G5, M4, R-DP7 |
| Trim retune (R-DP13) | `PARTITION_ACCENT_STRIP_EMISSIVE` **0.55 → 0.40** (width constants unchanged). | G6 note |
| Ceiling adjacency (M8) | Extend `updateCeilingCutaway`: per-ceiling **opacity** (not binary `visible`); active = 0; adjacent **or** frustum-intersecting = `CEILING_FADE_ALPHA` ∈ [0.25, 0.4]; else 1.0; lerp each frame. Interstitial ceiling follows same fade when an active room is set. | G9–G12, VD §7 r6 |
| Adjacency definition | `listAdjacentRooms(graph, id)` = sorted unique union of door-`neighbors(graph, id)` **and** every other room id co-listed on any `wallSegment.rooms` with `id`. Closed doors do **not** remove adjacency (ambush telegraph is visual). | TL-v2-1, VD §7 r6 |
| Frustum test | Build `THREE.Frustum` from `camera.projectionMatrix * camera.matrixWorldInverse`; room footprint → AABB `y∈[0, ROOM_HEIGHT_M]`; **intersects** ⇒ “substantially inside.” | TL-v2-2 |
| Collision freeze | `buildCollisionWorld(graph)` `aabbs` + `polyEdges` deep-equal pre-polish snapshot; scene build must not mutate `graph.wallSegments`. | G7 |
| Pixel audit (CI) | Pure-function void classifier + material luminance floor + 2D silhouette-mask occupancy sampler over interstitial/skirt/envelope **material samples** (no WebGL required). Gate 1 still uses real screenshots S1–S11. | TL-v2-3, R-DP9 |

---

## Exact project layout (additions / extensions)

```
/
├── src/
│   ├── config.ts                         # EXTEND: v2 luminance / skirt / fade / trim / UV constants
│   ├── deck/
│   │   └── graph.ts                      # EXTEND: listAdjacentRooms (read-only query)
│   └── render/
│       ├── createDeckScene.ts            # EXTEND: skirt parenting if needed; ceiling mats transparent-ready
│       ├── deckHullGeometry.ts           # EXTEND: luminance mats, skirts, closure, UV continuity
│       ├── deckDressing.ts               # EXTEND: wall-face-only placement + bounds helpers
│       ├── ceilingCutaway.ts             # EXTEND: opacity bands, lerp, frustum, interstitial
│       └── deckHullAudit.ts              # NEW: void-family classifier + luminance helpers (testable)
└── tests/
    ├── render/
    │   ├── deckHullEnvelope.test.ts      # EXTEND: skirts, closure, luminance contract
    │   ├── deckDressing.test.ts          # EXTEND: placement-domain bounds (S6 v2)
    │   ├── deckHullPixelAudit.test.ts    # NEW: R-DP9 silhouette / void-family (S1 v2)
    │   ├── deckMaterialContinuity.test.ts# NEW: UV continuity contract (S9)
    │   ├── ceilingCutaway.test.ts        # NEW: G9–G12 opacity bands + lerp (S10/S11)
    │   └── visualPassDeterminism.test.ts # EXTEND: still hash-stable with v2 path
    └── deck/
        └── collisionDrift.test.ts        # KEEP: bit-identical buildCollisionWorld
```

**Forbidden paths:** `src/deck/data/deck03.json`, `src/deck/collision.ts`, `src/deck/loadDeck.ts` (read-only import OK), `src/sim/**`, `src/combat/**`, `src/ai/**`, `src/input/**`, `src/mission/**` (boot cutaway call-site wiring OK), shell/HUD accent CSS/TS (R-DP1).

---

## Constants (append / amend in `src/config.ts`)

```ts
/** R-DP13 — trim emissive retune (was 0.55 in SPEC v1; still wayfinding trim, not area light). */
export const PARTITION_ACCENT_STRIP_EMISSIVE = 0.40 as const;

/** Void clear-color family (scene.background / fog) — G1 v2 / R-DP9. */
export const VOID_FAMILY_RGB = { r: 5, g: 8, b: 15 } as const; // #05080f
/** Max per-channel distance to VOID_FAMILY_RGB before a sample counts as void-family. */
export const VOID_FAMILY_CHANNEL_EPSILON = 6 as const; // 8-bit

/** Interstitial dim-structure emissive (hull-steel mid family). */
export const INTERSTITIAL_EMISSIVE_HEX = '#2a3644' as const;
export const INTERSTITIAL_EMISSIVE_INTENSITY = 0.22 as const;
/** Minimum linear luminance (0–1) of interstitial/skirt/envelope sample under audit. */
export const INTERSTITIAL_MIN_LINEAR_LUMINANCE = 0.04 as const;

/** Wall-skirt vertical extent from interstitial floor up to deck plane (m). */
export const HULL_SKIRT_HEIGHT_M = 0.06 as const; // covers y=-0.01 → y=0 + tolerance
export const HULL_SKIRT_THICKNESS_M = 0.08 as const;

/** Envelope top-band rim height (m) at ROOM_HEIGHT_M. */
export const HULL_ENVELOPE_TOP_BAND_M = 0.12 as const;
/** Pad-ring bridge face thickness (m) — shell-to-outer-wall connectivity. */
export const HULL_PAD_RING_FACE_THICKNESS_M = 0.08 as const;

/** Shared UV policy for hull-steel / deck-plate continuity (VD §5 v1.10). */
export const HULL_UV_REPEAT = 0.35 as const;
export const HULL_UV_ROTATION = 0 as const; // radians; same for coplanar family faces

/** Ceiling adjacency fade (VD §7 rule 6 / M8) — alpha mid-band. */
export const CEILING_FADE_ALPHA = 0.32 as const; // must stay in [0.25, 0.4]
export const CEILING_FADE_ALPHA_MIN = 0.25 as const;
export const CEILING_FADE_ALPHA_MAX = 0.4 as const;
/** Opacity lerp rate (1/sec) toward target — ~0.15–0.2 s settle. */
export const CEILING_FADE_LERP_PER_SEC = 8 as const;

/** Dressing must sit on / within this distance of an allowed wall face (m). */
export const DRESSING_WALL_FACE_TOLERANCE_M = 0.45 as const;
```

Keep existing `HULL_ENVELOPE_*`, `SIGNAGE_PLANE_*`, `DRESSING_PROPS_PER_ROOM_MAX`, `APERTURE_SITES` unless a task below amends them. Assert at module load / test: `CEILING_FADE_ALPHA_MIN ≤ CEILING_FADE_ALPHA ≤ CEILING_FADE_ALPHA_MAX`.

---

## Data structures & APIs

### `listAdjacentRooms(graph, roomId): readonly string[]` — `src/deck/graph.ts`

```ts
/** Door neighbors ∪ wall-segment co-members; sorted; excludes self. Closed doors ignored. */
export function listAdjacentRooms(graph: DeckGraph, roomId: string): readonly string[];
```

### `deckHullAudit.ts`

```ts
export function isVoidFamilyRgb(r8: number, g8: number, b8: number): boolean;
/** Relative luminance from MeshStandardMaterial color + emissive*intensity (linear approx). */
export function materialLinearLuminance(mat: THREE.MeshStandardMaterial): number;
/** 2D grid: cells inside deckBounds silhouette and outside all room footprints. */
export function buildInterstitialMask(
  bounds: WorldRect,
  roomPolys: { points: WorldVec2[] }[],
  cellSizeM?: number,
): { width: number; height: number; insideInterstitial: boolean[] };
```

### `buildHullEnvelope` amendments (`deckHullGeometry.ts`)

Returns group still named `hull-envelope`, now also containing:
- `hull-interstitial:floor` / `hull-interstitial:ceiling` with luminance mats (M1)
- `hull-skirt:*` meshes (R-DP10)
- `hull-envelope:shell:*` + `hull-envelope:corner:*` + `hull-envelope:top-band:*` + `hull-envelope:pad-ring:*` (R-DP11)
- `hull-envelope:aperture:*` (unchanged metadata)

Export helpers if tests need them:
```ts
export function applyHullFamilyUv(mat: THREE.MeshStandardMaterial): void;
export function createInterstitialMaterial(base: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial;
```

### `buildDeckDressing` amendments

- Place props along **interior wall faces** (and spine walls): offset inward by `WALL_INSET`-class distance; no free-floating center-room scatter that can land in pad/interstitial.
- Export:
```ts
export function isDressingOriginAllowed(
  graph: DeckGraph,
  x: number,
  z: number,
): boolean;
```
  True iff point-in-room-footprint **and** within `DRESSING_WALL_FACE_TOLERANCE_M` of a wall segment belonging to that room (spine included). Envelope / pure interstitial → false.

### `updateCeilingCutaway` — signature (breaking vs v1 call site)

```ts
export interface CutawayState {
  lastRoomId: string | null;
  /** Per-room current opacity (0..1). */
  opacityByRoom: Map<string, number>;
  interstitialOpacity: number;
}

export function updateCeilingCutaway(
  roomGroups: ReadonlyMap<string, THREE.Group>,
  graph: DeckGraph,
  x: number,
  z: number,
  state: CutawayState,
  camera: THREE.Camera,
  dtSec: number,
  interstitialCeiling?: THREE.Object3D | null,
): void;
```

**Target opacity rules (normative):**

| Condition | Target α |
|-----------|----------|
| `id === activeId` | `0` (G9) |
| `id` ∈ `listAdjacentRooms(graph, activeId)` | `CEILING_FADE_ALPHA` (G10) |
| else if room AABB intersects camera frustum | `CEILING_FADE_ALPHA` (G11) |
| else | `1` (opaque OK) |
| interstitial ceiling when `activeId != null` | `CEILING_FADE_ALPHA` (M8) |
| interstitial when no active room | `1` |

Each frame: `opacity += (target - opacity) * min(1, CEILING_FADE_LERP_PER_SEC * dtSec)`.

**Material application:** ceiling meshes use `MeshStandardMaterial` with `transparent: true`; set `opacity`; `depthWrite = opacity > 0.99`; `visible = opacity > 0.01` (avoids pop — G12/S11). Do **not** use binary `visible = id !== activeId` as the sole mechanism.

### `boot.ts` wiring

```ts
const cutawayState: CutawayState = {
  lastRoomId: null,
  opacityByRoom: new Map(),
  interstitialOpacity: 1,
};
// in onFrame, after follow.update:
updateCeilingCutaway(
  deckScene.roomGroups,
  graph,
  entity.x,
  entity.z,
  cutawayState,
  follow.camera,
  dt,
  deckScene.hullEnvelope?.getObjectByName('hull-interstitial:ceiling') ?? null,
);
```

Fly-camera path: either skip cutaway or pass fly camera the same way — cutaway must not throw.

### Material policy (normative — v2 deltas)

| Surface | Allowed | Forbidden |
|---------|---------|-----------|
| Interstitial floor/ceiling | Hull-steel/deck-plate clone + interstitial emissive floor; UV via `applyHullFamilyUv` | Matching void-family luminance; accent palette |
| Skirts / pad-ring / corners / top-band | Same hull family + UV policy | Collision registration |
| Room ceilings | Neutral ceiling mat, opacity driven by cutaway | Large-area accent tint; hard pop (no lerp) |
| Dressing | Neutral mats; wall-face domain only | Origins in interstitial / on envelope |
| Partition trim | `PARTITION_ACCENT_STRIP_EMISSIVE = 0.40` | Raising emissive back to area-light levels |
| Shell UI / HUD | Unchanged (R-DP1) | Touching shell accents |

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | **v2 constants.** Amend/append constants exactly as **Constants** above (trim retune, void family, interstitial emissive, skirts, top-band, pad-ring, UV, ceiling fade, dressing tolerance). Assert fade alpha band in a unit test or config self-check. | `src/config.ts` | G1, G2, G5, G6, G8–G12, M1, M2, M4, M7, M8, R-DP9–R-DP13, R-DP15 |
| 2 | **Interstitial luminance + vertical read (M1).** `createInterstitialMaterial` / apply emissive floor to `hull-interstitial:floor` + `:ceiling`; ensure corridor-spine interstitial region stays solid (existing Shape holes). Document E4 y-levels unchanged. | `deckHullGeometry.ts`, `deckHullAudit.ts` | G1, M1, R-DP9, VD §7 r4/r9 |
| 3 | **Wall skirts (R-DP10).** For every `listWallSegments` entry, add render-only skirt mesh(es) sealing wall base to interstitial floor; name `hull-skirt:<wallId>`; parent under `hull-envelope` (or dedicated `hull-skirts` child group under envelope). Optional doorway corner seals if gap remains at openings. **Never** feed skirts to `buildCollisionWorld`. | `deckHullGeometry.ts`, `createDeckScene.ts` if needed | G8, M1, R-DP10 |
| 4 | **Envelope closure (R-DP11).** Add corner pillars, continuous top-band rim, pad-ring bridge faces from outermost room exterior walls to envelope inner face. Keep `APERTURE_SITES` opaque reserved faces + `ApertureFaceUserData`. AABB perimeter permitted. | `deckHullGeometry.ts` | G2, M2, M6, R-DP11, R-DP2 |
| 5 | **Material continuity (M7).** Apply `applyHullFamilyUv` to envelope/fill/skirt/pad-ring/corner mats of the same family; where two family faces meet at a hard angle, insert a thin trim/edge box rather than leaving mismatched UVs. | `deckHullGeometry.ts`, `deckMaterials.ts` only if shared helper fits | G8, M7, VD §5 v1.10 |
| 6 | **Dressing placement domain (G5 v2).** Rewrite `buildDeckDressing` so every prop origin satisfies `isDressingOriginAllowed`; spine runs stay on spine wall faces; remove free-float placements that land in interstitial (Gate-2 screen3 defect). Deterministic; ≤ `DRESSING_PROPS_PER_ROOM_MAX`; `castShadow=false`. | `deckDressing.ts` | G5, M4, R-DP7 |
| 7 | **`listAdjacentRooms`.** Implement in `graph.ts` per API above; unit-test: door-linked pair adjacent; wall-sharing pair adjacent; self excluded; sorted stable. | `src/deck/graph.ts`, `tests/deck/` or render tests | G10, M8, TL-v2-1 |
| 8 | **Ceiling cutaway opacity engine (M8).** Replace binary visibility with opacity targets + lerp; frustum test; apply to `ceiling:<roomId>` mats; keep `CutawayState` fields. Ceiling mats must be unique clones (already are) so opacity is per-room. | `ceilingCutaway.ts`, `createDeckScene.ts` (ensure `transparent` ready on ceiling mats) | G9–G12, M8, VD §7 r6 |
| 9 | **Interstitial ceiling + boot wiring.** Pass camera, `dt`, and interstitial ceiling into `updateCeilingCutaway` from `boot.ts` follow path; interstitial respects fade policy when active room set. | `ceilingCutaway.ts`, `src/app/boot.ts` | G9–G12, M8, R-DP15 |
| 10 | **Pixel-audit tests (S1 v2).** `isVoidFamilyRgb`, `materialLinearLuminance` ≥ `INTERSTITIAL_MIN_LINEAR_LUMINANCE` for interstitial/skirt/envelope sample mats; interstitial mask cells non-empty; optional note that Gate-1 screenshots remain human evidence at AL0+AL1. | `deckHullAudit.ts`, `tests/render/deckHullPixelAudit.test.ts` | G1, R-DP9 |
| 11 | **Dressing-bounds tests (S6 v2).** Every `dressing:*` mesh position.xz passes `isDressingOriginAllowed`; zero props named under envelope; prop count deterministic. | `tests/render/deckDressing.test.ts` | G5, M4 |
| 12 | **Skirt / closure / continuity tests (S3/S8/S9).** Assert skirt per wall id (or documented aggregate coverage); corner + top-band + pad-ring name prefixes present; UV repeat/rotation match on sampled family mats. | `deckHullEnvelope.test.ts`, `deckMaterialContinuity.test.ts` | G2, G8, M2, M7, R-DP10, R-DP11 |
| 13 | **Ceiling fade tests (S10/S11).** With stub camera/frustum: active α→0; adjacent α→`CEILING_FADE_ALPHA` within band; off-frustum non-adjacent →1; after several `dt` steps opacity approaches target without step-function jump from 1→0 in one call when `dt` is small; interstitial fades when active set. | `tests/render/ceilingCutaway.test.ts` | G9–G12, M8 |
| 14 | **Collision / determinism freeze.** Existing `collisionDrift` + `visualPassDeterminism` remain green; `buildCollisionWorld` bit-identical; `hashDeckGraph` unchanged across scene build. | existing tests | G7, R-DP3 |
| 15 | **Suite gate.** Project test script green; no forbidden-path edits; PR revision cites `G1–G12, M1–M8 @ spec v2`. Manual Gate-1 prep: S1–S11 from design pack v2 (screenshots not blocking PR open if automated tests cover contract). | — | G7 |

**Task count: 15**

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Bridge polygon footprint | Still punched as hole; pad-ring/closure covers nose protrusion inside bounds | envelope tests |
| E2 | No active room yet (`lastRoomId` null) | All ceilings + interstitial opacity target 1; no throw | cutaway test |
| E3 | Player in corridor spine | Spine is a room id — its ceiling hides; adjacent rooms fade | cutaway test |
| E4 | Interstitial z-fight | Keep floor `y=-0.01`, room floors `y=0.05` (v1 E4) | regression |
| E5 | Collision drift | Any new mesh must not enter `buildCollisionWorld` | collisionDrift |
| E6 | Fade alpha constants out of band | Fail config/test assert | T1 |
| E7 | Hard pop 1→0 in one frame | Forbidden when `dtSec` small; lerp only | S11 test |
| E8 | Dressing in pad ring / interstitial | Forbidden — bounds test fails | S6 |
| E9 | Aperture through-hole | Still forbidden at #10 | aperture phase |
| E10 | Transparent ceiling sorting | `depthWrite` false when α < 0.99; silhouettes under faded ceilings remain mesh-visible (no `visible=false` on actors) | cutaway + manual S10 |
| E11 | Fly-camera boot path | Must not crash if cutaway skipped or camera passed | boot smoke |
| E12 | Determinism | Same graph → same dressing names/positions; sim/deck hashes stable | determinism |

---

## Test / verification requirements

Composer must pass before revision push:

1. New/extended tests from T10–T14 green.
2. Existing suite green (incl. collision drift, polish materials, hull envelope aperture metadata, visual-pass determinism).
3. Manual Gate-1 evidence (design pack v2 S1–S11) prepared for Kimi — AL0 **and** AL1 for S1; before/after vs `gate2-screen0..3` for S2; adjacency doorway framing for S10; room-to-room move for S11.

---

## Out of scope (Composer must NOT touch)

- Starfield backdrop, transparent aperture **glazing** → **`p1-hull-exterior-view` (#11)** — topology reservation (M6) stays opaque
- Standalone second feature cycle for `#12` — **satisfied by this PR** when Gate 2 passes (R-DP15); do not open a parallel pack
- Any change to `buildCollisionWorld`, wall/door/node JSON, spawn tables, validator **rules** (read-only `listAdjacentRooms` helper OK)
- Sim / AI / combat / input / mission rule changes; alarm; netcode
- Shell UI / HUD section accent policy (R-DP1 — keep)
- Blender-authored envelope band (R-DP12 — contingency not triggered)
- Re-opening `p1-visual-pass` G6 tint-navigation as a requirement
- Performance “optimizations” that drop envelope/interstitial/skirts/dressing or disable ceiling fade

---

## Traceability matrix

| Goal / Mechanic | Tasks |
|-----------------|-------|
| G1 No void / dim structure | T1, T2, T3, T10, E4, E5 |
| G2 Envelope closes as one vessel | T1, T4, T12 |
| G3 Neutral interiors | (v1 baseline — do not regress) |
| G4 Navigation via signage/trim | (v1) + T1 trim retune keeps trim role |
| G5 Dressing bounds | T6, T11, E8 |
| G6 Palette language | T1 (R-DP13), materials policy |
| G7 No functional change | T14, T15, E5, E12 |
| G8 Seal & continuity | T3, T5, T12 |
| G9 Active ceiling hidden | T8, T9, T13 |
| G10 Adjacent fade | T7, T8, T13 |
| G11 Frustum fade | T8, T13 |
| G12 Readable under fade | T8, E10; Gate-1 S10 |
| M1 Interstitial (+ skirts / luminance) | T2, T3, T10 |
| M2 Envelope closure | T4, T12 |
| M3 Neutral retint | v1 baseline |
| M4 Dressing domain | T6, T11 |
| M5 Signage/trim | v1 + T1 |
| M6 Aperture tags | T4 (preserve), v1 tests |
| M7 Material continuity | T5, T12 |
| M8 Ceiling adjacency fade | T7, T8, T9, T13 |
| R-DP3 Collision freeze | T14 |
| R-DP9 Pixel luminance bar | T2, T10 |
| R-DP10 Wall skirts | T3, T12 |
| R-DP11 Envelope closure | T4, T12 |
| R-DP13 Trim retune | T1 |
| R-DP15 Ceilings in #10 | T8, T9, T13 |

Every goal G1–G12 and mechanic M1–M8 has ≥1 task. No task lacks a G#/M#/ruling trace.

---

## Branch / PR

- **Branch:** `feat/p1-deck-polish` (continue; do not re-cut)
- **Commits:** cite goals/mechanics, e.g. `G1,M1 @ spec v2 — interstitial luminance + skirts`
- **PR → `integration`:** revise PR #14; Stage 4 review; Gate 1 (Kimi) → Gate 2 (Director) before `master`

---

*Clarification for this spec: see `clarification-log.md` in this folder. Round-trip: see `round-trip-log.md`.*
