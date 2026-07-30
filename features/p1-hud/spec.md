# Technical Specification — p1-hud

`SPEC v1 FINAL | feature p1-hud | charter v1.13 | design doc v1.16 | design pack v1 | goals: G1..G9 | mechanics: M1..M8`
*Owner: Grok 4.5. Status: **FINAL** — ready for Stage 3. Zero open clarification questions; full traceability.*

**Versions worked from (charter §8):** charter **v1.13** · design doc **v1.16** · visual direction **v1.6** · design pack **v1** @ `e06d370` (G1–G9, M1–M8, R1–R8) · feature roadmap **v1.8** (P1 #7; #7/#8 split per R6) · shipped deps: `p1-mission-shell`, `p1-combat-core` (+ readability), `p1-enemy-baseline` · clarification log **all resolved (no Kimi questions; TL bindings below)** · AGENTS.md current · HEAD surveyed `e06d370`

### Clarification rulings incorporated

No design questions raised to Kimi — pack v1 + design doc v1.16 + visual v1.6 fully settle G1–G9 / M1–M8 / R1–R8. Pre-answered pack topics (render surface, layout, display granularity, focus model, DEV disposition) are locked as Technical Lead bindings below. Zero doc bumps required for this spec.

| Q# | Ruling (summary) | Spec landing |
|----|------------------|--------------|
| — | (none to Kimi) | TL bindings in Technical decisions |

Composer may start Stage 3 on branch `feat/p1-hud`.

---

## Technical decisions (Technical Lead authority — locked)

| Concern | Choice | Why |
|---------|--------|-----|
| Render surface | **DOM overlay** (`position:fixed`, `pointer-events:none`) — same family as `missionShellUi` / `objectiveBanner` / `combatDevReadout`. Not in-scene/canvas text. | G8/G9; pack anticipated topic; matches shell chrome pattern; zero sim coupling |
| View-model split | Pure functions `buildHudView(state) → HudView` and `formatMissionClock(ticks) → string` in `src/render/hud/` (or `hudView.ts`). DOM sync only applies the view. No writes to `SimState`. | G9; unit-testable without DOM |
| HUD visibility | Visible **iff** `missionPhase ∈ {INSERTION, ACTIVE}`. Hidden for BRIEFING, SCORE, and any other phase. Shell overlays own BRIEFING/SCORE (z-index above HUD). | G1, M6, R1 |
| Element inventory | Exactly five DOM regions: health, ammo, objective line, alarm indicator, mission clock. No sixth. Transient objective banner (`objectiveBanner.ts`) is **not** a HUD element — leave it unchanged. | G1, G4, R1, R7 |
| Layout (blockout) | Screen-edge anchors, center plane clear: **bottom-left** health + ammo (stacked); **top-left** objective line; **top-right** alarm + clock (stacked). Chrome base `#05080f` family behind text blocks (semi-opaque panel ok). Final aesthetics = `p1-visual-pass`. | G8, M8 |
| Palette constants | Reuse / add config hexes: allied `PLAYER_COLOR_HEX` / `#69f0ae`; hazard `HOSTILE_COLOR_HEX` / `#ff5252`; interactive `#ffd54f` (new `UI_FOCUS_HEX`); void `SHELL_CHROME_HEX` / `#05080f`. Never cross meanings. | G8, M8, VD §3 v1.6 |
| Health presentation | Integer HP from `entity.hp` (playerId). Color allied when `hp > 25`; at `hp ≤ 25` pulse hazard via **CSS animation** (render-only). HP 0 shown while still INSERTION/ACTIVE (death tick leaves phase ACTIVE until next shell tick → SCORE — see edge E-d). | G2, M1, R2 |
| Ammo presentation | Idle: `${magazine} / ${reserve}` integers. While `reloadTicksRemaining > 0`: show `RELOADING` + progress `p = 1 - reloadTicksRemaining / RELOAD_DURATION_TICKS` clamped `[0,1]`, displayed to 2 decimal places (e.g. `0.00`…`1.00`). Mag `0` must remain readable (do not blank the mag numeral during reload — show `0 / reserve` plus RELOADING line, or keep mag visible beside progress). | G3, M2, R3 |
| Objective line | Text empty when `!objectiveIssued`; else exactly `OBJECTIVE_BANNER_TEXT` (`Reach Engineering`). No completion copy; ignore `objectiveComplete` for the line (persists until mission end / SCORE hides HUD). Banner coexistence unchanged. | G4, M3 |
| Alarm indicator | Data table `ALARM_LEVEL_LABELS` keyed `0..4` (or enough for MELTDOWN): `AL0 UNAWARE`, `AL1 ALERTED`, plus AL2+/MELTDOWN names for forward-compat **unreachable** at P1 (`alarmLevel` typed `0\|1`). Display `AL{n} {NAME}`. AL0 dim/neutral (e.g. `#e0e0e0` at ~0.45 opacity or `#8b949e`); AL1 solid hazard `#ff5252`. Read `meta.alarmLevel` only — never derive from DEV readout. | G5, M4, R4 |
| Mission clock | `formatMissionClock(state.tick)` → `M:SS` (minutes, no zero-pad required on M; seconds always two digits). Source = sim `tick` from 0 — **not** `performance.now` / wall clock. Score screen may keep its existing seconds display; G6 equality = same underlying tick (`missionEndTick` / current tick) — assert HUD string at end-state tick equals `formatMissionClock(score.missionEndTick)`. | G6, M5, R5 |
| Shell focus (G7) | **Derived focus** — no new sim fields. BRIEFING: focus index = `meta.breachSelectIndex`; focused row styled `#ffd54f` (replace/augment bare `▸`). SCORE: single focus target on the restart prompt line (`#ffd54f`). Exactly one visible focus at a time. Navigation/confirm/cancel remain existing shell sim path — **no new bindings**, confirm ≠ fire. | G7, M7, R6 |
| DEV readout (R8) | Keep `createCombatDevReadout` DEV-only. Add `[DEV]` prefix; move to **top-center or far top-left** away from player HUD edges; never styled as shipped chrome; never required for G# checks. Optional URL toggle `?devReadout=0` to hide — nice-to-have, not required. | R8 |
| Sim / tick order | **No changes** to integrators, commands, alarm, combat, mission shell, hash, or tick order. HUD is render-only, synced from `boot.ts` `syncPresentation` (and tests call `buildHudView` / HUD `update` after ticks). | G9, non-goals |
| Determinism proof | Replay / hash tests: identical command streams → identical hashes with or without HUD constructed/updated. HUD modules must not import mutators that write sim state. | G9 |
| Regression | All mission-shell / combat-core / enemy-baseline suites stay green unmodified in behavior. | charter §7 |

---

## Exact project layout (additions / extensions only)

Composer **adds** or **extends** these paths. Do not invent top-level packages beyond `src/render/hud/`.

```
/
├── src/
│   ├── config.ts                         # EXTEND: UI_FOCUS_HEX, HUD_LOW_HEALTH_HP, ALARM_LEVEL_LABELS (or hud-local table + exported focus/low-HP constants)
│   ├── render/
│   │   ├── hud/
│   │   │   ├── types.ts                  # NEW: HudView, AlarmLabelEntry
│   │   │   ├── formatMissionClock.ts     # NEW: ticks → M:SS
│   │   │   ├── alarmLabels.ts            # NEW: data-driven AL0..MELTDOWN table (if not in config)
│   │   │   ├── buildHudView.ts           # NEW: SimState → HudView (pure)
│   │   │   └── createHud.ts              # NEW: DOM chrome; update(state); dispose()
│   │   ├── missionShellUi.ts             # EXTEND: #ffd54f visible focus on breach rows + SCORE restart
│   │   ├── combatDevReadout.ts           # EXTEND: [DEV] prefix + reposition (R8)
│   │   ├── objectiveBanner.ts            # KEEP (coexists; do not merge into HUD)
│   │   └── …
│   └── app/
│       └── boot.ts                       # EXTEND: createHud; sync in syncPresentation; dispose
└── tests/
    ├── render/
    │   ├── hudView.test.ts               # G1–G6 view-model (phase visibility, HP/ammo/obj/alarm/clock)
    │   ├── hudFocus.test.ts              # G7 shell focus presentation helpers / DOM class contract
    │   └── hudDeterminism.test.ts        # G9 hash unchanged with HUD update calls
    └── helpers/
        └── hudTestUtils.ts               # NEW (optional): mount HUD host, snapshot view
```

Do **not** edit `docs/` (except this feature folder’s logs if asked), `assets/` tangible art, `tools/mockups/`, or other features’ design packs. Do not change three.js / Vitest / Vite pins. Do not add audio, HUD skinning, aim-assist, hot-swap logic, or persistence.

---

## Task breakdown (in order)

| # | Task | Files | Traces to |
|---|------|-------|-----------|
| 1 | Add palette / threshold constants: `UI_FOCUS_HEX = '#ffd54f'`, `HUD_LOW_HEALTH_HP = 25`, void/allied/hazard already present — re-export or document reuse. Add `ALARM_LEVEL_LABELS` table (AL0 UNAWARE … forward-compat AL2+/MELTDOWN). | `src/config.ts` and/or `src/render/hud/alarmLabels.ts` | G2, G5, G8, M4, M8, R2, R4 |
| 2 | Implement `formatMissionClock(ticks: number): string` → `M:SS` (non-negative; floor minutes; seconds `floor(ticks/TICK_HZ)%60` zero-padded to 2). Pure; no wall clock. | `src/render/hud/formatMissionClock.ts` | G6, M5, R5 |
| 3 | Implement `HudView` types + `buildHudView(state): HudView \| null` — `null` when phase ∉ {INSERTION, ACTIVE}; otherwise five fields: health `{hp, lowHealth}`, ammo `{magazine, reserve, reloading, reloadProgress}`, objective `{text}`, alarm `{level, label, numeral, hazardous}`, clock `{text, ticks}`. | `src/render/hud/types.ts`, `buildHudView.ts` | G1–G6, M1–M6, R1–R5 |
| 4 | Implement `createHud(host): { update(state); dispose() }` — DOM for exactly five readouts; apply palette rules (allied HP, hazard pulse ≤25, ammo/objective allied, alarm dim vs hazard, clock neutral/allied); screen-edge layout per Technical decisions; chrome `#05080f` family; `pointer-events:none`; z-index below shell (20) and such that SCORE/BRIEFING shell fully covers. | `src/render/hud/createHud.ts` | G1, G2, G3, G5, G8, M8, R1 |
| 5 | Extend `missionShellUi.ts`: BRIEFING selected row uses visible focus color `#ffd54f` (not merely `▸`); SCORE restart prompt is the single `#ffd54f` focus target. No new bindings; still driven only by sim state. | `src/render/missionShellUi.ts` | G7, M7, R6 |
| 6 | DEV readout: `[DEV]` prefix + reposition off player HUD edges (R8). | `src/render/combatDevReadout.ts` | R8 (supports G5 independence) |
| 7 | Wire boot: `createHud(document.body)`; `hud.update(world)` inside `syncPresentation`; dispose on teardown. Do **not** gate sim on HUD. | `src/app/boot.ts` | G1, G9 |
| 8 | Tests: view-model suites for visibility lifecycle, HP/ammo/reload/objective/alarm/clock; shell focus color contract; determinism (hash identical with/without HUD updates); binding audit (no new `ACTION_BINDINGS`). | `tests/render/hud*.test.ts`, helpers | G1–G9, M1–M8 |
| 9 | README subsection **HUD (p1-hud)**: five readouts, visibility phases, low-HP threshold, alarm labels, clock format, shell focus, DEV vs shipped. Verification commands. | `README.md` | G1–G8 |
| 10 | Verify `npm run test:run` and `npm run build` green; smoke INSERTION/ACTIVE chrome + BRIEFING/SCORE focus; AL1 firefight center clear. Do not commit. | — | G1–G9 |

*Traceability check: G1→T3,T4,T7,T8; G2→T1,T3,T4,T8; G3→T3,T4,T8; G4→T3,T4,T8; G5→T1,T3,T4,T6,T8; G6→T2,T3,T4,T8; G7→T1,T5,T8; G8→T1,T4,T5,T9,T10; G9→T3,T4,T7,T8,T10. M1↔G2; M2↔G3; M3↔G4; M4↔G5; M5↔G6; M6↔G1; M7↔G7; M8↔G8. All G1–G9 covered. Zero orphan tasks.*

---

## Data structures & APIs

### Constants

```ts
/** UI focus / highlight (visual §3 interactive — v1.6 UI note). */
export const UI_FOCUS_HEX = '#ffd54f' as const;

/** Low-health presentation threshold (design §10 / pack R2). Pulse hazard at hp ≤ this. */
export const HUD_LOW_HEALTH_HP = 25 as const;

/** Reuse existing: PLAYER_COLOR_HEX, HOSTILE_COLOR_HEX, SHELL_CHROME_HEX, OBJECTIVE_BANNER_TEXT,
 *  RELOAD_DURATION_TICKS, TICK_HZ, ALARM_LEVEL_AL0, ALARM_LEVEL_AL1 */
```

### Alarm label table (data-driven)

```ts
export const ALARM_LEVEL_LABELS: Readonly<Record<number, string>> = {
  0: 'UNAWARE',
  1: 'ALERTED',
  2: 'HARDENED',   // unreachable at P1 — table only
  3: 'SIEGE',      // unreachable at P1
  4: 'MELTDOWN',   // unreachable at P1 — name may match §4; presence is the contract
};
```

Display string: `` `AL${level} ${ALARM_LEVEL_LABELS[level]}` `` (e.g. `AL0 UNAWARE`, `AL1 ALERTED`). Exact AL2–4 name strings may match design §4 ladder wording; if §4 uses different words, prefer §4 names — **labels only**, no behavior. Grep/tests prove table keys ≥ 0..4 exist; no P1 test drives level ≥ 2.

### View model

```ts
export interface HudView {
  health: { hp: number; lowHealth: boolean };
  ammo: {
    magazine: number;
    reserve: number;
    reloading: boolean;
    /** 0..1 when reloading; 0 when not. */
    reloadProgress: number;
  };
  objective: { text: string }; // '' or OBJECTIVE_BANNER_TEXT
  alarm: {
    level: 0 | 1;
    numeral: string; // 'AL0' | 'AL1'
    name: string;
    label: string;   // 'AL0 UNAWARE' | 'AL1 ALERTED'
    hazardous: boolean; // level >= 1
  };
  clock: { ticks: number; text: string }; // text === formatMissionClock(ticks)
}

/** null ⇒ HUD must not render any of the five readouts. */
export function buildHudView(state: SimState): HudView | null;

export function formatMissionClock(ticks: number): string;

export interface MissionHud {
  update(state: SimState): void;
  dispose(): void;
}

export function createHud(host: HTMLElement): MissionHud;
```

**`buildHudView` rules:**

| Field | Source |
|-------|--------|
| visible | `phase === 'INSERTION' \|\| phase === 'ACTIVE'` else `null` |
| `health.hp` | `entities.get(playerId)?.hp ?? 0` |
| `health.lowHealth` | `hp <= HUD_LOW_HEALTH_HP` |
| ammo | `meta.magazine`, `meta.reserve`, `meta.reloadTicksRemaining` |
| `reloadProgress` | `reloading ? clamp01(1 - remaining/RELOAD_DURATION_TICKS) : 0` |
| objective | `meta.objectiveIssued ? OBJECTIVE_BANNER_TEXT : ''` |
| alarm | `meta.alarmLevel` + label table |
| clock | `formatMissionClock(state.tick)` |

### Shell focus presentation contract

- BRIEFING: the row whose index equals `breachSelectIndex` has computed style / marker color `UI_FOCUS_HEX`. Non-focused rows are not interactive-yellow.
- SCORE: the restart hint line uses `UI_FOCUS_HEX`.
- Tests may assert via DOM (`getComputedStyle` / data attributes `data-focused="true"`) — Composer may add `data-focused` for testability; recommended.

### Boot sync

```ts
const hud = createHud(document.body);
// inside syncPresentation:
hud.update(world);
// dispose path:
hud.dispose();
```

---

## Edge cases & failure modes

| ID | Case | Expected |
|----|------|----------|
| E-a | BRIEFING / SCORE | `buildHudView` → `null`; no five-readout DOM visible |
| E-b | INSERTION start | HUD visible; objective empty; AL0; clock running; HP 100; `30 / 120` |
| E-c | Door-open → ACTIVE | Objective becomes `Reach Engineering` same tick as `objectiveIssued`; banner still fires 180 ticks |
| E-d | Lethal damage | Death tick: phase still ACTIVE, HUD shows HP `0`; next tick SCORE hides HUD (mission-shell same-tick SCORE enter on the shell check after death) |
| E-e | `debugDamage` / direct hp set to 25 | `lowHealth===true`, hazard pulse class applied; hp 26 clears pulse |
| E-f | Fire 7 rounds | Ammo `23 / 120` within 1 tick |
| E-g | Reload complete | Mag/reserve update; RELOADING clears |
| E-h | Empty-mag auto-reload | RELOADING + progress for ~`RELOAD_DURATION_TICKS` (±1); mag `0` readable |
| E-i | Alarm trip | Label flips to `AL1 ALERTED` hazard within 1 tick; never returns to AL0 |
| E-j | Clock vs score | At SCORE, `formatMissionClock(score.missionEndTick)` equals last ACTIVE/INSERTION HUD clock text for that end tick |
| E-k | HUD update in tests | Calling `hud.update` / `buildHudView` never mutates hash |
| E-l | COMPLETE/FAILED phase values | If ever observed, treat as not visible (only INSERTION/ACTIVE show). Current shell promotes to SCORE same tick |
| E-m | No player entity | HP displays `0`; do not throw |
| E-n | R7 absences | No minimap, hit markers, vignettes, interact prompts, reticle chrome, pause menu, squad HUD in PR |
| E-o | Confirm vs fire | Shell confirm remains interact (E / face-south); fire binding unchanged and unused for confirm |

---

## Test / verification requirements

Composer must add/pass the following (names advisory). Prefer pure `buildHudView` + `formatMissionClock` tests; DOM tests only where G7/G8 require.

| Suite | Coverage |
|-------|----------|
| `hudView.test.ts` | G1 visibility matrix; G2 HP + low-health flag at 25/26; G3 ammo/reload progress; G4 objective empty→issued; G5 AL0→AL1 + no de-escalation; G6 clock `M:SS` advances with tick not wall time; end-tick equals `formatMissionClock(missionEndTick)` |
| `hudFocus.test.ts` | G7 BRIEFING focus follows `breachSelectIndex` with `#ffd54f`; SCORE restart focused; KBM-mapped vs gamepad-mapped command streams still yield identical `breachSelectIndex` / SCORE restart (reuse mission-shell parity pattern); `ACTION_BINDINGS` length/contents unchanged |
| `hudDeterminism.test.ts` | G9: scripted mission command stream → identical `hashWorld` with HUD constructed+updated vs never created; differ when commands differ |
| Alarm table | Table contains unreachable AL2+/MELTDOWN keys (grep or unit assert); no test sets `alarmLevel > 1` |

**Regression:** `npm run test:run` green for mission-shell, combat-core, enemy-baseline, input, deck. `npm run build` green.

**Manual smoke:** BRIEFING focus yellow on Port/Starboard → INSERTION HUD chrome → ACTIVE fight with AL1 hazard alarm + low-HP pulse → COMPLETE/FAILED SCORE with yellow restart focus; center telegraphs unobstructed; DEV readout clearly marked and not mistaken for HUD.

---

## Out of scope (Composer must NOT touch)

- **#8 `p1-gamepad-support`:** twin-stick aim-assist (0.35 / 10°), input-device hot-swap mid-mission, gameplay action-parity gaps, navigation for UI introduced by #8
- HUD skinning / fonts / panel art / motion polish — `p1-visual-pass` (#9, M-P1)
- Everything in design pack R7 absent list: minimap, compass, off-screen arrows, hit markers, damage vignettes, kill/score popups, interact prompts, crosshair changes, pause/options, co-op squad HUD
- Alarm AL2+ behavior, lockdown UI, PA — P2
- Any sim, tuning, combat, AI, alarm trip rules, or mission-logic change
- Score-screen field set / composite score / persistence changes (clock **source** already correct; optional display-format change to M:SS on score is **not required** this feature)
- Audio
- Design doc / visual direction / roadmap / other feature packs

---

*Clarification for this spec: see `clarification-log.md` in this folder — **zero open questions**.*
