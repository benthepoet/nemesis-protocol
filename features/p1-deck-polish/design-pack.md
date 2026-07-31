# Design Pack — p1-deck-polish

`DESIGN PACK v2 | feature p1-deck-polish | design doc v1.18 | visual direction v1.10 | goals: G1..G12 | mechanics: M1..M8`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.18 · visual direction v1.10 · roadmap v1.9 · assets/AGENTS.md (current) · `p1-visual-pass` design pack v2 (G6 supersession context). Kickoff: Director Stage 0, 2026-07-30 — ruling R2 (roadmap v1.9), post-M-P1 polish mandate, P1 #10. Depends on: P1 #9 (`p1-visual-pass`, Gate-2 accepted @ `master` `d4809d6`; Director message cites working tree `faad264`).*

**v2 status:** binding Stage 1 contract, supersedes v1 (§3.5a Director Gate-2 iteration on PR #14, 2026-07-31 — *"It doesn't look good."*; **2026-07-31 Director: include ceilings** — pulls forward roadmap #12 adjacency fade into this feature/PR). Gate-2 evidence: `gate2-screen0.png`–`gate2-screen3.png`. v2 amends G1/G2/G5, adds G8–G12 + M7–M8, rulings R-DP9–R-DP15. VD **v1.10**.

**v1 status:** binding Stage 1 contract. Reference boards gathered and committed (`references/references.md`, boards D–F) — charter §1 reference-first satisfied before asset production.

**Feature identity:** post-checkpoint P1 polish (roadmap v1.9 #10). Fixes the Director's three deck-presentation complaints in one gateable unit: *"the ship is ugly"*, *"massive gaps between the rooms — unacceptable"*, *"get rid of the coloring in the rooms"*. Presentation only — deck graph, wall segments, collision, spawn data, and room footprints are accepted work and **do not change** (R-DP3).

## Goal set (the contract)

Every goal is binary-verifiable in the running build at the 60° gameplay camera.

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | **No visible void between room footprints.** Within the hull envelope, every screen pixel between rooms reads as structure (interstitial hull plating, maintenance band, or room geometry) — verified by a full-deck screenshot sweep at the 60° camera; the flat `#05080f` background is never visible *inside* the hull silhouette | ☐ |
| G2 | **Outer hull envelope.** A continuous hull shell silhouette (hull-steel PBR per VD §5) bounds the playable deck union; from every reachable follow-camera framing the deck reads as one vessel, never floating rooms. The envelope carries the R-DP2 aperture topology (M6) without exposing any starfield or transparency at this feature | ☐ |
| G3 | **Neutral interiors (VD §3 v1.8 interior-neutrality rule).** No large-area accent tints remain on floor, ceiling, or wall bodies — the `accentFloorMaterial` emissive-tint source (`src/render/createDeckScene.ts`) is retired and floors/ceilings/walls render in the hull-steel and corridor-neutral families only. This **supersedes** `p1-visual-pass` G6's tint-navigation read by Director ruling R2 (that G6 acceptance stands as history) | ☐ |
| G4 | **Navigation survives the retint.** With area tints removed, section/room identification is carried by the signage atlas, accent-lit trim strips, and fixture gels — verified by a HUD-off walkthrough: every room's identity is determinable from in-world cues at gameplay distance | ☐ |
| G5 | **Dressing uplift (VD §2 pillar 1).** Spine and room walls carry machinery dressing (pipes, conduits, panels, vents) — authored placement, non-colliding, zero gameplay-graph impact; no surface is decoration-without-function, and dressing never obscures a VD §6 telegraph or a walk lane | ☐ |
| G6 | **Palette language intact (VD §3 rule + R-DP1).** Interactive `#ffd54f` / hostile `#ff5252` / allied `#69f0ae` meanings unchanged and never crossed, in-world and on UI; shell UI (breach select, score screen, HUD) **keeps** its section/function accents — the retint is in-world surfaces only | ☐ |
| G7 | **No functional change + performance.** Full existing suite green with zero sim/binding drift; every accepted G#/M# from P1 #1–#9 behaves identically (except the explicitly superseded `p1-visual-pass` G6 tint read); deck graph, collision, and room data untouched; 60 fps @1080p mid-tier held with fill + envelope + dressing live (VD §8); license scan clean | ☐ |

## Mechanics callout (presentation surfaces only)

**Anti-assumption rule: a surface not on this list does not exist for this feature.** This feature creates, alters, and retunes no game mechanic; all entries are render-side presentation surfaces.

| ID | Presentation surface | Ref |
|----|----------------------|-----|
| M1 | **Interstitial hull fill geometry** — fills all void regions between room footprints inside the envelope; render/collision-neutral (no collision bodies, no deck-graph nodes); spans floor→ceiling with a top cap so cutaway views never reveal void | VD §2, §5; deck data read-only |
| M2 | **Outer hull envelope shell** — silhouette geometry wrapping the deck-union footprint (top band + outward-facing side faces; underside is never camera-visible at 60° and is not built); hull-steel PBR per VD §5 | VD §2, §3 (v1.8 exterior read), §5 |
| M3 | **Neutral-room retint** — floor/ceiling/wall material policy per VD §3 v1.8; retires the `accentFloorMaterial` emissive tint (G3); supersedes `p1-visual-pass` G6 tint read by Director ruling R2 | VD §3 (v1.8) |
| M4 | **Machinery dressing props** — pipe runs, conduit bundles, wall panels, vent grilles; kit-bash path per charter overkill rule (R-DP4); authored deterministic placement; non-colliding; never on >50 % of any Class A wall face (P3 damage states must stay readable — R-DP7) | VD §2 pillar 1 |
| M5 | **Signage/trim/gel accent consolidation** — post-retint navigation carrier: section signage atlas (existing), partition accent trim strips (existing, survive as permitted trim), fixture gels; function-grain signage additions where a room's identity is not determinable (G4) | VD §3 (v1.8), §4 |
| M6 | **Class C aperture-site reservation (R-DP2)** — envelope geometry includes cut faces / face tags at authored Class C aperture sites (port + starboard airlocks, cargo hold, med bay, CIC/bridge-adjacent hull — where deck data marks `hullAdjacent` + Class C segments), tag naming `aperture:<roomId>:<wallId>`; faces ship **opaque hull-steel** at #10 so #11 (`p1-hull-exterior-view`) can swap in transparent glazing without reshaping collision | VD §3 (v1.9 apertures); design doc §6.1/§6.4 (presentation-only — no breach-rule, collision-class, or hull-roll change) |

**Does not exist for this feature (explicitly unlisted):** starfield rendering and aperture **glazing** — #11 `p1-hull-exterior-view`; locomotion animation — #13; audio — #14; any sim, AI, tuning, input, HUD-data, deck-graph, or collision change. *(Ceiling adjacency fade — formerly #12 — is **in scope** for v2 per Director 2026-07-31; standalone #12 pack defers to this delivery.)*

## Rule spec

**VD §3 v1.8 interior-neutrality rule (the M3 contract, verbatim intent):** room interiors are **neutral** — floors, ceilings, and wall bodies render in the hull-steel (`#1a232e`–`#2a3644`) and corridor-neutral (`#8b949e`) families only. Section and function accents are confined to **signage, trim strips, fixture gels/lighting, and HUD**; large-area floor/ceiling/wall tints are removed. Navigation remains a player skill — carried by the signage atlas, accent-lit trim, and the §4 lighting matrix, not by colored rooms.

**VD §3 v1.9 exterior/aperture rule (the M2/M6 contract):** space beyond the hull is a dim starfield inside the `#05080f` void family with a solid hull silhouette (**#11 ships the starfield; #10 ships the silhouette**). Hull apertures are real transparent openings cut into Class C exterior faces at authored sites — **#10 reserves the topology (M6), #11 ships the glazing.** Apertures are presentation geometry only: no change to breach rules, collision classes, or hull-breach rolls (design doc §6.1/§6.4).

**VD §3 v1.9 shell-UI note (R-DP1):** breach select, score screen, and HUD chrome **keep** section/function accent colors; interior-neutrality applies to in-world room surfaces only.

**VD §2 pillar 1 (the M4 contract):** rooms are built from systems — pipes, conduits, vents, panels, rivets; a surface with no function gets wear, not decoration.

**VD §5 materials:** envelope, fill, and dressing reuse the delivered PBR sets (hull-steel trim, deck plate, wall panel, wear masks) — metallic/roughness workflow, authored wear, trim-sheet strategy; any new texture is 1K structure-class via a committed `tools/` generator (precedent: `p1-visual-pass` R3).

**VD §7 camera non-negotiables:** rule 2 (hostile silhouettes before effects — dressing never competes), rule 6 (wall tops read cleanly; fill/envelope must not break the shipped ceiling-cutaway behavior), rule 4 (darkness is a budget — interstitial spaces read as dim structure, not true black).

**Roadmap rulings:** R2 (post-M-P1 polish mandate — this feature's scope row #10) and R1 protection rule (no accepted G#/number/rule altered except the explicitly superseded tint read).

## Design rulings

- **R-DP1 (Director, locked — OQ3):** shell UI keeps section/function accents; the M3 neutral retint is **in-world surfaces only** (VD §3 v1.9).
- **R-DP2 (Director, locked — OQ2 coordination):** the hull envelope **includes cut mesh / face tags** for Class C aperture sites (M6) so #11 adds transparent viewports without reshaping collision. At #10, aperture faces are opaque hull-steel — indistinguishable from surrounding envelope.
- **R-DP3 (Director, locked):** **no deck graph, collision, or room-data edits.** Deck 03 topology, wall segments/classes, footprints, spawns, and collision bodies are accepted work. Fill, envelope, and dressing are render-only geometry that intersects nothing in the collision world.
- **R-DP4 — Asset strategy: kit-bash, no Blender hero pass.** Envelope shell, interstitial fill, and dressing props are blockout-scale geometry best derived **data-driven from the deck footprints** (kit-bash modules instanced/merged render-side). Per the charter overkill rule, Blender MCP is not opened for #10. Contingency: if Gate 1 evidence shows the envelope silhouette failing G2 (reads as box-ring, not vessel), a Blender-authored envelope band becomes a design-pack v2 amendment — pre-authorized escalation path, not improvisation.
- **R-DP5 — Trim survives; tints die.** The partition accent **strips** (`partitionAccentStripMaterial`, emissive trim at wall bases) and the section signage planes are *trim/signage* under VD §3 v1.8 and **stay**. The floor emissive tint (`accentFloorMaterial`) is a *large-area* tint and **goes**. Corridor spine stays neutral `#8b949e` throughout.
- **R-DP6 — Reuse delivered materials.** No new hero texture authoring: envelope/fill/dressing reuse the `p1-visual-pass` delivered sets (hull-steel trim, deck plate, wall panel, wear masks). One new 1K structure-class plating variant (`p1_hull_plating_*`) is permitted if the envelope needs a distinct plate rhythm — generator script committed under `tools/` per the R3 precedent.
- **R-DP7 — Dressing discipline.** Placement is authored and deterministic (seeded from room/wall IDs — no per-run randomness, netcode-ready mandate holds). Spine gets continuous pipe/conduit runs; rooms get function-appropriate dressing (Life Support piping, Armory racks-adjacent panels, etc.). Dressing never covers >50 % of a Class A wall face, never crosses a doorway or walk lane, never sits in the gameplay mid-plane where telegraphs live (VD §7 rules 1–2), and never implies a destructibility state.
- **R-DP8 — Envelope read at the 60° camera.** The envelope is a hull band wrapping the deck-union footprint at room height with an outward skirt; silhouette priority is top-down readability as *one vessel* (VD §3 v1.8 exterior read). Underside geometry is not built (never camera-visible). Interstitial fill spans floor→ceiling with a top cap at room height so cutaway and adjacency views never reveal void.

## Ships vs deferred (explicit scope boundary)

| In scope (ships with this feature) | Deferred (owner / vehicle) |
|---|---|
| Interstitial hull fill (M1, G1) | Starfield backdrop — #11 `p1-hull-exterior-view` |
| Outer hull envelope silhouette (M2, G2) | Transparent aperture glazing — #11 (topology reserved by M6) |
| Neutral-room retint (M3, G3; supersedes `p1-visual-pass` G6 tint read) | ~~Ceiling adjacency fade — #12~~ **In scope v2 (G9–G12, M8)** |
| Machinery dressing kit (M4, G5) | Player locomotion anim set — #13; audio baseline — #14 |
| Signage/trim/gel consolidation (M5, G4) | Wall `intact/cracked/failed` states — P3 / M-P3 |
| Aperture-site topology reservation (M6, R-DP2) | Any new lighting-matrix rows — P2+ milestones |

## Prereq assets

All original, CC BY 4.0, phase-prefixed (charter §5). Reference boards: `features/p1-deck-polish/references/references.md` (boards D–F). Method per R-DP4/R-DP6: **kit-bash / data-driven — no Blender hero pass for this feature.**

| Asset | Path (assets/) | Method | Reference board | Status |
|-------|----------------|--------|-----------------|--------|
| Hull plating kit (plating panel, edge band, corner cap, maintenance band modules) | `models/p1_hull_plating_kit.glb` | Kit-bash primitives, data-driven placement | Board D | pending |
| Dressing kit (pipe run, conduit bundle, wall panel dressing, vent grille) | `models/p1_dressing_kit.glb` | Kit-bash primitives, deterministic placement (R-DP7) | Board E | pending |
| Hull plating texture variant (1K structure — only if R-DP6 contingency triggers) | `textures/p1_hull_plating_{albedo,metal,rough,normal}.png` | Procedural generator committed under `tools/` (R3 precedent) | Board D | optional |
| Function signage additions (only where G4 walkthrough shows an unidentified room) | `textures/p1_function_signage_additions.png` | Atlas extension, deck-plan v2.2 typography | Board F | conditional |
| Reused (delivered, unchanged): hull-steel trim, deck plate, wall panel, ceiling panel, wear masks, section signage atlas, corridor light fixture, amber beacon | `textures/p1_*`, `models/p1_*` (existing) | — | `p1-visual-pass` Board C (inherited) | delivered |

*Reference image files are never committed (charter v1.11) — index only at `references/references.md`.*

## Acceptance criteria (Gate 1 evidence plan)

**Automated:** full existing suite green with zero binding drift (G7); render-only additions at Grok's discretion (e.g., aperture-tag presence check on envelope output, collision-graph hash unchanged).

**Screenshot evidence (60° gameplay camera unless noted):**

| Shot | Proves |
|------|--------|
| S1 — Full-deck overview sweep (four quadrants + center framing) | G1 no void pixels inside the envelope; G2 vessel silhouette |
| S2 — Before/after pair: `master` `d4809d6` vs feature build, same camera path | G1 gaps closed; G3 tints removed (the Director's three complaints, side by side) |
| S3 — Interstitial close-ups at the tightest room clusters (midships spine adjacencies, aft engineering block) | G1, G5 fill + dressing read as structure, not void |
| S4 — Per-section room interiors, all sections | G3 neutral families only; accents confined to signage/trim/gels (R-DP5) |
| S5 — HUD-off navigation walkthrough sequence (reviewer blind-identifies each room from in-world cues) | G4 navigation survives retint |
| S6 — Dressing close-ups + densest combat scene (8 living crew, sustained two-way fire) | G5 pillar-1 dressing; VD §7 readability — dressing never competes with telegraphs |
| S7 — Palette sweep: HUD, breach select, score screen unchanged + in-world meaning check | G6, R-DP1 shell accents kept; no crossings |
| S8 — Envelope exterior sweep with aperture sites visible (opaque faces at the five M6 sites) + FPS overlay in the S6 scene | G2, M6/R-DP2 tags present; G7 performance held |

## Doc/visual bumps

**None required.** All design rules this pack enforces are already doc-first: interior-neutrality + exterior/aperture/shell-UI rulings landed in **visual_direction v1.8–v1.9**; the audio baseline note landed in **design doc v1.18**; scope rows #10–#14 and ruling R2 landed in **roadmap v1.9**. This pack is the Stage 1 contract against those current versions. If the clarification loop (§3.2a) produces rule changes, the doc bumps before the spec finalizes.

## Anticipated clarification answers (non-blocking — for Grok's Stage 2)

- **Q1 (anticipated):** *Envelope underside?* — Not built. Never camera-visible at the 60° pitch (R-DP8). [doc change: no]
- **Q2 (anticipated):** *Aperture-tag naming?* — `aperture:<roomId>:<wallId>` (M6); faces opaque hull-steel at #10. [doc change: no]
- **Q3 (anticipated):** *Interstitial fill height?* — Floor→ceiling with a top cap at `ROOM_HEIGHT_M` so cutaway/adjacency views never reveal void (R-DP8). [doc change: no]
- **Q4 (anticipated):** *Dressing instancing vs merged static geometry, placement derivation, culling* — technical domain, Grok decides; the design constraints are R-DP7 (deterministic, non-colliding, Class A coverage cap, telegraph non-competition).

---

# § v2 Amendment — Director Gate-2 iteration (2026-07-31, charter §3.5a)

**Director feedback on PR #14:** *"It doesn't look good."* Evidence: `gate2-screen0.png`–`gate2-screen3.png`. Diagnosed layer: **design/spec contract gaps** (v1 licensed geometry that cannot pass its own goal) + **art execution within existing contract**. Not diagnosed: deck data (R-DP3 holds — Director has not overridden; every fix below is render-only).

## Gate verdict against v1 contract (Gate 1/2 evidence review)

| Goal | Verdict | Evidence |
|------|---------|----------|
| G1 No visible void | **FAIL** | `gate2-screen0`, `gate2-screen1`, `gate2-screen3`: large true-black (`#05080f`-family) strips between room footprints and flanking the corridor spine, *inside* the hull silhouette. The interstitial plate exists (faint slab visible, screen0 border/left strip in screen1) but renders indistinguishable from void — VD §7 rule 4 broken between rooms |
| G2 Outer hull envelope | **FAIL** | `gate2-screen1`, `gate2-screen3`: rooms still read as floating islands; envelope shell is a perimeter frame with gaps at corners/sides and no visual connection to the outermost room walls — the "one vessel" read is not achieved |
| G3 Neutral interiors | **PASS** | All four screens: no large-area accent tints on floors/ceilings/wall bodies; neutral hull-steel/corridor families hold |
| G4 Navigation survives | **PASS** | All four screens: signage labels and accent trim strips present and readable at gameplay distance |
| G5 Dressing uplift | **FAIL** | `gate2-screen3`: a pipe run sits **in the interstitial void** between rooms — decoration without function, floating in black (R-DP7 broken in spirit; placement domain never constrained in v1). `gate2-screen2` vent grille is correct. Overall dressing sparse |
| G6 Palette language | **PASS** | No crossings observed. Tuning note: strengthened trim emissive (spec v1 constants) reads dominant/heavy in screens 1/3 — retune authorized under R-DP13, not a palette violation |
| G7 No functional change | **PASS** | Stage 3 report: 233 tests green + collision/graph freeze tests; no drift evidence in the screens |

## Root-cause diagnosis (design layer)

- **L1 — spec/algorithm gap (M1):** v1 licensed a *flat floor plate only* (AABB minus footprint holes, y=-0.01) with **no luminance/material bar** and **no vertical seal**. A dark PBR plate outside practical-light radius reads as `#05080f`; the "fill" is visually identical to the void it was meant to eliminate. G1's pixel-level intent had no binary contract in M1.
- **L2 — spec gap (M2):** v1 licensed envelope = four perimeter boxes at the padded AABB with **no closure requirement** (corners, top-band continuity) and **no connectivity requirement** to outermost room walls. Result: frame present, vessel read absent.
- **L3 — missing mechanic:** no wall-skirt/seal rule. Walls stand on y=0; footprint/wall-thickness mismatches and doorway/corner seams open black slivers (`gate2-screen2` diagonal wedge top-left, doorway gap top-right).
- **L4 — missing rule:** no material-continuity rule — adjacent same-family surfaces render with mismatched texture orientation (`gate2-screen2`: horizontal streak vs grid tile on adjoining faces). Fixed doc-first in VD §5 v1.10.
- **L5 — art execution within contract:** dressing placed in the interstitial void (`gate2-screen3` pipe) — v1's M4 never bounded the placement domain to room/spine wall surfaces.
- **Not at fault:** deck data, deck graph, collision (R-DP3 re-affirmed). Opaque adjacent-room ceilings were **#12** — **Director 2026-07-31 pulls adjacency fade into v2** (R-DP15).

## Amended goals (v2 contract)

- **G1 (amended):** No visible void between room footprints — **and no pixel inside the hull silhouette falls to the `#05080f` void family.** Interstitial structure reads as *dim structure* (VD §7 rules 4 + 9) under both AL0 and AL1 lighting at the 60° camera; verified by full-deck screenshot sweep **plus automated pixel audit** (S1 v2).
- **G2 (amended):** Outer hull envelope — continuous silhouette **that closes**: corners sealed, top band unbroken, shell visually connects to the outermost room walls (no void ring). From every reachable follow-camera framing the deck reads as one vessel (VD §7 rule 9).
- **G5 (amended):** Dressing uplift — **placement domain bounded:** props exist only on room interior walls and corridor-spine wall faces; zero props in interstitial regions, on envelope faces, or floating free (binary bounds check, S6 v2).
- **G8 (new):** **Seal & continuity.** Every wall body seals to the deck plane it stands on — no under-wall slivers, no footprint-seam gaps at any reachable camera angle; shared-structure surfaces satisfy VD §5 v1.10 continuity (orientation/scale/density match or authored trim transition).
- **G9–G12 (pulled forward from #12 — VD §7 rule 6):** **G9** active-room ceiling fully hidden (regression). **G10** adjacent-room ceilings semi-transparent (alpha 0.25–0.4), never opaque. **G11** in-frustum non-adjacent rooms fade to same band; off-frustum may stay opaque. **G12** under faded ceilings, hostile silhouettes + §6 telegraphs readable (ambush test — `gate2-screen2`/`3` framings).
- G3, G4, G6, G7 unchanged.

## Amended mechanics (v2 contract)

- **M1 (amended) — Interstitial fill:** (a) carries a **dim-structure read** — material/lighting treatment such that fill pixels never match the void family under AL0/AL1 (binary bar R-DP9; method is spec-level); (b) includes **vertical skirt faces** sealing wall bases and footprint seams from the fill plate up to wall bodies; (c) corridor spine region fully solid. Render/collision-neutral (unchanged).
- **M2 (amended) — Envelope:** closure required — sealed corners, unbroken top band at `ROOM_HEIGHT_M`, and visual connection to outermost room exterior walls (fill or shell faces bridge the pad ring). R-DP2 aperture topology (M6) unchanged.
- **M4 (amended) — Dressing:** placement domain = room interior walls + spine wall faces only; never interstitial, never envelope, never free-floating. R-DP7 discipline otherwise unchanged.
- **M7 (new) — Material continuity:** envelope/fill/skirt surfaces reuse hull-steel/deck-plate families with VD §5 v1.10 continuity — shared orientation, scale, texel density; transitions via trim/edge modules, never raw butt joints.
- **M8 (new — #12 pulled forward) — Ceiling adjacency fade:** extends `updateCeilingCutaway` — opacity/transparent materials per G9–G11; smooth transitions; interstitial ceiling plate respects same policy where it occludes adjacent rooms.
- M3, M5, M6 unchanged.

## New rulings

- **R-DP9 — Interstitial luminance bar (binary):** in S1/S3 screenshots, no sampled pixel inside the hull-silhouette mask matches the `#05080f` void family (threshold + mask method set in Grok's spec). The design bar: dim structure, not true black, at AL0 *and* AL1.
- **R-DP10 — Wall skirt/seal:** every wall body (partition, bulkhead, hull) extends — or a skirt mesh bridges — to the deck/fill plane it stands on. Zero visible gap at wall bases, doorways, and corners from any follow-camera framing.
- **R-DP11 — Envelope closure:** sealed corners, continuous top band, shell-to-outer-wall connection. The AABB-perimeter approach remains permitted if closure + connectivity pass; a stepped silhouette is **not** required.
- **R-DP12 — R-DP4 stands (kit-bash only).** The Gate-2 failure is connectivity/lighting/placement, not sculpture — the Blender envelope-band contingency is **not triggered**. It re-arms only if v2 evidence still reads as a floating box-ring after the closure bars pass.
- **R-DP13 — Trim retune authorized:** the v1 strengthen pass overshot; partition trim emissive may be retuned down within its VD §3 wayfinding-trim role (trim is accent, not area light). Numbers are spec-level.
- **R-DP15 — Ceilings in scope (Director 2026-07-31).** Roadmap #12 adjacency fade ships in this PR with deck-polish v2 — G9–G12 / M8. Standalone `p1-ceiling-adjacency-readability` is satisfied when #10 Gate 2 passes; no second feature cycle unless scope splits later.
- **R-DP3 re-affirmed:** no deck graph, collision, or room-data edits. Director has not overridden; all v2 work is render-only.

## Acceptance criteria v2 (for Grok spec v2 — binary checks)

**Automated:** v1 suite + collision/graph freeze unchanged (G7); new: S1 pixel-audit test (silhouette-masked screenshots, void-family threshold), S6 dressing-bounds test (every prop origin inside a room footprint or on a spine wall face).

**Screenshot evidence (60° gameplay camera; baseline "before" = `gate2-screen0..3`):**

| Shot | Proves |
|------|--------|
| S1 v2 — Full-deck overview sweep (four quadrants + center) **at AL0 and AL1**, with pixel audit | G1 v2: zero void-family pixels inside silhouette; interstitial reads as dim structure |
| S2 v2 — Before/after pairs: each `gate2-screenN` framing vs revised build, same camera path | G1, G2, G8: the Director's exact failing views, side by side |
| S3 v2 — Interstitial close-ups at the tightest clusters **+ grazing-angle wall-base shots** | G1, G8: skirt seals at wall bases, doorway corners, footprint seams — no black slivers |
| S4 — Per-section room interiors (unchanged) | G3 |
| S5 — HUD-off navigation walkthrough (unchanged) | G4 |
| S6 v2 — Dressing close-ups + densest combat scene + automated bounds audit | G5 v2: zero props in interstitial/envelope/free space; VD §7 readability holds |
| S7 — Palette sweep (unchanged; verify R-DP13 trim retune stays in trim role) | G6, R-DP1 |
| S8 v2 — Envelope exterior sweep at all four follow-camera framings + FPS overlay | G2 v2: silhouette continuous, corners sealed, top band unbroken, no void ring; M6 tags intact; G7 performance |
| S9 (new) — Material-continuity pairs at the `gate2-screen2` sites (streak-vs-grid junctions) | G8, M7: shared orientation/scale or authored trim transition |
| S10 (new) — Adjacency fade: doorway framing with crew in adjacent room (`gate2-screen2`/`3` sites) | G9–G12, M8: faded ceiling, silhouette + wind-up/tracer readable |
| S11 (new) — Active vs adjacent opacity sweep while moving room-to-room | G9–G11: no pop; alpha in 0.25–0.4 band |

## Doc/visual bumps (v2)

- **visual_direction v1.10** — landed doc-first with this pack: §5 material-continuity rule; §7 rule 9 one-vessel read.
- **Design doc:** no change (presentation-only; no rules touched).
- **Roadmap:** no change.

## Next pipeline step

Pack v2 → **Grok spec v2** (hotfix/revision spec against PR #14, S1–S9 acceptance above) → **Composer revision on `feat/p1-deck-polish`** (same PR) → Stage 4 review → Gate 1 re-review → Gate 2.
