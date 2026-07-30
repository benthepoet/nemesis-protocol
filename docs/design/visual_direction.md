# Visual Direction — Nemesis Protocol

**Owner:** Kimi K3 (Art Lead, charter §1)
**Applies to:** all assets, VFX, lighting, UI treatment. Binding for every phase; deviations require a version bump here + Director sign-off.
**Status:** v1.6 — UI palette application note: palette meanings extend to HUD/shell UI verbatim (`p1-hud` design pack v1)

---

## 1. North Star

**A dying warship, lit like a thriller.** Industrial sci-fi horror at AAA presentation quality: the ship is believable machinery first and a haunted house second. Every visual system earns its place by serving both fidelity *and* gameplay readability.

Reference points (tone, not imitation):
- **Alien: Isolation** — industrial believability, retro-mechanical surfaces, dread through restraint
- **Dead Space (remake)** — volumetric lighting, particle-rich gore-adjacent industrial damage, integrated lighting-as-UI
- **The Callisto Protocol** — material quality, wet/specular response, oppressive atmosphere

## 2. Visual Pillars

1. **Machinery, not movie sets.** Rooms are built from systems: pipes, conduits, vents, panels, rivets. If a surface has no function, it gets wear, not decoration.
2. **Light is language.** Game state is readable from lighting alone, at any moment, without UI. (See §4 — this is the backbone of the whole direction.)
3. **Particles tell you what just happened.** Every VFX family is attached to a mechanic and telegraphs it: damage, breach, venting, meltdown. No ambient confetti.
4. **Spectacle never beats telegraph.** In a top-down frame, readability is survival. Clarity hierarchy: enemy telegraphs > objectives > player state > environment mood.

## 3. Color Language

Inherited from the deck-plan mockups — this palette is the brand and carries into 3D:

| Role | Hex | Usage |
|------|-----|-------|
| Void / base dark | `#05080f` | Space, unlit recesses, UI chrome |
| Hull steel | `#1a232e` – `#2a3644` | Primary surfaces, PBR base metals |
| Section accents | Engineering `#ef5350` · Command `#7986cb` · Ops `#ffb74d` · Life support `#4dd0e1` · Crew `#ce93d8` · Hydro `#81c784` | Per-section lighting gels, trim, signage — **players learn to navigate by tint** |
| Function accents (extended) | Armory `#ff8a65` · Medical `#80cbc4` · Comms/Sensors `#5c7cfa` · Mess/Crew ops `#a1887f` | Room-function trim/signage at finer grain than sections — inherited from the deck-plan mockups |
| Corridor neutral | `#8b949e` | Spine/corridor surfaces — deliberately tint-neutral so section accents read by contrast |
| Alarm / hazard | `#ff5252` | Alarm states, breach events, enemy telegraphs |
| Safe / allied | `#69f0ae` | Airlocks, extraction, player-aligned indicators |
| Interactive / door | `#ffd54f` | Doors, gates, interactables — one color, one meaning, everywhere |

**Rule:** interactive-vs-hostile color meanings are never crossed. Red never decorates; green never threatens.

**UI application (v1.6 — `p1-hud`):** the palette's meanings extend to HUD/shell UI verbatim — player-state readouts (health, objective) use allied `#69f0ae`; danger/alarm readouts (alarm at AL1+, low-health warning) use hazard `#ff5252`; UI focus/highlight and any interactive element use `#ffd54f`; chrome base is void `#05080f`. The crossing rule holds on UI exactly as in-world: red never decorates, green never threatens.

## 4. The Lighting System (core)

**Model:** physically-based lighting, fully dynamic — no baked lightmaps that can't respond to ship state. Key light per room + practical sources (fixtures, screens, emergency strips) + player-sourced lights (muzzle flash, flashlight).

### 4.1 Ship-state lighting matrix — the state machine you can *see*

