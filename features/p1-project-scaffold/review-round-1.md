# Stage 4 — Review round 1 / max 5

**Reviewer:** Grok 4.5 (Technical Lead)  
**PR:** https://github.com/benthepoet/nemesis-protocol/pull/1  
**Posted:** https://github.com/benthepoet/nemesis-protocol/pull/1#issuecomment-5123937047  
**Versions worked from:** charter v1.13 · design doc v1.10 · design pack v2 · SPEC v1 FINAL · KIMI RULINGS v1

## Independent verification

| Command | Result |
|---------|--------|
| `npm install` | ok (up to date) |
| `npm run test:run` | 6 files, **16 tests passed**, exit 0 |
| `npm run build` | `tsc` + vite build exit 0, `dist/` emitted |

## Deviation rulings (Technical Lead)

1. **devDeps `@types/three@0.178.0` + `jsdom`** — **ACCEPT.** `jsdom` is required for E9 (`@vitest-environment jsdom` + `KeyboardMouseDevice`). `@types/three` is harmless/justified for TS resolution with `three@0.178.0`.
2. **`hash.ts` uses `globalThis.crypto.subtle` in Vitest instead of `node:crypto`** — **ACCEPT.** Node 22 provides Web Crypto; single path yields identical SHA-256 and green E10. Prefer keeping one implementation.

## Findings

1. **[blocker] Task 13–14 / Q4 / E13:** `GamepadDevice.poll()` on disconnect clears `previousButtons` and returns without emitting release edges for held actions; `startFrameLoop` / `boot` never call `CommandBus.notifyDeviceDeparting`. A mid-hold pad disconnect leaves stuck held intents until some other device produces samples (and may never clear). **Required fix:** on disconnect transition, emit releases for all held actions (device edge path and/or `notifyDeviceDeparting` from the loop) so Q4 “immediate clear” holds without waiting for another device; extend E13 to exercise the live disconnect path (not only the API helper in isolation).

2. **[blocker] Task 19 / Edge case E8:** `tests/input/hotSwap.test.ts` asserts `world.meta.interactHeld === true` after the swap tick, but E8 requires synthetic `interact` release and **`meta.interactHeld` false after apply** with arriving device **neutral**. Current case conflates swap with an arriving `interact` press. **Required fix:** rewrite E8 so arriving device activates without pressing `interact` (e.g. `cancel` press, or depart-only), assert release `value: 0` and `interactHeld === false` after apply, and that arriving starts with no held state.

3. **[minor] Tasks 6–7:** `EntityIdAllocator` is implemented and unit-tested, but `spawnEntity` increments `state.nextEntityId` directly and never uses the allocator class. Determinism still holds; wire production spawns through the allocator (keeping `nextEntityId` / hash surface in sync) per task 7.

4. **[minor] Task 14:** `mapSamplesToIntents` exists but `CommandBus.enqueueFromDevices` manually strips `kind` instead of calling the mapper. Behavior is provenance-free; route through the mapper so the InputMapper + bus contract matches the API section.

5. **[minor] Verification / PR body:** Stage 3 required screenshot of placeholder scene **including** on-canvas `#fps-overlay` is missing (noted headless-only). Overlay implementation itself is present (Tasks 2, 17). Attach screenshot before Gate 1.

6. **[question] Task 15 / API:** Spec types `AppRenderer.renderer` as `THREE.WebGLRenderer | THREE.WebGPURenderer`; implementation uses a `RenderSurface` structural type. Acceptable if intentional for WebGPU import ergonomics — confirm no further change needed.

## Verdict

**REQUEST CHANGES** — two open blockers. Merge held. Round 1 of 5.
