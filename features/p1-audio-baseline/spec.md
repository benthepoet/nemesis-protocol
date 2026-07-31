# Technical Specification — p1-audio-baseline

`SPEC v1 FINAL | feature p1-audio-baseline | charter v1.13 | design doc v1.19 | design pack v1 | goals: G1..G9 | mechanics: M1..M6`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability. Supersedes `spec-outline.md`.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.19** (§12.1 audio baselines; §10 footstep cadence + bed crossfade rows) · visual direction **v1.10** · design pack **v1** (G1–G9, M1–M6, R1–R8) · feature roadmap **v1.9** (P1 #14) · clarification log **all resolved (pack R1–R8 + TL bindings below)** · AGENTS.md current · branch `feat/p1-audio-baseline` · base `integration` @ `0084465` · shipped deps: scaffold, player-controller, combat-core v2, enemy-baseline, mission-shell, hud, deck-polish (as merged)

### Clarification rulings incorporated

No design questions raised to Kimi at Stage 2 FINAL — pack v1 + design doc v1.19 fully settle G1–G9 / M1–M6 / R1–R8. Pack “Open questions anticipated for Stage 2” are Technical Lead authority; locked below. Prior Stage 2 prep topics (footsteps, impacts, shell inventory, ambient lifecycle, non-goals, Gate 1 bar, assets) are answered by pack R1–R8 / G1–G9 / prereq table — see `clarification-log.md`.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | (none to Kimi) | TL bindings in Technical decisions |
| TL-A1 | Web Audio API backend; no new npm deps | Technical decisions |
| TL-A2 | Container `.ogg` (Vorbis); Vite serves/copies `assets/audio` | Layout + T1/T2 |
| TL-A3 | Round-robin variants (render counters only) | Technical decisions |
| TL-A4 | Listener = follow camera (fly cam when debug-fly) | Technical decisions / R6 |
| TL-A5 | Autoplay unlock on first user gesture; bed starts ASAP after | Technical decisions / R7 |
| TL-A6 | No voice-drop for required event reports; soft voice pool OK | Technical decisions |
| TL-A7 | Minimal stereo via PannerNode; ambient/UI non-spatial | Technical decisions / R6 |
| TL-A8 | `p2-ship-pa` deferred — modular `src/audio/` only; no PA/duck API | Out of scope |

Composer may start Stage 3 on branch `feat/p1-audio-baseline` once prereq audio assets (or license-clean placeholders matching the prereq table filenames) are present under `assets/audio/`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Package | New top-level `src/audio/` — render-side only. **No** imports from `src/audio` into `src/sim`, `src/combat`, `src/ai`, `src/mission`, `src/input`. Audio may import types/constants from those packages **read-only**. | G7, M1, M6 |
| Backend | **Native Web Audio API** (`AudioContext`, `AudioBuffer`, `AudioBufferSourceNode`, `GainNode`, `PannerNode`). Do **not** add howler/tone/three-audio deps; do not use `THREE.Audio` / `AudioListener` (keeps audio independent of renderer backend swap). | Pack anticipated; G7; latency ≤1 frame |
| Asset container | Shipped files **`.ogg` (Vorbis)**. Filenames match pack prereq table **without** requiring a double extension in code URLs — e.g. `p1_sfx_rifle_fire_01.ogg`. Loops authored gapless. | Pack format call; seamless bed (G6) |
| Vite asset plugin | Extend `nemesisAssetsPlugin` to serve + `closeBundle`-copy **`audio`** beside `models`/`textures`; MIME `audio/ogg` (and `audio/wav` if any interim WAV appears in DEV only — do not ship WAV in FINAL unless Kimi delivers WAV and pack is amended). | G9 path parity with existing assets |
| URL constants | `src/audio/urls.ts` (or extend `src/render/assets/urls.ts` — prefer **`src/audio/urls.ts`**) using `ASSET_BASE_URL` → `/assets/audio/...` | Matches ASSET_BASE_URL pattern |
| Preload | `preloadAudioAssets(): Promise<AudioBuffers>` at boot (parallel `fetch` + `decodeAudioData`). Missing/failed decode → `console.warn` once per file; **do not throw** (boot continues; that cue silent). | Soft fail; Gate 1 still requires assets for acceptance |
| Unlock / resume | On first `pointerdown` \| `keydown` \| `gamepadconnected`/button poll success (document-level), call `audioContext.resume()` then start ambient bed if not started. Design contract R7: bed from earliest permitted moment. | R7; browser autoplay |
| Combat wiring | Same path as VFX: `startFrameLoop({ onCombatEvents })` — wrap so both `combatVfx.push(events)` **and** `gameAudio.pushCombatEvents(events)` run. Do not change `CombatEvent` union. | G2–G4, G7, R3 |
| Crew AI events | Do **not** pass `onCrewAiEvents` to audio. Wind-up stays visual-only. | G8, R5 |
| Event→cue (R3) | `muzzle` + `ownerKind === PLAYER_KIND` → rifle family; `muzzle` + `ownerKind === SECURITY_CREW_KIND` → sidearm family; `impact-wall` → wall family; `impact-actor` → actor family; `hit-flash` → **no-op**. Unknown/`ownerKind` missing on muzzle → treat as rifle if player shot path impossible — prefer **silence** if `ownerKind` absent (defensive; shipped events always set it). | R3 |
| Variants | **Round-robin** per family via render-side integer counters on the audio service. Never `Math.random`, never sim RNG, never write counters into `SimState`. | Pack anticipated; rule spec 6 |
| Spatialization (R6) | World one-shots (gunfire, impacts, footsteps): `PannerNode` `distanceModel: 'linear'`, `refDistance` / `maxDistance` from Constants, `rolloffFactor: 1`. Listener pose = gameplay follow-camera world position (XZ) + orientation from camera forward; debug-fly → fly camera. Ambient bed + UI SFX: **non-spatial** (destination via master gain only). Minimal stereo from panner is OK; no HRTF/convolver. | R6 |
| Footsteps (R1/G1) | Each `sync`/`update(dtSec, state)` while `missionPhase === 'ACTIVE'` and player alive: measure horizontal displacement from last sample; `speed = dist / max(dtSec, ε)`; if `speed < FOOTSTEP_SILENCE_SPEED_MPS` (0.5) reset stride accumulator and play nothing; else accumulate distance; each time accumulator ≥ `FOOTSTEP_STRIDE_M` (= `PLAYER_MOVE_SPEED_MPS / FOOTSTEP_RATE_AT_CAP_HZ`), consume one stride and play next footstep variant at player position. Equivalent rate: `2.2 * (speed / 6)` steps/s. | G1, R1, §10 |
| Gameplay mute (G5) | Footsteps / combat one-shots only when `missionPhase === 'ACTIVE'`. If combat events somehow arrive outside ACTIVE, ignore. Shell UI sounds fire on shell edges only. | G5 |
| Shell edges (R4) | Render-side prev snapshot: `breachSelectIndex` change while BRIEFING → `ui_focus`; BRIEFING→INSERTION (or interact edge leaving BRIEFING) → `ui_confirm`; enter SCORE → `ui_score_appear`; SCORE→BRIEFING (restart) → `ui_confirm`. One play per edge; no repeat while held. | G5, R4 |
| Ambient bed (R2/R7/G6) | Two looping buffer sources (calm + alert) into a 2-gain crossfade pair → master. Both start together after unlock; AL0: calm gain 1, alert 0; on `alarmLevel` 0→1 edge start **1.5 s** equal-power crossfade (calm→0, alert→1). Never reverse until `reset`/new mission (restart → calm). Poll `meta.alarmLevel` each presentation sync (lighting precedent). | G6, R2, R7 |
| Equal-power crossfade | Over `t ∈ [0,1]` for duration 1.5 s: calm = `cos(t * π/2)`, alert = `sin(t * π/2)` (or equivalent equal-power). | R2 |
| Concurrency | Soft voice pool / stop finished sources. **Must not drop** required event plays (G2/G4 counts). Do not implement priority dropping. | Pack anticipated |
| Master gain | Single master `GainNode` default `1.0`. No user volume UI. Optional DEV-only `?muteAudio=1` URL flag that sets master to 0 — nice-to-have, not required for Gate 1. | R8 |
| Sim drift | **Zero** edits under `src/sim/`, `src/combat/`, `src/ai/`, `src/mission/`, `src/input/` **semantics**. Import-only of types/constants from audio allowed the other direction only. `CombatEvent` union byte-identical. Hash/replay suites unchanged in expectations. | G7 |
| Visuals | No HUD/shell/palette/telegraph visual changes. | G8 |
| PA foundation | Modular `src/audio/` is the foundation; **no** PA channel, ducking, or voice API in this feature. | Roadmap note; pack non-goal |

---

## Constants (add to `src/config.ts` exactly)

```ts
/** Footstep cadence at move-speed cap (steps/s). Design doc §10 / pack R1. */
export const FOOTSTEP_RATE_AT_CAP_HZ = 2.2 as const;
/** Silence footsteps at or below this measured speed (m/s). Pack R1. */
export const FOOTSTEP_SILENCE_SPEED_MPS = 0.5 as const;
/** Stride length at cap: PLAYER_MOVE_SPEED_MPS / FOOTSTEP_RATE_AT_CAP_HZ. */
export const FOOTSTEP_STRIDE_M = PLAYER_MOVE_SPEED_MPS / FOOTSTEP_RATE_AT_CAP_HZ;
/** AL0→AL1 ambient bed crossfade (seconds). Design doc §10 / pack R2. */
export const ALARM_BED_CROSSFADE_SEC = 1.5 as const;
/** World SFX linear distance model (meters). TL — R6 audibility baseline. */
export const AUDIO_REF_DISTANCE_M = 8 as const;
export const AUDIO_MAX_DISTANCE_M = 48 as const;
```

No other magic numbers for cadence, crossfade, or distance model. Per-asset trim levels may be local constants in `src/audio/` (defaults `1.0`) — R8 tuning levers, not sim.

---

## Exact project layout (additions / extensions only)

```
/
├── assets/
│   └── audio/                                      # NEW (Kimi prereq assets)
│       ├── p1_sfx_rifle_fire_01.ogg … _03.ogg
│       ├── p1_sfx_sidearm_fire_01.ogg … _03.ogg
│       ├── p1_sfx_impact_wall_01.ogg … _03.ogg
│       ├── p1_sfx_impact_actor_01.ogg … _02.ogg
│       ├── p1_sfx_footstep_01.ogg … _04.ogg
│       ├── p1_sfx_ui_focus_01.ogg
│       ├── p1_sfx_ui_confirm_01.ogg
│       ├── p1_sfx_ui_score_appear_01.ogg
│       ├── p1_bed_ship_calm_loop.ogg
│       ├── p1_bed_ship_alert_loop.ogg
│       └── p1_attribution.md
├── vite.config.ts                                  # EXTEND: serve/copy audio + MIME
├── src/
│   ├── config.ts                                   # EXTEND: FOOTSTEP_*, ALARM_BED_*, AUDIO_* distances
│   ├── audio/                                      # NEW package
│   │   ├── urls.ts                                 # NEW: /assets/audio/… constants
│   │   ├── types.ts                                # NEW: GameAudio, buffer maps, shell snapshot
│   │   ├── preloadAudio.ts                         # NEW: fetch+decode
│   │   ├── createGameAudio.ts                      # NEW: factory — pushCombatEvents, update, dispose
│   │   ├── combatCues.ts                           # NEW (optional split): R3 mapping + play
│   │   ├── footsteps.ts                            # NEW (optional split): R1 cadence
│   │   ├── shellCues.ts                            # NEW (optional split): R4 edges
│   │   └── ambientBed.ts                           # NEW (optional split): R2/R7 bed
│   ├── render/
│   │   └── frameLoop.ts                            # KEEP API; boot wires dual consumers
│   └── app/
│       └── boot.ts                                 # EXTEND: preload audio, createGameAudio, wire events + sync + dispose
└── tests/
    └── audio/
        ├── combatCues.test.ts                      # G2–G4, R3
        ├── footsteps.test.ts                       # G1, R1
        ├── shellCues.test.ts                       # G5, R4
        ├── ambientBed.test.ts                      # G6, R2
        ├── audioDeterminism.test.ts                # G7
        └── bindingAudit.test.ts                    # G8 anti-assumption (optional grep/unit)
```

Do **not** edit `docs/` (except this feature folder’s logs if asked), `tools/mockups/`, or other features’ design packs. Do not change three.js / Vitest / Vite **version** pins. Do **not** add npm audio libraries. Do not edit visual HUD/shell presentation.

**Asset gate:** Stage 3 implementation of playback may land against silent/mocked buffers in unit tests; Gate 1 / Gate 2 require real files from the prereq table + `p1_attribution.md`.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Add Constants to `config.ts` exactly as above (`FOOTSTEP_RATE_AT_CAP_HZ`, `FOOTSTEP_SILENCE_SPEED_MPS`, `FOOTSTEP_STRIDE_M`, `ALARM_BED_CROSSFADE_SEC`, `AUDIO_REF_DISTANCE_M`, `AUDIO_MAX_DISTANCE_M`). | `src/config.ts` | G1, G6, R1, R2, R6, M1 |
| 2 | Extend Vite plugin: serve files under `assets/audio/`; copy `audio/` into `dist/assets/audio` on build; MIME for `.ogg`. | `vite.config.ts` | G9, M1 |
| 3 | Add `src/audio/urls.ts` listing every pack prereq clip URL under `${ASSET_BASE_URL}/audio/…`. | `src/audio/urls.ts` | G9, prereq table |
| 4 | Implement `preloadAudioAssets(ctx)` → decoded buffer map keyed by cue id; warn-and-skip on failure. | `src/audio/preloadAudio.ts` | G9, boot |
| 5 | Implement `createGameAudio({ getListenerPose })` returning `{ pushCombatEvents, update(dtSec, state), dispose, unlock? }`. Own `AudioContext`, master gain, round-robin counters, shell prev-snapshot, footstep accumulator, bed gains. **No sim writes.** | `src/audio/createGameAudio.ts` (+ splits) | G1–G8, M1, M6 |
| 6 | Combat mapping (R3): on `pushCombatEvents`, if phase ACTIVE, play spatial one-shots per binding; `hit-flash` ignored; assert one play attempt per event (G2/G4). | `src/audio/combatCues.ts` or inside factory | G2, G3, G4, R3, M3 |
| 7 | Footsteps (R1): in `update`, ACTIVE + alive only; displacement cadence; silence rules; spatial at player XZ. | `src/audio/footsteps.ts` or factory | G1, R1, M2 |
| 8 | Shell cues (R4): detect focus / confirm / score-appear / restart edges; play non-spatial UI clips. | `src/audio/shellCues.ts` or factory | G5, R4, M5 |
| 9 | Ambient bed (R2/R7): dual loops + 1.5 s equal-power crossfade on AL0→AL1; restart resets calm; runs across all phases after unlock. | `src/audio/ambientBed.ts` or factory | G6, R2, R7, M4 |
| 10 | Boot integration: `await preloadAudioAssets`; `createGameAudio`; wire `onCombatEvents` to VFX **and** audio; call `audio.update(dt, world)` from `syncPresentation` / `onFrame` (both follow + debug-fly paths); pass listener from active camera; register unlock listeners; `dispose` tears down context/nodes/listeners. | `src/app/boot.ts` | G1–G7, M1, M6 |
| 11 | Attribution file present (authored with assets): `assets/audio/p1_attribution.md` listing every shipped file. Composer lands empty stub **only if** Director/Kimi instruct; otherwise expect Kimi asset drop — do not invent third-party credits. | `assets/audio/p1_attribution.md` | G9 |
| 12 | Tests per **Test / verification** below. Full `npm run test:run` + `npm run build` green. | `tests/audio/*` | G1–G9 |
| 13 | Anti-assumption audit: no wind-up/reload/door/death/klaxon/HUD/music/PA code paths; no `src/sim|combat|ai|mission|input` semantic diffs. | PR + tests | G7, G8, R5 |

---

## Boot integration (contract)

```ts
const audioBuffers = await preloadAudioAssets();
const gameAudio = createGameAudio({
  buffers: audioBuffers,
  getListenerPose: () => ({ /* from active camera */ }),
});

// unlock on first gesture → resume + ensureBedStarted()

const stopLoop = startFrameLoop({
  // …
  onCombatEvents: (events) => {
    combatVfx.push(events);
    gameAudio.pushCombatEvents(events, world); // or phase read inside update only — either OK if G2 latency ≤1 frame
  },
});

// inside syncPresentation / onFrame:
gameAudio.update(dtSec, world);

// dispose:
gameAudio.dispose();
```

**Latency:** combat cues must be scheduled in the same animation frame that receives the `onCombatEvents` batch (G2). Prefer calling `pushCombatEvents` directly from that callback rather than deferring to a later `update` only.

**Listener:** update panner listener each frame from the **active** camera (follow or debug-fly).

---

## Event → sound binding (normative — R3/R4)

| Trigger | Condition | Cue family | Spatial? |
|---------|-----------|------------|----------|
| `CombatEvent` `muzzle` | ACTIVE ∧ `ownerKind === PLAYER_KIND` | `p1_sfx_rifle_fire_*` (RR 01–03) | yes @ event xyz |
| `CombatEvent` `muzzle` | ACTIVE ∧ `ownerKind === SECURITY_CREW_KIND` | `p1_sfx_sidearm_fire_*` (RR 01–03) | yes @ event xyz |
| `CombatEvent` `impact-wall` | ACTIVE | `p1_sfx_impact_wall_*` (RR 01–03) | yes @ hit |
| `CombatEvent` `impact-actor` | ACTIVE | `p1_sfx_impact_actor_*` (RR 01–02) | yes @ hit |
| `CombatEvent` `hit-flash` | any | **silence** | — |
| `breachSelectIndex` Δ | BRIEFING | `p1_sfx_ui_focus_01` | no |
| leave BRIEFING (confirm) | interact edge / phase→INSERTION | `p1_sfx_ui_confirm_01` | no |
| enter SCORE | phase Δ → SCORE | `p1_sfx_ui_score_appear_01` | no |
| leave SCORE (restart) | phase → BRIEFING | `p1_sfx_ui_confirm_01` | no |
| footstep stride | ACTIVE ∧ alive ∧ speed ≥ 0.5 | `p1_sfx_footstep_*` (RR 01–04) | yes @ player |
| `alarmLevel` 0→1 | any phase (bed running) | crossfade calm→alert 1.5 s | bed non-spatial |

---

## Edge cases & failure modes

| ID | Case | Expected |
|----|------|----------|
| E-a | BRIEFING / INSERTION / SCORE | Zero footsteps, gunfire, impacts |
| E-b | INSERTION with move intent held | Silence (verbs locked; phase non-ACTIVE) |
| E-c | Full-speed into wall (blocked) | Measured speed → 0 → footstep silence |
| E-d | Wall-slide half speed | Cadence ≈ half of 2.2 (± test tolerance) |
| E-e | Mag empty / reload window | No rifle reports (no muzzle events) |
| E-f | Sustained 10 rps fire 3 s | Exactly 30 rifle plays (full mag) then silence during reload |
| E-g | `hit-flash` with `impact-actor` | Exactly one actor-hit sound (not two) |
| E-h | AL1 already | No second crossfade; stays alert |
| E-i | Restart after AL1 | Calm layer restored; alert gain 0 |
| E-j | AudioContext suspended | After first gesture, resume + bed audible |
| E-k | Missing ogg file | Warn; that cue silent; boot lives |
| E-l | Debug-fly camera | Listener follows fly cam; SFX still work |
| E-m | `pushCombatEvents` + hash | World hash unchanged |
| E-n | Unlisted SFX | Absent from code and assets (G8) |
| E-o | Crew wind-up | No audio (`onCrewAiEvents` unused) |

---

## Test / verification requirements

Prefer pure functions / injectable “play” spies (mock `AudioContext` or inject a `CuePlayer` interface) so jsdom/vitest does not need real audio hardware. Real decode optional behind existence checks.

| Suite | Coverage |
|-------|----------|
| `combatCues.test.ts` | R3 map: player muzzle→rifle, crew→sidearm, wall/actor impacts, hit-flash silent; ACTIVE gate; one play per event; RR advances |
| `footsteps.test.ts` | At 6 m/s for 1 s → 2.2 ±0.1 steps; at 3 m/s → ~1.1; speed &lt; 0.5 → 0; non-ACTIVE → 0; dead → 0 |
| `shellCues.test.ts` | Focus Δ → focus cue; BRIEFING confirm → confirm; SCORE enter → score-appear; restart → confirm; no gameplay cues on those phases |
| `ambientBed.test.ts` | AL0 gains; trip starts crossfade; after 1.5 s alert full; no de-escalate; restart resets calm |
| `audioDeterminism.test.ts` | Scripted mission stream: `hashSimState` identical with `createGameAudio`+`update`+`pushCombatEvents` vs without; control: different commands → different hash |
| `bindingAudit.test.ts` (optional) | Static list of allowed cue ids equals prereq table; no `windup`/`reload`/`klaxon`/`music` string paths in `src/audio` |

**Regression:** `npm run test:run` green (mission, combat, ai, hud, input, deck). `npm run build` green. Diff audit: no semantic changes under `src/sim/`, `src/combat/`, `src/ai/`, `src/mission/`, `src/input/`.

**Manual / Gate 1 evidence (pack):** four clips — `gate1-briefing-score.*`, `gate1-footsteps.*`, `gate1-firefight.*`, `gate1-alarm-shift.*` — plus G7 hash transcripts and G9 attribution. Evidence only; never shipped as game assets.

---

## Zero sim drift guards (checklist for Stage 4)

1. `CombatEvent` union in `src/combat/types.ts` unchanged.  
2. No new fields on `Entity` / `WorldMeta` / hash payload for audio.  
3. No audio imports from sim packages that mutate state.  
4. Replay/determinism tests unmodified in expectations; new audio determinism tests prove hash stability with audio active.  
5. Alarm trip rules, combat fire rates, shell state machine untouched — audio **mirrors** only.  
6. Presentation randomness (RR counters) lives only inside `src/audio/`.

---

## Out of scope (do not build)

- Music; score stingers beyond `ui_score_appear`; PA voice / ducking / `p2-ship-pa` API  
- Mixing buses, occlusion, priorities, volume/options UI, persisted settings  
- P3 wall-creak / vacuum muffling; crew footsteps; wind-up / reload / door / death / hit-reaction / klaxon / HUD sounds  
- Any sim event/field/number/mechanic change; haptics  
- Visual HUD/shell/palette/telegraph changes  
- New npm dependencies for audio  
- Code implementation in this Stage 2 deliverable (Composer Stage 3)

---

## Traceability matrix

| Goal | Tasks | Primary tests |
|------|-------|---------------|
| G1 | T1, T5, T7, T10, T12 | `footsteps.test.ts` |
| G2 | T5, T6, T10, T12 | `combatCues.test.ts` |
| G3 | T5, T6, T10, T12 | `combatCues.test.ts` |
| G4 | T5, T6, T10, T12 | `combatCues.test.ts` |
| G5 | T5, T8, T10, T12 | `shellCues.test.ts` |
| G6 | T1, T5, T9, T10, T12 | `ambientBed.test.ts` |
| G7 | T5, T10, T12, T13 | `audioDeterminism.test.ts` + regression |
| G8 | T6–T9, T13 | binding audit + manual |
| G9 | T2, T3, T4, T11 | attribution + license scan |

| Mechanic | Covered by |
|----------|------------|
| M1 | All tasks |
| M2 | T7 (read-only) |
| M3 | T6 (read-only events) |
| M4 | T9 |
| M5 | T8 |
| M6 | T5, T10, T12, T13 |

Every goal has ≥1 task; every task traces to ≥1 goal. Provisional outline T1–T10 folded into tasks 1–13 above.