| Ship state | Lighting treatment | Trigger (design doc) |
|------------|--------------------|-----------------------|
| **Cruise (AL0)** | Warm-neutral key, 80% fixtures live, gentle idle flicker on older circuits | Mission start, pre-alarm |
| **Alerted (AL1)** | Rotating amber beacons in corridors; unaffected rooms unchanged — *the alert spreads visibly* | First contact (§4) |
| **Hardened (AL2)** | Amber ship-wide; section accents desaturate; shadows deepen (fewer live fixtures) | First key completed |
| **Siege (AL3)** | Red rotating beacons; long shadows; smoke haze at low level | Aft gate opens |
| **Meltdown** | Emergency red + strobing blast-door whites; gravity-flicker causes light-dip events; fire glow as practical key | Charge armed |
| **Vacuum zone** | Hard, shadowless work-light; floating dust frozen mid-air; frost creep at edges | Post-breach compartment (§6.4) |
| **Reactor proximity** | Pulsing orange core-glow, intensity synced to meltdown timer | Engineering approach |

### 4.2 Lighting quality bar
- Volumetric fog/haze in all corridors (density scales with alarm level and damage).
- Contact-hardening shadows; no floating-actor look — every actor grounded by shadow or AO.
- Specular response on every metal surface (roughness maps with wear variance — §5).
- Muzzle flash, explosions, and the reactor are *real lights* that move shadows, not sprite glows.

## 5. Materials & Surfaces

- **PBR metallic/roughness workflow throughout.** No albedo-only cheats.
- **Wear is authored, not procedural-random:** grime concentrated at hand height, thresholds, and around door frames; hull-adjacent surfaces colder-toned.
- **Damage states are material states:** Class A walls ship with `intact / cracked / failed` texture variants (design doc §6.2) — the crack telegraph must be readable at gameplay camera distance.
- **Texel density:** 10.24 px/cm target for hero surfaces, 5.12 for structure; trim-sheet strategy for paneling to hold the frame budget.

## 6. Particle & VFX Families (each tied to a mechanic)

| Family | Mechanic (doc ref) | Required behavior |
|--------|--------------------|--------------------|
| **Sparks & debris** | Wall chip damage (§6.2) | Per-hit spark burst + material-appropriate chips; persistent floor debris accumulates |
| **Wall failure** | Class A breach (§6.2) | Directional collapse burst, dust cloud that *temporarily obscures the new hole* — 1.5 s of "what's through there?" dread |
| **Hull breach** | Class C event (§6.4) | Explosion → debris stream *toward the hole* — particles visualize suction direction |
| **Venting** | 5 s suction (§6.4) | Full-room particle advection toward breach: papers, dust, frost; screen-edge frost on player camera |
| **Curtain seal** | Emergency curtain (§6.4) | Hard light-bar slam + pressure-equalization mist burst |
| **Reactor** | Proximity + arming (§3 Phase 4) | Core bloom pulse, heat distortion, ember drift; intensity = timer pressure |
| **Muzzle/impacts** | Combat (P1) | Per-surface impact FX (sparks on metal, dust on composite); muzzle flash lights the room (allied **and** enemy fire — a real light either way); **visible projectile tracers** — emissive slug stretched along velocity, hot-white core, render-synced to sim projectile positions: halo allied `#69f0ae` for player fire, **hostile `#ff5252` for enemy fire** — allegiance readable at a glance in a two-way firefight; **aim-direction line** — in-world telegraph from the muzzle along facing to the first wall obstruction, dim at rest, bright while firing; **enemy attack wind-up** — muzzle pre-glow `#ff5252` for the full wind-up duration before an enemy's first shot of an engagement, render-only (the "about to shoot" read; design doc §10 wind-up) |
| **Android** | §6.7 units | Cold white eye-slit glow (visible in darkness — *the* android telegraph), hydraulic vapor on wake |
| **Meltdown fires** | Extraction hazards (§3 Phase 5) | Real area light, smoke columns that block sightlines, ember advection toward venting zones |

**Budget rules:** max 2 simultaneous "hero" emitters per frame region; VFX LODs degrade particle *count*, never the telegraph shape; telegraph effects (venting direction, wall crack, android eyes) are exempt from culling.

## 7. Readability Rules (camera non-negotiables)

**Camera (prototype):** angled top-down, ~60° pitch, perspective projection — Alien Swarm-style. All rules below are authored for this view. If the first/third-person pivot (design doc §12.1) is adopted after P1, this section gets a camera-specific revision before any asset is re-judged.

