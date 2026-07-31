# Design Pack — p1-deck-blender-mesh

`DESIGN PACK v1 | feature p1-deck-blender-mesh | design doc v1.19 | goals: G1..G7 | mechanics: M1..M5`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.19 · visual direction v1.10 · roadmap v1.9 · assets/AGENTS.md (current) · `p1-deck-polish` design pack v3 · `p1-ship-blender-viz` exploration pack v0 · `integration` @ `e38ab8c`. Kickoff: Director Stage 0, 2026-07-31 — integrate the exploration Blender ship (`p1-ship-blender-viz`; `assets/blender/p1_nemesis_deck03_viz.blend`; `tools/blender/build_p1_nemesis_deck03_viz.py`) into three.js as **presentation-only**. Director hold lifted **for this feature only**; roadmap #11/#13 remain held. Depends on: `p1-deck-polish` (#10, Gate 2 Proceed @ `0084465`), `p1-audio-baseline` (#14, Gate 2 Proceed @ `2110913`).*

**Feature identity:** the Blender Deck 03 model — built data-faithful from `deck03.json` and already Director-reviewed as renders R1–R5 — becomes the deck's architectural presentation in the running build. The procedural architecture builders in `createDeckScene` (room floors/ceilings, walls, hull envelope, interstitial slab, dressing) are **replaced as a presentation source** by a GLB export; everything with sim state, dynamic behavior, or UI language stays engine-side. Deck graph, wall segments/classes, collision, spawn data, room footprints, and every accepted G# are untouched (R-DP3 carries; R-BM1).

## Goal set (the contract)

Every goal is binary-verifiable in the running build at the 60° gameplay camera.

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | **Blender GLB is the deck presentation.** With the blender path active, all 18 deck03 rooms render from `assets/models/p1_nemesis_deck03.glb` — floors, walls by class with real door openings, ceilings, interstitial slab, hull envelope, exterior plating — with visual parity-or-better against both (a) the viz R1 read (one vessel, no void, neutral interiors + trim/signage wayfinding) and (b) the accepted `p1-deck-polish` procedural baseline. VD §7 rule 9 holds from the GLB: no `#05080f`-family pixel inside the hull silhouette | ☐ |
| G2 | **Ceiling cutaway works identically (VD §7 rule 6 / deck-polish M8).** The GLB path populates `roomGroups: Map<string, THREE.Group>` with `room:<roomId>` groups each containing a `ceiling:<roomId>` mesh; `updateCeilingCutaway` behaves exactly as on the procedural path — active room hidden, adjacent/in-frustum rooms at alpha 0.25–0.4, interstitial ceiling fades, no pop, ambush telegraph preserved. Verified by the S10/S11 sweep re-run on the GLB path | ☐ |
| G3 | **Aperture reservation preserved (deck-polish M6 / R-DP2).** All six `APERTURE_SITES` carry their `aperture:<roomId>:<wallId>` tagged faces on the GLB hull, **opaque hull-steel**, indistinguishable from surrounding envelope — the #11 glazing swap needs no reshaping. Automated tag-presence check passes | ☐ |
| G4 | **Flag & default policy (R-BM4).** GLB path is the **default** presentation on merge; the procedural path remains selectable via a runtime flag for A/B and fallback; a missing/failed GLB load falls back to procedural with a console warning — never a boot failure. Both paths boot clean | ☐ |
| G5 | **Performance held (VD §8).** 60 fps @1080p mid-tier GPU with the GLB path live in the densest combat scene; draw calls on the GLB path ≤ 1.5× the procedural baseline at the same framing (Grok measures; the number goes in the spec) | ☐ |
| G6 | **Zero functional drift.** Full existing suite green; collision derives from `deck03.json` only — no collision, raycast targets for gameplay, or deck-graph data is sourced from the GLB; every accepted G#/M# from P1 #1–#14 behaves identically | ☐ |
| G7 | **License scan clean.** GLB and `.blend` source are original, CC BY 4.0; no third-party material; no reference images in shipped paths; textures (if any) PNG/WebP per VD §8 | ☐ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

**This feature creates, alters, and retunes no game mechanic.** All entries are render-side presentation surfaces.

