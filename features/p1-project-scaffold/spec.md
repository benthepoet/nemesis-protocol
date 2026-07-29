# Technical Specification — p1-project-scaffold

`SPEC v1 | feature p1-project-scaffold | charter v1.13 | design doc v1.10 | design pack v2 | goals: G1..G9 | mechanics: M1..M3`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.10** · design pack **v2** · feature roadmap **v1.3** · visual direction **v1.1** · AGENTS.md current · clarification log **KIMI RULINGS v1** (2026-07-29)

### Clarification rulings incorporated

All six questions in `clarification-log.md` are resolved (KIMI RULINGS v1). No design-doc version bump required. Binding effects on this spec:

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| Q1 | Closed `{ interact, cancel }`; press/release pairs; data-driven bindings | Tasks 5, 8, 11; Commands + Input bindings APIs |
| Q2 | Palette-conformant placeholder (void clear, hull-steel, warm key + cool fill) | Task 16; Placeholder scene API |
| Q3 | No provenance on `InputCommand`; parity = entire object | Tasks 5, 14; Commands API; E7 |
| Q4 | Synthetic releases on disconnect/swap; arriving device neutral | Task 14; Command bus API; E8, E13 |
| Q5 | Hash = tick, nextEntityId, entities (all sim fields), world meta; render excluded | Task 9; Hash & replay API; E10 |
| Q6 | Mandatory on-canvas rolling-fps overlay | Tasks 2, 17, 18; Frame loop; manual smoke |

Composer may start Stage 3 on branch `feat/p1-project-scaffold`.

---

## Stack choice (Technical Lead authority)

| Concern | Choice | Version pin | Why |
|---------|--------|-------------|-----|
| Language | **TypeScript** (strict) | `typescript@5.8.x` | Command shapes, entity IDs, and replay hashes are compile-time contracts; junior cannot invent alternate shapes without type errors. three.js ships first-class types. |
| Module / bundler / dev server | **Vite** | `vite@6.3.x` | Minimal browser ESM pipeline; one `dev` + one `build` command satisfies G1. |
| 3D | **three.js** | `three@0.178.0` | Design doc + visual direction §8; pin exact so WebGL2/HDR APIs are stable across agents. |
| Unit / determinism tests | **Vitest** | `vitest@3.2.x` | Same Vite toolchain; Node runner for headless sim/input tests (G8). |
| Package manager | **npm** | lockfile committed (`package-lock.json`) | Documented in README; no pnpm/yarn in this feature. |

**Not chosen:** React/other UI frameworks, physics engines, ECS libraries, networking libraries, WebGPU-as-required. Keep the scaffold minimal and browser-runnable.

---

## Exact project layout (create these paths; no others for this feature)

Composer creates the following under the repo root. Do **not** move `docs/`, `assets/`, `features/`, `tools/`, `app/`, `.cursor/`, or `.opencode/`.