1. **Gameplay plane stays clean.** Fog and haze live below knee height or above head height at the camera angle; the mid-plane where actors and telegraphs live stays legible.
2. **Enemies read before effects do.** Hostile silhouettes get rim-light priority over all ambient FX.
3. **No visual noise on interactables.** Doors/gates/panels carry the `#ffd54f` language and nothing competes with it.
4. **Darkness is a budget, not a default.** Meltdown goes dark, but every dark room contains exactly one readable light story (exit strip, fire, beacon) — never true black.
5. **VFX can obscure intentionally** (wall-failure dust, smoke columns) — but always as a *timed, designed* readability event, never incidental clutter.
6. **Ceiling policy — full interiors, camera cutaway.** All rooms are built with complete geometry including ceilings (needed for the lighting model and the perspective pivot). Top-down visibility is handled by camera-driven ceiling fade/cutaway per room, **never by omitting geometry**. Wall tops must read cleanly at the camera angle.
7. **Player combat telegraphs are world-space, never HUD chrome.** Projectile tracers and the aim-direction line live in the scene, use the allied palette only (white core / `#69f0ae` — red never decorates, and hostile fire will own `#ff5252`), sit *below* enemy telegraphs in the clarity hierarchy, and must stay legible against hull-steel floors without competing with `#ffd54f` interactables. They visualize facing and shot clearance — they are not a laser-sight cosmetic.

## 8. Technical Standards

| Item | Standard |
|------|----------|
| Engine | **three.js** (WebGL2 baseline, WebGPU where beneficial); HDR pipeline, ACES-style tonemapping |
| Asset format | **glTF/GLB** (Blender export) with standard PBR maps; textures PNG/WebP (KTX2 for hero sets) |
| Camera-agnostic authoring | Full interiors incl. ceilings (§7 rule 6) — pivot to first/third person must never require re-authoring geometry |
| Rendering | PBR, dynamic lighting; no baked lightmaps that can't respond to ship state |
| Shadows | Contact-hardening; 2 shadow-casting lights minimum per gameplay space |
| VFX | GPU particles for advection (venting), CPU for hero bursts; LOD 3 tiers |
| Textures | 2K hero / 1K structure; wear via masks, not unique bakes |
| LODs | LOD0–LOD3 per model; LOD switches must not alter silhouette at gameplay distance |
| Naming | Phase-prefixed per charter §5 (`p1_`, `p2_`…) |
| Performance target | Prototype: 60 fps at 1080p in-browser on mid-tier GPU, full lighting + venting active |

## 9. Anti-Goals

- No clean, bright "Star Trek" corridors — ever.
- No baked, unchangeable lighting that can't express ship state.
- No particles that exist only to be pretty — every emitter is bound to a mechanic.
- No red/green meaning collisions (§3 rule).
- No darkness so complete it hides enemy telegraphs.

## 11. Phase Visual Milestones

Every phase (P1–P4) closes with a scheduled **visual-pass feature** (`pN-visual-pass`, roadmap v1.7+) — a full pipeline instance whose only deliverable is presentation uplift. This section is the Gate 1 bar for that feature: the milestone must hold *in the running build* before the phase checkpoint can be signed.

**Universal bar (every milestone, M-P1 through M-P4):**
1. **No blockout in frame.** Zero untextured primitives/placeholder capsules visible in normal play. (Exception: assets a later phase explicitly owns may stay placeholder — e.g., android racks during P1–P3.)
2. **Lighting-matrix rows live.** The ship states reachable in that phase render per §4.1, transition correctly, and are readable without UI (pillar 2).
3. **Telegraphs complete.** Every mechanic shipped in the phase has its §6 VFX family and its material/damage states — particles tell you what just happened (pillar 3).
4. **Palette language intact.** §3 section accents readable in-game (navigable by tint); interactive-vs-hostile color meanings never crossed.
5. **Readability verified.** §7 rules checked at the 60° camera in the densest combat scene the phase can produce; spectacle never beats telegraph (pillar 4).
6. **Performance held.** §8 target (60 fps @1080p, mid-tier GPU) with the phase's full lighting + VFX load active.
7. **No functional change.** A visual pass alters no accepted G#, number, or rule — anything that does routes as a separate feature. License scan (charter §3 Stage 5) passes.