| ID | Presentation surface | Ref |
|----|----------------------|-----|
| M1 | **Blender GLB architectural deck mesh** — static architecture presentation of deck03: room floors/ceilings, walls by class with authored door openings, interstitial maintenance slab (R-DP16), hull envelope + exterior plating read. Replaces the corresponding procedural builders as the presentation source; render/collision-neutral | VD §2, §5, §7 rule 9; design doc §6.1 (classes, presentation only) |
| M2 | **Ceiling-cutaway binding preservation** — GLB scene graph ships `room:<id>` groups and `ceiling:<id>` meshes so the existing `ceilingCutaway.ts` contract (`roomGroups` map + `findCeilingMesh`) binds unchanged; interstitial ceiling face ships as `hull-interstitial:ceiling` for the boot.ts binding | VD §7 rule 6 (v1.8); deck-polish M8 |
| M3 | **Class C aperture-site tags** — the six `APERTURE_SITES` faces carried in the GLB hull with `aperture:<roomId>:<wallId>` naming, opaque hull-steel | VD §3 (v1.9); deck-polish M6/R-DP2; design doc §6.1/§6.4 (presentation-only) |
| M4 | **Static dressing & trim carried in GLB** — spine pipe/conduit runs, room machinery props, partition accent trim strips, per the viz model; VD §2 pillar 1 function-first, §3 v1.8 interior-neutrality (accents on trim/signage only, interiors neutral), deck-polish M4 placement domain (room/spine walls only, never interstitial, never telegraph-competing) | VD §2, §3 (v1.8), §5 |
| M5 | **Engine material retune on load** — the GLB ships standard PBR (metallic/roughness); the engine may retune materials on import (ceiling opacity setup for M2, emissive intensities for trim/fixture gels, texture assignment to the delivered `p1_*` sets) to sit correctly under the engine lighting rig. Palette and VD §3 language are locked; retune is values-only, never color-meaning changes | VD §3, §4, §5, §8 |

