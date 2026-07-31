# Design Pack — p1-hull-exterior-view

`DESIGN PACK v0 (KICKOFF STUB — goal sketches only) | feature p1-hull-exterior-view | design doc v1.18 | goals: G1..G5 (sketch) | mechanics: M1..M3 (sketch)`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.18 · visual direction v1.9 · roadmap v1.9. Kickoff: Director ruling R2 + OQ resolution 2026-07-30 — P1 #11. Depends on: P1 #10 (`p1-deck-polish` — hull envelope + aperture topology).*

**Director rulings (locked):**
- **OQ1:** **Dim starfield** (not plain void-only backdrop) within `#05080f` family — VD §3 v1.9.
- **OQ2:** **Real transparent hull apertures** — viewport glazing on Class C exterior faces at authored sites; starfield visible through openings.
- **OQ3:** N/A for this feature (shell UI colors unchanged — see `p1-deck-polish` R-DP1).

**v0 status:** goal sketches for Stage 0/1 — pack v1 follows Director **Kick off** on #11 after #10 lands or in parallel pre-phase once aperture sites are tagged in #10 spec.

## Goal sketches (v0)

| ID | Goal sketch |
|----|-------------|
| G1 | Dim starfield environment visible beyond the hull silhouette at the 60° camera — no flat `scene.background` only read |
| G2 | Hull exterior reads as a continuous vessel shell (uses #10 envelope); interior never shows bare void between rooms |
| G3 | At least one **real aperture** per major exterior exposure (airlock faces minimum): transparent glazing, starfield parallax/static read, no gameplay collision change |
| G4 | Aperture sites match deck-data / #10 envelope tags; Class C breach rules unchanged (presentation-only cutouts) |
| G5 | No functional change; 60 fps @1080p mid-tier (VD §8) |

## Mechanics-callout sketches

| ID | Surface | Ref |
|----|---------|-----|
| M1 | Starfield backdrop (render environment / skydome, void palette) | VD §3 v1.9 |
| M2 | Hull exterior material + silhouette complement to #10 shell | VD §5 |
| M3 | Viewport glazing meshes + render ordering at aperture sites | VD §3 v1.9 |
