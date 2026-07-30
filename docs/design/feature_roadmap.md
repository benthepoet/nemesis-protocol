# Feature Roadmap — Nemesis Protocol

**Purpose:** the phase→feature breakdown. Each feature below is one pipeline instance (charter §3): one design pack, one spec, one branch/PR, one Gate 1 + Gate 2.
**Granularity rule:** a feature is the smallest unit that can be independently gated. Target 3–8 features per phase; if a feature can't pass Gate 1 alone, it's too small; if it needs two design packs, it's too big.
**Status:** v1.7 — P1 #1–#5 shipped (Gate 2 through 2026-07-30); phase visual-pass policy (Director ruling R1, 2026-07-30): one terminal visual-pass feature per phase; P1 #9 appended; P2–P4 visual-pass rows scoped

> **Director ruling (v1.2):** P1 is **solo-first**. Netcode is targeted for the P2–P3 window, and every P1 feature must satisfy the netcode-ready architecture mandate (design doc §12.1): command-pattern inputs, deterministic sim ticks, no frame-rate-coupled logic, stable entity IDs. Grok's scaffold spec (p1-project-scaffold) carries this as a primary goal.

> **Director ruling R1 (v1.7, 2026-07-30) — Phase Visual Milestone:** every phase P1–P4 ends with a scheduled **visual-pass feature** (`pN-visual-pass`) as its terminal row. Trigger: Director feedback "this still looks primitive" — presentation uplift is now per-phase, not prototype-end.
> - A visual pass is a **normal pipeline instance** (Stage 0–5: design pack, spec, branch/PR, Gate 1 + Gate 2) that **depends on all of its phase's functional features** and ships **no new mechanics** — presentation only.
> - **Gate 1 bar:** the universal bar + per-phase milestone (M-P1…M-P4) defined in `visual_direction.md` §11 — verified in the running build.
> - **Phase checkpoint rule:** a phase checkpoint (charter §8) is signed only when the phase's visual pass is Gate-2 accepted — functional exit criteria AND the visual milestone both hold. There is **one** phase checkpoint; the visual pass is its closing feature, which also gives the Director a dedicated Gate 2 review moment focused purely on presentation at each phase end.
> - **Protection of accepted work:** a visual pass may not alter any accepted G#, number, or rule; anything that does routes as a separate feature. Functional features earlier in the phase are never blocked by the visual pass — it is terminal, not gating.

---

## Phase model

| | Phase | Feature |
|---|---|---|
| **Container** | Roadmap milestone (P1–P4) | One slice of a phase |
| **Artifacts** | Prereq asset set, phase checkpoint | `features/p<phase>-<slug>/` (pack, spec, logs) |
| **Branch/PR** | — | `feat/<phase>-<slug>` + 1 PR |
| **Acceptance** | Director phase checkpoint (charter §8) | Gate 1 (Kimi) + Gate 2 (Director) |
| **Ordering** | Sequential per design doc §12.5 | Within a phase: by dependency below |

---

## P1 — Single-Deck Core Loop

*Goal: a playable deck — move, shoot, fight enemies, enter and exit the ship. No gating, no destructibility.*

