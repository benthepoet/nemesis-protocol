# Stage 4 — Review round 2 / max 5

**Reviewer:** Grok 4.5 (Technical Lead)  
**PR:** https://github.com/benthepoet/nemesis-protocol/pull/1  
**Posted:** https://github.com/benthepoet/nemesis-protocol/pull/1#issuecomment-5123978788  
**Versions worked from:** charter v1.13 · design doc v1.10 · design pack v2 · SPEC v1 FINAL · KIMI RULINGS v1

## Independent verification

| Command | Result |
|---------|--------|
| `npm install` | ok (up to date) |
| `npm run test:run` | 6 files, **17 tests passed**, exit 0 |
| `npm run build` | `tsc` + vite build exit 0, `dist/` emitted |

## Per-finding verification (revision round 1)

1. **[blocker] Q4 / E13 disconnect** — **verified-fixed** (`c10a67b`). `GamepadDevice.poll()` on connected→absent emits `value: 0` for every held action and clears `held` before clearing `previousButtons`. New E13 exercises live `GamepadDevice` + bus + `applyCommands` (not only `notifyDeviceDeparting`); asserts releases for `cancel`+`interact`, both meta held flags false, device held empty. Pre-fix disconnect cleared buttons and returned empty pending — that test would fail on old code. Frame loop continues to poll devices each fixed tick, so device-edge path is sufficient without `notifyDeviceDeparting` from the loop.

2. **[blocker] E8** — **verified-fixed** (`b8709bd`). Arriving pad activates with `cancel` press (not `interact`); asserts synthetic/bus `interact` release (`value: 0`) and `interactHeld === false` after apply. Old test expected `interactHeld === true` after swap with arriving `interact` — would fail the new assertions. Arriving intentional `cancelHeld === true` is correct and does not reintroduce stuck prior-device state.

3. **[minor] spawnEntity → EntityIdAllocator** — **verified-fixed** (`c8eb18b`). `createWorld` / `cloneSimState` attach allocator via `WeakMap`; `spawnEntity` allocates through it and syncs `state.nextEntityId = peekNext()`. Replay path uses `cloneSimState` (re-attach at cloned `nextEntityId`). Determinism surface preserved.

4. **[minor] mapSamplesToIntents** — **verified-fixed** (`40604ee`). `enqueueFromDevices` routes polled samples through `mapSamplesToIntents` before buffering.

5. **[minor] fps screenshot** — **still absent** (Composer cannot capture headlessly). Overlay implementation remains in place (Tasks 2/17). **Not blocking Stage 4 technical approval** — this is Gate 1 / Director local-smoke evidence per spec PR-body + Q6. Remains open for Gate 1.

6. **[question] RenderSurface** — **ACCEPT.** Confirmed: `THREE.WebGPURenderer` is not exported from the main `three` / `@types/three` module entry (`TS2724`); runtime correctly dynamic-imports `three/webgpu`. Structural `RenderSurface` is an intentional, correct compile-time stand-in covering both backends. No alignment change required.

## New defects from revision commits

None. Revision diff is scoped to the four fix commits + round-trip log (`gamepad.ts`, `hotSwap.test.ts`, `world.ts`, `commandBus.ts`).

## Open items (non-blocking for Stage 4)

- FPS overlay screenshot still needed before **Gate 1** (finding 5).

## Verdict

**APPROVE** — zero open blockers. Stage 4 technical approval granted. **Merge held** pending Director/process handoff (Gate 1 next). Round 2 of 5.