```
/
├── index.html                          # Vite entry HTML (canvas + fps overlay host)
├── package.json
├── package-lock.json                   # committed after npm install
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── README.md                           # install / dev / build / test commands (G1, G8)
├── CONTRIBUTING.md                     # two-tier branching (G9)
├── src/
│   ├── main.ts                         # browser bootstrap
│   ├── config.ts                       # tick rate + render constants
│   ├── sim/
│   │   ├── types.ts                    # EntityId, SimState, entities, WorldMeta
│   │   ├── commands.ts                 # InputCommand + equality (full-object)
│   │   ├── entityId.ts                 # deterministic ID allocator
│   │   ├── world.ts                    # createWorld, spawnEntity, getState
│   │   ├── step.ts                     # applyCommands + fixedStep
│   │   ├── hash.ts                     # deterministic state hash (hex string)
│   │   └── replay.ts                   # record / replay / assertIdentical
│   ├── input/
│   │   ├── types.ts                    # DeviceKind, ActionId, DeviceSample
│   │   ├── bindings.ts                 # data-driven binding table
│   │   ├── keyboardMouse.ts            # KeyboardMouseDevice
│   │   ├── gamepad.ts                  # GamepadDevice (Gamepad API)
│   │   ├── mapper.ts                   # DeviceSample[] → action edges (no provenance)
│   │   └── commandBus.ts               # tick-stamp, enqueue, hot-swap releases
│   ├── render/
│   │   ├── createRenderer.ts           # WebGL2 baseline; optional WebGPU
│   │   ├── createPlaceholderScene.ts   # palette-conformant primitives
│   │   ├── fpsOverlay.ts               # on-canvas / DOM rolling fps (Q6)
│   │   └── frameLoop.ts                # rAF, accumulator, sim ticks, render
│   └── app/
│       └── boot.ts                     # wire input + sim + render + overlay
└── tests/
    ├── sim/
    │   ├── fixedTimestep.test.ts        # G3
    │   ├── entityId.test.ts             # G6
    │   ├── commandPattern.test.ts       # G4
    │   └── replayDeterminism.test.ts    # G7
    ├── input/
    │   ├── parity.test.ts               # G5
    │   └── hotSwap.test.ts              # G5
    └── helpers/
        ├── fakeDevices.ts
        └── commandFixtures.ts
```

