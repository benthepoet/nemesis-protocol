# Design Pack — p1-visual-pass

`DESIGN PACK v2 | feature p1-visual-pass | design doc v1.17 | goals: G1..G17 | mechanics: M1..M11`
*Owner: Kimi K3. Working versions: charter v1.13 · design doc v1.17 · visual direction v1.7 · roadmap v1.8 · assets/AGENTS.md (current). Kickoff: Director 2026-07-30, `master` @ `75675b4`.*
*v2 (2026-07-30, §3.5a Director iteration on `integration` @ `931f7b3`):* Director Gate 2 feedback — **"I need those models rigged and animated"** — overrides **R8** (superseded by **R13**). Added G16–G17, M10–M11, R13–R15; visual_direction bumped to **v1.7** (§7 rule 8 + §11 M-P1 row). Design doc and roadmap unchanged (see *Doc/visual bumps*). G1–G15 unchanged in text.

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
| G16 | Player and security-crew hero GLBs are **skeletally rigged** (skinned mesh, one humanoid skeleton each per R14) and play their animation clips in-engine via the render-side animation path; the rifle remains a separate rigid GLB constrained to the right-hand grip socket with muzzle-anchor parity (R6) preserved through every pose | MP (v1.7 row) | ☐ |
| G17 | **Minimum animation set** live, mirrored from sim state (render-side only — G15 holds): (a) `idle` loop while stationary; (b) `move` in-place locomotion loop playback-matched to sim velocity — player 6 m/s; crew patrol 2.0 / investigate 3.5 / chase 4.5 m/s (design doc §10); (c) `aim_fire` upper-body pose hold while the fire verb is active (player) and for the crew's stationary ATTACK state (design doc §10 — no move-and-shoot at P1); (d) crew `death` fall/expiry on crew sim death (neutralized count is sim-visible, design doc §3 v1.15 note); (e) foot-slide within ±10 % at the 60° camera (VD §7 rule 8). **Not required:** player death animation — death routes instantly to the score screen (design doc §10 fail flow), leaving no visibility window | MP (v1.7 row), U5 | ☐ |

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
| M10 | Hero skeletal rigs + minimum animation set (player boarder, security crew): clips `idle` / `move` / `aim_fire` / `death` (crew only), in-place loops, no root motion — the sim owns actor translation; animation mirrors existing sim state only (velocity, fire verb, ATTACK/wind-up, crew death) | VD §7 rule 8, §8; design doc §10 (speeds, wind-up — mirror only) |
| M11 | Rifle grip attachment: rifle GLB constrained to the `hand_r_grip` socket bone of the player rig; muzzle-anchor parity (R6) holds in `idle`, `move`, and `aim_fire` poses | VD §6; pack R6 |

