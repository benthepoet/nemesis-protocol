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

With `?debugCamera=1` in dev, free-fly owns **KeyE** (vertical rise); keyboard **E** does not emit interact. Default boot uses follow camera (~60° pitch), player capsule, **eight** security-crew patrol posts, combat VFX, DEV combat readout (alarm + AI states), and occupied-room ceiling cutaway.

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

## Combat readability telegraphs (p1-combat-readability)

World-space **projectile tracers** (R7) and a persistent **aim-direction line** (R8) — render-only; sim combat rules unchanged. Parent design: `features/p1-combat-core` design pack **v2** (G10/M10). Branch: `feat/p1-combat-readability`.

```bash
npm run test:run   # includes tests/combat/telegraphs.test.ts + G10(e) determinism
npm run build
npm run dev        # LMB/RT fire shows moving tracers; aim line dim at rest, bright while fire held
```

## Enemy baseline (p1-enemy-baseline)

Eight deck-authored **security crew** (`crewSpawnTable` in `deck03.json`): two spine rovers + six room posts. **AL0 / AL1** alarm stub (no de-escalation); shared **LKP** on trip; crew FSM (patrol → chase → attack → investigate). Hostile tracers use `#ff5252` halo; ATTACK wind-up shows red pre-glow (render-only). DEV readout adds `ALn`, LKP coords, and `crewId:STATE` for all crew.

```bash
npm run test:run   # combat-core regression + tests/ai/* + tests/deck/crewSpawnTable.test.ts
npm run build
npm run dev        # AL0 patrol; fire in airlock without LOS → AL1 converge; sight cone → chase/attack
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

## Mission shell (p1-mission-shell)

Boot starts in **BRIEFING** (no player): choose **Port** or **Starboard** breach (vertical move axis), **Interact** to confirm. **INSERTION** runs a **5 s** airlock cycle with the inner spine door closed and combat verbs locked; then **ACTIVE** (door open, objective issued). Reach **Engineering** while alive for **COMPLETE**; player death is **FAILED** (no respawn). End states show a **score** screen (breach, mission time, alarm, crew neutralized); **Interact** restarts to a fresh **BRIEFING**.

Verification:

```bash
npm run test:run   # includes tests/mission/* + updated combat fail-flow tests
npm run build
npm run dev        # BRIEFING → breach → cycle → fight → Engineering or death → score → restart
```

## HUD (p1-hud)

DOM overlay (`#mission-hud`) with **five readouts** during **INSERTION** and **ACTIVE** only: **health** and **ammo** (bottom-left, stacked), **objective line** (top-left), **alarm** and **mission clock** (top-right, stacked). Hidden during **BRIEFING** and **SCORE** (shell overlays sit above at z-index 20).

| Topic | Detail |
|-------|--------|
| Low HP | Hazard pulse when HP ≤ **25** (`HUD_LOW_HEALTH_HP`) |
| Ammo | `${mag} / ${reserve}`; **RELOADING** + 0.00–1.00 progress while reload ticks run |
| Objective | Empty until issued; then **`Reach Engineering`** (banner unchanged) |
| Alarm | **AL0 UNAWARE** (dim) / **AL1 ALERTED** (hazard `#ff5252`); table includes AL2+ labels for forward-compat |
| Clock | **`M:SS`** from sim `tick` via `formatMissionClock` — not wall clock |
| Shell focus | BRIEFING breach row + SCORE restart hint use **`#ffd54f`** (`UI_FOCUS_HEX`) |
| DEV readout | **`[DEV]`** prefix, top-center — not shipped HUD chrome |

Verification:

```bash
npm run test:run   # tests/render/hud*.test.ts + full regression
npm run build
npm run dev        # yellow breach focus → in-mission HUD → AL1 + low-HP pulse → score restart focus
```

## Gamepad support (p1-gamepad-support)

**Gamepad-only aim assist** (sim-side): magnetism **0.35**, half-angle cone **10°**, range **60 m** (same as rifle max range). Assist runs only when the **aim channel owner** is **gamepad** (`getChannelOwner('aim') === 'gamepad'`); keyboard/mouse aim stays raw `atan2` with no pull.

**Hot-swap:** per-channel MRU + synthetic releases unchanged from player-controller; mission-state verification in `tests/input/missionHotSwap.test.ts`.

**Full loop:** `tests/mission/gamepadOnlyLoop.test.ts` drives BRIEFING → INSERTION → ACTIVE (assist + fire) → SCORE → restart using **only** gamepad-mapped samples (zero `keyboard-mouse` in the recorded stream).

Verification:

```bash
npm run test:run   # aimAssist, missionHotSwap, gamepadOnlyLoop, bindingsAudit + full regression
npm run build
npm run dev        # right-stick assist near crew; mouse aim unchanged; KBM↔pad hot-swap mid-fight
```

## Visual pass (p1-visual-pass / M-P1)

Presentation-only milestone: hero GLBs, deck PBR textures, AL0/AL1 lighting, combat VFX surfaces, HUD/shell chrome. **No sim, tuning, or binding changes** — `hashSimState` / `hashDeckGraph` stay bit-identical.

**Asset paths (canonical):**

- Models: `assets/models/p1_*.glb`
- Textures: `assets/textures/p1_*.png`
- Served at `/assets/…` in dev (`vite` plugin) and copied to `dist/assets/` on build.

**Regenerate procedural stand-ins (R3):**

```bash
node tools/textures/generate-p1-textures.mjs
node tools/models/generate-p1-placeholders.mjs
```

Replace placeholders with Kimi-authored assets at the same paths before Gate 1.

**AL0 / AL1:** AL0 = warm keys + corridor practicals + light haze (`HAZE_DENSITY_AL0`). AL1 = corridor amber beacons + denser haze (`HAZE_DENSITY_AL1`); rooms unchanged. Alarm never de-escalates in sim.

**Verification:**

```bash
npm run test:run   # 224 tests incl. heroAnimation, heroMuzzleParityAnim, heroPbrRestore, visualPassDeterminism
npm run build
npm run dev        # FPS overlay (`#fps-overlay`) for G14; smoke heroes, AL1 beacons, HUD skin
```

**Hero animation (G16–G17 / M10–M11):** rigged GLBs drive render-only `AnimationMixer` instances — clips `idle`, `move`, `aim_fire`, and crew `death`. No root motion (sim still owns position/yaw). Move playback rate scales from presentation speed (player **6 m/s**; crew **2.0 / 3.5 / 4.5 m/s** by FSM). Rifle parents to bone `hand_r_grip` when present.

**`HERO_MATERIAL_MODE` (`src/config.ts`):** `'basic'` (default) keeps tune-4 unlit heroes for anim Gate 1; flip to `'pbr'` before Gate 2 to restore `MeshStandardMaterial` maps within the **two** shadow-casting directional cap (`SHADOW_CASTING_DIRECTIONAL_MAX`) so WebGL texture units stay safe.

Gate 1 screenshots S1–S10: manual capture plan (optional DEV screenshot harness not landed).
