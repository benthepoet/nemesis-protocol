# Design Pack — p1-ship-blender-viz

`DESIGN PACK v0 — EXPLORATION ONLY | feature p1-ship-blender-viz | design doc v1.19 | visual direction v1.10 | goals: — | mechanics: —`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.19 · visual direction v1.10 · roadmap v1.9 · assets/AGENTS.md (current) · `p1-deck-polish` design pack v3 · `integration` @ `e38ab8c`. Kickoff: Director personal directive, 2026-07-31 — **not a shipped feature**: no Grok spec, no Composer, no deck-graph/collision changes, no GLB into `assets/models`, no Gate 2.*

**Feature identity:** Kimi personal modeling task — **see what the ship looks like** in Blender. Professional-modeler bar: accuracy (design doc + VD + deck03 layout) and aesthetics (VD §1–§2, §5, §7). The in-engine deck from `p1-deck-polish` is the intent reference; this model should **beat** the kit-bash read: solid hull, believable interstitial structure, readable trim/signage.

## Scope & scale lock

- **Scale:** `src/config.ts` — `SCALE_PX=120 px = 25 m` → `M_PER_PX = 0.208333`. `ROOM_HEIGHT_M = 3.0`. `WALL_THICKNESS_M = 0.3`; Class B bulkheads 0.6 m (`BULKHEAD_THICKNESS_M`).
- **Data truth:** `src/deck/data/deck03.json` v1 (room footprints, wall segments + classes, door openings, racks, objectives) — identical data the engine loads; converted with the same `svgToWorld` mapping (`x→X`, `y→Z`, y-up floor plane → Blender Z-up).
- **Deck extent:** ~207 m (aft–fore) × ~51 m (port–starboard) plan; one deck, 3.0 m interiors.
- **Camera reference:** 60° pitch, 50° FOV, perspective (`FOLLOW_CAMERA_*` in `src/config.ts`).

## Room list traced to deck03 (18 nodes, all modeled)

| Section | Rooms (deck03 ids) |
|---------|--------------------|
| Aft | `port-engine`, `stbd-engine`, `engineering` |
| Midships | `main-spine`, `port-airlock`, `cargo-hold`, `armory`, `med-bay`, `life-support`, `barracks`, `stbd-airlock`, `hydroponics`, `mess` |
| Fore | `fore-connector`, `officer-qtrs`, `cic`, `comms-nav`, `bridge` (polygon nose) |

Wall classes per §6.1: **A** partitions (9 segs, breachable read — lighter paneling), **B** bulkhead/interior (gating firewall — heavier, sealed), **C** outer hull (18 segs — hull skin). Doors: 15 interior + 2 blast (`door-engineering-spine-blast`, `door-spine-connector-blast`) — blast doors presented as heavy bulkhead gates.

## What I modeled vs deferred

| Modeled | Deferred (why) |
|---------|----------------|
| All 18 rooms: floors, walls by class w/ real door openings, ceilings (hideable collection) | Starfield as a *game* feature (#11 `p1-hull-exterior-view` owns it in-engine) — render backdrop only here |
| Continuous hull envelope: smooth shell outline (sealed corners, unbroken top band, connects to outermost walls — VD §7 rule 9), beveled, plated | Transparent glazing *gameplay* swap — #11; here apertures are **real cut topology** with recessed glazing for honesty (directive) |
| Interstitial: solid maintenance-deck slab across full deck bounds (R-DP16 intent) — no void between rooms | Ceiling adjacency-fade *behavior* (engine owns it; here ceilings are a hideable collection for the top-down render) |
| Six Class C aperture sites (`APERTURE_SITES` in `src/config.ts`) as cut openings w/ frames | Wall `intact/cracked/failed` damage states — P3 |
| Function-first dressing: spine pipe/conduit runs + fixtures, reactor core, engine machinery, cargo crates, armory + android racks (2, §6.7), med beds, LS tanks, bunks, hydro racks, mess tables, CIC consoles + holotable, bridge console arc | Actor/hero models (player/crew/android figures) — M-P1 accepted in-engine; this is a ship viz |
| Trim/signage/gel accents per VD §3 (small area only; interiors neutral hull-steel/corridor families) | Alarm lighting states AL1+ (viz renders at Cruise AL0 per VD §4.1 row 1) |
| Exterior read: plating rhythm, maintenance band, aft engine housings, nose taper (bridge polygon), restrained greeble | Multi-deck / superstructure beyond Deck 03 (§12.3 expansion — out of prototype scope) |

## Camera notes for review (renders, 1920×1080, Eevee)

| Render | View | Proves |
|--------|------|--------|
| R1 | 60° top-down gameplay-like hero, full deck, ceilings hidden | One-vessel read (VD §7 rule 9), no void between rooms, neutral interiors + accent wayfinding |
| R2 | Spine corridor oblique (interior, eye-level, fore-looking) | Industrial spine: pipes, fixtures, signage, door rhythm (VD §2 pillar 1) |
| R3 | Airlock/aperture exterior read (port airlock hull face) | Hull solidity, aperture cut + frame, plating, maintenance band |
| R4 | Engineering identity shot | Reactor core, Engineering `#ef5350` trim/signage, machinery dressing, VD §7 rule 4 (one readable light story) |

## Aesthetic targets (VD cites)

- §1 north star: dying warship, lit like a thriller — machinery first, haunted house second.
- §2 pillar 1: pipes/conduits/vents/panels; wear over decoration. §2 pillar 4: spectacle never beats telegraph — dressing stays off the gameplay mid-plane.
- §3: interior-neutrality rule (v1.8) — accents on trim/signage/gels only; corridor spine neutral `#8b949e`.
- §5: PBR metallic/roughness; authored wear (grime at hand height/thresholds); material continuity across shared structure (v1.10).
- §7 rule 9: no `#05080f` void pixels inside the hull silhouette; envelope closes; dim-structure interstitial.

## Reference board

`references/references.md` — Board G (interior: industrial corridor, retro-mechanical surfaces, restraint lighting) + Board H (exterior: capital-ship hull plating/silhouette). Charter §1 reference-first satisfied before modeling; index-only commit (no image files).

## Explicit non-goals (Director directive)

No three.js import path, no `loadDeck03` mesh replacement, no collision, no gameplay features, no `src/` or `docs/design/` edits, no PR, no kick of roadmap #11/#13 (Director hold). No Gate 1/Gate 2 — Director reviews renders directly.