Update root `.gitignore` only if needed to keep ignoring `node_modules/`, `dist/`, `build/` (already present). Do not remove existing reference-image rules.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Initialize npm package + TypeScript + Vite + Vitest configs; set `"type": "module"`; scripts: `dev`, `build`, `preview`, `test`, `test:run`. Pin deps to versions in Stack choice. | `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts` | G1, G8 |
| 2 | Add `index.html` with `#app` root, full-viewport `<canvas id="game-canvas">`, and a visible fps host element `<div id="fps-overlay" aria-live="off">` (top-left, readable on dark void). Entry script: `/src/main.ts`. | `index.html` | G1, G2 |
| 3 | Write `src/config.ts` exporting: `TICK_HZ = 60`, `FIXED_DT = 1/60`, `MAX_FRAME_DELTA_SEC = 0.25`, `DEFAULT_PIXEL_RATIO_CAP = 2`. No other magic numbers for the sim clock. | `src/config.ts` | G3, M1 |
| 4 | Define sim types: `EntityId` (branded `number`), `Entity` `{ id, kind, x, y, z, alive }`, `WorldMeta` `{ interactCount, cancelCount, lastAction, interactHeld, cancelHeld }`, `SimState` `{ tick, nextEntityId, entities: Map<EntityId, Entity>, meta: WorldMeta }`. Map serializes as id-sorted entries for hashing. | `src/sim/types.ts` | G3, G6, G7, M1 |
| 5 | Implement closed `ActionId = 'interact' \| 'cancel'` and `InputCommand` with fields **only** `{ tick, sequence, action, value }` — **no** `source` / device provenance (Q3). `value: 1` = press edge, `value: 0` = release edge (Q1). Export `commandsEqualForParity(a,b)` as deep equality of the **entire** command object (Q3). | `src/sim/commands.ts` | G4, G5, M1, M2 |
| 6 | Implement `EntityIdAllocator`: starts at `1`; `allocate()` returns next id and increments; `reset(startId=1)` for tests/replay. Identical call sequences → identical IDs. Never use `Math.random`, `crypto.random*`, or timestamps for IDs. | `src/sim/entityId.ts` | G6, M1 |
| 7 | Implement `createWorld(): SimState`, `spawnEntity(state, kind, x,y,z): EntityId` (uses allocator), `getEntity`, `setEntityPose` (sim-only mutators). No render imports. | `src/sim/world.ts` | G3, G6, M1 |
| 8 | Implement `applyCommands(state, commands: InputCommand[]): void` then `fixedStep(state): void`. Apply commands in `(tick, sequence)` ascending order. On `interact`/`cancel` press (`value===1`): increment the matching `*Count`, set `lastAction`, set matching `*Held=true`. On release (`value===0`): set matching `*Held=false`. Ignore unknown actions. **No** `deltaTime` parameter on sim functions. `fixedStep` always does `state.tick += 1` after commands for that tick. | `src/sim/step.ts` | G3, G4, M1 |
| 9 | Implement `hashSimState(state): Promise<string>` — SHA-256 hex over deterministic JSON (stable key order) of exactly: `{ tick, nextEntityId, entities: [...all sim-owned entity fields sorted by id], meta }` (Q5). Render state must not appear in the hash input. Use Web Crypto in browser; `node:crypto` in Vitest. | `src/sim/hash.ts` | G7, M1 |
| 10 | Implement `recordCommands` / `replay(initialState, commands[]): SimState` / `assertReplayDeterministic(...)` that runs replay twice from deep-cloned identical initial state and asserts equal hashes. | `src/sim/replay.ts` | G7, M1 |
| 11 | Define `DeviceKind`, `DeviceSample` (adapter-layer only — may carry `kind` for debug; **never** copied onto `InputCommand`). Implement **data-driven** `bindings.ts` table: list of `{ action, keyboard?, mouseButton?, gamepadButton? }` — not hard-coded per device class (Q1). Bindings: `interact` → `KeyE` / mouse button 0 / gamepad `buttons[0]` (south); `cancel` → `Escape` / gamepad `buttons[1]` (east). Devices look up this table. | `src/input/types.ts`, `src/input/bindings.ts` | G5, M2 |
| 12 | Implement `KeyboardMouseDevice`: listen `keydown`/`keyup`/`mousedown`/`mouseup` on `window`; resolve via bindings table; emit press/release `DeviceSample`s; ignore `event.repeat === true`. Track which actions are held on this device. | `src/input/keyboardMouse.ts` | G4, G5, M2 |
| 13 | Implement `GamepadDevice`: poll `navigator.getGamepads()` each gather; resolve buttons via bindings table; emit press/release edges from previous-vs-current button state. Track held actions. | `src/input/gamepad.ts` | G4, G5, M2 |
| 14 | Implement `InputMapper` + `CommandBus`: map samples → `{ action, value }` intents (strip any device identity); on each sim tick stamp `tick` + monotonic `sequence` and emit `InputCommand[]`. **Device handlers must not mutate the world.** Hot-swap / disconnect (Q4): when the active/departing device changes or disconnects, bus emits **synthetic release** commands (`value: 0`) for every action still held on the departing device before accepting the arriving device; arriving device starts **neutral** (no held state). Active device = kind of last real (non-synthetic) sample; no menu required. | `src/input/mapper.ts`, `src/input/commandBus.ts` | G4, G5, M1, M2 |
| 15 | Implement `createRenderer(canvas)`: `THREE.WebGLRenderer` with `{ antialias: true, powerPreference: 'high-performance' }`; `outputColorSpace = THREE.SRGBColorSpace`; `toneMapping = THREE.ACESFilmicToneMapping`; `toneMappingExposure = 1.0`. Optional WebGPU: if `navigator.gpu` exists **and** `?webgpu=1` is set, attempt `WebGPURenderer`; on failure fall back to WebGL2 and log once. Expose `backend: 'webgl2' \| 'webgpu'`. | `src/render/createRenderer.ts` | G2, M3 |
| 16 | Implement placeholder scene (Q2): `Scene`; static `PerspectiveCamera` (trivial pose — **not** the gameplay ~60° rig); clear color **`#05080f`**; one warm-neutral **key** `DirectionalLight` (color ~`#fff2e0`, intensity ~1.0) + one cool **fill** `AmbientLight` or second dim directional/hemisphere (color ~`#a8c0d8`, intensity ~0.35) — Cruise/AL0 mood; one `Mesh` (`BoxGeometry` + `MeshStandardMaterial` with color in hull-steel range `#1a232e`–`#2a3644`, metalness/roughness plausible for steel). No models, textures, or `assets/` imports. | `src/render/createPlaceholderScene.ts` | G2, M3 |
| 17 | Implement `fpsOverlay.ts` + `frameLoop`: `requestAnimationFrame`; accumulate real `dt` (clamped by `MAX_FRAME_DELTA_SEC`); while accumulator ≥ `FIXED_DT`: gather devices → bus (incl. hot-swap releases) → `drainForTick` → `applyCommands` → `fixedStep` → subtract `FIXED_DT`; then render once. Update `#fps-overlay` text every frame or ≤100 ms with rolling fps (e.g. `FPS 60`) — **mandatory Gate 1 evidence** (Q6). Optional additional console log `[nemesis] fps=…` every 1 s. Sim advances ~60 ticks per real second regardless of render FPS. | `src/render/fpsOverlay.ts`, `src/render/frameLoop.ts` | G2, G3, M1, M3 |
| 18 | Wire `boot.ts` + `main.ts`: create world, devices, bus, renderer, palette scene, fps overlay, start loop. Export nothing gameplay-related. | `src/app/boot.ts`, `src/main.ts` | G1, G2, G3, G4 |
| 19 | Write Vitest suite covering E1–E13 and G3–G8 assertions under **Test / verification**. Use `fakeDevices` to inject samples — no real browser gamepad required for CI. | `tests/**` | G3, G4, G5, G6, G7, G8, M1, M2 |
| 20 | Write `README.md`: prerequisites (Node 22 LTS or newer), `npm install`, `npm run dev`, `npm run build`, `npm run test:run`, expected outcomes for G1/G8; note on-canvas fps overlay and optional `?webgpu=1`. | `README.md` | G1, G8 |
| 21 | Write `CONTRIBUTING.md` documenting two-tier model per charter §6: feature branches `feat/<phase>-<slug>` → PR into `integration` after Stage 4; `master` only on Gate 2; Grok merges; `master` always buildable. Note existing local branches `master` and `integration`. | `CONTRIBUTING.md` | G9 |
| 22 | Verify `npm run build` exits 0 and emits `dist/`; verify `npm run test:run` green; smoke `npm run dev` shows palette scene + on-canvas fps. Do not commit. | — | G1, G2, G8, G9 |

