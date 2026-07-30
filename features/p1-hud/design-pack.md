# Design Pack — p1-hud

`DESIGN PACK v1 | feature p1-hud | design doc v1.16 | goals: G1..G9 | mechanics: M1..M8`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.13 · design doc **v1.16** (bumped doc-first from v1.15 by this pack — rulings R1/R2/R4/R5 landed in §4 note, §10 rows, §12.1 HUD baselines) · visual direction **v1.6** (bumped doc-first from v1.5 by this pack — R7/M8 §3 UI application note) · feature roadmap **v1.8** (bumped from v1.7 by this pack — R6 rows #7/#8 scope split) · shipped deps: `p1-mission-shell` (mission state machine BRIEFING→INSERTION→ACTIVE→COMPLETE|FAILED→SCORE, transient objective banner, score screen, breach select), `p1-combat-core` v2 (HP/magazine/reserve/reload sim state, no persistent HUD chrome by design), `p1-enemy-baseline` (AL0/AL1 alarm stub, DEV readout `combatDevReadout`).

**Feature (roadmap P1 #7):** health, ammo, objective line, alarm indicator stub, mission clock as persistent HUD chrome — plus in-HUD focus and gamepad/KBM navigation for the shell/mission UI that already exists (breach select, score screen). Depends on #6 ✅. Today all player-state reads live in the DEV readout (`combatDevReadout`, dev tooling); after this feature the player has a real HUD presenting sim state the game already tracks. Presentation-only: **zero sim changes, zero tuning changes.**

**Scope split vs #8 `p1-gamepad-support` (Director kickoff tension, resolved by R6):** roadmap row #7's "full gamepad UI navigation" is read as **navigation of UI that exists** — HUD focus + the shipped shell/mission screens. Row #8 owns **gameplay-side gamepad**: twin-stick aim quality + aim-assist (§10: 0.35 magnetism, 10° cone), input-device hot-swap mid-mission, gameplay action parity gaps, and navigation for any new UI #8 introduces. Non-goals below make the split explicit.

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | HUD chrome exists (M6, R1): a persistent render-only overlay presents **exactly five readouts** — health, ammo, objective line, alarm indicator, mission clock — visible during mission states **INSERTION and ACTIVE**, and not visible during **BRIEFING** and **SCORE** (shell screens own those states per `p1-mission-shell`); no sixth HUD element exists | ☑ |
| G2 | Health readout (M1, R2): shows current player HP of 100, live (≤1 tick lag behind sim); presentation is allied `#69f0ae` above the low-health threshold and pulses hazard `#ff5252` at **≤25 HP**; scripted damage (combat or `debugDamage`) is reflected exactly; HP 0 is shown at death until SCORE takes over | ☑ |
| G3 | Ammo readout (M2, R3): shows magazine/reserve as integers (`30 / 120` at mission start), live on fire, on reload completion, and on auto-reload start (empty-mag trigger pull); a **RELOADING** state with progress over the 2.0 s reload shows while reloading; an empty magazine (0) is distinctly readable | ☑ |
| G4 | Objective line (M3): a persistent text line shows the current objective — empty before issue; **"Reach Engineering"** from door-open (issue tick) until mission end; the shipped transient banner (mission-shell R3, 180 ticks) is unchanged and coexists; no second objective line is ever issued at P1 | ☑ |
| G5 | Alarm indicator (M4, R4): shows the current alarm level as **label + numeral** from the §4 level names — `AL0 UNAWARE` / `AL1 ALERTED`; AL0 presentation is dim/neutral, AL1 is hazard `#ff5252`; the indicator flips within 1 tick of the trip and never de-escalates (mirrors the stub); labels are data-driven — AL2+/MELTDOWN names exist in the label table for forward compatibility but are unreachable at P1 | ☑ |
| G6 | Mission clock (M5, R5): a live `M:SS` clock sourced from sim tick 0 displays during INSERTION + ACTIVE; its value at the end-state tick equals the mission time shown on the score screen (same sim source) | ☑ |
| G7 | Shell/mission UI navigation + focus (M7, R6): every existing shell screen (breach select, score screen) shows a **visible focus target** (interactive `#ffd54f`, visual §3 v1.6) and is fully traversable on **both devices** — move verb navigates, interact confirms, cancel backs out where a back exists (§8 v1.12 mapping, unchanged); identical navigation outcomes are driven from gamepad-mapped and keyboard/mouse-mapped command streams; no new bindings are introduced | ☑ |
| G8 | Presentation conformance (M8): chrome base in the void `#05080f` family; palette roles per visual §3 v1.6 UI application note (player state allied, alarm/danger hazard, focus interactive — meanings never crossed); HUD is screen-edge anchored so the center gameplay plane stays unobstructed; in an AL1 firefight at the 60° rig the HUD never occludes enemy telegraphs (wind-up pre-glow, hostile tracers) in center frame; blockout fidelity — skinning is `p1-visual-pass` (#9, M-P1) | ☑ |
| G9 | Determinism preserved (§12.1): the HUD is render-only with zero sim coupling; identical command streams produce identical world hashes with the HUD enabled or disabled; no frame-rate-coupled or unseeded-random logic in any HUD path | ☑ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | Player health model (display only): HP 100, no passive regen, death = mission FAILED (v1.15 fail flow); the HUD reads existing sim HP — no healing, no regen, no new damage rules | §10 (player HP); §10 v1.15 fail row |
| M2 | Ammo/reload model (display only): magazine 30, reserve 120, reload 2.0 s **uninterruptible**, auto-reload on empty-mag trigger pull; the HUD reads magazine/reserve/reload-timer sim state — no ammo pickups, no cancel, no tuning change | §10 v1.12 combat rows |
| M3 | Objective placeholder (restated for integration — **unchanged** from `p1-mission-shell` M4/R3): "Reach Engineering," issued at door-open, completed by living player entering Engineering; the persistent objective line is new presentation over the same objective state; the transient banner stays | §3 v1.15 scoping note |
| M4 | Alarm stub AL0/AL1 (display only — semantics **unchanged** from `p1-enemy-baseline` R7): two states; trips on first player shot / crew detection / crew damage; never de-escalates; the indicator is presentation over `alarmLevel` sim state and adds no stealth/alarm mechanics | §4 rows 0–1 + v1.14 note + **v1.16 indicator note** |
| M5 | Mission clock: sim-sourced clock from tick 0 (already the score-screen source); in-mission display format `M:SS` | §10 mission clock row (v1.15 + **v1.16** format) |
| M6 | Mission state machine (governs HUD visibility): BRIEFING → INSERTION → ACTIVE → COMPLETE\|FAILED → SCORE; HUD visible only in INSERTION/ACTIVE; shell screens own BRIEFING/SCORE | §3 v1.15 scoping note; mission-shell G1 |
| M7 | Shell-screen input parity + verb mapping (restated — **unchanged** from mission-shell M8/R8): move verb (WASD / left stick) navigates, interact (E / face-south) confirms, cancel (Esc / face-east) backs out where a back exists; fire owns the primary trigger — confirm is never fire; shell inputs are deterministic commands through the same pipeline; **focus visibility** is the new presentation layer | §8 + v1.12 binding table; §12.1 |
| M8 | HUD presentation standard: palette roles per visual §3 including the **v1.6 UI application note** (allied = player state, hazard = alarm/danger, interactive `#ffd54f` = UI focus, void `#05080f` chrome); screen-edge anchoring keeps the gameplay plane clean (visual §7 rule 1 analog for chrome); telegraphs remain world-space (visual §7 rule 7) — the HUD is readout chrome, never a telegraph; blockout fidelity pending M-P1 skinning | visual §3 (+v1.6 note), §7 rules 1/7; visual §8 standards |

**Design rulings (new, this pack):**

- **R1 — Element set and visibility lifecycle.** Exactly five readouts: health, ammo, objective line, alarm indicator, mission clock. Visible during INSERTION and ACTIVE (the player is in the world, verbs locked or not); hidden during BRIEFING and SCORE where shell screens own presentation (mission-shell G2/G6). INSERTION inclusion is deliberate: HP/ammo visible during the airlock cycle anchors the cycle as in-world, not a menu. *(Doc change: yes — §12.1 HUD baselines note, v1.16.)*
- **R2 — Low-health warning threshold: ≤25 HP.** At or below 25 HP the health element pulses hazard `#ff5252`; above it the element is allied `#69f0ae`. This is presentation over existing HP state — the player HP model (100, no regen) is untouched. 25 HP = one-quarter of max, one crew sidearm magazine of incoming damage — legible as "one bad engagement from death" without inventing a regen/shield fiction. *(Doc change: yes — §10 row, v1.16.)*
- **R3 — Reload readout is progress, not a new verb.** While the 2.0 s uninterruptible reload runs, the ammo element shows RELOADING with progress fraction of the reload timer (sim state). No cancel, no partial-mag rule, no tuning change — v1.12 semantics stand exactly.
- **R4 — Alarm indicator form: name + numeral, data-driven.** Label = §4 level name (`UNAWARE` / `ALERTED`) with numeral (`AL0` / `AL1`), from a level-label table keyed by alarm level. AL0 = dim/neutral (all-is-quiet is ambient information, not a warning); AL1 = hazard `#ff5252`. AL2+/MELTDOWN labels exist in the table for forward compatibility but are **unreachable and untestable** at P1 — the stub's two states are the whole contract. The indicator adds no alarm mechanics (anti-assumption against myself). *(Doc change: yes — §4 v1.16 note.)*
- **R5 — Clock format `M:SS`, one source.** The in-mission clock and the score-screen mission time read the same sim source (tick 0). Format minutes:seconds — raw ticks are dev-readout vocabulary, not player vocabulary (mission-shell Gate 1 finding M-n2 flagged tick units on the score screen; the HUD must not repeat that). *(Doc change: yes — §10 mission clock row, v1.16.)*
- **R6 — #7/#8 scope split (Director kickoff tension).** #7 owns: HUD presentation (G1–G6, G8) **and** in-HUD/shell focus + navigation for UI that already exists (breach select, score screen — G7). #8 `p1-gamepad-support` owns: twin-stick aim quality + aim-assist (§10: 0.35 magnetism, 10° cone — "tune in P1 playtest"), input-device **hot-swap mid-mission** robustness, gameplay action-parity gaps (any verb not fully bound on gamepad), and navigation for any **new** UI #8 introduces. Roadmap rows #7/#8 clarified to match (roadmap v1.8). #7 introduces no new bindings and touches no aim/hot-swap logic.
- **R7 — No new HUD mechanics.** Explicitly not built: minimap, compass, off-screen objective arrows (the shipped in-world beacon is the guide), hit markers, directional damage vignettes, kill confirms, score popups, interact prompts (**no interactables exist at P1** — the airlock cycle is scripted), crosshair/reticle changes (aim presentation stays world-space per visual §7 rule 7), pause/options menus (no pause exists), co-op squad HUD (netcode era). Any of these in the PR is an anti-assumption violation and a Gate 1 blocker. *(Doc change: yes — §12.1 "explicitly absent" list, v1.16.)*
- **R8 — DEV readout stays dev tooling.** `combatDevReadout` (phase/HP/mag/reserve/AL/crew states) is a developer instrument, not shipped HUD, and is not a substitute for G5 — the alarm indicator must read sim `alarmLevel` independently. Whether the DEV readout remains on-screen by default in dev builds or moves behind a toggle is Grok's implementation call, constrained to: never presented as player UI, never required for any G# check.

**Explicit non-goals (do not build):**

- **#8 scope (R6):** twin-stick aim-assist (§10 0.35/10° row is #8's to implement/tune), input-device hot-swap mid-mission, gameplay action-parity gaps, any new gameplay UI and its navigation.
- HUD skinning / final UI art: fonts, panel materials, animation, layout polish — `p1-visual-pass` (#9, milestone M-P1 "HUD skinned to palette").
- Everything in R7's absent list: minimap, compass, off-screen indicators, hit markers, damage vignettes, kill/score feedback popups, interact prompts, crosshair changes, pause/options menus, squad/co-op HUD.
- Alarm levels AL2+, lockdown, reinforcement UI, PA announcements — P2 features (`p2-alarm-director`, `p2-lockdown`, `p2-ship-pa`); the indicator's label table is forward-compatible data, not implemented behavior.
- Any sim, tuning, combat, AI, alarm, or mission-logic change — none. `p1-mission-shell` G1–G10, `p1-combat-core` G1–G10, `p1-enemy-baseline` G1–G10 must keep passing unmodified (regression safety, charter §7).
- Composite score, persistence, meta-progression — post-prototype (mission-shell R6 stands).
- Audio of any kind — no audio system exists (phase-checkpoint scoping item, combat-core precedent).

## Rule spec

1. **§12.1 v1.16 HUD baselines (M6, R1/R7).** Persistent HUD chrome exists only during INSERTION and ACTIVE, with exactly the five readouts; all HUD is render-only; the §12.1 "explicitly absent" list (R7) is binding anti-assumption scope. Shell screens (mission-shell) own BRIEFING/SCORE — the HUD never duplicates or overlaps them.
2. **§10 health/ammo rows (M1/M2, R2/R3).** Player HP 100, no passive regen; magazine 30, reserve 120, reload 2.0 s uninterruptible, auto-reload on empty-mag trigger pull. The HUD reads these values; the low-health warning threshold (≤25 HP) is a *presentation* threshold — it changes no number in the sim.
3. **§4 + v1.14/v1.16 notes (M4, R4).** The alarm stub is two-state and never de-escalates; the indicator presents level name + numeral from a data table, AL1 in hazard `#ff5252`, flip ≤1 tick after trip. No stealth mechanics, no AL2+ behavior, no lockdown UI.
4. **§3 v1.15 note (M3, M6).** Objective issue at door-open, completion by living room entry; mission clock from sim tick 0; state machine phases govern HUD visibility (R1). The transient banner (180 ticks) is untouched.
5. **§8 + v1.12 binding table (M7).** Move/interact/cancel map exactly as shipped; fire owns the primary trigger on both devices (confirm is never fire); shell inputs are deterministic commands (§12.1). G7 adds *visible focus* to screens that already accept these commands — no new bindings, no device-specific behavior gaps.
6. **Visual direction §3 v1.6 UI application note (M8, G8).** Palette meanings extend to UI verbatim: allied `#69f0ae` = player-state readouts; hazard `#ff5252` = alarm/danger readouts; interactive `#ffd54f` = UI focus/highlight; void `#05080f` = chrome base. Red never decorates; green never threatens — on UI exactly as in-world. Screen-edge anchoring keeps the gameplay plane legible (visual §7 rules 1/7: telegraphs world-space, mid-plane clean).
7. **Netcode-ready architecture (§12.1, non-negotiable — G9).** HUD is render-only: reads sim state, writes nothing back, holds no gameplay logic. The combat-core G8/G10 and mission-shell G9 replay/hash pattern is the verification model — HUD enabled/disabled must not change sim trajectories or world hash.
8. **Scope guard (anti-assumption).** A mechanic not in the callout does not exist: no AL2+ UI, no interact prompt, no minimap, no hit feedback chrome, no pause menu, no aim-assist, no hot-swap logic, no tuning change, no audio. Any of these in the PR is a Gate 1 blocker.

## Prereq assets

| Asset | Path (assets/) | Reference board (references/) | Status |
|-------|----------------|-------------------------------|--------|
| — none tangible this feature — HUD is text/palette chrome over existing sim state; no models, textures, or schematics are generated | | | n/a |

*No Blender work and no reference board this feature — nothing tangible is generated (charter §1 reference-first applies to asset generation; there is none). HUD skinning (fonts, panel art, animation) is `p1-visual-pass` (#9, milestone M-P1) and will carry reference boards there.*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | Build + state-driven checks: during BRIEFING and SCORE no HUD element is rendered; during INSERTION and ACTIVE exactly the five readouts render; element inventory (health, ammo, objective line, alarm indicator, clock) verified against the R1 set — no sixth element; transitions BRIEFING→INSERTION→ACTIVE→SCORE flip visibility at the correct phase ticks |
| G2 | Tests/build evidence: scripted `debugDamage` to 74 HP → readout shows 74 within 1 tick, allied palette; damage to 25 HP → element pulses hazard `#ff5252`; heal back above 25 (test-only state set) → pulse clears; lethal damage → 0 shown, then SCORE owns the screen |
| G3 | Tests: mission start shows `30 / 120`; scripted fire of 7 rounds → `23 / 120`; reload completion → `30 / 90`; empty-mag trigger pull → auto-reload starts and RELOADING + progress shows for 2.0 s (±1 tick); mag 0 is distinctly readable during the reload window |
| G4 | Tests: during BRIEFING/INSERTION the objective line is empty; at door-open tick the line shows "Reach Engineering" and persists until mission end; the transient banner still appears and expires per mission-shell G5 timing, unchanged; no completion-state line or second objective ever renders |
| G5 | Tests: mission start shows `AL0 UNAWARE` dim/neutral; scripted trip (fire one shot) → indicator shows `AL1 ALERTED` hazard `#ff5252` within 1 tick; soak past trip → never returns to AL0; label table contains AL2/AL3/MELTDOWN names but no P1 path reaches them (grep-level evidence + no test can drive them) |
| G6 | Tests/build evidence: clock renders `M:SS` from tick 0 during INSERTION/ACTIVE and advances with sim ticks (not wall time — pause-free fixed-step evidence); scripted run ending at a known tick → HUD clock value at end tick equals score-screen mission time |
| G7 | Tests: on breach select and score screen a visible focus target (`#ffd54f`) exists and moves on move-verb commands; full traversal + confirm + back driven from gamepad-mapped command stream produces identical outcomes to the KBM-mapped stream (command-level parity per mission-shell G2 pattern); binding audit: no new bindings, confirm never shares fire's binding |
| G8 | Screenshot/build evidence at the 60° rig: chrome base `#05080f`-family; palette roles per visual §3 v1.6 (allied player state, hazard alarm/low-HP, `#ffd54f` focus — no crossing); all elements screen-edge anchored, center gameplay plane clear; staged AL1 firefight frame: enemy wind-up pre-glow and hostile tracers unobstructed by any HUD element; blockout fidelity (no skinned/animated panels) |
| G9 | Replay test (established pattern): identical command stream twice with HUD enabled and disabled → identical mission-state trajectories and identical world hash; hash differs when commands differ; HUD code holds no sim writes (review-level evidence) |

## Open questions anticipated for Stage 2 (clarification loop §3.2a)

None blocking — R1–R8 pre-rule the expected conflicts. Topics Grok may still raise, with my positions:

- **HUD render surface** (DOM overlay vs in-scene/canvas) — Grok's call; design constraints: render-only (G9), screen-edge anchoring and palette conformance (G8), no sim coupling, no frame-rate-coupled logic.
- **Readout layout** (which edge holds which element) — Grok/Composer convenience within G8's constraints: center gameplay plane unobstructed, allied/hazard/interactive meanings uncrossed. Final layout aesthetics belong to M-P1 skinning.
- **Clock/HP granularity** (per-tick vs interpolated display) — display smoothing is fine; the values must be ≤1 tick behind sim (G2/G6) and never predictive.
- **Focus model on shell screens** (explicit focus state vs derived selection) — technical; design constraint: exactly one visible focus target at a time, driven by the M7 verb mapping, identical across devices (G7).
- **DEV readout disposition** (R8) — Grok's call within the dev-only constraint; the shipped player HUD must not depend on it.
