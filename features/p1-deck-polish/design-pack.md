# Design Pack — p1-deck-polish

`DESIGN PACK v0 (KICKOFF STUB — goal sketches only) | feature p1-deck-polish | design doc v1.18 | goals: G1..G7 (sketch) | mechanics: M1..M5 (sketch)`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.18 · visual direction v1.9 · roadmap v1.9 · assets/AGENTS.md (current). Kickoff: Director ruling R2 (roadmap v1.9, 2026-07-30) — post-M-P1 polish mandate, P1 #10. Depends on: P1 #9 (`p1-visual-pass`, Gate-2 accepted @ `master` `d4809d6`).*

**v0 status:** goal/mechanic **sketches** for Stage 0/1 dialogue — not yet the binding contract. Pack v1 (full goal set, mechanics callout, rule spec, reference boards, acceptance criteria) follows Director Stage 0 kickoff. Reference boards (charter §1, reference-first) are **not yet gathered** — required before any asset production.

**Feature identity:** post-checkpoint P1 polish (roadmap v1.9 #10). Fixes the Director's three deck-presentation complaints in one gateable unit: *"the ship is ugly"*, *"massive gaps between the rooms — unacceptable"*, *"get rid of the coloring in the rooms"*. Presentation only — deck graph, wall segments, collision, spawn data, and room footprints are accepted work and **do not change**.

## Goal sketches (v0 — to be hardened in pack v1)

| ID | Goal sketch (binary-verifiable intent) |
|----|----------------------------------------|
| G1 | **No visible void between room footprints.** Within the hull envelope, every screen pixel between rooms reads as structure (interstitial hull plating, maintenance space, or room geometry) — verified by a full-deck screenshot sweep at the 60° camera; the flat `#05080f` background is never visible *inside* the hull silhouette |
| G2 | **Outer hull envelope.** The deck reads as a single vessel from any follow-camera position — a continuous hull shell silhouette (hull-steel PBR per VD §5) bounds the playable deck; rooms no longer read as floating boxes |
| G3 | **Neutral interiors (VD §3 v1.8 interior-neutrality rule).** No large-area floor/ceiling/wall accent tints remain; rooms render in hull-steel / corridor-neutral families; this **supersedes** `p1-visual-pass` G6's tint-navigation read by Director ruling R2 (the G6 acceptance stands as history) |
| G4 | **Navigation survives the retint.** With area tints removed, section/room identification is carried by signage atlas, accent-lit trim strips, and fixture gels — verified by a HUD-off walkthrough: every room's identity is determinable from in-world cues at gameplay distance |
| G5 | **Dressing uplift (VD §2 pillar 1).** Spine + room walls carry machinery dressing (pipes, conduits, panels, vents) — authored placement, non-colliding, zero gameplay-graph impact; no surface is decoration-without-function |
| G6 | **Palette language intact (VD §3 rule).** Interactive `#ffd54f` / hostile `#ff5252` / allied `#69f0ae` meanings unchanged and never crossed, in-world and on UI |
| G7 | **No functional change + performance.** Full existing suite green, zero sim/binding drift (all accepted P1 #1–#9 G#/M# except the explicitly superseded G6 tint read); 60 fps @1080p mid-tier held (VD §8) |

## Mechanics-callout sketches (presentation surfaces only)

| ID | Surface sketch | Ref |
|----|----------------|-----|
| M1 | Interstitial hull fill geometry (render/collision-neutral — fills void regions between room footprints inside the envelope) | VD §2, §5; deck data (read-only) |
| M2 | Outer hull envelope shell (silhouette geometry around the deck union) | VD §2, §5 |
| M3 | Neutral-room retint (floor/ceiling/wall material policy per VD §3 v1.8; supersedes G6 tint read) | VD §3 (v1.8) |
| M4 | Machinery dressing props (kit-bash path per charter overkill rule; non-colliding) | VD §2 pillar 1 |
| M5 | Signage/trim/gel accent consolidation (navigation carrier post-retint) | VD §3 (v1.8), §4 |

**Explicitly unlisted (does not exist for this feature):** starfield rendering and aperture glazing (#11 `p1-hull-exterior-view` — #10 **must** reserve exterior-facing Class C aperture topology per VD §3 v1.9); ceiling transparency changes (#12); any sim, AI, tuning, input, or HUD-data change.

## Director rulings (locked for pack v1)

- **R-DP1 (OQ3):** Shell UI (breach select, score screen, HUD) **keeps** section/function accent colors; M3 neutral retint is **in-world surfaces only** (VD §3 v1.9).
- **R-DP2 (OQ2, coordination):** Hull envelope geometry **includes cut mesh / face tags** for Class C aperture sites so #11 can add transparent viewports without reshaping collision.
