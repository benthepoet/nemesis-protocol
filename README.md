# Nemesis Protocol

Browser-runnable P1 project scaffold: fixed-timestep sim, command-only input, and a palette-conformant three.js placeholder scene.

## Prerequisites

- **Node.js** 22 LTS or newer
- **npm** (lockfile committed; use `npm install`)

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server — canvas placeholder + on-canvas `#fps-overlay` |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run test:run` | Vitest (non-watch); must exit 0 for CI/scaffold verification (G8) |
| `npm run preview` | Serve production build locally |

### Expected outcomes

- **G1:** After `npm run dev` or `npm run preview`, the app loads in a browser with a full-viewport WebGL canvas.
- **G8:** `npm run test:run` runs the full E1–E14 / G3–G8 suite headlessly.

Optional: append `?webgpu=1` to the dev URL to attempt WebGPU rendering when `navigator.gpu` is available; the app falls back to WebGL2 on failure.

## Controls (scaffold)

- **Interact:** `E`, mouse LMB, gamepad south (A/cross)
- **Cancel:** `Escape`, gamepad east (B/circle)

Both emit press/release commands into the sim meta counters (no gameplay HUD beyond the fps overlay).

## Player controller (p1-player-controller)

| Input | Action |
|-------|--------|
| **W / A / S / D** | Move (6 m/s, normalized diagonals) |
| **Mouse** | Aim (raycast onto deck plane) |
| **Gamepad left stick** | Move |
| **Gamepad right stick** | Aim (deadzone 0.24) |
| **E / gamepad south** | Interact (DEV console trace on press) |
| **Escape / gamepad east** | Cancel |
| **Mouse LMB / gamepad RT** | Fire |
| **R / gamepad face west** | Reload |

With `?debugCamera=1` in dev, free-fly owns **KeyE** (vertical rise); keyboard **E** does not emit interact. Default boot uses follow camera (~60° pitch), player capsule, three crew stand-ins, combat VFX, DEV combat readout, and occupied-room ceiling cutaway.

Verification:

```bash
npm run test:run   # scaffold (17) + deck + player + combat suites
npm run build
npm run dev        # WASD + mouse aim; LMB fire; R reload; E interact
```

## Combat core (p1-combat-core)

Bindings (R1): **LMB / RT** fire; **R / face west** reload; **E / south** interact (not LMB). DEV-only `debugDamage` command for player HP testing (tests / dev enqueue only).

```bash
npm run test:run   # tests/combat/* E1–E28 + input fireReloadArbitration
npm run build
npm run dev
```

## Deck 03 (p1-deck-geometry)

After `npm run dev`, the app loads the Deck 03 blockout (floors, walls, ceilings, per-room accent tints) instead of the scaffold placeholder cube.

| Command / URL | Purpose |
|---------------|---------|
| `npm run dev` | Dev server with deck blockout + fps overlay |
| `?debugCamera=1` | Dev-only free-fly inspection camera (WASD + mouse look, Q/E vertical, Shift sprint). Requires `import.meta.env.DEV`. |
| `npm run test:run` | Vitest — scaffold regression (17 tests) + deck suite (E1–E20) |
| `npm run build` | Typecheck + production build |

Verification: `npm run test:run` and `npm run build` must exit 0 before PR submission.