**Per-phase milestone scope:**

| Milestone | Phase | What must be true at Gate 1 |
|-----------|-------|------------------------------|
| **M-P1** | Core loop | Player, rifle, and security-crew hero models (textured glTF/GLB, PBR per §5) replace all capsules/blockout weapons. Deck surfaces carry hull-steel materials with authored wear + section accent trim/signage. Lighting rows **Cruise (AL0)** and **Alerted (AL1)** live: per-room key + practicals, contact-hardening shadows, corridor volumetric haze baseline (§4.2). **Muzzle/impacts** family complete — muzzle flash is a real light, per-surface impacts. HUD skinned to palette (void chrome, section/function accents). |
| **M-P2** | Gating & alarm | Blast doors, gates, and objective props (charge, slicer/key stations) are hero assets with the `#ffd54f` interactable language. Lighting rows **Hardened (AL2)**, **Siege (AL3)**, **Meltdown**, and **Reactor proximity** live; alarm-state transitions visibly spread through the ship. **Reactor** VFX family (bloom pulse, heat distortion, ember drift). PA/alarm telegraphs carry the hazard palette. |
| **M-P3** | Destructibility | Class A walls ship `intact / cracked / failed` material states, crack telegraph readable at gameplay distance (§5). VFX families **sparks & debris**, **wall failure** (dust-obscured hole), **hull breach**, **venting** (advection + screen frost), **curtain seal** complete. Lighting row **Vacuum zone** live (hard work-light, frozen dust, frost creep). |
| **M-P4** | Androids & bosses | Android and rack hero models; **android eye-slit glow** readable in darkness (the android telegraph) + hydraulic wake vapor. Boss variant silhouettes distinct at camera distance. **Meltdown fires** family live (real area light, sightline-blocking smoke, ember advection). Full lighting matrix now complete end-to-end. |

Each visual pass is scoped, not open-ended: its design pack enumerates exactly the assets/rows/families above that are in scope, with reference boards per charter §1 (reference-first). Polish beyond the milestone is S3 defect work, not visual-pass scope creep.

---

## 12. Changelog

| Version | Change |
|---------|--------|
| v1.0 | Initial direction: pillars, palette, ship-state lighting matrix, VFX families, readability rules, technical bar |
| v1.1 | Engine, camera model, ceiling policy |
| v1.2 | §3 palette extended: function accents (armory `#ff8a65`, medical `#80cbc4`, comms `#5c7cfa`, mess `#a1887f`) + corridor neutral `#8b949e` — formalized from deck-plan mockup v2.2 (`p1-deck-geometry` clarification Q2) |
| v1.3 | §11 added: phase visual milestones — universal Gate 1 bar + per-phase scope (M-P1…M-P4) for the scheduled visual-pass features (Director ruling 2026-07-30; roadmap v1.7). Changelog renumbered to §12 |
| v1.4 | Combat readability telegraphs (Director Gate-2 iteration on `p1-combat-core`, pack v2 R7/R8): §6 muzzle/impacts row extended — visible projectile tracers (emissive slug, white core / allied `#69f0ae` halo) + aim-direction line (muzzle → first wall obstruction, dim at rest, bright while firing); §7 rule 7 added — player combat telegraphs are world-space, allied-palette, subordinate to enemy telegraphs |
| v1.5 | Hostile combat telegraphs (`p1-enemy-baseline` design pack v1, R9): §6 muzzle/impacts row extended — tracer halo carries allegiance (allied `#69f0ae` / hostile `#ff5252`, formalizing the §7 rule 7 note), enemy muzzle flash is a real light like the player's, and the **enemy attack wind-up pre-glow** (`#ff5252`, full wind-up duration, render-only) joins the family |
| v1.6 | §3 UI application note (`p1-hud` design pack v1, R7/M8): palette meanings extend to HUD/shell UI verbatim — allied `#69f0ae` player-state readouts, hazard `#ff5252` alarm/danger readouts, interactive `#ffd54f` UI focus/highlight, void `#05080f` chrome base; crossing rule holds on UI |