*Traceability check: G1→T1,T2,T18,T20,T22; G2→T2,T15–T18,T22; G3→T3,T4,T7,T8,T17,T19; G4→T5,T8,T12–T14,T19; G5→T5,T11–T14,T19; G6→T4,T6,T7,T19; G7→T4,T9,T10,T19; G8→T1,T19,T20,T22; G9→T21,T22. All G1–G9 covered. M1↔G3/G4/G6/G7; M2↔G5; M3↔G2. Zero PENDING markers. No contradictions with KIMI RULINGS v1.*

---

## Data structures & APIs

### Constants (`src/config.ts`)

```ts
export const TICK_HZ = 60 as const;
export const FIXED_DT = 1 / TICK_HZ;
export const MAX_FRAME_DELTA_SEC = 0.25;
export const DEFAULT_PIXEL_RATIO_CAP = 2;
```

### Entity IDs (`src/sim/entityId.ts`)

```ts
export type EntityId = number & { readonly __brand: 'EntityId' };

export class EntityIdAllocator {
  private next: number;
  constructor(startId: number = 1) { this.next = startId; }
  allocate(): EntityId;
  peekNext(): number;
  reset(startId: number = 1): void;
}
```

Rules: IDs are positive integers starting at 1; never reused within a session; `spawnEntity` is the only production allocator path.

### Commands (`src/sim/commands.ts`) — Q1, Q3

```ts
/** Closed set for this feature (Q1). Nothing else. */
export type ActionId = 'interact' | 'cancel';

/**
 * Sim-facing command. NO device provenance field (Q3).
 * The sim must be incapable of knowing which device produced an action.
 */
export interface InputCommand {
  /** Sim tick index at which this command is applied. */
  tick: number;
  /** Monotonic order within the same tick (session-wide counter). */
  sequence: number;
  action: ActionId;
  /** 1 = press edge, 0 = release edge (Q1 press/release pairs). */
  value: 0 | 1;
}

/** G5 parity: deep equality of the entire command object (Q3). */
export function commandsEqualForParity(a: InputCommand, b: InputCommand): boolean;
```

