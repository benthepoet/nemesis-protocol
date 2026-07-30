# Design Pack — p1-player-controller

`DESIGN PACK v1 | feature p1-player-controller | design doc v1.11 | phase P1`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

Working from: design doc v1.11 · visual direction v1.2 · roadmap v1.4 (P1 #3) · charter v1.13 · shipped deps: `p1-project-scaffold` (sim loop, command bus, input devices), `p1-deck-geometry` (deck graph, collision, spawn points, blockout scene).

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | A player entity exists in the sim: stable entity ID, spawns at the port airlock spawn point (M4 data from p1-deck-geometry), sim-side state = position + facing angle | ☐ |
| G2 | Movement is command-driven and deterministic: a move-intent vector command consumed inside the fixed sim tick at 6 m/s (M1/M2), producible identically by keyboard/mouse and gamepad (§8 input parity) | ☐ |
| G3 | Aim is twin-stick: facing angle from mouse raycast onto the gameplay plane (KBM) or right-stick direction (gamepad), stored as sim state, independent of movement direction (M3) | ☐ |
| G4 | The player respects deck collision: cannot penetrate any wall class (A/B/C), slides along obstructing geometry, actor radius 0.4 m, and can traverse all 17 doorways incl. both blast passages (ruling R1 stands) | ☐ |
| G5 | Camera rig: ~60° pitch perspective follow camera, player-centered with aim bias (M6), render-side only (zero sim coupling); hides the ceiling of the player's current room (visual §7 rule 6 cutaway) | ☐ |
| G6 | The interaction verb exists as a command: `interact` pressed/released on both devices (M7), with no gameplay consumers yet — ready for p1-mission-shell | ☐ |
| G7 | Determinism preserved: identical command streams produce identical positions/facings across runs; world hash extended to cover the player entity; no frame-rate-coupled sim logic | ☐ |
| G8 | The debug fly camera remains dev-gated (`?debugCamera=1`); without the flag the player controller + follow camera is the default experience | ☐ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | Move speed **6 m/s** — prototype default set by this pack (design doc has no movement tuning); config constant, tune at P1 checkpoint | §10 (tuning-table convention) |
| M2 | Movement model: velocity = normalized move-intent × M1 (no diagonal speed boost); instant acceleration (arcade); **no sprint, crouch, jump, or dodge** — none exist in the design | — |
| M3 | Aim model: KBM = raycast mouse position onto the y=0 gameplay plane, facing = atan2 toward hit point; gamepad = right-stick direction (device deadzone from scaffold input config); facing independent of move direction (twin-stick, §8) | §8 |
| M4 | Device arbitration: per-channel most-recent-input-wins (move channel, aim channel, interact channel); hot-swap mid-mission with no menu trip | §8 input parity |
| M5 | Collision response: circle (r=0.4 m, the deck's `ACTOR_PROXY_RADIUS_M`) vs. deck collision geometry, slide-along-wall response; uses p1-deck-geometry collision APIs only | §7 topology model |
| M6 | Camera: pitch 60°, fixed yaw (north-up), perspective; damped follow (render-side smoothing legal — not sim state); aim bias shifts the frame center up to 2 m toward the aim point. Tunables in config | doc header camera line; visual §7 |
| M7 | Interaction verb: `interact` command with pressed/released edges; hold-duration semantics belong to future consumers (P2 keys/patches are "hold interaction", §3/§6.4) — this feature ships the verb only | §6.3 ("keys are interactions") |
| M8 | Player blockout presentation: capsule in allied green `#69f0ae` with a facing wedge; silhouette must read at the camera angle (visual §7 rule 2 priority logic — player state tier) | visual §3, §7 |

## Rule spec

1. **Camera (locked for P1):** angled top-down, ~60° pitch, perspective projection (design doc header; visual §7). The first/third-person pivot is a post-P1 evaluation (§12.1) — this rig must not foreclose it: full interiors stay (visual §7 rule 6), and the rig implements the camera-driven ceiling cutaway for the occupied room.
2. **Netcode-ready architecture (§12.2, non-negotiable):** all player state changes happen in the fixed sim tick from commands; inputs enter only via the command bus; entity has a stable ID; no `Math.random`/`Date.now`/frame-dt coupling in sim. The follow camera's damping is render-side and MUST NOT feed back into sim.
3. **Input parity (§8):** every verb (move, aim, interact) fully playable on keyboard/mouse and gamepad. The scaffold already enqueues both devices every tick; M4's most-recent-input-wins arbitration makes hot-swap seamless. Aim-assist (§10: 0.35 magnetism, 10° cone) is **deferred to p1-gamepad-support** — it needs targets, and none exist until p1-combat-core.
4. **Spawn:** port airlock spawn point via the p1-deck-geometry spawn API (deterministic default; starboard equally valid, no selection UI this feature).
5. **Interaction verb scope:** the design defines keys, patches, and vents as *interactions* (§6.3: "keys are interactions, not locations"), all P2+ consumers. P1 ships the plumbed verb with edge events (pressed/released) and a dev-console trace — no doors, panels, or objectives respond yet.
6. **What does NOT exist in this feature:** combat, firing, health, enemies, HUD, animation, sprint/crouch/jump/dodge, aim-assist, interaction consumers, netcode, player-authored lighting (flashlight). Any of these appearing in the PR is an anti-assumption violation.

## Prereq assets

| Asset | Path (assets/) | Reference board (references/) | Status |
|-------|----------------|-------------------------------|--------|
| — none — all blockout primitives (capsule, wedge) generated in code | | | n/a |

## Acceptance criteria

- **G1:** unit test: world after spawn contains exactly one player entity with stable ID at the port airlock spawn coordinates (±0.01 m).
- **G2:** scripted command stream (KBM-mapped and gamepad-mapped variants) moves the player a deterministic distance at 6 m/s; diagonal intent = same speed as cardinal.
- **G3:** unit tests: mouse raycast aim produces expected facing for known screen points; stick aim produces expected facing; facing unchanged when only moving.
- **G4:** tests: drive the player into each wall class → no penetration, position clamps with slide; scripted traversal of all 17 doorways succeeds at r=0.4 (extends deck E10 to the live player entity).
- **G5:** assertions on the rig object (pitch 60° ±0.1°, perspective projection, follow offset, aim-bias cap 2 m); ceiling of the player's room hidden, others visible; sim tick count identical with camera enabled/disabled (zero sim coupling).
- **G6:** unit test: binding `interact` on both devices emits pressed/released command edges through the bus into the sim.
- **G7:** replay test: same command stream twice → identical positions/facings AND identical extended world hash; hash differs when commands differ.
- **G8:** build without `?debugCamera=1` boots to player controller; with flag (dev only) fly camera takes over as before.
