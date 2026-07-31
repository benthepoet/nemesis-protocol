# Design Pack — p1-audio-baseline

`DESIGN PACK v1 | feature p1-audio-baseline | design doc v1.19 | goals: G1..G9 | mechanics: M1..M6`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.13 · design doc **v1.18 → v1.19** (bumped doc-first by this pack — rulings R1/R2 numbers landed as two §10 rows; §12.1 audio scope unchanged) · visual direction **v1.10** · feature roadmap **v1.9** (P1 #14; Director ruling R2 post-M-P1 polish block) · branch base: `integration` current (post #10 `p1-deck-polish` merge @ `0084465`) · shipped deps: `p1-project-scaffold` (event plumbing, determinism harness), `p1-player-controller` (motion substrate), `p1-combat-core` v2 (CombatEvent stream), `p1-enemy-baseline` (crew sidearm events, AL0/AL1 stub), `p1-mission-shell` (BRIEFING/INSERTION/SCORE states), `p1-hud` (alarm indicator timing precedent).

**Feature (roadmap P1 #14, Director kickoff 2026-07-31 — chosen ahead of deferred #11 hull exterior and #13 locomotion anim):** the prototype's baseline SFX layer — **render-side presentation over existing sim events, zero sim/rule drift** (design doc §12.1 v1.18 audio note). Scope is the Director's binding list: player footsteps (cadence from sim velocity), rifle fire + crew sidearm fire, projectile surface impacts, shell-UI sounds (breach select, score screen), and a looping ambient ship bed with an AL0→AL1 mix shift. **No new telegraph obligations at P1** — the §6.2/§6.4 audio telegraphs (wall-creak, vacuum muffling) stay P3; music, PA voice (P2 `p2-ship-pa`), and mixing policy beyond the AL bed shift are out of scope.

**Code survey (shipped state, `integration` @ `0084465`) — concrete integration hooks (read-only survey; all consumption is render-side):**

| Hook point | What exists today | Use in this feature |
|------------|-------------------|---------------------|
| `src/combat/types.ts` — `CombatEvent` union | `muzzle` (carries `x/y/z`, `yaw`, `ownerKind` — `PLAYER_KIND` vs `SECURITY_CREW_KIND` distinguishes rifle from sidearm at the source, `src/combat/integrateCombat.ts`) · `impact-wall` (position) · `impact-actor` (position, `targetId`) · `hit-flash` (`targetId` only) | Rifle/sidearm/impact triggers (G2–G4) via the R3 binding table; `hit-flash` is bound to **silence** (R3) |
| `src/app/boot.ts` — `startFrameLoop({ onCombatEvents })` | Events delivered per fixed-timestep slice to the render side; currently consumed by `combatVfx.push(events)` | The audio consumer hangs off the same callback — the established render-side event path; no new plumbing through the sim |
| `src/render/frameLoop.ts` — `runFixedTimestepSlice` | `onCombatEvents` fired once per sim tick batch; a second callback `onCrewAiEvents` (`windup-start`/`windup-end`) exists and is **not consumed** by this feature (R5 — no windup audio telegraph) | Timing semantics: one event batch per tick — sounds trigger within one rendered frame of their sim tick |
| `src/sim/types.ts` — `WorldMeta.alarmLevel` (`0 \| 1`), `alarmTripTick` | AL0→AL1 stub state (`src/ai/alarm.ts` `tripAlarm`); render-side read precedent: `deckLighting.update(dt, world.meta.alarmLevel as 0 | 1)` in `boot.ts` `onFrame` | Bed mix-shift trigger (G6) — polled render-side exactly like the lighting/HUD alarm presentations |
| `src/sim/playerMotion.ts` + `PLAYER_MOVE_SPEED_MPS` (6 m/s) | Motion is ACTIVE-gated (`isGameplayActive`), wall-blocked with axis-slide; entities store **no velocity field** — only position + `moveIntentX/Z` | Footstep cadence derives from render-side **position deltas** (measured displacement), not input intent (R1); no sim change needed |
| `src/render/missionShellUi.ts` + shell meta | BRIEFING focus row driven by `meta.breachSelectIndex`; SCORE by `meta.score`; confirms on the `meta.shellInteractPrev` interact edge; phase in `meta.missionPhase`; `missionShellUi.update(world)` runs every frame in `syncPresentation` | Shell-UI sound triggers (G5) read the same meta-diff pattern render-side (R4) |
| Audio system | **None exists anywhere** (precedent: `p1-gamepad-support` non-goals — "no audio system exists") | Entire layer is new render-side code + new assets; zero sim footprint (G7) |

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | **Player footsteps (M1/M2, R1):** while the player is alive and the mission is ACTIVE, footstep reports are audible at a cadence of **2.2 steps/s at 6 m/s**, scaling linearly with measured sim displacement speed; stationary, wall-blocked, dead, or non-ACTIVE (BRIEFING/INSERTION/SCORE) states produce **zero** footstep sounds | ☐ |
| G2 | **Rifle report (M1/M3):** every player muzzle `CombatEvent` (`ownerKind` = player) produces exactly one rifle report within one rendered frame of its sim tick; sustained 10 rps fire yields 10 reports/s with no dropped or doubled shots; reports stop when the magazine empties / reload blocks fire (mirrors sim exactly) | ☐ |
| G3 | **Crew sidearm report (M1/M3):** every crew muzzle event (`ownerKind` = security crew) produces a sidearm report **sonically distinct** from the rifle (A/B identifiable on a blind listen), triggered at the firing crew member's position | ☐ |
| G4 | **Projectile surface impacts (M1/M3):** every `impact-wall` event produces a surface-impact sound at the hit position; every `impact-actor` event produces a distinct actor-hit sound; `hit-flash` events produce **no** audio (no double-pinging hits) | ☐ |
| G5 | **Shell-UI sounds (M1/M5, R4):** breach-select focus change and breach confirm each produce a UI sound; score-screen appearance and restart confirm each produce a UI sound; **no** gameplay SFX (footsteps, gunfire, impacts) can sound during BRIEFING, INSERTION, or SCORE | ☐ |
| G6 | **Ambient bed + AL mix shift (M1/M4, R2/R7):** a looping ambient ship bed is audible continuously from first user interaction through the score screen; on the AL0→AL1 trip the bed crossfades calm→alert layer over **1.5 s**, starting within one sim tick of the trip (the `p1-hud` indicator's timing precedent); the shift never de-escalates; restart returns the bed to the calm layer on the fresh sim | ☐ |
| G7 | **Zero sim drift (M6):** the `CombatEvent` union, all sim state, and all sim numbers are unchanged; replay determinism holds — identical command streams produce identical world hashes with audio enabled; every shipped sim/input/mission test suite passes unmodified; the audio path holds no sim writes and no sim-readable state | ☐ |
| G8 | **Presentation-only conformance (M1, R5/R6):** no unlisted sounds exist — no windup cue, no reload, no door/airlock, no death, no hit-reaction, no crew footsteps, no alarm klaxon, no HUD sounds; the VD §6 visual families remain the binding telegraphs (audio adds no telegraph obligations); zero visual changes — HUD set, shell screens, palette untouched | ☐ |
| G9 | **License clean (charter §1/§3 Stage 5; assets/AGENTS.md):** every shipped audio asset is original or CC0/CC BY with attribution logged in `assets/audio/p1_attribution.md`; Gate 1 license scan finds no third-party copyrighted audio in any shipped/build path | ☐ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | **P1 baseline SFX layer** (the feature): render-side presentation over existing sim events — footsteps, rifle + crew sidearm fire, surface impacts, shell-UI sounds (breach select, score screen), looping ambient bed with AL0→AL1 mix shift; model numbers per §10 v1.19 (cadence 2.2 steps/s @ 6 m/s; crossfade 1.5 s one-way). **No new telegraph obligations** — VD §6 visual families remain the binding telegraphs | §12.1 audio note (v1.18); §10 v1.19 rows |
| M2 | Player locomotion substrate (restated — **unchanged**): 6 m/s move speed, ACTIVE-gated motion, wall-blocked with slide; footstep cadence *reads* this — it changes nothing about it | §10 (crew speeds row: "chase < player 6 m/s"); §8 move verb |
| M3 | Combat event surfaces (restated — **unchanged**): rifle 25 dmg @ 10 rps auto, magazine 30 + auto-reload on empty, reload 2.0 s uninterruptible; crew sidearm 1 shot/0.9 s with 0.5 s wind-up; projectile 60 m/s / 60 m; the shipped `CombatEvent` union is the trigger vocabulary — **no new events are added** | §10 rifle/sidearm/projectile rows; `p1-combat-core` v2 |
| M4 | AL0/AL1 alarm stub (restated — **unchanged**): two-state stub, trip rules (player shot / detection / crew damage), converge-only AL1 effect, **never de-escalates at P1** — the bed shift mirrors this exactly, one-way | §4 v1.14 prototype scoping note |
| M5 | Mission shell states (restated — **unchanged**): BRIEFING (two-breach select) → INSERTION (5.0 s airlock cycle, verbs locked) → ACTIVE → COMPLETE/FAILED → SCORE → restart on fresh sim; shell-UI sounds are presentation over these existing transitions | §3 v1.15 prototype scoping note; §10 player-death row |
| M6 | Netcode-ready architecture (non-negotiable): command-pattern inputs, deterministic sim ticks, stable IDs — audio is strictly render-side; nothing in the audio path may write to, or be read by, the sim | §12.1 |

**Design rulings (new, this pack):**

- **R1 — Footstep cadence model: measured displacement, never input intent.** Cadence derives from the player's actual sim displacement (render-side position deltas), so wall-slides slow the step rate and blocked movement produces silence — phantom footsteps against a wall read as a bug, not as texture. Default **2.2 steps/s at the 6 m/s cap** (≈2.7 m stride — a deliberate boarding pace, not a jog), linear in speed, silent below ~0.5 m/s. Rate is a tuning lever (R8). *(Doc change: yes → §10 row, v1.19.)*
- **R2 — Bed mix shift semantics: two-layer crossfade, one-way.** The bed is two loop layers — calm (AL0) and alert (AL1). The AL0→AL1 trip starts a **1.5 s** equal-power crossfade to the alert layer; the shift is one-way (the stub never de-escalates, so the bed never de-escalates); a fresh sim (restart) returns to the calm layer. The bed shift is the *entire* alarm audio at P1 — no klaxon, no stinger. Crossfade time is a tuning lever (R8). *(Doc change: yes → §10 row, v1.19.)*
- **R3 — Event→sound binding table (the whole vocabulary).** `muzzle` + `ownerKind` = player → **rifle report**; `muzzle` + `ownerKind` = security crew → **sidearm report**; `impact-wall` → **surface impact**; `impact-actor` → **actor hit**; `hit-flash` → **silence** (it is a redundant presentation event on the same hit — sounding it would double-ping every actor impact). No other event binding exists. *(Doc change: no — a reading of the §12.1 list over the shipped event union.)*
- **R4 — Shell-UI trigger reading.** Focus-move = `breachSelectIndex` change while BRIEFING; breach confirm = the shell interact edge (`shellInteractPrev`) that leaves BRIEFING; score-appear = transition into SCORE; restart confirm = the interact edge that leaves SCORE. All are render-side meta diffs — the same pattern `missionShellUi.update` already uses. *(Doc change: no.)*
- **R5 — The no-new-telegraph rule enforced by omission.** Anti-assumption applied to audio: a sound not in the §12.1 list **does not exist**. Explicitly: no crew wind-up cue (the wind-up telegraph stays visual-only; `onCrewAiEvents` is not consumed), no reload sound, no airlock/door sound, no death sound, no hit-reaction vocal, no crew footsteps, no objective-complete sting, no HUD sounds. The §6.2 wall-creak and §6.4 vacuum-muffling telegraphs remain P3 scope and arrive with their mechanics. *(Doc change: no.)*
- **R6 — Audibility baseline, not mixing policy.** World SFX (gunfire, impacts, footsteps) use simple distance attenuation against the follow-camera listener so near events read louder than far ones — the minimum for a coherent top-down read. This is explicitly **not** the deferred mixing policy: no buses, no ducking, no occlusion/obstruction modeling, no priority system, no per-source tuning tables. Vacuum muffling/occlusion is P3 (§6.4). *(Doc change: no.)*
- **R7 — Bed lifecycle.** The bed is the ship, not a gameplay state: it loops across all mission states including BRIEFING and SCORE, with no per-screen music or stingers (music is out of scope). Browser autoplay unlock (first user gesture) is a technical concern — Grok's call; the design contract is that the bed is audible from the earliest permitted moment. *(Doc change: no.)*
- **R8 — Tuning levers reserved.** Cadence rate (2.2 steps/s), crossfade time (1.5 s), and per-asset trim levels are P1-checkpoint playtest levers routed through §3.5a. No in-game volume controls exist (no options menu — `p1-hud` explicit-absent list); none are added.

**Explicit non-goals (do not build):**

- **Music of any kind** — including score-screen stingers; **PA voice** — P2 `p2-ship-pa`.
- **Mixing policy beyond the AL bed shift** — buses, ducking, occlusion, priorities, volume/options UI (R6/R8).
- **P3 audio telegraphs** — wall-creak (§6.2), vacuum muffling/silence (§6.4); they ship with their mechanics.
- **Any unlisted SFX (R5)** — reload, doors/airlock, deaths, hit reactions, crew footsteps, wind-up cues, klaxons, objective stings, HUD sounds.
- **Any sim change** — no new events, fields, numbers, or mechanics (G7); no haptics/rumble; no spatialization beyond R6 distance attenuation.
- **Any visual change** — HUD set, shell screens, palette, and VD telegraph hierarchy are untouched.
- **Persisted audio settings** — no settings exist to persist.

## Rule spec

1. **§12.1 v1.18 audio note — the binding scope, verbatim intent.** Baseline SFX as render-side presentation over existing sim events with **zero sim/rule drift**: footsteps (cadence from sim velocity), rifle + crew sidearm fire, surface impacts, shell-UI sounds (breach select, score screen), looping ambient bed with AL0→AL1 mix shift. No new telegraph obligations at P1; §6.2/§6.4 audio telegraphs stay P3; music, PA voice, and mixing policy beyond the bed shift are out of scope. The Director's kickoff restated this list as binding — this pack does not expand it.
2. **§10 v1.19 audio rows (R1/R2 numbers).** Footstep cadence 2.2 steps/s @ 6 m/s, linear in actual displacement, zero at rest/blocked/dead/non-ACTIVE; alarm bed crossfade 1.5 s, one-way, fresh-sim reset. Both are presentation-only tuning levers.
3. **§4 v1.14 stub (M4).** AL0→AL1 trips on first player shot / detection / crew damage; never de-escalates at P1. The bed shift inherits this timing and one-way behavior — it is a *mirror*, not a new alarm mechanic.
4. **§4 v1.16 timing precedent.** The HUD alarm indicator flips within one tick of the trip; the bed crossfade starts within the same one-tick envelope (G6).
5. **§3 v1.15 shell note (M5).** BRIEFING = minimal two-option breach select; INSERTION = 5.0 s airlock cycle, all verbs locked; mission end → SCORE; restart = fresh sim. UI sounds attach to these transitions only; the verbs-locked INSERTION window is sim-guaranteed silent (G5).
6. **§12.1 netcode-ready mandate (M6).** Audio consumes sim output read-only at the render boundary (the shipped `onCombatEvents` path and meta polling); replay of a command stream reproduces identical world state with audio active; render-side randomness (e.g., round-robin variant pick) must never feed the sim (G7).
7. **Licensing (charter §1; assets/AGENTS.md).** Shipped audio is original or built from CC0/CC BY sources with attribution logged (`assets/audio/p1_attribution.md`); web reference material is index-only in `references/references.md` — never shipped, never committed beyond the index (and `references/cleared/` for license-clean files); Gate 1 runs the license scan (G9).
8. **Scope guard (anti-assumption).** A sound not reachable from the R3/R4 binding tables does not exist: any additional SFX, telegraph, music cue, UI sound, or sim event in the PR is a Gate 1 blocker.

## Prereq assets

*Blocking dependency for Stage 3 (charter §3 Stage 1 gate). Reference-first: board index at `features/p1-audio-baseline/references/references.md` (Boards G/H) — gathered before asset production; index-only commit policy per charter v1.11. Source policy: CC0 / CC BY / original synthesis only, attribution logged in `assets/audio/p1_attribution.md` (G9). Naming per assets/AGENTS.md rule 3: phase-prefixed, human-readable. Variants exist to prevent machine-gun artifacting at 10 rps — round-robin selection is render-side (rule spec 6).*

| Asset (assets/audio/) | Count | Drives | Source | Status |
|-----------------------|-------|--------|--------|--------|
| `p1_sfx_rifle_fire_01..03` | 3 variants | G2 (R3: player muzzle) | CC0 source or original synth — sharp mid-caliber report, short tail; reads at 10 rps without smearing | pending |
| `p1_sfx_sidearm_fire_01..03` | 3 variants | G3 (R3: crew muzzle) | CC0/original — lighter, higher crack; A/B-distinct from the rifle family | pending |
| `p1_sfx_impact_wall_01..03` | 3 variants | G4 (R3: impact-wall) | CC0/original — metal bulkhead hit, brief; not explosive | pending |
| `p1_sfx_impact_actor_01..02` | 2 variants | G4 (R3: impact-actor) | CC0/original — soft body-hit thud; distinct from wall family | pending |
| `p1_sfx_footstep_01..04` | 4 variants | G1 (R1 cadence) | CC0/original — boot on deck plate; short, dry, loopable at 2.2 steps/s without fatigue | pending |
| `p1_sfx_ui_focus_01` | 1 | G5 (R4: focus move) | CC0/original — restrained console tick; VD-shell chrome character | pending |
| `p1_sfx_ui_confirm_01` | 1 | G5 (R4: breach confirm + restart confirm) | CC0/original — committed mechanical engage; shared by both confirms | pending |
| `p1_sfx_ui_score_appear_01` | 1 | G5 (R4: SCORE entry) | CC0/original — neutral readout-present sweep; not a music sting (R5) | pending |
| `p1_bed_ship_calm_loop` | 1 (seamless loop) | G6 (R2: AL0 layer) | CC0/original — low room-tone: HVAC, distant machinery, hull stress; dread through restraint (VD §1 lineage) | pending |
| `p1_bed_ship_alert_loop` | 1 (seamless loop) | G6 (R2: AL1 layer) | CC0/original — same bed tensed: added ventilation load, distant klaxon-adjacent pulse *texture* (not a klaxon — R2), raised energy floor | pending |
| `p1_attribution.md` | 1 | G9 | authored index — per-asset source + license + attribution line | pending |

*No Blender work this feature (audio-only). Loops must be authored gapless; final container format is Grok's spec call (design constraint: seamless looping, see open questions).*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | Scripted ACTIVE run with position capture: full-speed strafe → measured step rate 2.2 ±0.1 steps/s; half-speed wall-slide → rate scales down proportionally; push into a wall at full intent → **silence**; stand still → silence; INSERTION cycle (verbs locked) → silence even with move input held |
| G2 | Scripted 3 s hold-fire capture (ACTIVE, full magazine): exactly 30 rifle reports, one per shot, none during the auto-reload window after the magazine empties; trigger-tap single shots → exactly one report each; event-to-sound latency ≤ 1 rendered frame (capture-review) |
| G3 | Blind A/B on captured clips: rifle vs sidearm correctly identified 10/10 by a listener who hasn't seen the build; crew fire capture → one sidearm report per crew muzzle event (match against `combatReadout`/event log count) |
| G4 | Scripted capture: 5 wall hits → 5 surface impacts; 5 actor hits → 5 actor-hit sounds (wall and actor families distinguishable); `hit-flash` adds no second sound on actor hits (count = impact events, not flashes); impacts audible at the hit position (far impact quieter than near — R6) |
| G5 | Full-loop capture: BRIEFING focus toggle → focus tick per move; confirm → confirm sound; airlock cycle → silent gameplay layer; SCORE entry → score-appear sound; restart confirm → confirm sound; no footstep/gunfire/impact audio anywhere outside ACTIVE |
| G6 | Capture from mission start: bed audible continuously across BRIEFING → INSERTION → ACTIVE → SCORE; fire one shot (trip AL1) → alert layer fades in, full within ~1.5 s of the trip tick (±1 tick start); bed never returns to calm before mission end; restart → calm layer from mission start |
| G7 | Replay/determinism harness (established pattern): identical command stream twice with audio enabled → identical world hash; hash differs when commands differ; full shipped test suite passes unmodified; diff audit: zero changes under `src/sim/`, `src/combat/`, `src/ai/`, `src/mission/`, `src/input/` semantics (import-only at most); `CombatEvent` union byte-identical |
| G8 | Asset/code audit against the R3/R4 binding tables: every shipped sound file is reachable from exactly one binding; event log during a full mission shows no unlisted trigger; VD telegraph families render unchanged (regression screenshots at the 60° rig vs `0084465` baseline); HUD inventory unchanged (five readouts, shell screens identical) |
| G9 | `assets/audio/p1_attribution.md` lists every shipped file with source + license (CC0/CC BY/original); license scan: no third-party copyrighted audio in `assets/audio/`, build output, or shipped paths; `references/` contains the index (+ any `cleared/` files) only |

**Screenshot/audio check plan (Gate 1 evidence package):** four captured clips with audio, archived in this folder alongside the visual-pass evidence precedent — (a) `gate1-briefing-score.*` full shell loop; (b) `gate1-footsteps.*` the G1 movement battery; (c) `gate1-firefight.*` sustained rifle + crew engagement with wall and actor impacts; (d) `gate1-alarm-shift.*` quiet start → first shot → bed shift → SCORE. Plus the G7 hash transcripts and the G9 attribution index. Clips are evidence only — never shipped assets.

## Open questions anticipated for Stage 2 (clarification loop §3.2a)

None blocking — R1–R8 pre-rule the expected design conflicts. Topics Grok may still raise, with my positions:

- **Audio backend & asset format** (Web Audio graph vs three.js audio nodes; WAV vs OGG) — Grok's call entirely; design constraints: loops must be gapless, event-to-sound latency ≤ 1 rendered frame (G2), render-side only (G7).
- **Variant selection randomness** — round-robin or render-side random pick is fine; it must never touch the sim RNG or any sim-readable state (rule spec 6).
- **Listener placement** — the follow camera is the listener (R6); debug-fly camera uses itself as listener; no design consequence either way.
- **Autoplay unlock gesture** — first user interaction on BRIEFING (R7); mechanism is Grok's; the contract is "bed audible from the earliest permitted moment."
- **SFX concurrency caps** (many simultaneous impacts) — a technical performance guard is acceptable as long as every *event* still produces an audible report (G2/G4 counts hold); dropping reports to a cap is a spec defect unless Kimi rules otherwise via the loop.
- **Headphone/stereo panning** — minimal stereo width from listener-relative position is within R6's audibility baseline; anything fancier (HRTF, convolution) is the deferred mixing policy.
