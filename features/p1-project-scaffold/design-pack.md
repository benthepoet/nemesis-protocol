# Design Pack — p1-project-scaffold

`DESIGN PACK v1 | feature p1-project-scaffold | design doc v1.10 | phase P1`
*Owner: Kimi K3. Gate: must exist before Stage 2 finalizes.*

**Versions cited (charter §8):** charter v1.12 · design doc v1.10 · feature roadmap v1.3 · visual direction v1.1

**Feature (roadmap P1 #1):** three.js project setup (WebGL2/WebGPU), build pipeline, input plumbing, `main` repo conventions per charter §6. Technical enabler — no dependencies. Carries the Director's solo-first ruling (roadmap v1.2): the netcode-ready architecture mandate (design doc §12.1) is a **primary goal** of this feature, not a nice-to-have.

## Goal set (the contract)

| ID | Goal (binary-verifiable) | Verified |
|----|--------------------------|----------|
| G1 | A fresh checkout installs and runs with documented commands: dev server serves a rendering three.js scene in-browser; production build succeeds and emits static assets | ☐ |
| G2 | Rendering baseline conforms to visual direction §8: WebGL2 renderer (WebGPU path optional), HDR pipeline with ACES-style tonemapping, placeholder scene holds 60 fps at 1080p on a mid-tier GPU | ☐ |
| G3 | Simulation advances on fixed, deterministic ticks fully decoupled from render frame rate — no frame-rate-coupled logic anywhere in the sim layer (§12.1) | ☐ |
| G4 | All player intent reaches the sim as tick-stamped input **commands** (command pattern); nothing mutates sim state directly from device events (§12.1) | ☐ |
| G5 | Keyboard/mouse and gamepad feed the **same** command stream with full action parity for scaffold-level actions, and device hot-swap works mid-session with no menu trip or restart (§8 foundation) | ☐ |
| G6 | Every entity is addressable by a stable, deterministic ID — identical spawn sequences yield identical IDs across runs (§12.1) | ☐ |
| G7 | Determinism is demonstrable: replaying a recorded command stream from identical initial state produces identical sim state | ☐ |
| G8 | Automated test runner is wired in and runs the scaffold's verification suite via a single documented command | ☐ |
| G9 | Two-tier branching (`main` / `integration`) per charter §6 exists and is documented in-repo; `main` is buildable at all times | ☐ |

## Mechanics callout (anti-assumption: unlisted = does not exist)

| ID | Mechanic | Design doc ref |
|----|----------|----------------|
| M1 | Netcode-ready architecture mandate: command-pattern inputs, deterministic sim ticks, no frame-rate-coupled logic, stable entity IDs | §12.1 |
| M2 | Input parity foundation: keyboard/mouse and gamepad as first-class citizens, hot-swap at any time | §8 |
| M3 | Rendering technical standard: three.js, WebGL2 baseline, HDR + ACES-style tonemapping, 60 fps @ 1080p target | visual_direction §8 |

**Explicit non-goals for this feature** (listed so nobody "helpfully" builds them):
- The ~60° pitch camera rig, movement, and aim — `p1-player-controller` (P1 #3). The scaffold placeholder scene uses any trivial static camera.
- Twin-stick aiming, aim-assist (§9 tuning: 0.35 magnetism / 10° cone), full UI navigation — `p1-gamepad-support` (P1 #8). G5 covers *plumbing parity only*: both devices emit the same commands.
- Any gameplay mechanic whatsoever — no combat, enemies, deck geometry, or mission logic exists in this feature.

## Rule spec

1. **Design doc §12.1 (locked prototype scope):** "Players: solo-first (Director ruling)… Hard requirement on the architecture: the simulation is built **netcode-ready from day one** — command-pattern inputs, deterministic sim ticks, no frame-rate-coupled logic, entities addressable by stable IDs. Solo-first must never mean retrofit-later." → G3, G4, G6, G7.
2. **Design doc §8 (input parity):** "every action is fully playable on keyboard/mouse *and* gamepad… hot-swap — switching input device mid-mission must never require a menu trip or a restart." Scaffold scope: the *plumbing* that makes this possible (one command stream, device-agnostic). → G5.
3. **Visual direction §8 (technical standards):** three.js (WebGL2 baseline, WebGPU where beneficial); HDR pipeline, ACES-style tonemapping; performance target 60 fps at 1080p in-browser on mid-tier GPU. → G2.
4. **Charter §6 (two-tier integration):** `integration` receives feature PRs after Stage 4 approval; `main` receives features only on Gate 2 acceptance; `main` is always buildable. → G9.
5. **Roadmap v1.2 Director ruling:** P1 is solo-first; netcode targeted P2–P3; every P1 feature must satisfy the netcode-ready mandate. The scaffold is where this mandate is *made structural* — a scaffold that couples logic to frame rate or reads devices imperatively fails Gate 1 on its face.

## Prereq assets

| Asset | Path (assets/) | Reference board (references/) | Status |
|-------|----------------|-------------------------------|--------|
| — none — | — | — | n/a |

*This feature is code-only: no tangible assets (models, textures, props) are produced, so no reference boards are required (charter §1 reference-first rule applies to tangible assets only). The placeholder scene uses primitives only — no authored art ships in this feature.*

## Acceptance criteria

| Goal | Observable check |
|------|------------------|
| G1 | On a clean machine/clone: documented install + dev command serves the app; scene visibly renders; documented build command exits 0 with static output |
| G2 | Renderer config shows HDR + ACES-style tonemapping enabled; on-screen or logged frame timing shows 60 fps @ 1080p in the placeholder scene on mid-tier hardware |
| G3 | Sim tick rate is a fixed constant (e.g., 60 Hz); forcing render to 30/144 fps does not change sim advancement per real second; code review finds no `deltaTime`-scaled mutation in the sim layer |
| G4 | Device events are translated to command objects (tick-stamped, typed); the sim's only input entry point consumes commands — demonstrated by driving the sim headlessly with a scripted command file |
| G5 | The same scaffold action (e.g., a test "interact" verb) issued from keyboard/mouse and from gamepad produces byte-identical commands; live device swap mid-session continues emitting commands with zero interruption |
| G6 | Two runs spawning the same entity sequence produce the same ID sequence (asserted in test) |
| G7 | Record a command stream + initial state, replay it twice, assert identical final-state hash (test in the verification suite) |
| G8 | Single documented command runs the test suite green on a fresh checkout |
| G9 | Repo docs (README or CONTRIBUTING) name the two-tier model and merge authorities; `main` HEAD builds |