**Does not exist for this feature (explicitly unlisted):** android models/racks/eye-glow (P4, M-P4); wall `intact/cracked/failed` states, sparks-&-debris, wall-failure, hull-breach, venting, curtain-seal VFX (P3, M-P3); AL2/AL3/Meltdown/Vacuum/Reactor lighting rows; reactor VFX; meltdown fires; PA/alarm telegraph treatment (P2, M-P2); reload animation, skeletal hit-react, player death animation, ragdoll/physics death, facial or per-finger animation (R13 — deferred, S3 class); any sim, AI, tuning, input, or HUD-data change.

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
- **R8 — ~~No animation system at P1.~~ SUPERSEDED by R13** (Director Gate 2 override, 2026-07-30, §3.5a). *Original text for audit: M-P1 requires hero models to replace capsules — it does not require skeletal/locomotion animation. Hero models ship as rigid, single-pose meshes authored in a top-down-readable combat stance. Locomotion animation is deferred (post-P1 polish backlog, S3 class). This keeps the pass scoped per §11 ("scoped, not open-ended").*
- **R13 — Animation scope at P1 (supersedes R8; Director ruling "I need those models rigged and animated").** The player boarder and security crew hero models ship **skeletally rigged with the minimum animation set of G17** — `idle`, `move`, `aim_fire`, plus `death` for crew. This is the **full** set; scope discipline per VD §11 ("scoped, not open-ended") holds: **no** reload animation, **no** skeletal hit-react (the hit telegraph remains the R7 flash, unchanged in duration and read), **no** player death animation (no visibility window — death routes to the score screen), **no** ragdoll, **no** facial/finger animation. Those remain post-P1 S3 polish. Animation is **render-side presentation only**: it reads existing sim state (velocity, fire verb, crew ATTACK/wind-up states, crew death) and changes no rule, number, or binding — G15 holds. Binding telegraphs (wind-up pre-glow, tracers, hit-flash) remain the readable signals; animation may mirror them but never carries a telegraph alone (VD §7 rule 8). The rifle is **not** independently animated at P1 — it rides the rig via M11.
- **R14 — Rig & export standard (glTF for three.js AnimationMixer).** One humanoid skeleton per character; documented bone naming — `root`, `pelvis`, `spine_01`, `spine_02`, `neck`, `head`, `clavicle_l/r`, `upperarm_l/r`, `forearm_l/r`, `hand_l/r`, `thigh_l/r`, `shin_l/r`, `foot_l/r` — plus a `hand_r_grip` socket bone aligned to the current rifle attach offset (M11). Clips named exactly `idle`, `move`, `aim_fire`, `death` (crew only), authored at 30 fps and sampled on export. **Root motion policy: none** — all loops authored in place with zero root translation; the deterministic sim owns actor translation (netcode-ready mandate, design doc §12.1) and the render layer must never drift from sim positions. `move` cadence is authored to a reference speed and playback-rate-scaled per sim velocity so foot slide stays within ±10 % (VD §7 rule 8). Skinning: max 4 bone influences per vertex, normalized weights. Unit scale, +Y-up orientation, and world origin identical to the currently shipped rigid GLBs (swap must be invisible to scene placement). LOD0–LOD3 share the single skeleton and clip set — LOD switches alter mesh density only, never silhouette (VD §8). Single skeleton per character; rifle stays a separate rigid GLB.
- **R15 — Staged acceptance vs the unlit-Basic hotfix.** The tune-4 unlit `MeshBasicMaterial` hero presentation (round-trip log, S1 hotfix) is **interim technical debt**, not the M-P1 art read (VD §5 PBR stands). Sequencing: this iteration's Gate 1 may verify **G16/G17 (rig + animation) on the current unlit heroes** so animation correctness is judged without waiting on the WebGL sampler-budget fix; a **full Gate 1 pass — including G2/G3/G4 PBR per VD §5 — is required before this feature is presented at Gate 2.** PBR restoration is a technical problem (shadow-sampler budget), spec'd by Grok; the design bar does not move.
- **R9 — Android racks stay absent.** Racks are P4-owned (M-P4); per §11 universal-bar exception, later-phase assets may stay placeholder — at P1 they are simply not present in frame. No rack stand-ins are added.
- **R10 — Per-surface impacts at P1 = metal wall vs deck floor.** P1 has no composite/damage-state surfaces (those arrive with P3 wall classes); "per-surface" at M-P1 means a distinct, material-appropriate response for vertical metal (spark burst) vs deck plate (spark + brief dust/scorch read). Dust-on-composite is deferred with the P3 families.
- **R11 — Haze implementation is render-side and camera-safe.** Volumetric haze must never obscure the gameplay mid-plane (VD §7 rule 1) and is exempt from the "no ambient confetti" anti-goal only as corridor atmosphere per §4.2 — it carries alarm-state information (density scales with alarm level).
- **R12 — HUD skin is chrome-only.** DOM structure, readout set, visibility lifecycle, and data bindings (design doc §12.1 v1.16) are accepted work and do not change. The pass styles the chrome: typography, panel treatment, palette-exact colors.

## Ships vs deferred (explicit scope boundary)

| In scope (ships with this feature) | Deferred (owner / vehicle) |
|---|---|
| Player, security-crew, rifle hero GLBs (M1–M3) | Reload animation, skeletal hit-react, player death animation, ragdoll, facial/finger animation — post-P1 S3 polish (R13) |
| **Hero skeletal rigs + minimum animation set (M10, G16–G17, R13/R14)** | Advanced locomotion (blends, strafes, turns-in-place beyond the single `move` cycle) — post-P1 S3 polish |
| Rifle grip-socket attachment (M11) | Independently animated rifle (bolt/mag moving parts) — post-P1 S3 polish |
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
| Player boarder hero model (2K PBR) | `models/p1_player_boarder.glb` (+ `textures/p1_player_boarder_{albedo,metal,rough,normal}.png` if external) | Board A — player boarder | **delivered (v2, 2026-07-30) — rigged + animated (R13/R14): R14 21-joint skeleton, clips `idle`/`move`/`aim_fire`, supersedes rigid v1 at same path** |
| Security crew hero model (2K PBR) | `models/p1_security_crew.glb` (+ `textures/p1_security_crew_*.png` if external) | Inherited — p1-enemy-baseline board (design synthesis binding) | **delivered (v2, 2026-07-30) — rigged + animated (R13/R14): R14 21-joint skeleton, clips `idle`/`move`/`aim_fire`/`death`, supersedes rigid v1 at same path** |
| Rifle hero model (2K PBR) | `models/p1_rifle.glb` (+ `textures/p1_rifle_*.png` if external) | Board B — rifle | delivered (v1) — unchanged; `muzzle` anchor parity R6 must survive the grip-socket constraint (M11) |
| Hull-steel trim sheet (1K, structure) | `textures/p1_hull_steel_trim_{albedo,metal,rough,normal}.png` | Board C — deck materials & lighting | delivered (v1) |
| Deck plate floor set (1K) | `textures/p1_deck_plate_{albedo,metal,rough,normal}.png` | Board C | delivered (v1) |
| Wall panel set (1K) | `textures/p1_wall_panel_{albedo,metal,rough,normal}.png` | Board C | delivered (v1) |
| Ceiling panel set (1K) | `textures/p1_ceiling_panel_{albedo,metal,rough,normal}.png` | Board C | delivered (v1) |
| Authored wear masks (hand height / thresholds / door frames) | `textures/p1_wear_masks.png` | Board C (per VD §5 authored-wear rule) | delivered (v1) |
| Section signage atlas (VD §3 palette, deck-plan mockup v2.2 typography) | `textures/p1_section_signage_atlas.png` | Board C + deck-plan mockup palette | delivered (v1) |
| Corridor light fixture prop (kit-bash GLB) | `models/p1_corridor_light_fixture.glb` | Board C | delivered (v1) |
| Amber beacon fixture prop (kit-bash GLB, AL1 practical) | `models/p1_amber_beacon.glb` | Board C | delivered (v1) |