Parity test method: reset bus → inject one device’s press → `drainForTick` → `cmdA`; reset bus → inject the other device’s same action press → `drainForTick` → `cmdB`; assert `commandsEqualForParity(cmdA, cmdB) === true` (identical `tick`/`sequence`/`action`/`value` because provenance does not exist and stamping is deterministic from a reset bus).

### World meta & sim step (`src/sim/types.ts`, `src/sim/step.ts`)

```ts
export interface WorldMeta {
  interactCount: number;
  cancelCount: number;
  lastAction: ActionId | null;
  interactHeld: boolean;
  cancelHeld: boolean;
}

export interface SimState {
  tick: number;
  nextEntityId: number;
  entities: Map<EntityId, Entity>;
  meta: WorldMeta;
}

export function applyCommands(state: SimState, commands: readonly InputCommand[]): void;
export function fixedStep(state: SimState): void;
```

`applyCommands` updates `WorldMeta` (and held flags) only — no movement, no camera. Call order per tick: `applyCommands` → `fixedStep`.

### Hash & replay (`src/sim/hash.ts`, `src/sim/replay.ts`) — Q5

```ts
/** Hash surface (Q5): tick, nextEntityId, entities (all sim-owned fields, id-sorted), meta.
 *  Deterministic serialization (stable key order). Render state excluded. */
export function hashSimState(state: SimState): Promise<string>; // hex sha-256
export function replay(initial: SimState, commands: readonly InputCommand[]): SimState;
export async function assertReplayDeterministic(
  initial: SimState,
  commands: readonly InputCommand[],
): Promise<void>; // throws if hashes differ
```

### Input devices (adapter layer)

```ts
export type DeviceKind = 'keyboard-mouse' | 'gamepad';

export interface InputDevice {
  readonly kind: DeviceKind;
  /** Gather press/release samples since last call. */
  poll(): DeviceSample[];
  /** Actions currently held on this device (for Q4 synthetic releases). */
  getHeldActions(): ReadonlySet<ActionId>;
  /** Clear held tracking without emitting (used after synthetic flush). */
  clearHeld(): void;
  dispose(): void;
}

/** Adapter-only. `kind` must never be copied onto InputCommand (Q3). */
export interface DeviceSample {
  kind: DeviceKind;
  action: ActionId;
  value: 0 | 1;
}
```

### Input bindings — data-driven (Q1)

`src/input/bindings.ts` exports a single table consumed by both device adapters:

```ts
export interface ActionBinding {
  action: ActionId;
  keyboard?: string;       // KeyboardEvent.code, e.g. 'KeyE', 'Escape'
  mouseButton?: number;    // 0 = LMB
  gamepadButton?: number;  // standard mapping index
}

export const ACTION_BINDINGS: readonly ActionBinding[] = [
  { action: 'interact', keyboard: 'KeyE', mouseButton: 0, gamepadButton: 0 },
  { action: 'cancel',   keyboard: 'Escape',               gamepadButton: 1 },
];
```

| ActionId | Keyboard | Mouse | Gamepad (standard) |
|----------|----------|-------|--------------------|
| `interact` | `KeyE` | button 0 (LMB) | `buttons[0]` south (A/cross) |
| `cancel` | `Escape` | — | `buttons[1]` east (B/circle) |

Do not hard-code these lookups inside device classes outside of reading `ACTION_BINDINGS`.

### Command bus — Q3, Q4

```ts
export class CommandBus {
  /** Map device samples → provenance-free intents; buffer until drain. */
  enqueueFromDevices(devices: InputDevice[]): void;
  /**
   * On active-device change or disconnect (Q4): before switching,
   * enqueue synthetic release (value 0) for every held action on the
   * departing device; clear that device's held set; arriving device
   * must be neutral (no synthetic presses).
   */
  notifyDeviceDeparting(device: InputDevice): void;
  /** Stamp tick + sequence; return commands for this tick; clear buffer. */
  drainForTick(tick: number): InputCommand[];
  getActiveDeviceKind(): DeviceKind | null;
}
```

