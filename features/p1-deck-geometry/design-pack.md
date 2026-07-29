# Design Pack — p1-deck-geometry

`DESIGN PACK v1 | feature p1-deck-geometry | design doc v1.10 | phase P1`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.13 · design doc v1.10 · feature roadmap v1.3 · visual direction v1.1 · deck plan mockup v2.2 (`assets/mockups/cruiser_boarding_deck_plan.svg`, generator `tools/mockups/gen_ship_svg.py`) · scaffold: p1-project-scaffold accepted (spec v1, PR #1)

**Feature (roadmap P1 #2):** Deck 03 as playable level — room graph from the reference layout, wall-class data (A/B/C), collision, spawn-safe entry rooms. Depends on `p1-project-scaffold` ✅ (deterministic sim, command input, renderer baseline all exist). P1 carries **no gating, no destructibility** — wall classes ship as *data*, not behavior.

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | Deck 03 exists as a machine-readable definition derived from the canonical mockup (v2.2): 18 nodes (16 rooms + main spine + fore connector), all doors as edges, all wall segments typed A/B/C, sections, breach points, android racks, objective markers — at correct metric scale (mockup 120 px = 25 m) | ☑ |
| G2 | The room graph conforms to the §7 topology model and **validates**: graph connected; every room reachable from both breach points; exactly 2 breach points (§7 r5); every edge carries a wall class (§7 r7); Engineering/aft is Class-B-bounded (§7 r7); critical-path rooms border ≥1 Class A wall and hull rooms are flagged (§7 r8) | ☑ |
| G3 | The deck renders as blockout 3D from the deck definition: floors, full-height walls, **ceilings on every room** (cutaway-ready — visual direction §7 rule 6), per-section accent tinting per visual direction §3 (players navigate by tint) | ☑ |
| G4 | Collision derives from the same deck definition: actor proxies cannot pass walls, bulkheads, or hull; all doorways (including both blast-door passages — see ruling R1) are traversable | ☑ |
| G5 | Both airlocks are flagged spawn-safe entry rooms with validated spawn points (inside room, non-colliding, clearance-checked), mapped to their breach profiles per §3 Phase 0 | ☑ |
| G6 | The data model is topology-agnostic (§12.2): collision and rendering consume the room *graph* via APIs — no layout coordinates hard-coded outside the deck definition | ☑ |
| G7 | Determinism preserved from the scaffold: identical deck definition → identical graph (hash-verifiable); deck entities use stable IDs | ☑ |
| G8 | A dev-only debug inspection camera (free-fly) exists for gate review — explicitly **not** the gameplay camera rig (that is `p1-player-controller`) | ☑ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | Topology model: rooms = nodes, doors = edges, walls = typed edges (A/B/C), spine = critical-path axis, sections = lockdown units, hull rooms = risk zones | §7 |
| M2 | Wall classes as **data semantics only**: A partition (breachable), B structural (sealed/immune), C outer hull (vulnerable) — no damage, HP, or destruction behavior in P1 | §6.1 |
| M3 | Topology-agnostic mission-logic data model: graph-first, layout grammar emits graphs a validator checks | §12.2, §7 validation pass |
| M4 | Dual breach points with asymmetric profiles: Port → Cargo/Armory profile (loot-rich, heavier resistance); Starboard → Life Support/Barracks profile (softer, fewer resources) — flagging/data only | §3 Phase 0, §7 r5 |
| M5 | Android rack placements: Armory + Engineering, 3-unit capacity each — markers/data only, no units, no deployment | §6.7 |
| M6 | Full-interior authoring incl. ceilings (camera cutaway-ready) + section accent palette | visual_direction §7 r6, §3 |

**Design ruling R1 (new, this pack):** At P1, **all doorways are open passages** — including both blast doors. Lockdown/sealing behavior arrives with `p2-lockdown`; the P1 exit criteria require the Director to traverse breach → Engineering end to end, so nothing may be sealed. Blast doors exist as geometry + Class-B-bounded *door edges* in the graph (typed so P2 can seal them without re-authoring).

**Explicit non-goals (do not build):**
- Player movement, aim, or the ~60° camera rig — `p1-player-controller` (P1 #3). The debug fly camera (G8) is scaffolding for review only.
- Combat, enemies, AI, spawners, alarm — P1 #4/#5 and P2.
- Door open/close mechanics, lockdown, gating, keys — P2.
- Wall damage/HP/destruction, breaching, depressurization — P3. Class A walls are **solid** at P1.
- Procedural generation — Deck 03 is hand-authored; only the graph *validator* ships (it later checks generated maps, §7).
- Androids, racks behavior — P4 (markers only per M5).
- Mission objectives/PA/HUD — P1 #6/#7 and P2.

## Rule spec

1. **§7 topology model + validation pass.** rooms/doors/walls/spine/sections/hull-rooms as above (M1). The validator (§7 "Validation pass") applies to this deck for: (a) valid traversal exists between any two nodes; (b) rules 5, 7, 8 compliance; (c) connectivity from both breach points. Rules 1–4 and 6 (keys, gate depth, extraction variance) are **not applicable at P1** — no keys/gates exist yet; they bind when P2 features land.
2. **§6.1 wall classes.** Every wall segment belongs to exactly one class (M2). From the canonical mockup: **9 Class A partitions** (port row: airlock|cargo, cargo|armory, armory|med bay; stbd row: life support|barracks, barracks|stbd airlock, stbd airlock|hydroponics, hydroponics|mess; fore: officer qtrs|CIC, CIC|comms/nav) · **3 Class B bulkhead bands** (aft rear, midships|aft, midships|fore) · **Class C** = the outer hull perimeter (hull-adjacent rooms flagged: both engine rooms, all port-row and stbd-row midship rooms, bridge nose).
3. **§3 Phase 0 breach profiles (M4):** Port breach → Port Airlock, loot-rich route, heavier patrol density (later phases); Starboard breach → Stbd Airlock, softer resistance, fewer resources. Selection UI is P1 #6 (mission shell) — this feature ships the data only.
4. **§6.7 racks (M5):** exactly two racks — Armory, Engineering — 3-unit capacity each. Data markers only.
5. **§12.2 architectural rule (M3, G6):** mission-logic layer is topology-agnostic; the deck definition is the single source for graph, render geometry, and collision. Same mandate class as the scaffold's netcode-ready rule — a deck feature that scatters layout constants through code fails Gate 1.
6. **Visual direction §3 + §7 r6 (M6):** per-section accent tints (Engineering `#ef5350`, Command `#7986cb`, Ops `#ffb74d`, Life support `#4dd0e1`, Crew `#ce93d8`, Hydro `#81c784`); void `#05080f`; hull-steel `#1a232e`–`#2a3644` surfaces; full interiors incl. ceilings — never omit geometry for the camera. Blockout materials: PBR-capable (metallic/roughness), no authored textures required at P1.
7. **Scale:** mockup scale bar 120 px = 25 m → 1 px = 0.2083 m. Deck interior ≈ 213 m long, spine ≈ 96 m — consistent with §7 r4 tension beats (25–35 m intervals) in later phases. Sim units = meters.

## Canonical deck inventory (authoritative extraction from mockup v2.2 — SVG coordinates, px)

| # | Node | Section | Footprint (x, y, w, h) | Notes |
|---|------|---------|------------------------|-------|
| 1 | Port Engine | Aft | 140, 288, 200×52 | hull-adjacent (C) |
| 2 | Stbd Engine | Aft | 140, 460, 200×52 | hull-adjacent (C) |
| 3 | Engineering (reactor) | Aft | 140, 348, 200×104 | primary objective marker; android rack; Class-B bounded |
| 4 | Main Spine | Midships | 340, 385, 460×30 | pacing axis |
| 5 | Port Airlock | Midships | 372, 288, 58×94 | **port breach point**; spawn-safe; hull-adjacent |
| 6 | Cargo Hold | Midships | 438, 288, 118×94 | hull-adjacent |
| 7 | Armory | Midships | 564, 288, 118×94 | android rack; hull-adjacent |
| 8 | Med Bay | Midships | 690, 288, 98×94 | hull-adjacent |
| 9 | Life Support | Midships | 372, 418, 98×94 | hull-adjacent |
| 10 | Barracks | Midships | 478, 418, 98×94 | hull-adjacent |
| 11 | Stbd Airlock | Midships | 584, 418, 58×94 | **stbd breach point**; spawn-safe; hull-adjacent |
| 12 | Hydroponics | Midships | 650, 418, 72×94 | hull-adjacent |
| 13 | Mess | Midships | 730, 418, 62×94 | hull-adjacent |
| 14 | Fore Connector | Fore | 800, 388, 22×24 | spine → CIC corridor |
| 15 | Officer Qtrs | Fore | 822, 292, 103×35 | |
| 16 | CIC | Fore | 822, 335, 103×130 | |
| 17 | Comms/Nav | Fore | 822, 473, 103×35 | |
| 18 | Bridge | Fore | wedge polygon (933,352 → 1112,400 → 933,448) | secondary objective marker; hull-adjacent nose |

**Door edges (17):** spine↔port airlock, spine↔cargo, spine↔armory, spine↔med bay; spine↔life support, spine↔barracks, spine↔stbd airlock, spine↔hydroponics, spine↔mess; Engineering↔port engine, Engineering↔stbd engine; CIC↔officer qtrs, CIC↔comms/nav, CIC↔bridge; connector↔CIC; **blast** Engineering↔spine (aft); **blast** spine↔connector (fore). Per R1 all are open passages at P1.

**Class A partitions (9)** and **Class B bulkheads (3)** as enumerated in rule spec item 2. Remaining inter-room faces are ordinary solid walls (non-typed structural interior — see clarification note below).

*Clarification note for Grok: faces not marked A/B/C on the mockup (e.g., room-to-spine faces between doorways) are **solid interior walls** — indestructible at all phases but not "bulkhead law." §6.1 says every wall segment belongs to exactly one class; treat these as **Class B for behavior** (sealed/immune) while keeping the mockup's visual distinction. If this needs a doc line, raise it in the clarification loop.*

## Prereq assets

| Asset | Path (assets/) | Reference board | Status |
|-------|----------------|-----------------|--------|
| Deck definition source data | derived from `tools/mockups/gen_ship_svg.py` + `assets/mockups/cruiser_boarding_deck_plan.svg` (canonical, v2.2) | n/a — 2D-derived from our own canonical mockup | ✅ delivered (inventory above) |
| Blockout material/palette set | defined in-code per visual direction §3 | n/a — palette is the standard | ✅ defined (rule spec 6) |

*No reference boards required for this feature (charter §1 reference-first rule): both assets are 2D-derived from our own canonical mockup or defined by the existing palette standard — no web reference is gathered to reproduce our own layout. No Blender work: blockout geometry takes the lighter path (assets/AGENTS.md). Runtime file format for the deck definition is Grok's call in the spec.*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | Deck definition file loads in the sim; node/edge counts match this pack (18 nodes, 17 door edges, 9 A partitions, 3 B bulkheads); metric spot-check: spine length 95.8 m ±0.5 |
| G2 | Validator runs as an automated test: connected graph; all rooms reachable from both breach points; 2 breach points; 100% of wall edges typed; Engineering Class-B bounded; hull rooms flagged |
| G3 | Screenshot evidence: deck rendered from the definition; per-section tints visible; ceilings present (debug camera can verify from below/side angles) |
| G4 | Automated tests: actor proxy swept along walls/hull never penetrates; proxy passes through every door edge incl. both blast passages |
| G5 | Spawn-point validation test passes for both airlocks; data shows breach-profile flags (M4) |
| G6 | Gate 1 code check (with Grok's Stage 4 evidence): collision + render query the graph API; no layout constants outside the deck definition |
| G7 | Test: two loads of the same definition produce identical graph hash; entity IDs stable across loads |
| G8 | Debug fly camera navigates the full deck in dev mode; clearly gated behind a dev flag — absent from any player-facing path |
