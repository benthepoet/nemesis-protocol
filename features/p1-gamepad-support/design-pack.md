# Design Pack — p1-gamepad-support

`DESIGN PACK v1 | feature p1-gamepad-support | design doc v1.17 | goals: G1..G9 | mechanics: M1..M7`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.13 · design doc **v1.17** (bumped doc-first from v1.16 by this pack — rulings R1–R3 landed in the §10 aim-assist row; numbers unchanged) · visual direction **v1.6** · feature roadmap **v1.8** (P1 #8; #7/#8 scope split per `p1-hud` R6) · shipped deps: `p1-player-controller` (twin-stick aim model M3, per-channel arbitration M4), `p1-combat-core` v2 (fire/reload bindings R1, crew targets G6, aim-direction line R8), `p1-enemy-baseline` (living crew targets, AL0/AL1), `p1-hud` (shell-screen nav + focus G7; five-element HUD set locked).

**Feature (roadmap P1 #8):** first-class gamepad gameplay — full action parity, twin-stick aim + **aim-assist** (§10: 0.35 magnetism, 10° cone), input-device hot-swap mid-mission, navigation for any new UI it introduces. Depends on #3, #4 ✅ (both shipped).

**Code survey (shipped state, `master` @ `6230ba6`) — what exists vs. what this feature adds:**

| Area | Shipped today | Gap vs design |
|------|---------------|----------------|
| Device wiring | Boot wires `GamepadDevice` + `KeyboardMouseDevice` into one `CommandBus` (`src/app/boot.ts`); both polled every tick | None — plumbing parity accepted (scaffold G5) |
| Bindings | §8 v1.12 table fully bound on both devices: fire = mouse 0 / RT(7), reload = R / face-west(2), interact = E / face-south(0), cancel = Esc / face-east(1); move = WASD / left stick; aim = mouse raycast / right stick (`src/input/bindings.ts`) | None — parity is complete; this feature **verifies** it end-to-end (G6), it does not extend it |
| Aim model | Mouse: raycast to y=0 plane, emitted only on cursor move — facing is sticky (player-controller M3; `mouseAimSticky` tests). Gamepad: right-stick direction while deflected, radial deadzone 0.24 (scaffold config); facing persists on neutral | **No aim-assist exists anywhere** — deferred by player-controller ("no targets yet") and combat-core R4 ("#8 owns it"). Targets now exist (crew, `p1-enemy-baseline`) → this feature implements it |
| Hot-swap | Per-channel most-recent-input-wins arbitration; synthetic releases on discrete-channel takeover and on device disconnect; idle sticks don't steal axis channels (`commandBus`, `axesArbitration`/`hotSwap` tests) | Robustness unverified across the **full mission loop** (INSERTION verbs-locked window, shell screens, mid-combat swaps) — this feature hardens/verifies it (G5) |
| Shell UI nav | Breach select + score screen navigable on both devices with visible focus (`p1-hud` G7) | None — #7 owns existing-UI nav; this feature introduces **no new UI** (R6) → the roadmap "navigation for any new UI #8 introduces" clause resolves to **empty** |

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | Aim-assist exists (M1, R1/R2): while the gamepad right stick commands an aim direction and an eligible target lies within the **±10° half-cone** around that direction, the player's effective facing rotates toward the target by **0.35 of the remaining angular offset per sim tick**; with no eligible target in the cone, facing equals the raw stick direction exactly | ☐ |
| G2 | Assist eligibility (M1/M5, R3): only **living hostile crew** with **unobstructed LOS** (all wall classes block, same rule as §10 crew sight) within **60 m** are eligible; selection = smallest angular offset from the commanded direction, tie → nearest distance; dead crew, wall-occluded crew, and crew beyond 60 m never attract aim | ☐ |
| G3 | Assist is gamepad-only (M1, R4): mouse-derived aim is never altered by assist — KBM command streams produce facing identical to the pre-feature behavior (regression on shipped aim math); the assist path cannot activate from any KBM command stream | ☐ |
| G4 | Assist never overrides intent (M1, R1): no snap, no lock-on — with the stick held fully away from a target, facing follows the stick (the 0.35 blend always leaves the player in command); with the stick at neutral, facing persists unassisted (no drift toward targets — sticky-aim symmetry with mouse) | ☐ |
| G5 | Hot-swap mid-mission (M4, R7): switching input device at any point in the full loop — BRIEFING (breach select), INSERTION (verbs-locked airlock cycle), ACTIVE (incl. mid-firefight, fire/reload held), SCORE — never requires a menu trip or restart; the departing device's held actions release synthetically (no stuck fire/reload/interact); facing survives the swap in both directions (sticky aim both ways); the receiving device drives commands from its first input | ☐ |
| G6 | Full action parity verified (M3): every verb in the §8 v1.12 table — move, aim, fire (hold = automatic), reload, interact, cancel — is fully playable on both devices with parity-equal commands; the shipped parity suite (`tests/input/*`) passes unmodified; binding audit: no binding changed, fire still owns the primary trigger on both devices, confirm is never fire | ☐ |
| G7 | Full mission loop on gamepad alone (M3/M4/M6): a complete run — breach select → airlock cycle → fight crew → reach Engineering → score screen → restart — is drivable entirely from gamepad-mapped commands with zero keyboard/mouse input and zero menu trips; the same loop on KBM alone is unaffected (regression) | ☐ |
| G8 | Determinism preserved (M6, §12.1): aim-assist is computed sim-side from commands + sim state only; identical command streams produce identical facings and identical world hashes with assist active; no frame-rate-coupled or unseeded-random logic in any input/aim path | ☐ |
| G9 | Presentation conformance (M7, R6): the aim-direction line (combat-core R8) reflects **effective** (assisted) facing — assist feedback is the line, no new telegraph; no new HUD elements (the five-element set from `p1-hud` G1/R1 is locked); no new UI screens, focus targets, or bindings; palette and world-space telegraph rules (visual §3, §7 rule 7) unchanged | ☐ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | **Gamepad aim-assist** (the feature's core): 0.35 magnetism, 10° cone, model per the §10 v1.17 clarification — per-tick blend toward selected target while stick deflected; eligibility = living hostile crew, LOS-unobstructed, ≤60 m, smallest-offset selection; gamepad-only; deterministic sim-side | §10 aim-assist row (**v1.17**); §8 input parity |
| M2 | Twin-stick aim model (restated — **unchanged** from player-controller M3): facing = mouse raycast onto the y=0 gameplay plane (KBM) or right-stick direction (gamepad, device deadzone); facing independent of move direction; sticky on neutral input both devices | §8 (twin-stick); §8 v1.12 binding table |
| M3 | Input parity + verb bindings (restated — **unchanged**): every action fully playable on KBM and gamepad; fire owns the primary trigger; interact is deliberate, never shares fire's binding; deterministic commands through one bus | §8 + v1.12 binding table; §12.1 |
| M4 | Device hot-swap (restated + hardened): hot-swap at any time, never a menu trip or restart; shipped mechanism = per-channel most-recent-input-wins arbitration with synthetic releases on takeover/disconnect — this feature extends *verification* to every mission state, it does not redesign the mechanism | §8 ("hot-swap at any time… never require a menu trip or a restart") |
| M5 | Crew as assist subjects (eligibility only — **no new targeting mechanics**): living security-crew entities (§4.5 roster; `p1-enemy-baseline` population) are the only assist-eligible targets at P1; assist reads existing sim state (alive, position, LOS) and adds no perception, no target marking, no new crew behavior | §4.5; §10 crew rows |
| M6 | Netcode-ready architecture (non-negotiable): all facing changes — including assisted facing — happen in the fixed sim tick from tick-stamped commands; no device-event mutation of sim; stable IDs; replay-deterministic | §12.1 |
| M7 | Aim presentation (restated — **unchanged** from combat-core R8/v2): the in-world aim-direction line renders effective facing from sim state, muzzle → first wall obstruction, dim at rest / bright while firing; assisted facing flows through it automatically; telegraphs stay world-space, allied-palette, subordinate to enemy telegraphs | visual §6 (P1 row), §7 rule 7; §3 |

**Design rulings (new, this pack):**

- **R1 — Magnetism model: per-tick blend, never snap.** While the right stick commands an aim direction and an eligible target (R3) lies inside the cone, effective facing rotates toward the target by **0.35 × the remaining angular offset per sim tick**; otherwise facing equals the raw stick direction. This is exponential approach, not lock-on: the player always retains command (G4), and the assist reads as "the reticle leans onto a target you're already pointing near," not as a snap. 0.35/tick at the 60 Hz sim closes ~most of a small offset in a few ticks — strong enough to matter against strafing crew at 10 rps, weak enough to steer out of. *(Doc change: yes — §10 row, v1.17. Numbers unchanged; the model is the clarification.)*
- **R2 — Cone reading: ±10° half-angle.** The §10 "10° cone" is a **half-angle of 10° around the commanded stick aim direction** (20° full cone). This is the reading that makes "0.35 magnetism, 10° cone" coherent as a pair: a narrow qualification window plus a strong blend inside it. *(Doc change: yes — §10 row, v1.17.)*
- **R3 — Eligibility: living crew, LOS, ≤60 m, smallest offset.** Eligible targets are living hostile crew with unobstructed line of sight (all wall classes block — the same LOS rule as §10 crew sight) within **60 m** (projectile max range — no assisting onto targets a bullet can't reach). Selection = smallest angular offset from the commanded direction; ties break to nearest distance. No assist through walls (an unseen magnet is indistinguishable from a bug), no assist on corpses. *(Doc change: yes — §10 row, v1.17.)*
- **R4 — Gamepad-only, observably.** Assist never alters mouse-derived aim — the mouse has pixel precision and needs no help; parity means *capability* parity (both devices can fight the crew effectively), not identical processing. The mechanism that distinguishes device origin inside the device-agnostic command stream is **technical — Grok's call** (the bus already tracks per-channel ownership); the design contract is observable only: no KBM command stream ever produces assisted facing (G3).
- **R5 — Neutral stick = no assist.** Assist engages only while the stick commands a direction; at neutral, facing persists exactly (sticky aim, symmetric with the shipped mouse behavior). Aim never drifts toward a target the player isn't pointing at.
- **R6 — No new UI, no new telegraphs.** This feature introduces **no** new UI screens, HUD elements, or focus targets: the five-element HUD set is locked by `p1-hud` G1/R1 (an accepted goal — adding a sixth element, e.g. a device indicator, would violate it), and no aim-assist reticle/crosshair exists (crosshair changes are on the §12.1 explicitly-absent list; telegraphs stay world-space per visual §7 rule 7). Assist feedback is the existing aim-direction line tracking effective facing. The roadmap clause "navigation for any new UI #8 introduces" therefore resolves to **empty** — confirmed against the `p1-hud` R6 split.
- **R7 — Hot-swap contract restated, mechanism unchanged.** The shipped per-channel arbitration with synthetic releases (player-controller M4; scaffold G5/Q4) *is* the design's hot-swap mechanism — this feature does not redesign it. What it adds is the **verification envelope** (G5): every mission state, both swap directions, held-verb releases, facing persistence. Any defect found is an implementation defect against this contract, not a reason to invent new UI or menus.
- **R8 — Tuning levers reserved.** Magnetism 0.35, cone ±10°, stick deadzone 0.24 (scaffold config) are P1-checkpoint playtest levers (§10 note: "tune in P1 playtest"). Playtest findings route through §3.5a — no tuning changes inside this feature beyond making the shipped numbers real.

**Explicit non-goals (do not build):**

- **HUD skinning / any HUD change** — `p1-visual-pass` (#9, milestone M-P1 "HUD skinned to palette"); the five-element set is locked (`p1-hud` G1/R1). No device indicator, no assist reticle, no crosshair anything (R6).
- **Any new UI screen, menu, options page, or binding remap** — no remapping exists in the design; bindings are fixed by the §8 v1.12 table. No pause menu (none exists).
- **KBM aim-assist** — never (R4). Mouse assist appearing anywhere is an anti-assumption violation.
- **New verbs or bindings** — sprint, crouch, dodge, weapon-switch, melee: none exist in the design. The §8 v1.12 table is the whole verb set.
- **Haptics/rumble, gyro, touch, additional controller models, multi-pad** — unlisted mechanics do not exist; co-op multi-device is netcode era (P2–P3).
- **Any change to crew AI, combat tuning, alarm, or mission logic** — assist consumes sim state read-only beyond facing; `p1-enemy-baseline` G1–G10, `p1-combat-core` G1–G10, `p1-mission-shell` G1–G10, `p1-hud` G1–G9 must keep passing unmodified (regression safety, charter §7).
- **Shell-screen nav changes** — shipped and accepted in `p1-hud` G7; untouched here.
- **Audio of any kind** — no audio system exists (combat-core precedent; phase-checkpoint scoping item).

## Rule spec

1. **§10 aim-assist row (v1.17) — the contract, verbatim.** 0.35 magnetism = per-tick blend fraction toward the selected target while the stick is deflected; 10° cone = ±10° half-angle around the commanded stick direction; eligibility = living hostile crew, unobstructed LOS (all wall classes block), ≤60 m, smallest-offset selection (tie → nearest distance); gamepad-only; neutral stick = no assist; deterministic sim-side; tune in P1 playtest. R1–R3 are the binding reading of this row.
2. **§8 input parity + v1.12 binding table (M2/M3).** Every action fully playable on both devices; twin-stick aim (left move / right aim); fire owns the primary trigger (mouse 0 / RT); interact is deliberate and never shares fire's binding. The binding table is fixed — this feature changes no binding.
3. **§8 hot-swap clause (M4).** "Switching input device mid-mission must never require a menu trip or a restart." Mid-mission reads as **any mission state**: BRIEFING, INSERTION (verbs locked by the airlock cycle — hot-swap must not wedge locked verbs), ACTIVE, SCORE.
4. **§12.1 netcode-ready (M6, non-negotiable).** Assisted facing is sim state derived from tick-stamped commands and deterministic target queries — replay of a command stream reproduces assisted facings bit-for-bit. No `Math.random`, no wall-clock, no frame-dt in the assist path. Device-origin knowledge (needed for R4) is input-side plumbing; the sim contract it feeds stays deterministic — mechanism is Grok's, contract is G3/G8.
5. **Crew-sight LOS rule by reference (R3).** §10 crew sight ("LOS blocked by all wall classes") is the LOS standard assist reuses — no second LOS model may be invented for aiming.
6. **Visual direction §3 / §7 rule 7 (M7).** Player combat telegraphs are world-space and allied-palette; the aim-direction line is the facing telegraph on both devices; no HUD chrome may become a telegraph. This feature adds no visual elements — conformance means *not regressing* the line and telegraph hierarchy.
7. **Scope guard (anti-assumption).** A mechanic not in the callout does not exist: no lock-on, no snap, no target marking, no bullet bending (assist rotates *facing before the shot*; projectiles are unchanged — 60 m/s straight along facing, combat-core M5), no haptics, no remap, no pause, no new UI, no KBM assist, no tuning changes. Any of these in the PR is a Gate 1 blocker.

## Prereq assets

| Asset | Path (assets/) | Reference board (references/) | Status |
|-------|----------------|-------------------------------|--------|
| — none tangible this feature — aim-assist is sim math over existing entities; no models, textures, schematics, or UI art are generated | | | n/a |

*No Blender work and no reference board this feature — nothing tangible is generated (charter §1 reference-first applies to asset generation; there is none).*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | Sim tests: stick deflected toward a living crew target at 5° offset → facing error shrinks by exactly 35% per tick (5° → 3.25° → 2.11°…); target at 10° offset → assisted; target at 10.1° → facing equals raw stick direction bit-exact; no crew alive → raw stick direction bit-exact |
| G2 | Sim tests: (a) nearest-angle target selected when two crew are in-cone; equal-angle → nearer distance wins; (b) wall between player and in-cone crew → no assist; remove wall → assist resumes; (c) crew at 61 m in-cone → no assist; (d) kill the assisted target mid-hold → assist switches to the next eligible target or falls back to raw stick, no NaN/stale facing |
| G3 | Regression tests: the shipped KBM aim suite passes unmodified; scripted KBM command streams with crew in-cone produce facing identical to raw raycast math (zero assist); static audit: the assist path is unreachable from KBM-origin commands |
| G4 | Sim tests: stick held at 45° from a target (outside the cone) → zero pull, facing tracks stick exactly; stick swept through a target → facing blends while the target crosses the cone and exits cleanly (no capture, no hysteresis); stick to neutral with a target adjacent → facing freezes (no drift); aim held on empty space beside a crew target (target outside cone) → facing never leaves the commanded direction |
| G5 | Scripted runs on the mission loop: swap KBM→pad and pad→KBM during BRIEFING, during the INSERTION cycle, and mid-ACTIVE with fire held → after each swap: no menu/restart, departing device's held verbs emit synthetic releases (no autofire stuck on), the receiving device's next input takes its channels, facing at swap+1 tick equals facing at swap tick (sticky both ways); the shipped `hotSwap`/`axesArbitration` suites pass unmodified |
| G6 | The full shipped input suite (`parity`, `hotSwap`, `gamepadAxes`, `axesArbitration`, `fireReloadArbitration`, `mouseAimSticky`) passes unmodified; command-level parity: every verb driven from gamepad-mapped and KBM-mapped streams produces parity-equal commands; binding table diff vs `6230ba6` is empty |
| G7 | Scripted full-loop run driven 100% by gamepad-mapped commands: breach select → 5.0 s airlock cycle → alarm trip + crew kill (assist active) → Engineering entry → score screen fields correct → restart to breach select; zero KBM samples in the stream; the KBM-only equivalent run passes unchanged (regression) |
| G8 | Replay test (established pattern): identical command stream (gamepad-mapped, crew present, assist active) twice → identical facing trajectories and identical world hash; hash differs when commands differ; assist path holds no sim writes beyond facing and no unseeded randomness (review-level evidence) |
| G9 | Build/screenshot evidence at the 60° rig: during an assisted firefight the aim-direction line visibly tracks the *assisted* facing (line leans onto the in-cone target as facing blends); element inventory unchanged — exactly five HUD readouts, no sixth element, no reticle/crosshair, no device indicator; palette/telegraph hierarchy unchanged (allied `#69f0ae` line, enemy telegraphs dominant); G10 (combat-core v2) telegraph checks still pass |

## Open questions anticipated for Stage 2 (clarification loop §3.2a)

None blocking — R1–R8 pre-rule the expected conflicts. Topics Grok may still raise, with my positions:

- **Device-origin plumbing for R4** (channel-owner hint vs. command flag) — Grok's call; design constraints: observable contract G3 (mouse never assisted), G8 (stream replay stays deterministic), and the no-provenance-fields convention on drained commands (scaffold E14) is respected at the *command* boundary — whatever carries origin must not leak into replayed command semantics.
- **LOS query reuse** (share the crew-perception LOS code vs. a parallel query) — Grok's call; design constraint: identical blocking rule (all wall classes block), deterministic, no new LOS semantics (rule spec 5).
- **Assist while `fire` is held vs. idle aim** — same behavior both ways (design: assist is an aim-channel behavior, not a fire behavior); no separate "ADS" strength exists.
- **Multiple sticks / multi-pad** — out of scope (non-goals); first connected pad drives, as shipped.
- **Deadzone exposure** — remains scaffold config (0.24); tuning lever per R8, not a per-player setting (no options menu exists).