| # | Slug | Feature | Mechanics (design doc) | Depends on |
|---|------|---------|------------------------|------------|
| 1 | `p1-project-scaffold` ✅ shipped | three.js project setup (WebGL2/WebGPU), build pipeline, input plumbing, `master` repo conventions per charter §6 | — (technical enabler; G# defined in its design pack) | — |
| 2 | `p1-deck-geometry` ✅ shipped | Deck 03 as playable level: room graph from the reference layout, wall-class data (A/B/C), collision, spawn-safe entry rooms | §7 topology model, §6.1 wall classes | 1 |
| 3 | `p1-player-controller` ✅ shipped | Angled top-down movement + aim, ~60° pitch camera rig (cutaway-ready, §7 rule 6), interaction verb | — (foundation; goals set in pack) | 2 |
| 4 | `p1-combat-core` ✅ shipped | Firearms, projectiles, damage, health/death for player + enemies, ammo | §9 tuning (damage baselines) | 3 |
| 5 | `p1-enemy-baseline` ✅ shipped | Security crew infantry AI (patrol → investigate → chase → attack); basic spawner; alarm stub (AL0/AL1 only) | §4 (AL0–AL1), §4.5 roster | 4 |
| 6 | `p1-mission-shell` | Airlock entry sequence, objective placeholder ("reach Engineering"), mission end + score screen | §3 Phase 0–1 (shell only) | 2, 5 |
| 7 | `p1-hud` | Health, ammo, objective line, alarm indicator stub; full gamepad UI navigation | §4 (indicator), §3 | 6 |
| 8 | `p1-gamepad-support` | First-class gamepad: full action parity, twin-stick aim + aim-assist (§9), hot-swap mid-mission, UI navigation | §8 (input parity), §9 | 3, 4 |
| 9 | `p1-visual-pass` | Phase visual milestone **M-P1** (visual_direction §11): hero models for player/rifle/security crew replace all capsules & blockout weapons; deck PBR materials + authored wear + section accent trim; lighting rows AL0/AL1 live (keys, practicals, contact shadows, corridor haze); muzzle/impact VFX family complete; HUD skinned to palette; §7 readability verified | visual_direction §3–§7, §11 | 5, 6, 7, 8 |

**P1 exit criteria (phase checkpoint):** Director can breach, traverse the full deck, fight, reach Engineering, and exit — end to end, one deck, **on either input device without touching a menu** — **and** `p1-visual-pass` is Gate-2 accepted (milestone M-P1, visual_direction §11). Per ruling R1 the checkpoint is signed only when both hold.

---

## P2 — Gating & Alarm

*Goal: the mission structure exists. No straight lines.*

| # | Slug | Feature | Mechanics | Depends on |
|---|------|---------|-----------|------------|
| 1 | `p2-alarm-director` | Full alarm ladder AL0–AL3 + meltdown; spawn budgets; converge behavior | §4 | P1 |
| 2 | `p2-lockdown` | Blast doors seal on alarm; section lockdown units | §3 Phase 2, §6.1 Class B | 1 |
| 3 | `p2-cic-slice` | Key A — CIC security override (20 s defended hack) | §3 Phase 2–3 | 2 |
| 4 | `p2-coolant-vent` | Key B — coolant vent interaction; ≤30 s two-key window; solo decay fallback | §3 Phase 3, §9 | 3 |
| 5 | `p2-reactor-arming` | Aft gate opens; charge placement + 90 s arming hold-out waves | §3 Phase 4 | 4 |
| 6 | `p2-extraction` | Escape timer, original breach sealed, repopulation, alternate extraction point, manual-crank door beat | §3 Phase 5 | 5 |
| 7 | `p2-ship-pa` | Ship PA announcement system (telegraph channel for gates, alarm, bosses later) | §9.1 rule 4 | 1 |
| 8 | `p2-visual-pass` | Phase visual milestone **M-P2** (visual_direction §11): blast doors/gates + objective props (charge, slicer/key stations) as hero assets with the `#ffd54f` language; lighting rows AL2/AL3/Meltdown/Reactor-proximity live with visible state spread; reactor VFX family; PA/alarm telegraph treatment | visual_direction §3–§6, §11 | 1, 2, 3, 4, 5, 6, 7 |

**P2 exit criteria:** full mission loop playable start → extraction with gating; a speedrun straight to the reactor is impossible — **and** `p2-visual-pass` is Gate-2 accepted (milestone M-P2, visual_direction §11).

---

## P3 — Destructibility & Depressurization

*Goal: geometry becomes negotiable.*

| # | Slug | Feature | Mechanics | Depends on |
|---|------|---------|-----------|------------|
| 1 | `p3-wall-damage` | Class A wall HP, chip damage, cracked/failed stages + telegraphs | §6.2 | P1 (deck data), P2 |
| 2 | `p3-breach-pathing` | Holes passable both ways; player + enemy pathing through breaches; noise draws investigation | §6.3, §6.5 | 1 |
| 3 | `p3-hull-breach` | Class C explosion rule (≤4 m, yield, 60% roll), hull rip event | §6.4 | 1 |
| 4 | `p3-venting` | 5 s suction phase, actor/object pull, loss-to-space, emergency curtain + manual patch | §6.4 | 3 |
| 5 | `p3-vacuum-tax` | Depressurized zone aftermath: 5 HP/s, no audio telegraphs, no healing; tax-never-block enforcement | §6.4 ruling, §9 | 4 |
| 6 | `p3-meltdown-hazards` | Extraction-time degradation: fires, venting sections, lighting/gravity events, cascading curtains | §3 Phase 5, §6.6 | 5, P2 |
| 7 | `p3-visual-pass` | Phase visual milestone **M-P3** (visual_direction §11): Class A wall `intact/cracked/failed` material states with readable crack telegraph; sparks/debris, wall-failure, hull-breach, venting, curtain-seal VFX families complete; vacuum-zone lighting row live | visual_direction §5, §6, §11 | 1, 2, 3, 4, 5, 6 |

**P3 exit criteria:** a wall can be tunneled, the hull can be ripped, vacuum taxes but never soft-locks; validator rule (e) holds in generated tests — **and** `p3-visual-pass` is Gate-2 accepted (milestone M-P3, visual_direction §11).

---

## P4 — Androids & Prototype Bosses

*Goal: the ship gets an immune system and two bosses.*

| # | Slug | Feature | Mechanics | Depends on |
|---|------|---------|-----------|------------|
| 1 | `p4-android-unit` | Android base: vacuum-rated, armored, ship-access traversal (ignores lockdown, respects walls) | §6.7 | P3 |
| 2 | `p4-android-directives` | HUNT→SEAL priority, rack deployment (2 units, 10 s boot), seal vulnerability window, finite budget | §6.7, §9 | 1 |
| 3 | `p4-rack-destruction` | Racks destructible in advance; §5 modifier (venting tactics unlocked) | §5, §6.7 | 2 |
| 4 | `p4-boss-charge-defender` | Phase 4 heavy that channels disarm on the charge; interrupt window | §9.2, §9.3 | P2, 1 |
| 5 | `p4-boss-warden` | Elite stalker android: AL3/rack-revenge deploy, seals player-made holes, exposed core while sealing | §9.2, §9.3 | 2, P3 |
| 6 | `p4-meltdown-deploy` | Charge armed → all remaining androids deploy; extraction gauntlet | §6.7 meltdown | 4, 5 |
| 7 | `p4-visual-pass` | Phase visual milestone **M-P4** (visual_direction §11): android + rack hero models, eye-slit glow telegraph + wake vapor; distinct boss silhouettes; meltdown-fires VFX family (real light, smoke columns, ember advection); full lighting matrix complete end-to-end | visual_direction §5, §6, §11 | 1, 2, 3, 4, 5, 6 |

**P4 exit criteria:** prototype complete per design doc v1.6 scope; playtest data collection begins — **and** `p4-visual-pass` is Gate-2 accepted (milestone M-P4, visual_direction §11), so the prototype closes at full visual-direction conformance.

---

## Rules for using this roadmap

1. **P1 is fixed for shipped rows.** ✅ rows are never removed or rewritten. New P1 rows may only be **appended** by Director ruling (rule 2) — e.g., ruling R1 appended #9 `p1-visual-pass`. P2–P4 rows are scoped, not final — Kimi re-confirms each phase's feature list during that phase's pre-phase (Stage 1), folding in defect-log (S2/S3) and tuning fallout from prior phases.
2. **New features are added only by the Director at Stage 0 kickoff** and appended here first — this file is the backlog.
3. **Defects never become features** — they route through charter §7 severity paths.
4. Post-prototype phases (multi-deck, stations) are intentionally absent — see design doc §12.5 sequencing.