*Texture generator scripts (R3) commit under `tools/` alongside the assets they emit. Reference image files themselves are never committed (charter v1.11) — index only.*

**Blender MCP rigging/animation authoring steps (R13/R14 — hero re-delivery):** all original work, CC BY 4.0, same export paths (git history supersedes the rigid v1 GLBs).
1. Open the authored player/crew hero scenes from the v1 delivery (meshes, materials, and proportions are accepted work — do not re-sculpt silhouettes).
2. Build the humanoid armature per R14 naming, including the `hand_r_grip` socket bone aligned to the current rifle attach offset (muzzle anchor parity R6).
3. Skin the mesh (≤4 bone influences/vertex, normalized weights); QA extreme poses for volume collapse at gameplay camera.
4. Author clips at 30 fps, in place (zero root translation): `idle` (subtle combat-ready sway), `move` (single run/walk cycle authored to a reference speed, playback-rate-scaled in-engine per G17b), `aim_fire` (upper-body two-hand grip hold compatible with the muzzle flash + tracer origins), `death` (crew only — fall to deck, ends settled, no ragdoll).
5. Export GLB with skin + named clips, +Y-up, identical scale/origin to the shipped rigid GLBs; LOD0–LOD3 on the shared skeleton.
6. Validate before handoff: clip list/names, bone count/naming, muzzle-parity QA render through `idle`/`move`/`aim_fire`, file loads in a three.js AnimationMixer smoke check.

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
| S11 — Animation frame sequence (video capture acceptable): player `idle` → `move` at 6 m/s → stationary; crew `move` at patrol 2.0 / investigate 3.5 / chase 4.5 m/s — playback-rate match visible | G16, G17a/b |
| S12 — Sustained-fire sequence: player `aim_fire` hold with muzzle flash + tracer origins pixel-consistent with the pre-rig build (R6 parity through the pose) | G17c, M11, R6 |
| S13 — Crew `death`: fall on sim death → settled on deck → neutralized count increments (sim-visible event unchanged) | G17d, G15 |
| S14 — Foot-slide check: `move` loop frames against a fixed ground reference at the 60° camera — slide within ±10 % (VD §7 rule 8) | G17e |
| S15 — Silhouette-read sweep: hostile silhouette (VD §7 rule 2) holds across every clip's extremes in the S4 densest-combat scene | G3, G17, VD §7 rules 2+8 |

## Doc/visual bumps

**visual_direction bumped to v1.7** (2026-07-30, this iteration): **§7 rule 8** added — animation readability (in-place/no-root-motion, foot-slide ±10 %, animation never the sole telegraph carrier, silhouette holds through every clip); **§11 M-P1 row** amended — player/crew hero models now carry the skeletal rig + minimum animation set as part of the milestone bar. This records the Director's R8 override where Gate 1 will read it.

**Design doc: no bump.** Animation mirrors existing, already-accepted sim numbers (player 6 m/s; crew 2.0/3.5/4.5 m/s; 0.5 s wind-up; stationary ATTACK; crew death; player death → score screen — all §10/§3 v1.15) and adds no rule, number, or mechanic; hero presentation standards live in the visual direction doc by charter §1. R8 was a pack-level ruling, never a doc rule, so its supersession is pack-level too.

**Roadmap: no bump.** Scope stays inside P1 #9 (`p1-visual-pass`); the roadmap's M-P1 cell cites `visual_direction §11`, which now carries the amended bar — the row remains accurate as written. The P1 checkpoint rule (visual pass Gate-2 accepted before sign-off) is unchanged.