**Does not exist for this feature (explicitly unlisted):** starfield backdrop and aperture **glazing** (#11 `p1-hull-exterior-view`, held); collision or gameplay raycast from GLB geometry; engine lighting rig changes (the GLB carries **no** lights — `createDeckLighting` owns lighting, AL0/AL1 rows unchanged); engine **signage atlas** planes (stay engine-side, R-BM3); door state/animation (blast-door gating is P2); wall `intact/cracked/failed` damage states (P3); actor/hero models; audio; any sim, AI, tuning, input, HUD-data, deck-graph, or collision change.

## Rule spec

**Engine contracts preserved (Director kickoff, binding):**
- `ceilingCutaway.ts` finds `ceiling:<roomId>` under `room:<roomId>` groups for the M8 fade → M2, G2.
- `createDeckScene` returns `roomGroups: Map<string, THREE.Group>` → the blender path **populates the same map** (R-BM2); no equivalent-binding redesign.
- Aperture tags `aperture:<roomId>:<wallId>` per `APERTURE_SITES` / deck-polish M6 → M3, G3.
- Collision from `deck03.json` only — no mesh collision from GLB at P1 → G6.
- Boot-time interstitial fade binding: `hull-interstitial:ceiling` object must exist on the blender path (currently fetched from the hull envelope group in `boot.ts`) → M2.

**VD §3 v1.8 interior-neutrality:** GLB interiors neutral (hull-steel `#1a232e`–`#2a3644`, corridor `#8b949e`); accents confined to trim strips, fixture gels, signage (engine atlas). The viz model already conforms — the export must not regress it.

**VD §7 rule 9 one-vessel read:** envelope closes, interstitial reads as dim structure, no `#05080f` inside the silhouette — the GLB inherits the deck-polish v3 luminance bar (R-DP18) on interstitial/envelope-family materials after engine retune (M5).

**VD §8 technical bar:** glTF/GLB with standard PBR maps; textures PNG/WebP; phase-prefixed naming; 60 fps @1080p mid-tier (G5).

**Design doc §6.1/§6.4:** wall classes and hull-breach rules are cited for presentation fidelity only — the GLB changes no breach rule, collision class, or hull roll.

## Design rulings

- **R-BM1 — Presentation-only, R-DP3 carries.** No deck graph, collision, room-data, or spawn edits. The GLB is a presentation source swap for static architecture; anything sim-bound stays engine-side.
- **R-BM2 — Same binding surface, no redesign.** The blender path populates the existing `DeckScene.roomGroups` map and preserves the `hull-interstitial:ceiling` binding. Grok's spec must not redefine the cutaway/aperture contracts — only how GLB nodes map onto them.
- **R-BM3 — Signage stays engine-side.** The GLB's `SIGNAGE` collection (Blender text objects) is **excluded from export**. In-engine section signage planes (`signage:<roomId>`, atlas-driven) remain the single signage source — they carry VD §3 navigation language and stay consistent with shell UI. GLB trim strips (emissive accent geometry) do ship.
- **R-BM4 — Default = GLB; flag = escape hatch.** On merge, the GLB path is the default deck presentation (it is the intended ship look). The procedural path stays selectable via runtime flag for A/B evidence and fallback; load failure degrades to procedural with a warning, never a boot failure. Procedural-path retirement is a Director decision deferred to the #11 kickoff (earliest).
- **R-BM5 — Single GLB, merged for draw calls.** One file: `assets/models/p1_nemesis_deck03.glb` (no per-room split at P1 — one deck, one artifact; splitting is a P3/procgen question). Static geometry is merged by material **except** the cutaway-bound set: per-room `ceiling:<id>` meshes stay individual (M2), and the six aperture faces keep their tags (M3). Merge strategy details are Grok's spec domain within these constraints.
- **R-BM6 — World alignment locked to deck03.** The GLB exports in engine world coordinates: meters (1 unit = 1 m), y-up, x→X / deck-y→Z per the engine's `svgToWorld` mapping, origin per the viz script's locked center (`CX, CY = 614.5, 400` px). Alignment is verified by an automated probe test against `deck03.json` footprints — room AABB drift ≤ **0.05 m**, audit-only (not collision); target is exact, since exporter and engine run the same conversion math (clarification Q6). A misaligned export fails CI, not Gate 1.
- **R-BM7 — No lights, no cameras, no world in the GLB.** `LIGHTS`, `CAMERAS`, and the Blender world/compositor are export-excluded. Engine lighting rig, follow camera, and ACES pipeline own the look; the viz renders R1–R5 remain the *art target*, not the literal render setup.
- **R-BM8 — Source of record committed.** The generator script (`tools/blender/build_p1_nemesis_deck03_viz.py`, amended per below), the `.blend` workfile (`assets/blender/p1_nemesis_deck03_viz.blend`), and the exported GLB are all committed (CC BY 4.0 original). GLB is regenerated from the script, never hand-edited (assets/AGENTS.md rule 1 precedent).

## Blender pipeline amendments (what Kimi changes before export)

Amendments to `build_p1_nemesis_deck03_viz.py` + `.blend` so the exploration model becomes exportable. This is Kimi's Stage 1 asset work, delivered before/with spec finalization:

1. **Naming pass** — every export-bound object renamed to the engine contract: `room:<id>` parent empties (or group objects) per room containing its architecture; `ceiling:<id>` per-room ceiling meshes (individual, unmerged); `floor:<id>`; aperture faces `aperture:<roomId>:<wallId>` at the six `APERTURE_SITES` (matching `wallSegmentId`s in `src/config.ts`); interstitial ceiling face `hull-interstitial:ceiling`.
2. **Export set definition** — export collections: `STRUCTURE`, `ENVELOPE`, `CEILINGS`, `DRESSING`, `EXTERIOR`, `PROPS`, `TRIM`. Excluded: `SIGNAGE` (R-BM3), `LIGHTS`, `CAMERAS`, world (R-BM7).
3. **Merge pass** — static geometry merged by material within each `room:<id>` group and for envelope/exterior/interstitial, minus the R-BM5 exceptions (ceilings, aperture faces). Target: draw-call headroom inside G5.
4. **Transform lock** — +Y up export, transforms applied, meters, world placement per R-BM6; script gains an `export_glb()` step writing `assets/models/p1_nemesis_deck03.glb` (glTF binary, standard PBR).
5. **Material hygiene** — Principled BSDF only (glTF-compatible sockets); palette locked to VD §3 hexes; emissive strips/gels kept as emissive materials so M5 can retune intensity engine-side; no image textures baked from third-party sources (G7 — procedural/generated only, if any).
6. **Aperture honesty preserved** — aperture cut topology + frames from the viz stay, but ship **opaque hull-steel faces** in the GLB (M3); recessed glazing geometry is removed or opaqued for P1.

## Prereq assets

All original, CC BY 4.0, phase-prefixed. Reference boards **already gathered** — `features/p1-ship-blender-viz/references/references.md` (Board G interior, Board H exterior) satisfied reference-first before the model was built; cited here, no new refs required (no new tangible asset classes — this feature exports an existing, reference-backed model).

| Asset | Path | Method | Reference board | Status |
|-------|------|--------|-----------------|--------|
| Deck 03 architectural GLB (single file, R-BM5) | `assets/models/p1_nemesis_deck03.glb` | Blender export from amended generator (contract §above) | Boards G + H (existing) | pending export amendments |
| Blender workfile (source of record) | `assets/blender/p1_nemesis_deck03_viz.blend` | Existing, amended per pipeline §above | Boards G + H | on disk, uncommitted → commit with feature |
| Generator script (export step added) | `tools/blender/build_p1_nemesis_deck03_viz.py` | Existing, amended | — | on disk, uncommitted → commit with feature |

*Reference image files are never committed (charter v1.11) — index only.*

## Acceptance criteria (Gate 1 evidence plan)

**Automated:** full existing suite green + collision/graph freeze (G6); GLB node-contract test — every deck03 room id has `room:<id>` + `ceiling:<id>`, six aperture tags present, `hull-interstitial:ceiling` present (G2, G3); world-alignment probe test vs `deck03.json` (R-BM6); draw-call comparison capture on both paths (G5).

**Screenshot evidence (60° gameplay camera; baseline = procedural path @ same build, flag-toggled):**

| Shot | Proves |
|------|--------|
| B1 — Top-down hero, full deck, same framing as viz R1, GLB vs procedural side-by-side | G1 parity-or-better; vessel read; neutral interiors |
| B2 — Full-deck sweep (four quadrants + center) at AL0 **and** AL1 + void-pixel audit | G1, VD §7 rule 9 / R-DP18 luminance bar holds from GLB under engine lighting |
| B3 — Cutaway behavior sweep: active-room hidden, doorway framing with crew in adjacent room, room-to-room opacity transition (deck-polish S10/S11 re-run) | G2, M2 — fade band 0.25–0.4, no pop, ambush telegraph |
| B4 — Aperture exterior sweep: all six sites | G3, M3 — tags present, faces opaque, envelope closure intact |
| B5 — Spine oblique + engineering identity framings (viz R2/R4 equivalents, in-engine) | G1, M4 — pillar-1 dressing carried; trim/gel accents only |
| B6 — Densest combat scene (8 living crew, two-way fire) with FPS overlay, GLB path | G5 perf; VD §7 readability — GLB dressing never competes with telegraphs |
| B7 — Flag/fallback evidence: procedural flag boot, GLB-missing fallback boot (console warning) | G4, R-BM4 |
| B8 — Before/after: `gate2-screen0..3` framings (deck-polish) vs GLB path | G1 — the Director's failing views, resolved by the new presentation |

## Explicit non-goals

- No deck-graph, collision, spawn, or room-data change (R-BM1/G6). No GLB-derived collision.
- **No starfield** and **no aperture glazing** — roadmap #11 `p1-hull-exterior-view` owns both and remains under Director hold. The kickoff's M1 does **not** include the #11 starfield requirement; this feature's exterior bar is the solid-hull read only (VD §3 v1.8 silhouette, not the v1.9 starfield).
- No lighting-rig, camera, HUD, audio, actor-model, animation, damage-state, or door-state work.
- No retirement of the procedural path (deferred, R-BM4).
- No multi-deck / procgen generalization of the GLB pipeline (design doc §12.3 — P3+ question).

## Relationship to deferred #11 (`p1-hull-exterior-view`)

This feature **absorbs #11's envelope dependency**: #11 was specified as "depends on #10 envelope" — after this feature ships, the hull exterior is the GLB's authored envelope/plating, a strict upgrade over the procedural shell for #11's purposes. #11's remaining scope is unchanged: dim starfield backdrop + transparent glazing swap at the six tagged aperture faces (M3 tags are the seam). This feature must not ship any starfield or transparency; #11's kickoff will also decide procedural-path retirement (R-BM4). Director hold on #11 stands.

## Doc/visual bumps

**None required.** Presentation-only: no rule, number, or VD language changes. All governing rules are already doc-first — VD v1.8–v1.10 (interior-neutrality, apertures, adjacency fade, material continuity, one-vessel read), deck-polish R-DP16–R-DP18 (slab, shape convention, luminance). If the §3.2a clarification loop produces rule changes, the doc bumps before the spec finalizes.

## Next pipeline step

Pack v1 → **Grok Stage 2 spec** (clarification loop §3.2a open) in parallel with **Kimi's Blender export amendments** (pipeline §above — blocking asset dependency) → Composer Stage 3 on `feat/p1-deck-blender-mesh` → Stage 4 → Gates 1–2.
