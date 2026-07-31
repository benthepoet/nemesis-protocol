# Technical Specification — p1-deck-polish

`SPEC v1 FINAL | feature p1-deck-polish | charter v1.13 | design doc v1.18 | design pack v0 (sketches treated as working contract per Director kickoff) | goals: G1..G7 | mechanics: M1..M5`
*Owner: Grok 4.5. Status: **FINAL** — Stage 2 complete under Director Kick off on `integration` @ `1718432`. Zero open clarification blockers to Kimi; pack-v0 sketches + VD v1.9 + locked rulings R-DP1/R-DP2 + TL bindings below are the Stage 3 contract. If Kimi later ships pack v1 that changes G#/M#, TL revises this spec before Composer continues.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.18** · visual direction **v1.9** · design pack **v0** (goal/mechanic sketches G1–G7 / M1–M5; Director rulings R-DP1, R-DP2) · feature roadmap **v1.9** (P1 #10) · assets/AGENTS.md current · `integration` @ `1718432`

### Clarification rulings incorporated

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| Director R-DP1 | Shell UI keeps section/function accents; M3 retint is in-world surfaces only | T6 out-of-scope shell/HUD; material policy § below |
| Director R-DP2 | Envelope includes aperture face tags for #11 Class C sites | T5 aperture metadata API |
| Director OQ / VD v1.9 | Starfield + glazing are #11; #10 reserves topology only | Out of scope; opaque reserved aperture faces |
| TL-B1 (pack v0) | Proceed from v0 sketches + VD v1.9 + `createDeckScene.ts` / deck load path | This entire SPEC v1 |
| TL-B2 | No Kimi GLB prereq — dressing is primitive kit-bash only | T8 |
| TL-B3 | Aperture site set = Class C wall segments on airlock / cargo / med / bridge | Constants + T5 |

**Stage 3 gate:** Composer implements on branch **`feat/p1-deck-polish`** cut from current `integration` (`1718432` or later tip). Presentation-only (G7). **Do not** edit `src/deck/collision.ts`, `deck03.json`, wall/door/node data, sim, AI, combat, input, or mission logic. Full suite green + new tests below before PR.

---

## Mission

