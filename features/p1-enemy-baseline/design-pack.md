# Design Pack — p1-enemy-baseline

`DESIGN PACK v1 | feature p1-enemy-baseline | design doc v1.14 | goals: G1..G10 | mechanics: M1..M8`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.13 · design doc **v1.14** (bumped doc-first from v1.13 by this pack — rulings R3/R4/R5/R7 landed in §4 note + §10) · visual direction **v1.5** (bumped doc-first from v1.4 by this pack — ruling R9) · feature roadmap v1.7 (P1 #5) · shipped deps: `p1-project-scaffold` (sim loop, command bus, determinism), `p1-deck-geometry` (deck graph, collision, wall-class data — all doors open at P1 per its R1), `p1-player-controller` (player entity, move/aim verbs), `p1-combat-core` v2 + `p1-combat-readability` (fire/projectile/damage/HP/ammo pipeline, 3 static stand-ins, tracers + aim line).

**Feature (roadmap P1 #5):** security crew infantry AI (patrol → investigate → chase → attack); basic spawner; alarm stub (AL0–AL1 only). Depends on `p1-combat-core` ✅. This feature turns the deck's static crew stand-ins into the §4.5 baseline infantry and gives the player something that fights back — the first hostile damage source, resolving `p1-combat-core` R5 ("no damage source targets the player until #5") and the pack v2 note deferring hostile tracers to enemy fire.

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | Every live security-crew entity runs the §4.5 behavior chain as an explicit sim state machine — PATROL / INVESTIGATE / CHASE / ATTACK (plus DEAD, combat-core semantics) — observable per entity by stable ID; transitions occur only per M3/R8 (M1, M3) | ☐ |
| G2 | PATROL at AL0: exactly 8 crew spawn from the deck-data spawn table and walk their authored waypoint loops at 2.0 m/s with 2.0 s waypoint pauses, deterministic from tick 0 (M5, R2/R4) | ☐ |
| G3 | Detection (M2, R3): a crew member with continuous line of sight to the living player within 20 m and inside its 110° sight cone for 0.25 s detects — entering CHASE and tripping AL0→AL1 (M6). LOS is blocked by all wall classes | ☐ |
| G4 | CHASE (M3, R4/R8): crew path at 4.5 m/s through deck door edges toward the shared last-known-position (LKP); on arrival without LOS → INVESTIGATE scan for 4.0 s → hold alerted at the LKP area (no return to patrol at AL1) | ☐ |
| G5 | ATTACK (M4, R5): with LOS at ≤ 14 m the crew member stops, faces the player, runs a 0.5 s wind-up telegraph, then fires aimed shots at 1 shot / 0.9 s (10 damage/hit, seeded 4° spread) using the shared projectile model (60 m/s, 60 m, blocked by all wall classes); breaks to CHASE when LOS or range is lost | ☐ |
| G6 | Spawner & stand-in disposition (M5, R1/R2): the 3 static stand-ins (combat-core G6) are **removed**; the spawner is the sole source of crew, producing the deterministic initial population from spawn-table data in the deck definition — the spine-midpoint, Cargo Hold, and Barracks stand-in positions persist as patrol posts. Killed crew stay dead; corpses persist as inert blockouts; no reinforcement spawns exist at P1 | ☐ |
| G7 | Alarm stub (M6, R7): mission starts at AL0; the first of {player fires any shot, any crew detects the player, any crew takes damage} trips AL1 ship-wide; at AL1 all living crew converge on the shared LKP (updated while any crew has LOS); the alarm never de-escalates and no lockdown, reinforcement, or AL2+ behavior occurs | ☐ |
| G8 | Player is now a hostile damage target (M4/M7, R6): crew projectiles damage the player through the identical pipeline as combat-core (100 HP, death → 3 s respawn placeholder, §10); crew projectiles pass through crew and corpses (no friendly fire); accepted combat-core behavior G1–G10 is unchanged (regression safety, charter §7) | ☐ |
| G9 | Determinism preserved (§12.1): identical command streams produce identical AI-state/alarm/projectile/HP trajectories and identical extended world hash across runs; all AI randomness (spread) is seeded and sim-side; no frame-rate-coupled or unseeded-random logic | ☐ |
| G10 | Hostile presentation conforms to visual direction v1.5 (M8, R9): wind-up pre-glow, hostile tracers, and enemy muzzle flash read at the 60° camera; hostile fire owns `#ff5252` and palette meanings never cross (visual §3/§7); blockout capsule presentation — hero models are `p1-visual-pass` (#9) | ☐ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | Security crew roster unit: baseline infantry with the behavior chain patrol → investigate → chase → attack; **sidearms at AL0–AL1**; not vacuum-rated (flee behavior is §6.5 — P3, out of scope) | §4.5 |
| M2 | Crew perception model: 20 m sight range, 110° sight cone (±55°) centered on facing, 0.25 s continuous-LOS detection delay; LOS blocked by all wall classes; hearing exists only as the alarm-trip rules in M6 (no standalone noise-investigation at P1 — breach noise §6.2 is P3) | §10 (v1.14) |
| M3 | Crew state machine + navigation: states PATROL / INVESTIGATE / CHASE / ATTACK / DEAD with transitions per R8; movement paths derive from the deck room graph through door edges only (topology-agnostic, §12.2) — walls of every class block crew exactly as they block the player; actor proxy r = 0.4 m | §4.5, §12.2, §10 (v1.14) |
| M4 | Crew sidearm combat: attack enters via a 0.5 s wind-up, then aimed shots at 1 / 0.9 s, 10 damage/hit, seeded 4° half-angle spread, stationary while firing; projectiles use the combat-core projectile model (60 m/s, 60 m max, first collision, blocked by all wall classes); crew projectiles collide with the player and walls only — they pass through crew and corpses (R6); infinite sidearm ammo, no reload at P1 | §10 (v1.14), §4.5; projectile model §10 (v1.12) |
| M5 | Spawner & patrol data: the deck definition carries a spawn table (8 crew posts, waypoint loops) consumed by a basic spawner at mission start; deterministic initial population; killed crew are never replaced at P1 (reinforcements/spawn budgets are §4 AL2+ — P2); corpse persistence per combat-core M5/M7 | §4.5, §12.2, §10 (v1.14) |
| M6 | Alarm stub AL0–AL1: two states only; trip rules and converge effect per R7; **lockdown (§3 Phase 2), reinforcement budgets, and AL2–AL3/MELTDOWN do not exist at P1**; alarm state is sim data observable via dev overlay — the alarm indicator is `p1-hud` (#7) | §4 (rows 0–1 + v1.14 scoping note) |
| M7 | Crew health/death (restated for traceability — unchanged from combat-core M4/M5): 100 HP, 25-damage player rifle hits, dead state (untargetable, projectile-transparent), corpses persist as inert blockouts | §10 (v1.12), §4.5 |
| M8 | Hostile telegraphs (render-side): enemy wind-up muzzle pre-glow `#ff5252` (0.5 s, render-only); enemy projectile tracers — same emissive-slug treatment as combat-core R7 with hostile `#ff5252` halo; enemy muzzle flash reuses the muzzle/impacts family as a real light; zero sim coupling (mirrors combat-core G8/G10 discipline) | visual §6 (v1.5), §7 rule 7, §3 |

**Design rulings (new, this pack):**

- **R1 — Stand-in disposition: REPLACE.** The 3 static stand-ins (combat-core G6) are removed, not converted. The spawner (M5) becomes the sole source of crew entities, and the three stand-in positions (Main Spine midpoint, Cargo Hold center, Barracks center) persist as patrol posts in the spawn table — combat-core's deterministic placement rationale (spine traversal target + one per breach-route profile) survives as data.
- **R2 — Population & patrol routes.** 8 crew on Deck 03 at mission start: **2 spine rovers** (walk the Main Spine end to end, aft-blast threshold ↔ fore-connector threshold); **6 posted crew** with short in-room waypoint loops — Cargo Hold (former stand-in), Armory, Med Bay (port row: heavier density per §3 Phase 0), Barracks (former stand-in), Life Support (stbd row), and CIC (fore loop via the connector). Engineering/aft stays unposted at P1 — the aft objective guard arrives with gating (P2). *(Doc change: yes — population row landed in §10 v1.14.)*
- **R3 — Perception numbers.** Sight range 20 m; sight cone 110° (±55° on facing); detection requires 0.25 s of continuous LOS (a corner-flash does not trip); facing while patrolling = direction of travel; LOS blocked by all wall classes. *(Doc change: yes — §10 v1.14.)*
- **R4 — Movement speeds.** Patrol 2.0 m/s · investigate 3.5 m/s · chase 4.5 m/s · attack stationary. Chase stays below the player's 6 m/s: disengagement is always possible, pressure comes from converge + numbers, not footrace. Crew fire only from the stationary ATTACK state — no move-and-shoot at P1 (keeps the telegraph honest and the shots dodgeable). *(Doc change: yes — §10 v1.14.)*
- **R5 — Sidearm numbers.** 10 damage/hit; 1 shot per 0.9 s; 0.5 s wind-up before the first shot of each attack engagement (telegraphed per M8); attack range ≤ 14 m with LOS; seeded spread 4° half-angle; shared projectile model (60 m/s, 60 m); infinite ammo, no reload at P1. Single-crew sustained fire kills in ~9 s — a baseline, tuned at the P1 checkpoint. *(Doc change: yes — §10 v1.14.)*
- **R6 — No crew friendly fire.** Crew projectiles collide with walls (all classes, impact FX) and the player actor only; they pass through other crew and corpses. No crew-on-crew damage chains, no morale/reaction simulation. Player projectiles are unchanged (hit crew, not the player). *(Doc change: yes — noted on the §10 sidearm row, v1.14.)*
- **R7 — Alarm stub semantics.** AL0→AL1 trips on the first of: (a) any player shot fired (§3 Phase 1: "first fired shot → ALARM"), (b) any crew detection (M2), (c) any crew damage. Cameras/hull sensors don't exist at P1, so that §3 Phase 1 trip is N/A. AL1 effect at P1 = **converge only**: all living crew treat the ship-wide shared LKP as their objective (LKP updates while any crew holds LOS). Lockdown is P2 (`p2-lockdown`); reinforcements and entrenchment are AL2+ (P2). The alarm **never de-escalates at P1**. *(Doc change: yes — §4 prototype scoping note, v1.14.)*
- **R8 — Lost-contact flow.** CHASE persists while any crew holds LOS (shared LKP at AL1). A crew member reaching the LKP without LOS enters INVESTIGATE: 4.0 s scan, then holds an alerted posture at the LKP area indefinitely (AL1 never resets, R7). If it regains LOS at any point → CHASE; if in range → ATTACK. There is no return-to-patrol at AL1, and INVESTIGATE is unreachable at AL0 (no standalone noise sources exist at P1, M2).
- **R9 — Hostile telegraph presentation.** Enemy wind-up = muzzle pre-glow in `#ff5252`, 0.5 s, render-only (the "I'm about to shoot" read). Enemy tracers = the combat-core R7 slug treatment with hostile `#ff5252` halo — hostile fire owns red (visual §7 rule 7). Enemy muzzle flash stays a real dynamic light (combat-core G9 family). All render-side, zero sim coupling; tracer budget extends to ≤ ~24 concurrent (player + crew fire). *(Doc change: yes — visual direction §6 v1.5.)*
- **R10 — No drops, no loot.** Crew carry nothing pickup-able and drop nothing; ammo economy stays per combat-core M6 (resupply is a mission feature, §3 Phase 6).
- **R11 — Navigation constraints (design side).** Crew paths derive from the deck room graph via door edges only (§12.2 topology-agnostic); crew never cross walls of any class, never leave the deck, and respect actor-proxy collision (r = 0.4 m) against geometry, the player, and each other (no overlap — trailing crew halt at contact rather than stacking). Pathfinding *technique* is Grok's domain; determinism (G9) and graph-derivation are the binding constraints.

**Explicit non-goals (do not build):**

- AL2–AL3/MELTDOWN ladder, spawn budgets, reinforcement/wave spawning, entrenchment — P2 (`p2-alarm-director`). Crew rifles (§4.5 "rifles at AL2+") do not exist.
- Lockdown, blast-door sealing, gating, keys, PA announcements — P2. All doors remain open passages (deck-geometry R1).
- Vacuum flee (§6.5), depressurization, wall damage/breaching, enemy breaching (AL3+) — P3. Walls are solid to everything at P1.
- Androids, racks, HUNT/SEAL, bosses — P4 (§6.7, §9).
- Squad tactics: flanking, cover use, coordination, morale, surrender, melee, grenades, crew ammo economy/reload — none exist in the design for P1.
- Cameras, hull sensors, stealth systems/takedowns — the §3 Phase 1 sensor trip is N/A at P1 (R7).
- Alarm HUD indicator, health/ammo HUD — `p1-hud` (#7); alarm/AI state observable via dev overlay only.
- Mission integration: airlock sequence, objectives, fail flow — `p1-mission-shell` (#6); the alarm trips on sandbox combat alone (R7).
- Aim-assist against live enemies — `p1-gamepad-support` (#8) owns it (combat-core R4 reasoning, now satisfied by live targets).
- Hero character models, animation, gore, audio — blockout capsules; hero security-crew model is `p1-visual-pass` (#9, milestone M-P1) using this folder's reference board. Audio flagged for phase-checkpoint scoping (combat-core precedent).

## Rule spec

1. **§4.5 roster (M1).** "Security crew — baseline infantry — patrol → investigate → chase → attack; sidearms at AL0–1, rifles at AL2+; not vacuum-rated; flees venting compartments (§6.5)." At P1 the chain and the sidearm exist; rifles and vacuum flee do not. The crew *is* the ship's defense (§4.5 ruling — aliens deferred): this feature is the first time pillar 2 ("the ship is the antagonist") has teeth.
2. **§4 alarm rows 0–1 (M6) + v1.14 scoping note (R7).** AL0: patrols only, stealth viable. AL1: "squads converge on last known position" — at P1 the converge is implemented as M6/R7 shared-LKP behavior, and the same row's "lockdown" effect is explicitly deferred (P2). The full ladder's key rule (*attacking an objective raises the defense of everything else*) is not testable at P1 — no objectives exist yet (#6).
3. **§3 Phase 1 stealth window (R7).** "Stealth ends on first contact, first camera/hull-sensor trip, or first fired shot → ALARM." P1 implements contact (detection/damage) and fired-shot trips; sensors are N/A. The airlock *scripted* stealth window is mission-shell (#6) scope — at P1 the mission simply starts at AL0.
4. **Netcode-ready architecture (§12.1, non-negotiable — G9).** All AI state (per-crew state machine, LKP, alarm level, perception timers, spread rolls) is sim state inside the fixed tick with stable entity IDs; any randomness is seeded sim-side. Render layers (M8 telegraphs) must not feed back into sim — the combat-core G8/G10 replay pattern is the verification model. Spawn/patrol data lives in the deck definition (topology-agnostic §12.2), not scattered through code.
5. **Projectile & health pipeline reuse (M4/M7).** Crew fire reuses the combat-core projectile model verbatim: point projectile, 60 m/s, 60 m despawn, first-collision vs actor circles (r = 0.4 m) and swept deck geometry, blocked by every wall class with impact FX only (§6.2 wall damage is P3). One shared health pipeline: 100 HP actors, damage floors at 0, dead-state semantics, player 3 s respawn placeholder (§10 v1.12). Only the projectile's *owner-side targeting* differs (R6).
6. **Spawn table (M5, R1/R2).** 8 deterministic posts per R2; waypoint loops are deck data; spawn-time validation (inside room, non-colliding, clearance-checked) mirrors the deck-geometry G5 spawn rules. The former stand-in yaw-facing rationale carries over: posts face their approach lanes (spine posts face along the spine; room posts face their spine-side door).
7. **Visual direction v1.5 (M8/G10).** Hostile telegraphs per R9; enemy silhouettes get rim-light priority over ambient FX (visual §7 rule 2); red never decorates, green never threatens (§3 rule — crew blockouts stay `#ff5252` family as shipped); fog/haze stays out of the gameplay mid-plane (§7 rule 1). Blockout fidelity: no new tangible assets this feature.
8. **Scope guard (anti-assumption).** A mechanic not in the callout does not exist: no AL2+, no lockdown, no reinforcements, no rifles, no vacuum behavior, no androids, no squads, no melee, no HUD, no audio, no drops. Any of these in the PR is an anti-assumption violation and a Gate 1 blocker.

## Prereq assets

| Asset | Path (assets/) | Reference board (references/) | Status |
|-------|----------------|-------------------------------|--------|
| — none tangible this feature — crew remain blockout capsules (kit-bash path per charter overkill rule); spawn-table data authored into the deck definition (rule spec 6) | | | n/a |
| Security-crew **reference board v1** (for the #9 hero pass) | — | `features/p1-enemy-baseline/references/references.md` — 6 refs: silhouette, materials, lighting; index committed, images local-only per charter v1.11 | ✅ delivered (board started here per §4.5 note) |

*No Blender work this feature (blockout capsules — combat-core precedent). The hero security-crew model is `p1-visual-pass` (P1 #9, milestone M-P1) scope and will consume the board above; heavy/exosuit and android boards (§4.5 note) start with their P4 features.*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | Sim tests: every spawned crew entity carries an observable AI state field by stable ID; scripted scenarios drive every transition (PATROL→CHASE on detection, CHASE→ATTACK in range, ATTACK→CHASE on LOS break, CHASE→INVESTIGATE at LKP, any→DEAD at 0 HP); no transition occurs outside M3/R8 rules |
| G2 | World-state check at tick 0: exactly 8 crew at the R2 posts with valid waypoint loops; replay: patrol trajectories over 60 sim-seconds are bit-identical across runs; patrol speed measured 2.0 m/s; 2.0 s pauses at waypoints |
| G3 | Tests: player held in cone at 15 m for 0.25 s → detection (CHASE + AL1); player crossing the cone for < 0.25 s → no detection; player at 25 m in cone → no detection; player behind a wall (any class) at 5 m → no detection |
| G4 | Tests: LOS broken mid-chase → crew continues to LKP, scans 4.0 s, then holds; chase speed measured 4.5 m/s; chase paths route through door edges only (never through any wall class) on a scripted cross-room pursuit |
| G5 | Tests: player stationary at 10 m LOS → crew stops, 0.5 s wind-up (no projectile before it ends), then shots at 0.9 s intervals ±1 tick; 10 damage per hit; spread bounded at 4° half-angle over a seeded sample; shots terminate on a wall between crew and player; crew breaks to CHASE when LOS/range lost |
| G6 | World-state check: zero stand-in entities from combat-core's spawn path; exactly 8 spawner-produced crew including posts at the three former stand-in positions; kill a crew → corpse persists inert (untargetable, projectile-transparent per M7) and no replacement ever spawns over a full-deck-clear replay |
| G7 | Tests, one per trip: (a) firing one shot with no crew in sight → AL1; (b) detection event → AL1; (c) damaging a crew → AL1. At AL1: all living crew path toward the shared LKP; LKP updates while any crew holds LOS; no alarm decay over 300 sim-seconds; no door state changes, no new spawns |
| G8 | Tests: crew projectile hit → player HP drops 10; player at 0 HP → dead state, input inert, 3 s respawn with full HP/ammo (combat-core G4 semantics); crew projectile through a second crew → no damage; full combat-core G1–G10 regression suite passes unmodified |
| G9 | Replay test (combat-core G8 pattern): identical command stream twice → identical AI-state/alarm/projectile/HP trajectories AND identical extended world hash; hash differs when commands differ; sim tick count identical with telegraphs enabled/disabled; spread rolls reproducible from seed |
| G10 | Screenshot/build evidence at the 60° rig: wind-up pre-glow reads before enemy fire (`#ff5252`, 0.5 s); enemy tracers read as hostile (`#ff5252` halo) and are distinguishable from allied tracers at a glance in a two-way firefight; enemy muzzle flash lights geometry; no red/green meaning collisions (visual §3) |

## Open questions anticipated for Stage 2 (clarification loop §3.2a)

None blocking — R1–R11 pre-rule the expected conflicts. Topics Grok may still raise, with my positions:

- Pathfinding representation (navmesh vs graph A* vs waypoint mesh) — Grok's call; binding constraints are R11 (graph-derived, door-edge traversable, deterministic) and G9 (seeded, tick-fixed).
- Chase repath cadence / LKP refresh behavior while LOS holds — technical; design constraint: crew converge on the *current* player position while any crew holds LOS, never on stale positions older than the last LOS tick.
- Multiple crew entering ATTACK simultaneously — allowed and intended (converge pressure, R4); no fire-slot limiting at P1.
- Crew-vs-crew crowding at doorways — R11 contact-halt is the whole rule; no avoidance steering required at P1, but movement must never wedge a crew permanently (deterministic unstuck fallback = hold position; flagged, not designed).
- Dev-overlay AI-state readout — scaffolding like combat-core's dev damage command; dev-gated, never player-facing (HUD is #7).
