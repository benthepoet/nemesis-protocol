# Design Pack — p1-visual-pass

`DESIGN PACK v1 | feature p1-visual-pass | design doc v1.17 | goals: G1..G15 | mechanics: M1..M9`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.17 · visual direction v1.6 · roadmap v1.8 · assets/AGENTS.md (current). Kickoff: Director 2026-07-30, `master` @ `75675b4`.*

**Feature identity (roadmap v1.8, P1 #9 — terminal P1 feature):** phase visual milestone **M-P1** (visual_direction §11). A normal pipeline instance that depends on P1 #5–#8 and ships **no new mechanics — presentation only** (ruling R1: no G#/M# functional changes, no tuning, no sim edits). Gate 2 acceptance on this feature closes the **P1 phase checkpoint**.

## Goal set (the contract)

Every goal is binary-verifiable in the running build. Mapping: **U#** = visual_direction §11 universal bar item, **MP** = §11 M-P1 row.

| ID | Goal (binary-verifiable) | Maps to | Verified |
|----|--------------------------|---------|----------|
| G1 | Zero untextured primitives/placeholder geometry visible in normal play: player capsule + facing wedge, rifle box blockout, and security-crew stand-in capsule are all replaced by textured hero models | U1, MP | ☐ |
| G2 | Player hero model: textured PBR glTF/GLB; allied `#69f0ae` identity preserved (VD §3); facing readable at the 60° camera with no debug wedge | MP | ☐ |
| G3 | Security-crew hero model: textured PBR glTF/GLB per the inherited reference-board synthesis (p1-enemy-baseline board); hostile silhouette reads before its effects at gameplay distance (VD §7 rule 2); `#ff5252` kept to small accents | MP | ☐ |
| G4 | Rifle hero model: textured PBR glTF/GLB carried by the player model; muzzle anchor preserved so tracers/aim-line/muzzle-flash origins are visually unchanged | MP | ☐ |
| G5 | Deck surfaces (floors, walls, ceilings) carry hull-steel PBR materials — albedo/metal/rough/normal, no albedo-only cheats (VD §5) — with **authored** wear: grime at hand height, thresholds, door frames; colder tones hull-adjacent | MP, U1 | ☐ |
| G6 | Section accent trim + signage live: the deck is navigable by tint per VD §3 (section + function accents); corridor spine stays neutral `#8b949e` | U4, MP | ☐ |
| G7 | Lighting row **Cruise (AL0)** live per VD §4.1: warm-neutral key per room + practical fixtures (~80% live, gentle idle flicker allowed); contact-hardening shadows; ≥2 shadow-casting lights per gameplay space (VD §8); every actor grounded by shadow/AO | U2, MP | ☐ |
| G8 | Lighting row **Alerted (AL1)** live per VD §4.1: on AL0→AL1 trip, rotating amber beacons activate in corridors while unaffected rooms stay unchanged — the alert spreads visibly, readable without the HUD indicator | U2, MP | ☐ |
| G9 | Corridor volumetric haze baseline live (VD §4.2), density scaling with alarm level; haze respects VD §7 rule 1 (below knee / above head — gameplay mid-plane stays legible) | U2, MP | ☐ |
| G10 | **Muzzle/impacts** VFX family complete per VD §6: muzzle flash is a real light for player **and** enemy fire; impact FX are per-surface (sparks on metal walls, distinct deck-floor response); tracers, aim-direction line, and enemy wind-up pre-glow (already shipped, VD v1.4/v1.5) remain conformant | U3, MP | ☐ |
| G11 | HUD skinned to palette per VD §3 v1.6 UI note: void `#05080f` chrome, allied/hazard/interactive meanings verbatim, no default-UA styling left | MP | ☐ |
| G12 | Palette language intact end-to-end: interactive-vs-hostile meanings never crossed — red never decorates, green never threatens (VD §3 rule), in-world and on UI | U4 | ☐ |
| G13 | VD §7 readability rules 1–7 verified at the 60° camera in the densest combat scene P1 can produce (8 living crew + sustained two-way fire): telegraph hierarchy holds — enemy telegraphs > objectives > player state > environment mood | U5 | ☐ |
| G14 | Performance held: 60 fps @ 1080p on a mid-tier GPU with the full P1 lighting + VFX load active (VD §8) | U6 | ☐ |
| G15 | **No functional change:** every accepted G#/M# from P1 #1–#8 behaves identically (existing automated suite green, zero binding drift); license scan clean — no third-party material in shipped paths (charter §3 Stage 5) | U7 | ☐ |

## Mechanics callout (presentation surfaces only)

**Anti-assumption rule: a surface not on this list does not exist for this feature.** This feature touches presentation surfaces only; no game mechanic is created, altered, or retuned.

| ID | Presentation surface | Ref |
|----|----------------------|-----|
| M1 | Player hero model & materials (replaces `createPlayerMesh` capsule + wedge) | VD §5, §8 |
| M2 | Security-crew hero model & materials (replaces `createStandInMesh` capsule) | VD §5, §7 rule 2 |
| M3 | Rifle hero model (replaces `createRifleBlockout` box; muzzle anchor preserved) | VD §5, §8 |
| M4 | Deck surface materials: hull-steel PBR sets, authored wear, accent trim + signage (`createDeckScene` surfaces; geometry/graph untouched) | VD §3, §5 |
| M5 | Lighting rows AL0/AL1: per-room key + practicals, contact-hardening shadows, AL0→AL1 amber-beacon transition | VD §4.1, §4.2, §8 |
| M6 | Corridor volumetric haze baseline | VD §4.2, §7 rule 1 |
| M7 | Muzzle/impacts VFX family: real-light muzzle flash (both sides), per-surface impacts, hit-flash retarget to hero materials | VD §6 |
| M8 | HUD/shell UI skin (DOM chrome treatment; DOM structure and readout set untouched) | VD §3 (v1.6 UI note) |
| M9 | Combat telegraph conformance pass: tracers (allegiance halos), aim-direction line, wind-up pre-glow — already shipped; verify only, restyle permitted within VD §7 rule 7 | VD §6, §7 rule 7 |

**Does not exist for this feature (explicitly unlisted):** android models/racks/eye-glow (P4, M-P4); wall `intact/cracked/failed` states, sparks-&-debris, wall-failure, hull-breach, venting, curtain-seal VFX (P3, M-P3); AL2/AL3/Meltdown/Vacuum/Reactor lighting rows; reactor VFX; meltdown fires; PA/alarm telegraph treatment (P2, M-P2); locomotion/ragdoll animation systems (R8 below); any sim, AI, tuning, input, or HUD-data change.

## Rule spec

**§11 universal bar (all seven items apply — goals G1–G15 map 1:1 above):** no blockout in frame · lighting-matrix rows for states reachable in the phase · telegraphs complete for shipped mechanics · palette language intact · readability verified at 60° in densest combat · performance held · no functional change + license scan.

**§11 M-P1 row (verbatim scope):** player, rifle, and security-crew hero models (textured glTF/GLB, PBR per §5) replace all capsules/blockout weapons · deck surfaces carry hull-steel materials with authored wear + section accent trim/signage · lighting rows Cruise (AL0) and Alerted (AL1) live: per-room key + practicals, contact-hardening shadows, corridor volumetric haze baseline · muzzle/impacts family complete — muzzle flash is a real light, per-surface impacts · HUD skinned to palette.

**§4.1 rows in scope (only these two):**
- **Cruise (AL0):** warm-neutral key, 80% fixtures live, gentle idle flicker on older circuits — mission start, pre-alarm.
- **Alerted (AL1):** rotating amber beacons in corridors; unaffected rooms unchanged — the alert spreads visibly. Trigger = the shipped AL0→AL1 stub (design doc §4 v1.14 note). AL1 never de-escalates at P1, so no reverse transition exists.

**§6 muzzle/impacts row (complete form, incl. v1.4/v1.5):** per-surface impact FX (sparks on metal, dust on composite); muzzle flash lights the room for allied **and** enemy fire; visible tracers — emissive slug, hot-white core, halo allied `#69f0ae` / hostile `#ff5252`, render-synced to sim projectiles; aim-direction line (muzzle → first wall obstruction, dim at rest, bright while firing); enemy attack wind-up pre-glow `#ff5252`, full wind-up duration, render-only.

**§7 camera non-negotiables:** all seven rules apply at Gate 1 (G13 checklist); ceilings stay full-geometry with cutaway (rule 6 — already shipped, unchanged).

**§8 technical standards:** three.js WebGL2 baseline (ACES already live in `createRenderer`); glTF/GLB with standard PBR maps, PNG/WebP (KTX2 optional, hero sets); textures 2K hero / 1K structure, wear via masks; LOD0–LOD3 per hero model, silhouette-safe switches; 60 fps @1080p mid-tier.

## Design rulings (asset strategy & presentation)

- **R1 — Hero models via Blender MCP.** Player boarder, security crew, and rifle are hero/complex assets (charter §1): authored in Blender via Blender MCP, exported glTF/GLB with standard PBR maps (2K hero textures), original work licensed CC BY 4.0. Reference-first per boards below.
- **R2 — Deck geometry untouched; uplift is material-level.** The room-graph-driven geometry, wall thicknesses, heights, collision, and ceiling cutaway are accepted work — they do not change. The pass replaces flat materials with PBR texture sets on a **trim-sheet strategy** (VD §5) and may add non-colliding dressing geometry (trim, signage planes, fixture props) that intersects nothing in the collision world.
- **R3 — Procedural texture generation is permitted** for deck/structure surfaces **if** output conforms to VD §5 (authored wear placement — hand height, thresholds, door frames — not procedural-random) and the generator script is committed under `tools/` so assets are reproducible, original, and license-clean. Hero character/rifle textures are authored, not generated.
- **R4 — Practicals & signage take the light path.** Light fixtures, wall trim, and signage are simple props/kit-bash (charter overkill rule — no Blender hero pass for what a kit-bash solves). Fixtures must read as light *sources* for the §4.2 practical model.
- **R5 — Facing wedge retires.** Facing readability is carried by the hero model's authored stance/orientation plus the shipped aim-direction line (VD §7 rule 7). The debug wedge is presentation scaffolding, not an accepted mechanic — its removal is not a functional change.
- **R6 — Muzzle-anchor parity.** The rifle's muzzle anchor must land at the same gameplay offset the telegraph system already uses (render-side constant); tracers, aim line, and muzzle flash keep pixel-equivalent origins. Any visible mismatch is a `[blocker]`.
- **R7 — Hit-flash preserved, retargeted.** The accepted white hit-flash telegraph (VD §6 muzzle/impacts) transfers to hero materials unchanged in duration and read.
- **R8 — No animation system at P1.** M-P1 requires hero models to replace capsules — it does not require skeletal/locomotion animation. Hero models ship as rigid, single-pose meshes authored in a top-down-readable combat stance. Locomotion animation is deferred (post-P1 polish backlog, S3 class). This keeps the pass scoped per §11 ("scoped, not open-ended").
- **R9 — Android racks stay absent.** Racks are P4-owned (M-P4); per §11 universal-bar exception, later-phase assets may stay placeholder — at P1 they are simply not present in frame. No rack stand-ins are added.
- **R10 — Per-surface impacts at P1 = metal wall vs deck floor.** P1 has no composite/damage-state surfaces (those arrive with P3 wall classes); "per-surface" at M-P1 means a distinct, material-appropriate response for vertical metal (spark burst) vs deck plate (spark + brief dust/scorch read). Dust-on-composite is deferred with the P3 families.
- **R11 — Haze implementation is render-side and camera-safe.** Volumetric haze must never obscure the gameplay mid-plane (VD §7 rule 1) and is exempt from the "no ambient confetti" anti-goal only as corridor atmosphere per §4.2 — it carries alarm-state information (density scales with alarm level).
- **R12 — HUD skin is chrome-only.** DOM structure, readout set, visibility lifecycle, and data bindings (design doc §12.1 v1.16) are accepted work and do not change. The pass styles the chrome: typography, panel treatment, palette-exact colors.

## Ships vs deferred (explicit scope boundary)

| In scope (ships with this feature) | Deferred (owner / vehicle) |
|---|---|
| Player, security-crew, rifle hero GLBs (M1–M3) | Locomotion/ragdoll animation — post-P1 S3 polish (R8) |
| Deck PBR materials, authored wear, trim + signage (M4) | Wall damage states `intact/cracked/failed` — P3 / M-P3 |
| AL0 + AL1 lighting rows, practicals, contact shadows (M5) | AL2/AL3/Meltdown/Vacuum/Reactor rows — P2 / M-P2, P3 / M-P3 |
| Corridor volumetric haze baseline (M6) | Haze density scaling beyond AL0/AL1 — follows later rows |
| Muzzle/impacts family completion (M7, R10) | Sparks-&-debris, wall-failure, hull-breach, venting, curtain-seal, reactor, android, meltdown-fires families — P2–P4 milestones |
| HUD chrome skin (M8) | New HUD elements — none; set is locked (design doc §12.1) |
| Telegraph conformance verify (M9) | Android eye-slit glow telegraph — P4 / M-P4 |
| License-clean original assets only (CC BY 4.0) | KTX2 hero texture compression — optional, §8, only if frame budget demands |

## Prereq assets

All original, CC BY 4.0, phase-prefixed (charter §5). Models: glTF/GLB + standard PBR maps per VD §8. Reference boards: `features/p1-visual-pass/references/references.md` (boards A–C) + inherited security-crew board (`features/p1-enemy-baseline/references/references.md`).

| Asset | Path (assets/) | Reference board | Status |
|-------|----------------|-----------------|--------|
| Player boarder hero model (2K PBR) | `models/p1_player_boarder.glb` (+ `textures/p1_player_boarder_{albedo,metal,rough,normal}.png` if external) | Board A — player boarder | pending |
| Security crew hero model (2K PBR) | `models/p1_security_crew.glb` (+ `textures/p1_security_crew_*.png` if external) | Inherited — p1-enemy-baseline board (design synthesis binding) | pending |
| Rifle hero model (2K PBR) | `models/p1_rifle.glb` (+ `textures/p1_rifle_*.png` if external) | Board B — rifle | pending |
| Hull-steel trim sheet (1K, structure) | `textures/p1_hull_steel_trim_{albedo,metal,rough,normal}.png` | Board C — deck materials & lighting | pending |
| Deck plate floor set (1K) | `textures/p1_deck_plate_{albedo,metal,rough,normal}.png` | Board C | pending |
| Wall panel set (1K) | `textures/p1_wall_panel_{albedo,metal,rough,normal}.png` | Board C | pending |
| Ceiling panel set (1K) | `textures/p1_ceiling_panel_{albedo,metal,rough,normal}.png` | Board C | pending |
| Authored wear masks (hand height / thresholds / door frames) | `textures/p1_wear_masks.png` | Board C (per VD §5 authored-wear rule) | pending |
| Section signage atlas (VD §3 palette, deck-plan mockup v2.2 typography) | `textures/p1_section_signage_atlas.png` | Board C + deck-plan mockup palette | pending |
| Corridor light fixture prop (kit-bash GLB) | `models/p1_corridor_light_fixture.glb` | Board C | pending |
| Amber beacon fixture prop (kit-bash GLB, AL1 practical) | `models/p1_amber_beacon.glb` | Board C | pending |

*Texture generator scripts (R3) commit under `tools/` alongside the assets they emit. Reference image files themselves are never committed (charter v1.11) — index only.*

## Acceptance criteria (Gate 1 evidence plan)

**Automated:** full existing suite green with zero binding drift (G15); render-only additions at Grok's discretion (his domain — e.g., material-map presence checks, muzzle-anchor parity).

**Screenshot evidence (60° gameplay camera unless noted):**

| Shot | Proves |
|------|--------|
| S1 — Full-deck overview + per-section room captures | G6 tint navigation; G1 no blockout in frame |
| S2 — AL0 corridor + room, lighting-only | G7 (key + practicals, contact shadows, grounding) |
| S3 — AL0→AL1 same-frame pair (pre/post trip) | G8 amber beacons, visible spread, unaffected rooms unchanged |
| S4 — Densest combat scene: 8 living crew, sustained two-way tracer fire, muzzle flashes both sides | G10, G13 telegraph hierarchy + haze mid-plane rule |
| S5 — Hero close-ups: player/crew/rifle in-game at gameplay distance + silhouette-only reads | G2, G3, G4, G13 (§7 rule 2) |
| S6 — Material close-ups: thresholds, door frames, hand-height wear, hull-adjacent cold tones | G5 authored wear; G12 palette |
| S7 — HUD capture: normal, low-HP pulse, AL1 indicator | G11, G12 |
| S8 — Before/after side-by-side (blockout `75675b4` vs feature build, same camera) | G1, overall milestone |
| S9 — FPS overlay in S4 scene | G14 |
| S10 — License/manifest check: shipped asset tree listing | G15 license scan |

## Doc/visual bumps

**None required.** Every ruling above is pack-level presentation direction that adds no rule, number, or mechanic to the design doc, and VD §11 M-P1 + §3–§8 already fully specify the bar (R5 wedge retirement and R8 no-animation are absences of presentation scaffolding, not rule changes). If the clarification loop (§3.2a) surfaces anything that *does* change a rule, it lands in the design doc with a version bump before the spec finalizes — standard path.