`InputCommand` objects leaving `drainForTick` must not contain any device identity field.

### Renderer

```ts
export interface AppRenderer {
  renderer: THREE.WebGLRenderer | THREE.WebGPURenderer;
  backend: 'webgl2' | 'webgpu';
  setSize(width: number, height: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}

export function createRenderer(canvas: HTMLCanvasElement): Promise<AppRenderer>;
```

### Placeholder scene (Q2)

```ts
export interface PlaceholderScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function createPlaceholderScene(): PlaceholderScene;
```

Requirements: clear `#05080f`; mesh material color in `#1a232e`–`#2a3644`; warm-neutral key + cool fill lighting as in Task 16.

### FPS overlay (Q6)

```ts
export function createFpsOverlay(element: HTMLElement): {
  update(dtSec: number): void;
};
```

Displays a rolling fps number on `#fps-overlay`, visible without opening devtools.

### Frame loop contract

```ts
export function startFrameLoop(args: {
  world: SimState;
  bus: CommandBus;
  devices: InputDevice[];
  scene: THREE.Scene;
  camera: THREE.Camera;
  appRenderer: AppRenderer;
  fpsOverlay: { update(dtSec: number): void };
}): () => void; // returns stop()
```

Pseudo-order each animation frame:
1. `dt = min(now - last, MAX_FRAME_DELTA_SEC)`
2. `accumulator += dt`
3. while `accumulator >= FIXED_DT`: `bus.enqueueFromDevices(devices)` (hot-swap path may call `notifyDeviceDeparting` first); `cmds = bus.drainForTick(world.tick)`; `applyCommands(world, cmds)`; `fixedStep(world)`; `accumulator -= FIXED_DT`
4. `appRenderer.render(scene, camera)`
5. `fpsOverlay.update(dt)` (and optional console fps log)

---

## Edge cases & failure modes

Each row maps to a required automated test ID.

| ID | Case | Required behavior | Test |
|----|------|-------------------|------|
| E1 | Render FPS forced to 30 via test harness injecting `dt=1/30` | Sim still advances 60 ticks per simulated real second (2 ticks per frame) | `fixedTimestep.test.ts` |
| E2 | Render FPS forced to 144 (`dt=1/144`) | Sim advances at 60 Hz; no fractional sim steps; leftover accumulator retained | `fixedTimestep.test.ts` |
| E3 | Spikes `dt > MAX_FRAME_DELTA_SEC` | Clamp; do not spiral (max ticks per frame = `floor(MAX_FRAME_DELTA_SEC / FIXED_DT)`) | `fixedTimestep.test.ts` |
| E4 | Device event fires | World fields unchanged until `applyCommands` | `commandPattern.test.ts` |
| E5 | Headless scripted command file (array fixture) | Drives sim without devices; meta counters update on press | `commandPattern.test.ts` |
| E6 | Same spawn sequence twice (fresh worlds) | Identical `EntityId` sequences | `entityId.test.ts` |
| E7 | KBM `interact` press vs gamepad `interact` press (fake devices, reset bus each) | `commandsEqualForParity` true on **entire** `InputCommand` objects (Q3) | `parity.test.ts` |
| E8 | Hot-swap while `interact` held on KBM → gamepad becomes active | Bus emits synthetic `interact` release (`value: 0`); `meta.interactHeld` becomes false after apply; gamepad starts neutral (Q4) | `hotSwap.test.ts` |
| E9 | `keydown` with `repeat: true` | No extra command | `parity.test.ts` |
| E10 | Replay same commands twice from cloned initial state | Identical `hashSimState`; hash input excludes render (Q5) | `replayDeterminism.test.ts` |
| E11 | Command `tick` mismatch (`command.tick ≠ state.tick`) | Reject/ignore command; do not mutate; test asserts ignore | `commandPattern.test.ts` |
| E12 | WebGPU init fails / unsupported | Fall back to WebGL2; `backend === 'webgl2'`; app still runs | manual smoke + README; optional stubbed `navigator.gpu` test |
| E13 | Device disconnect while both `interact` and `cancel` held | Synthetic releases for **both** held actions, then neutral (Q4) | `hotSwap.test.ts` |
| E14 | `InputCommand` type / runtime object | Assert no `source` / `device` / `kind` field exists on drained commands (Q3) | `parity.test.ts` |

