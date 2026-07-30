# Design Pack — p1-combat-core

`DESIGN PACK v2 | feature p1-combat-core | design doc v1.13 | goals: G1..G10 | mechanics: M1..M10`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.13 · design doc v1.13 · visual direction v1.4 (bumped from v1.3 by this pack — rulings R7/R8 landed doc-first) · feature roadmap v1.7 (P1 #4) · shipped deps: `p1-project-scaffold` (sim loop, command bus, input devices), `p1-deck-geometry` (deck graph, collision, wall-class data), `p1-player-controller` (player entity, move/aim/interact verbs, camera rig).

> **v2 note (Director iteration 1, §3.5a):** v1 below is the accepted baseline (G1–G9 ☑, Gate 2 accepted, on `master`). v2 adds **G10 / M10 / R7 / R8** — combat readability telegraphs (visible projectiles + aim-direction line) — from Director feedback *"We need to see bullet projectiles and I need some kind of line indicating where I'm firing."* See the **v2 addendum** at the end; it is the only section in force beyond v1.

**Feature (roadmap P1 #4):** firearms, projectiles, damage, health/death for player + enemies, ammo. Depends on `p1-player-controller` ✅. P1 carries **no gating, no destructibility, no AI, no HUD** — this feature is the combat *pipeline*: verbs → projectiles → damage → death, exercised against static crew stand-ins. Enemy behavior arrives in `p1-enemy-baseline` (#5).

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | The fire verb exists as a command on both devices (§8 v1.12 binding table): holding fire enqueues fire commands through the command bus, and while the rifle has magazine ammo and is not reloading, the sim spawns a projectile from the player toward the current facing at 10 rounds/s (M1/M3) | ☑ |
| G2 | Projectiles are deterministic sim entities: stable entity IDs, 60 m/s, despawn on first collision or at 60 m max range; they are blocked by all wall classes (A/B/C) and deal **no wall damage** — §6.2 is P3 scope (M2, ruling R3) | ☑ |
| G3 | One shared actor health pipeline: player and crew stand-ins each have 100 HP (M4); a projectile hit applies 25 damage; HP clamps at 0 | ☑ |
| G4 | Death rules (M5): a stand-in at 0 HP enters dead state (no longer targetable, no longer collides with projectiles); the player at 0 HP enters dead state (input inert) and respawns at the spawn point with full HP/ammo after 3 s (placeholder, §10 v1.12) | ☑ |
| G5 | Ammo economy (M6): magazine 30 + reserve 120 at start; each shot consumes 1 magazine round; reload command — or a trigger-pull on an empty magazine — starts a 2.0 s uninterruptible reload that moves rounds from reserve; no fire during reload; no reload without reserve rounds | ☑ |
| G6 | Enemy-as-damage-target: 3 static security-crew stand-ins (M7) exist at deterministic deck positions — Main Spine (midpoint), Cargo Hold, Barracks — damageable and killable through the same pipeline as the player | ☑ |
| G7 | Input parity: fire + reload are fully playable on keyboard/mouse and gamepad per the §8 v1.12 binding table; interact no longer fires — the mouse-0 conflict is resolved by ruling R1 | ☑ |
| G8 | Determinism preserved (§12.1): identical command streams produce identical projectile/HP/ammo states across runs; world hash extended to cover combat entities; no frame-rate-coupled or unseeded-random sim logic | ☑ |
| G9 | Combat presentation conforms to visual direction: muzzle flash is a real dynamic light that lights the room (visual §4.2); per-surface impact FX from the muzzle/impacts family (visual §6, P1 row); telegraphs readable at the 60° camera (visual §7); palette rules respected (visual §3) | ☑ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | Fire verb as command: held-state fire intent enters only via the command bus, consumed inside the fixed sim tick; fire rate gated sim-side (10 rps), never by device repeat rate | §12.1, §8 (v1.12 binding table) |
| M2 | Projectile model: point projectile, 60 m/s along spawn facing, 60 m max range, first-collision resolution vs actor circles (r = 0.4 m, the deck's `ACTOR_PROXY_RADIUS_M`) and deck collision geometry; **walls of every class are solid to projectiles at P1** — impact, no damage | §10 (v1.12); §6.1 (classes as collision semantics — M2 of p1-deck-geometry) |
| M3 | Rifle tuning: 25 damage/hit, 10 rounds/s automatic (hold-to-fire), no spread, no recoil, no falloff in v1 — deterministic single line of flight | §10 (v1.12) |
| M4 | Actor health model: 100 HP player, 100 HP security crew; damage floors at 0; no passive regen, no armor, no resistances, no friendly fire (solo) at P1 — android ballistic resistance (§6.7) is P4 | §10 (v1.12), §4.5 |
| M5 | Death & respawn placeholder: dead state semantics per G4; player respawn 3 s at the port airlock spawn with full HP/ammo; co-op downed-but-not-out (§8) and mission-fail flow are deferred (netcode / `p1-mission-shell`) | §10 (v1.12); §8 deferral note |
| M6 | Ammo economy: 30-round magazine, 120 reserve at start, 2.0 s uninterruptible reload, auto-reload on empty trigger-pull; **no pickups, drops, or resupply exist at P1** (Armory resupply is a mission feature, §3 Phase 6) | §10 (v1.12) |
| M7 | Crew stand-in targets: static, non-moving, non-attacking security-crew fictions (capsule blockouts), damaged through the identical pipeline as the player — forward-compatible with `p1-enemy-baseline` AI; corpses persist as inert blockouts (no gameplay effect) | §4.5 roster |
| M8 | Combat input bindings: `fire` and `reload` added to the verb set per §8 v1.12; interact drops its mouse-0 binding (KBM interact = E; gamepad interact = face south; cancel unchanged) | §8 (v1.12) |
| M9 | Muzzle/impacts VFX family: muzzle flash as dynamic light source (not sprite glow), per-surface impact burst (sparks on hull steel), hit flash on actors; blockout-level authoring, palette-conformant, telegraph-first | visual §6 (P1 row), §4.2, §7, §3 |

**Design rulings (new, this pack):**

- **R1 — Fire vs interact binding.** Fire owns the primary trigger on both devices: mouse button 0 (KBM) and right trigger (gamepad). Interact loses its mouse-0 binding; KBM interact is E only, gamepad interact stays face-south. Reload = R / face-west. *(Doc change: yes — landed in §8 v1.12 binding table. This intentionally revises the shipped `p1-player-controller` binding set; interact/cancel verbs themselves are unchanged.)*
- **R2 — P1 combat baselines.** Player/crew HP 100; rifle 25 dmg @ 10 rps automatic; magazine 30 + reserve 120; reload 2.0 s uninterruptible; projectile 60 m/s, 60 m range; no spread/recoil v1; player respawn 3 s placeholder. *(Doc change: yes — landed in §10 v1.12. The roadmap row cites "§9 tuning"; the tuning table lives in §10 — used faithfully.)*
- **R3 — Walls are solid to projectiles at P1.** The §10 line "Partition wall HP (Class A) 300 · rifle ~5/hit" is the **wall-damage** baseline and binds at `p3-wall-damage` (§6.2), not here. In this feature, projectiles terminate on all wall classes with impact FX only. No wall HP, no chipping, no breaching.
- **R4 — Aim-assist stays with `p1-gamepad-support` (#8).** The deferral made in `p1-player-controller` ("no targets exist until p1-combat-core") resolves cleanly: this feature delivers the targets (G6), and roadmap #8 ("twin-stick aim + aim-assist, §10 0.35/10° cone") owns the implementation against them. No aim-assist in this feature.
- **R5 — Player damage verification path.** No damage source targets the player until #5 (stand-ins don't shoot). The health/damage/death pipeline for the player is exercised via a **dev-gated debug damage command** (deterministic sim command, dev flag only — never player-facing). This is scaffolding, not a mechanic.
- **R6 — No randomness in combat v1.** Spread, crits, and damage variance do not exist; the rifle fires exactly along facing. This keeps G8 determinism trivial and reserves spread as a tuning lever for the P1 checkpoint playtest.

**Explicit non-goals (do not build):**

- Enemy AI, patrol/chase/attack, spawners, alarm — `p1-enemy-baseline` (#5) and P2. Stand-ins never move or shoot.
- HUD (health bar, ammo counter, hit markers) — `p1-hud` (#7). Combat state is observable via dev overlay/readout only.
- Wall HP, chip damage, cracked/failed stages, breaching, depressurization — P3 (R3).
- Explosives, grenades, AoE damage, melee, additional weapons, weapon switching — none exist in the design for P1.
- Aim-assist — `p1-gamepad-support` (R4).
- Ammo pickups / Armory resupply — mission features (M6).
- Audio (gunshots, hit sounds) — no audio system exists yet; visual telegraphs (M9) carry readability at P1. Flagged for phase-checkpoint scoping.
- Damage/healing consumers (Med Bay), mission fail/restart flow — `p1-mission-shell` (#6); the 3 s respawn is a placeholder (M5).
- Animation, hit reactions, gore — blockout capsule presentation only.

## Rule spec

1. **Netcode-ready architecture (§12.1/§12.2, non-negotiable).** Fire and reload are commands on the existing bus; all combat state (projectiles, HP, ammo, dead states) changes only inside the fixed sim tick; every projectile and stand-in has a stable entity ID; no `Math.random`/`Date.now`/frame-dt coupling in sim (R6 makes this easy — there is no randomness to seed). VFX (muzzle light, impacts) are render-side and MUST NOT feed back into sim, same separation as the follow camera.
2. **§8 input parity + v1.12 binding table (M8).** The shipped input layer arbitrates per-channel most-recent-input-wins across devices; fire and reload join as new channels. Hold-to-fire is a held-state intent (automatic weapon), not per-press commands. Binding conflicts ruled by R1: interact = E / face-south only.
3. **Projectile model (M2).** Spawned at the player's muzzle position toward facing; point-vs-circle test against actors (r = 0.4 m, the deck standard — generous enough to hit reliably at twin-stick distances); swept against deck collision geometry so fast projectiles never tunnel through walls; first collision wins (no piercing). Walls block at every class (R3).
4. **Health/damage/death (M4/M5).** One pipeline, two actor kinds. Damage applies only projectile→actor (no other damage sources exist — R5 covers verification). Death is a sim state, not a despawn: stand-in corpses persist as inert blockouts; the player respawns per §10 v1.12 placeholder. Healing does not exist at P1.
5. **Ammo (M6).** Magazine and reserve are sim state. Reload starts only when reserve > 0 and magazine < 30; it is uninterruptible (R2) and locks firing; on completion, rounds move reserve→magazine up to capacity. Trigger-pull on empty magazine auto-starts reload. Running dry is possible and permanent for the session at P1 (no resupply) — acceptable: stand-ins are finite and 30+120 rounds @ 25 dmg is 3750 effective damage vs 300 stand-in HP on the deck.
6. **Stand-ins (M7).** Three, at deterministic positions (G6). They are security-crew fictions (§4.5 baseline infantry) in capsule blockout — the hostile read comes from palette, not animation: hostile/alarm accent `#ff5252` family per visual §3 (red never decorates; the player's allied green is never crossed). Placement rationale: spine midpoint ( traversal target practice on the main artery), Cargo Hold and Barracks (one per breach-route profile, §3 Phase 0).
7. **Visual direction (M9).** Muzzle flash is a real light that moves shadows (visual §4.2: "muzzle flash … are *real lights*"); impacts use the P1 muzzle/impacts family — per-surface bursts, sparks on hull steel (visual §6); all FX subordinate to the readability hierarchy (visual §7: enemy telegraphs > player state > mood); no red/green meaning collisions (visual §3 rule). Blockout fidelity — hero weapon/character models are a later asset pass (see Prereq assets).
8. **Scope guard (P1 anti-assumption).** A mechanic not in the callout does not exist: no AI, no alarm, no HUD, no wall damage, no explosives, no pickups, no audio. Any of these appearing in the PR is an anti-assumption violation and a Gate 1 blocker.

## Prereq assets

| Asset | Path (assets/) | Reference board (references/) | Status |
|-------|----------------|-------------------------------|--------|
| — none — rifle, stand-ins, muzzle/impact sprites are blockout primitives + procedurally generated sprites in code | | | n/a |

*No reference boards required for this feature (charter §1 reference-first rule): every visible element is blockout-level — a kit-bashed primitive rifle, capsule stand-ins, and procedural particle sprites — taking the lighter path per the charter's overkill judgment rule and the `p1-player-controller` precedent (no boards for blockout primitives). The **hero** rifle model and security-crew character model are tangible assets that WILL need boards (4–8 refs: silhouette, materials, lighting); they are scheduled for the `p1-enemy-baseline` asset pass, whose roster boards (§4.5 note: "security crew, heavy/exosuit, android") are the correct home. No Blender work this feature.*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | Scripted fire-hold command streams (KBM-mapped and gamepad-mapped variants) spawn projectiles at exactly 10/s while ammo lasts; zero spawns during reload or on empty magazine |
| G2 | Unit tests: projectile entities carry stable IDs and advance 60 m/s deterministically; fired point-blank into each wall class → projectile removed, wall state untouched; no projectile survives past 60 m; sweep test: no tunneling through any wall at max per-tick travel |
| G3 | Tests: one hit → 75 HP on both actor kinds; four hits → 0 (clamped, never negative); player and stand-in share the same damage code path |
| G4 | Tests: stand-in at 0 HP → dead state, further projectiles pass through/ignore it, corpse entity persists; player at 0 HP (via dev damage command, R5) → dead state, input inert, respawn at port airlock spawn after exactly 3 sim-seconds with 100 HP / 30+120 ammo |
| G5 | Tests: 30 shots drain the magazine; 31st trigger-pull auto-starts reload; reload completes at 2.0 s ±1 tick moving min(30, reserve) rounds; fire commands during reload spawn nothing; reload with 0 reserve is a no-op; totals never exceed 30/120 without resupply |
| G6 | World-state check: exactly 3 stand-ins with stable IDs at the packed positions (spine midpoint, Cargo Hold, Barracks); each is killable end-to-end via rifle fire |
| G7 | Parity tests mirroring the scaffold pattern: fire + reload command streams from both devices produce identical sim outcomes; E / face-south emits interact and never spawns projectiles; mouse-0 / right trigger emits fire and never emits interact |
| G8 | Replay test: identical command stream twice → identical projectile/HP/ammo trajectories AND identical extended world hash; hash differs when commands differ; sim tick count identical with VFX enabled/disabled (zero sim coupling) |
| G9 | Screenshot/build evidence at the 60° rig: muzzle flash visibly lights nearby geometry (dynamic light, not sprite); wall impacts spark per surface; stand-in hit flash reads at camera distance; no red/green meaning collisions (visual §3) |

## Open questions anticipated for Stage 2 (clarification loop §3.2a)

None blocking — R1–R6 pre-rule the expected conflicts. Topics Grok may still raise, with my positions:

- Muzzle spawn offset / projectile-vs-self collision — technical; design constraint is only "never collides with the firing actor on the spawn tick."
- ~~Tracer presentation (render-side) — Grok's call within M9's readability bounds.~~ **Superseded by v2:** tracer presentation is no longer Grok's open call — it is a ruled requirement (R7, G10). The v1 deferral is diagnosed as the gap that produced Director iteration 1.
- Stand-in hit-flash duration — presentation detail within visual §7; not a rule.

---

## v2 addendum — Director iteration 1: combat readability telegraphs (2026-07-30)

**Director feedback (post-Gate-2, master shipped):** *"We need to see bullet projectiles and I need some kind of line indicating where I'm firing."*

**Diagnosis (§3.5a):** design-pack gap — presentation under-specification, **not** an implementation defect and **not** a design-doc rule change. The sim is correct (projectile entities, 60 m/s, stable IDs, deterministic); G9/M9 shipped muzzle light + impacts as accepted. But the v1 pack never required visible slugs and never enumerated an aim-direction telegraph — "tracer presentation" was deferred to Grok's discretion, where the requirement fell through. Sim rules, numbers, and bindings are untouched; this is render-side readability governed by the visual direction (bumped v1.3 → **v1.4**, §6 P1 row + §7 rule 7). Routing: pack v2 → Grok hotfix spec (Stage 2, reduced ceremony, §7 hotfix discipline) → Composer on `feat/p1-combat-readability` → Gates 1–2.

### New goal

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G10 | Combat readability telegraphs (M10, R7/R8): every live projectile renders as a visible emissive tracer synced to its sim entity, and the living player renders an in-world aim-direction line from the muzzle along facing to the first wall obstruction — dim at rest, bright while fire is held; both are render-only with zero sim coupling (G8 unchanged) | ☐ |

### New mechanic

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M10 | Player combat telegraphs (render-side): projectile tracers + aim-direction line, world-space scene elements (never HUD chrome — `p1-hud` #7 remains out of scope), allied-palette, subordinate to enemy telegraphs in the readability hierarchy | visual §6 (P1 row, v1.4), §7 rule 7 (v1.4), §3 |

### New rulings

- **R7 — Visible projectile tracers.** Every live sim projectile renders as an **elongated emissive slug** stretched along its velocity vector: hot-white core with an allied `#69f0ae` halo (visual §3 — player-aligned indicator; hostile fire will own `#ff5252` when enemies shoot in `p1-enemy-baseline`). Visual length ≈ **1.2 m** (2 sim ticks of travel at 60 m/s — reads as motion without implying a larger hitbox; the sim entity remains a point and the tracer must never be treated as geometry). Thin additive/emissive treatment, legible against hull-steel floors at the 60° camera. Tracers are **render-only**: spawned/killed with their sim entity by stable ID, position sampled from sim state each frame (render-side interpolation permitted), zero feedback into sim — G8 determinism and world hash are unaffected. The muzzle flash light (G9) stays; tracers supplement, never replace it. Budget: ≤ ~12 concurrent tracers (10 rps × ~1 s flight + margin) — trivially inside the §6 hero-emitter budget.
- **R8 — Aim-direction line (in-world, persistent).** A thin emissive line renders **whenever the player is alive** — from the muzzle along the current facing to the **first wall obstruction** (any class, per M2 collision semantics), clamped at the 60 m max range. **Dim at rest, bright while the fire verb is held**; visible during reload (aiming continues); **off while dead** (input inert, no facing to telegraph). Same allied treatment as R7 (white core / `#69f0ae`); it terminates on *geometry only* — actors do not stop it (their hit feedback is the M9 hit flash). Render-side read of collision/sim state only; zero sim coupling.
  - *Why persistent rather than fire-only:* under the 60° top-down rig the player is a capsule with **no readable body orientation** — the line *is* the facing telegraph. This holds for both devices: mouse aim exists continuously (cursor raycast, §8), and gamepad right-stick aim decays to neutral exactly when the player most needs to know where facing settled. A fire-only line would answer "where did that shot go" but not the Director's actual need — "where *am I* firing." Terminating at the first obstruction also telegraphs shot clearance (is this lane clean?) without any HUD.
  - *Why not HUD:* HUD remains `p1-hud` (#7) scope. This is a world-space combat telegraph under visual §7 rule 7 — scene readability, not chrome.

### v2 acceptance criteria

| Goal | Observable check |
|------|------------------|
| G10 | Screenshot/build evidence at the 60° rig: (a) a held-fire burst shows distinct, moving tracer slugs along the line of fire — visible against unlit hull-steel floor, white/`#69f0ae`, no red/green meaning collision; (b) tracers die at the same frame their projectile impacts/despawns (no orphaned tracers, including at 60 m max-range despawn); (c) the aim line runs muzzle → facing and visibly terminates at a wall when one blocks the lane, reaching full length in the open spine; (d) line is dim at rest, bright while firing, present during reload, absent after player death; (e) identical command stream with telegraphs enabled vs disabled → identical sim ticks, world hash, and G1–G8 outcomes (zero sim coupling); (f) G9 evidence still holds (muzzle light + impacts unchanged) |

### v2 explicit non-goals (do not build)

- No sim changes: projectile speed/range/damage/fire-rate, collision, HP, ammo — all frozen per v1 (R2/M1–M6). The hotfix that alters any accepted G1–G9 behavior is itself an S1 (charter §7 regression safety).
- No hostile/enemy tracers (stand-ins don't shoot; `p1-enemy-baseline` owns that when it lands).
- No spread/recoil visualization, no ricochets, no bullet drop — none exist in the sim (R6).
- No HUD elements, crosshair widgets, or screen-space overlays — `p1-hud` (#7).
- No laser-sight *attachment* fiction or hero weapon model work — blockout presentation, as v1.

### What Grok's hotfix spec must cover (Stage 2, reduced ceremony)

- Tracer renderer: slug mesh/material per R7 (stretch along velocity, white core + `#69f0ae` halo, additive/emissive); lifecycle bound to sim projectile entities by stable ID; per-frame position sync (interpolation allowed render-side); clean despawn on impact **and** max-range expiry.
- Aim-line renderer: origin at muzzle, direction from current facing; termination via read-only query against deck collision (all wall classes; geometry only, actors ignored); 60 m clamp; intensity state machine (alive+idle → dim, alive+firing → bright, reloading → visible, dead → off); palette per R8.
- Sim-coupling guard: telegraph layer strictly render-side; tests proving identical world hash / tick count / G1–G8 outcomes with telegraphs toggled on/off (mirrors the G8 replay pattern).
- Regression suite: full G1–G9 re-verification (charter §7 — regression safety); build + screenshot evidence for G10 (a)–(d).
- Out of scope list restating the v2 non-goals above.