Post-checkpoint P1 polish (roadmap #10, Director R2): fix deck presentation — fill inter-room void, add outer hull envelope silhouette, neutralize large-area room tints (supersedes `p1-visual-pass` G6 tint read), strengthen signage/trim navigation, add non-colliding machinery dressing. **Collision world, deck graph, wall segments, spawn data, and room footprints are accepted and must bit-match.**

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Authority surface | **Render-only.** New geometry/materials live under `src/render/**`. Read `DeckGraph` via existing `loadDeck03` / `listNodes` / `listWallSegments`. **Zero** writes to `SimState`, `CollisionWorld`, `DeckGraph`, or `deck03.json`. | G7, pack identity |
| Deck bounds source | **Computed at scene build** from world-space room footprints after `loadDeck` / `buildDeckGraph` (there is **no** `bounds` field in `deck03.json`). `computeDeckBounds(graph)` = axis-aligned AABB of every node footprint (rect corners + bridge polygon points), then expand by `HULL_ENVELOPE_PAD_M`. | Director: room union + deck03 load path; G1, G2, M1, M2 |
| Interstitial fill algorithm | (1) `deckBounds` AABB as above. (2) Collect each room as an XZ polygon (rect → 4 corners CCW; polygon → as authored). (3) Build `THREE.Shape` from deckBounds rectangle; punch each room polygon as a `Path` hole. (4) `ShapeGeometry` → horizontal mesh at `y = 0` (floor plating) named `hull-interstitial:floor`. (5) Optional thin upper deck plate at `y = ROOM_HEIGHT_M` named `hull-interstitial:ceiling` (same shape) so the 60° camera never reads `#05080f` through vertical gaps inside the silhouette. **Never** pass interstitial meshes into `buildCollisionWorld`. | G1, M1 |
| Outer hull envelope | Group `hull-envelope` under scene root: four (or more) exterior shell wall boxes along `deckBounds` perimeter at height `ROOM_HEIGHT_M`, thickness `HULL_ENVELOPE_SHELL_THICKNESS_M`, material = `mats.hullWall` / `hullSteel` (hull-steel family, VD §5). Bridge nose: extend shell to cover bridge polygon AABB protrusion (still inside `deckBounds`). Existing Class C `role:'hull'` wall segments from deck data **remain**; envelope is additional outer silhouette, not a replacement of wall data. | G2, M2 |
| Aperture reservation (R-DP2) | For each site in `APERTURE_SITES` (below), attach a named face mesh on the envelope (or on the matching exterior shell face) with `userData` metadata. **#10 keeps faces opaque** (same hull material) so G1 void rule holds until #11. **Do not** cut through-holes that expose clear-color. #11 will swap materials / add glazing without reshaping collision. | R-DP2, G1, G2; #11 coordination |
| Neutral interiors (M3) | **Delete** `accentFloorMaterial` usage. Floors use `mats.floor` (clone OK) with **no** accent `emissive` / color tint from `ACCENT_HEX`. Ceilings stay `mats.ceiling`. Partition/interior/bulkhead/hull **bodies** use existing neutral PBR mats — **no** large-area accent emissive on wall bodies. | G3, M3, VD §3 v1.8 |
| Navigation carriers (M5) | Keep and **strengthen** partition accent trim strips + section signage: increase strip emissive intensity / strip width constants; enlarge signage plane; ensure every room with `accentId !== 'corridor'` still gets `signage:<nodeId>`; corridor may keep spine-neutral strip only. Fixture gels in `createDeckLighting` are **out of scope to redesign** — do not strip existing practicals; do not recolor shell UI. | G4, M5, R-DP1 |
| Machinery dressing | Primitive kit-bash only (`BoxGeometry` / `CylinderGeometry`) — pipes, conduit runs, panel boxes, vent grilles. Parent under `dressing` group. Names: `dressing:<kind>:<roomId>:<index>` where `kind ∈ pipe\|conduit\|panel\|vent`. Place along spine + room wall interiors (inset from footprint edges); `castShadow=false`; **never** added to collision. Deterministic placement from room id hash / fixed offsets (no `Math.random`). | G5, M4, TL-B2 |
| Palette crossing (G6) | Interactive `#ffd54f` / hostile `#ff5252` / allied `#69f0ae` unchanged. Dressing/envelope/interstitial use hull-steel / corridor-neutral only — never those three as decoration. | G6, VD §3 |
| Collision freeze | `buildCollisionWorld(graph)` output (`aabbs` + `polyEdges`) must deep-equal a snapshot taken before any polish scene work. `createDeckScene` must not call `buildCollisionWorld` with new geometry and must not mutate `graph.wallSegments`. | G7 |
| Materials dispose | All clones / new materials created for interstitial, envelope, dressing, strengthened trim must be disposed via `DeckScene.disposeMaterials()` (or a child disposer registered there). | hygiene / G7 |

---

## Exact project layout (additions / extensions)

```
/
├── src/
│   ├── config.ts                         # EXTEND: hull pad/shell/aperture/dressing/trim constants
│   └── render/
│       ├── createDeckScene.ts            # EXTEND: neutral mats; call hull + dressing builders; strengthen signage/trim
│       ├── deckMaterials.ts              # EXTEND only if a shared interstitial/envelope mat helper is needed (prefer reuse hullSteel/floor/hullWall)
│       ├── deckHullGeometry.ts           # NEW: bounds, room polys, interstitial Shape, envelope + aperture builders
│       └── deckDressing.ts               # NEW: authored kit-bash prop placement
└── tests/
    ├── render/
    │   ├── deckPolishMaterials.test.ts   # NEW: no floor/wall body accent emissive; signage/trim present
    │   ├── deckHullEnvelope.test.ts      # NEW: interstitial + envelope + aperture userData
    │   ├── deckDressing.test.ts          # NEW: naming + scene presence; not in collision
    │   └── visualPassDeterminism.test.ts # EXTEND: polish modules also leave sim/deck hashes unchanged
    └── deck/
        └── collisionDrift.test.ts        # NEW (or under tests/render/): buildCollisionWorld snapshot equality
```

**Forbidden paths for this feature:** `src/deck/data/deck03.json`, `src/deck/collision.ts`, `src/deck/loadDeck.ts` (read-only import OK), `src/sim/**`, `src/combat/**`, `src/ai/**`, `src/input/**`, `src/mission/**` (except if boot already wires `createDeckScene` — only call-site wiring if required, no mission rule changes), shell/HUD accent CSS/TS (R-DP1).

---

## Constants (append to `src/config.ts`)

```ts
/** Outer pad beyond room-footprint AABB for hull envelope (m). */
export const HULL_ENVELOPE_PAD_M = 0.5 as const;

/** Envelope shell wall thickness (m) — presentation only. */
export const HULL_ENVELOPE_SHELL_THICKNESS_M = 0.4 as const;

/** Partition accent trim strip width after polish (m). Was 0.04 inline. */
export const PARTITION_ACCENT_STRIP_WIDTH_M = 0.07 as const;

/** Partition accent strip emissive intensity after polish. Was 0.38 inline. */
export const PARTITION_ACCENT_STRIP_EMISSIVE = 0.55 as const;

/** Signage plane width/height (m) — strengthened vs prior ~1.2×0.35. */
export const SIGNAGE_PLANE_WIDTH_M = 1.6 as const;
export const SIGNAGE_PLANE_HEIGHT_M = 0.45 as const;

/** Max dressing props per room (soft cap). */
export const DRESSING_PROPS_PER_ROOM_MAX = 6 as const;

/**
 * Class C aperture reservation sites for #11 (R-DP2 / VD §3 v1.9).
 * `wallSegmentId` must exist on deck03; face is placed on the exterior side of that segment.
 */
export const APERTURE_SITES = [
  { siteId: 'aperture-port-airlock-top', wallSegmentId: 'wall-c-port-airlock-top', roomId: 'port-airlock' },
  { siteId: 'aperture-port-airlock-side', wallSegmentId: 'wall-c-port-airlock-left', roomId: 'port-airlock' },
  { siteId: 'aperture-stbd-airlock-bottom', wallSegmentId: 'wall-c-stbd-airlock-bottom', roomId: 'stbd-airlock' },
  { siteId: 'aperture-cargo-top', wallSegmentId: 'wall-c-cargo-top', roomId: 'cargo-hold' },
  { siteId: 'aperture-med-top', wallSegmentId: 'wall-c-med-top', roomId: 'med-bay' },
  { siteId: 'aperture-bridge-nose', wallSegmentId: 'wall-c-bridge-nose', roomId: 'bridge' },
] as const;
```

Do **not** invent additional magic numbers in render code — lift any other polish sizes into `config.ts` the same way.

---

## Data structures & APIs

### `computeDeckBounds(graph): WorldRect`

```ts
/** AABB of all room footprints in world XZ, then expanded by HULL_ENVELOPE_PAD_M on each side. */
export function computeDeckBounds(graph: DeckGraph): WorldRect;
```

### `buildRoomFootprintPolygons(graph): { roomId: string; points: WorldVec2[] }[]`

Rect rooms → four corners (CCW in XZ). Bridge → polygon points as loaded. Skip degenerate (&lt;3 points).

### `buildInterstitialShape(bounds, roomPolys): THREE.Shape`

Outer rect path from `bounds`; each room poly → `shape.holes.push(path)`.

### `ApertureFaceUserData` (on mesh `userData`)

```ts
export interface ApertureFaceUserData {
  apertureReserved: true;
  apertureClass: 'C';
  siteId: string;
  roomId: string;
  wallSegmentId: string;
  /** #10 = opaque placeholder; #11 may set 'glazing'. */
  aperturePhase: 'reserved';
}
```

Mesh name: `hull-envelope:aperture:<siteId>`.

### `buildHullEnvelope(graph, mats): THREE.Group`

Returns group containing:
- interstitial floor (+ ceiling plate)
- envelope shell walls
- aperture face meshes (metadata attached)

### `buildDeckDressing(graph, mats): THREE.Group`

Returns group of kit-bash props. Materials: clones of `mats.hullSteel` / `partitionWall` only (neutral).

### `createDeckScene` integration

After room groups + `buildWalls`, add:
```ts
scene.add(buildHullEnvelope(graph, mats));
scene.add(buildDeckDressing(graph, mats));
```
Expose optional handles on `DeckScene` if tests need them:
```ts
export interface DeckScene {
  // existing fields…
  hullEnvelope?: THREE.Group;
  dressing?: THREE.Group;
}
```

### Material policy (normative)

| Surface | Allowed | Forbidden |
|---------|---------|-----------|
| Room floor | `mats.floor` (PBR / fallback), no accent emissive | `accentFloorMaterial`, `ACCENT_HEX` emissive/color on floor |
| Room ceiling | `mats.ceiling` | Section/function tint |
| Wall bodies (all roles) | `hullSteel` / `hullWall` / `partitionWall` / `bulkheadWall` | Large-area accent emissive on body |
| Partition trim strip | Accent emissive OK (M5) at `PARTITION_ACCENT_STRIP_*` | Floor/ceiling tint |
| Signage | Atlas plane, sized per constants | Removing signage from accent rooms |
| Interstitial / envelope / dressing | Hull-steel family only | Interactive/hostile/allied palette as decor |
| Shell UI / HUD | Unchanged (R-DP1) | Touching shell accent policy |

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | **Constants.** Append hull/envelope/aperture/dressing/trim/signage constants exactly as **Constants** above. Remove reliance on inline strip width `0.04` / emissive `0.38` / signage `1.2×0.35` by reading config. | `src/config.ts` | G2, G4, G5, M2, M4, M5, R-DP2 |
| 2 | **Deck bounds + room polygons.** Implement `computeDeckBounds` and `buildRoomFootprintPolygons` from loaded `DeckGraph` world footprints (post-`loadDeck` transform). Unit-test: bounds contain every room corner; pad equals `HULL_ENVELOPE_PAD_M`. | `src/render/deckHullGeometry.ts`, tests | G1, G2, M1, M2 |
| 3 | **Interstitial fill.** `buildInterstitialShape` + meshes `hull-interstitial:floor` / `hull-interstitial:ceiling` parented under envelope group. Material = `mats.floor` / `mats.ceiling` or `hullSteel` (neutral). Verify shape has hole count == room count with valid footprints. | `deckHullGeometry.ts`, `createDeckScene.ts` | G1, M1 |
| 4 | **Outer hull envelope shell.** Perimeter shell meshes along `deckBounds` at `ROOM_HEIGHT_M`, names `hull-envelope:shell:*`, hull-steel mats. Scene must show continuous outer silhouette from midships camera. | `deckHullGeometry.ts`, `createDeckScene.ts` | G2, M2 |
| 5 | **Aperture face metadata (R-DP2).** For each `APERTURE_SITES` entry, resolve `wallSegmentId` via `listWallSegments` / graph; place opaque reserved face mesh; set `ApertureFaceUserData`; name `hull-envelope:aperture:<siteId>`. Missing wall segment = hard test fail (deck data regression). | `deckHullGeometry.ts`, `config.ts`, tests | G2, M2, R-DP2 |
| 6 | **Neutral-room retint.** Remove `accentFloorMaterial` (and all floor accent emissive). Floors/ceilings/wall bodies use neutral materials only. Keep `accentId` on nodes (data untouched) for signage/trim lookup only. | `createDeckScene.ts` | G3, M3 |
| 7 | **Strengthen signage + trim.** Wire `PARTITION_ACCENT_STRIP_*` and `SIGNAGE_PLANE_*`; ensure accent rooms retain `signage:<nodeId>`; strip mats still use section/function `ACCENT_HEX` (navigation carrier). Do **not** alter HUD/shell accents. | `createDeckScene.ts`, `config.ts` | G4, M5, R-DP1 |
| 8 | **Machinery dressing.** Implement `buildDeckDressing` — deterministic kit-bash props on spine + rooms, naming `dressing:<kind>:<roomId>:<index>`, ≤ `DRESSING_PROPS_PER_ROOM_MAX`, neutral mats, `castShadow=false`. | `deckDressing.ts`, `createDeckScene.ts` | G5, M4 |
| 9 | **Dispose + boot wiring.** Ensure new materials/geometries dispose cleanly; `createDeckScene` adds envelope + dressing; no collision/sim call-site changes beyond existing scene construction. | `createDeckScene.ts`, `boot.ts` only if required | G7 |
| 10 | **Material policy tests.** Assert: no `floor:*` mesh has non-zero accent-tinted emissive from `ACCENT_HEX`; wall **body** meshes lack accent emissive; at least one `signage:*` and one partition `*:accent` strip exist; interstitial/envelope mats are neutral. | `tests/render/deckPolishMaterials.test.ts` | G3, G4, G6, M3, M5 |
| 11 | **Hull / aperture tests.** Assert envelope group present; interstitial floor exists; every `APERTURE_SITES` mesh present with correct `userData`; `aperturePhase === 'reserved'`. | `tests/render/deckHullEnvelope.test.ts` | G1, G2, M1, M2, R-DP2 |
| 12 | **Collision drift test.** Snapshot `buildCollisionWorld(loadTestDeck03())` (`aabbs` length + deep equality of rects/edges) **before** and after `createDeckScene` + dressing/envelope build; must be identical. Also assert `hashDeckGraph` unchanged across scene build. | `tests/deck/collisionDrift.test.ts` (or `tests/render/`) | G7 |
| 13 | **Determinism / dressing tests.** Extend `visualPassDeterminism.test.ts` to exercise hull+dressing path; add dressing name-pattern test; confirm no `Math.random` in new modules (static review + deterministic prop counts). | `visualPassDeterminism.test.ts`, `deckDressing.test.ts` | G5, G6, G7, M4 |
| 14 | **Suite gate.** `npm test` / project test script green; no edits under forbidden paths; PR title/body cite `G1–G7, M1–M5 @ spec v1`. | — | G7 |

---

## Edge cases & failure modes

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Bridge polygon footprint | Included in bounds + punched as hole; envelope covers nose | hull envelope test |
| E2 | Degenerate / missing room poly | Skip hole; do not throw mid-loop; DEV warn once | unit |
| E3 | Aperture `wallSegmentId` missing | Test fails; Composer must not invent substitute geometry silently | aperture test |
| E4 | Interstitial overdraw inside rooms | Holes must match footprints so room floors remain the walkable read; z-fight tolerance: interstitial at y=0, room floor at y=0.05 **or** interstitial y=`-0.01` (pick one; document in code comment) | materials / scene |
| E5 | Collision world drift | Any new mesh must not enter `buildCollisionWorld` | collisionDrift |
| E6 | Accent floor regression | Reintroduction of `accentFloorMaterial` or equivalent = fail | material policy |
| E7 | Shell UI retint | Breach/score/HUD section colors unchanged | out-of-scope + manual Gate 1 |
| E8 | Through-hole apertures in #10 | Forbidden — would show `#05080f` (fails G1) | aperture `aperturePhase` |
| E9 | Dressing blocks doors visually | Props inset ≥ 0.3 m from door openings; never centered in openings | dressing placement rule + test sample |
| E10 | Determinism | Same graph → same prop count/names/positions; hashSimState / hashDeckGraph stable | determinism test |

---

## Test / verification requirements

Composer must pass before opening the PR:

1. New tests from T10–T13 green.
2. Existing suite green (incl. `tests/deck/collision.test.ts`, `tests/render/deckMaterials.test.ts`, `tests/render/visualPassDeterminism.test.ts`).
3. Manual smoke (Gate 1 prep, not blocking PR open if automated tests cover contract): midships + follow-camera sweep — no void gaps inside hull silhouette; rooms read neutral; signage/trim identify sections; dressing visible on spine.

---

## Out of scope (Composer must NOT touch)

- Starfield backdrop, transparent aperture glazing, exterior space read → **`p1-hull-exterior-view` (#11)**
- Ceiling adjacency fade → **`p1-ceiling-adjacency-readability` (#12)**
- Any change to `buildCollisionWorld`, wall/door/node JSON, spawn tables, validator rules
- Sim / AI / combat / input / mission rule changes; alarm; netcode
- Shell UI / HUD section accent policy (R-DP1 — keep)
- New hero/prop GLBs from Kimi (kit-bash only this feature)
- Re-opening `p1-visual-pass` G6 tint-navigation as a requirement (superseded by Director R2 / VD §3 v1.8)
- Performance “optimizations” that drop envelope/interstitial or disable dressing

---

## Traceability matrix

| Goal / Mechanic | Tasks |
|-----------------|-------|
| G1 No void inside hull | T2, T3, T11, E1, E4, E8 |
| G2 Outer hull envelope | T1, T4, T5, T11 |
| G3 Neutral interiors | T6, T10, E6 |
| G4 Navigation via signage/trim | T7, T10 |
| G5 Machinery dressing | T8, T13, E9, E10 |
| G6 Palette language | T10, T13 |
| G7 No functional change | T9, T12, T13, T14, E5 |
| M1 Interstitial fill | T2, T3, T11 |
| M2 Outer envelope | T4, T5, T11 |
| M3 Neutral retint | T6, T10 |
| M4 Dressing props | T8, T13 |
| M5 Signage/trim | T7, T10 |
| R-DP1 Shell UI accents kept | T7 (non-touch), Out of scope |
| R-DP2 Aperture tags | T5, T11 |

---

## Branch / PR

- **Branch:** `feat/p1-deck-polish` from `integration`
- **Commits:** cite goals/mechanics, e.g. `G1,M1 @ spec v1 — interstitial hull fill`
- **PR → `integration`:** Stage 4 review surface; Gate 1 (Kimi) after Stage 4 approval; Gate 2 (Director) before `master`

---
*Clarification for this spec: see `clarification-log.md` in this folder.*
