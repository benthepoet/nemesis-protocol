# Design Pack — p1-ceiling-adjacency-readability

`DESIGN PACK v0 (KICKOFF STUB — goal sketches only) | feature p1-ceiling-adjacency-readability | design doc v1.18 | goals: G1..G5 (sketch) | mechanics: M1..M2 (sketch)`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.18 · visual direction v1.8 · roadmap v1.9. Kickoff: Director ruling R2 (roadmap v1.9, 2026-07-30) — post-M-P1 polish mandate, P1 #12. Depends on: P1 #3 (`p1-player-controller` — camera rig + ceiling cutaway surface).*

**v0 status:** goal/mechanic **sketches** for Stage 0/1 dialogue — not yet the binding contract. No new assets expected (material/fade policy change on existing ceiling geometry) — reference-board requirement waived unless pack v1 adds props.

**Feature identity:** post-checkpoint P1 polish (roadmap v1.9 #12). Implements the Director's *"ceilings of rooms that are nearby should be semi-transparent not completely opaque — easy to get ambushed"* as the VD §7 rule 6 (v1.8) **adjacency fade**. Presentation only — room geometry, lighting model, and sim are untouched; full ceiling geometry remains (VD §7 rule 6 full-interiors rule holds for the perspective pivot).

## Goal sketches (v0 — to be hardened in pack v1)

| ID | Goal sketch (binary-verifiable intent) |
|----|----------------------------------------|
| G1 | **Active-room cutaway preserved.** The player's current room ceiling is fully hidden (shipped behavior, regression-checked) |
| G2 | **Adjacent fade live.** Ceilings of rooms sharing a wall or door edge with the active room render semi-transparent (alpha 0.25–0.4 per VD §7 rule 6 v1.8) — never fully opaque, never fully hidden |
| G3 | **Frustum clause.** Rooms substantially inside the camera frustum but not adjacent fade to the same semi-transparent band; rooms outside the frustum may stay opaque |
| G4 | **Ambush telegraph verified.** Under every faded ceiling, hostile silhouettes and VD §6 telegraphs remain readable per VD §7 rules 2 and 4 — densest-combat scene check at the 60° camera (the Director's ambush complaint is the acceptance test) |
| G5 | **No functional change + performance.** Full existing suite green, zero sim drift; fade transitions are smooth (no pop) and cost within frame budget (VD §8) |

## Mechanics-callout sketches (presentation surfaces only)

| ID | Surface sketch | Ref |
|----|----------------|-----|
| M1 | Ceiling fade policy (per-room ceiling material opacity driven by active-room adjacency + frustum; extends the shipped cutaway surface) | VD §7 rule 6 (v1.8) |
| M2 | Telegraph readability conformance under faded ceilings (verify-only: silhouette priority, darkness budget) | VD §7 rules 2, 4 |

**Explicitly unlisted (does not exist for this feature):** geometry changes to ceilings or rooms; lighting-matrix changes; any wall/door/collision change; sim, AI, or camera-rig tuning beyond the fade surface; minimap or off-screen indicators (design doc §12.1 explicit-absent list stands).