---

## Test / verification requirements

Composer must run **all** of the following before opening the PR. Document the exact commands in `README.md`.

### Automated (required green)

```bash
npm install
npm run test:run
npm run build
```

`npm run test:run` must execute Vitest in non-watch mode and exit 0. Suite must include assertions for:

| Goal | Assertion (minimum) |
|------|---------------------|
| G3 | E1–E3 pass; `fixedStep` / `applyCommands` signatures accept no frame `deltaTime` |
| G4 | E4–E5, E11 pass; sim entrypoint is command-only |
| G5 | E7–E9, E13–E14 pass |
| G6 | E6 pass |
| G7 | E10 pass |
| G8 | single command `npm run test:run` runs the suite |

### Manual / smoke (required evidence in PR body)

```bash
npm run dev
```

1. Browser opens; canvas shows hull-steel box on void `#05080f` with warm key + cool fill (G1, G2 / Q2).
2. **On-canvas** `#fps-overlay` shows rolling fps; at 1080p on mid-tier GPU, fps ≥ 60 in the placeholder (G2 / Q6). Console log optional.
3. Press `E` / LMB / gamepad south and `Escape` / gamepad east: press/release update scaffold meta without a menu (G5 / Q1).
4. Hot-swap or disconnect mid-hold: no stuck held intents; arriving device neutral (G5 / Q4).

### Docs check (G9)

- `CONTRIBUTING.md` names `master` / `integration`, PR target `integration`, Gate 2 → `master`, merge authority = Grok.
- `npm run build` succeeds on the feature branch; do not break `master`.

### PR body must cite

- Spec version (`SPEC v1`), goals G1–G9, mechanics M1–M3
- Link to `features/p1-project-scaffold/clarification-log.md` (KIMI RULINGS v1)
- Test command output summary + build success
- Screenshot of placeholder scene **including** the on-canvas fps overlay

---

## Out of scope (Composer must NOT touch)

**From design pack non-goals (enforce):**

- No ~60° gameplay camera rig, no player movement, no aim — those belong to `p1-player-controller`.
- No twin-stick aiming, no aim-assist (design doc §9: 0.35 / 10°), no UI navigation — those belong to `p1-gamepad-support`. G5 is **plumbing parity only** (same command stream; closed `{ interact, cancel }` only).
- No gameplay mechanics: no combat, enemies, deck geometry, mission logic, alarm, doors, weapons, health, or gameplay HUD (the fps overlay is Gate 1 evidence only — not a game HUD).

**Also out of scope for this feature:**

- Editing `docs/design/**`, `docs/team/**`, design pack, or any file under `features/` (Composer does not edit this `spec.md` or `design-pack.md`).
- Authoring/shipping art under `assets/`; importing mockup SVGs into the three.js scene.
- Networking / multiplayer / rollback netcode implementation (architecture readiness only).
- Procedural generation, room graph, physics engines, audio.
- Changing charter branch policy; inventing a third long-lived branch.
- React/Vue/Svelte, CSS frameworks, or a second bundler.
- Replacing Vitest with another test runner.
- Committing to `master` or `integration` directly; Composer uses `feat/p1-project-scaffold` only.
- WebGPU as a hard requirement (optional path only).
- Adding device provenance onto `InputCommand` or the sim layer (forbidden by Q3).

---

*Clarification for this spec: see `clarification-log.md` in this folder (KIMI RULINGS v1 — all resolved).*
