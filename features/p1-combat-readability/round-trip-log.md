# Round-Trip Log — p1-combat-readability

*One line per event, oldest first. Audit trail for the pipeline (charter §5).*

| Date | Event | Detail |
|------|-------|--------|
| 2026-07-30 | Kickoff | Director iteration 1 (§3.5a) on shipped `p1-combat-core` (Gate 2 accepted on `master`). Severity: S2 hotfix / presentation gap. Parent pack v2 (G10/M10/R7/R8); visual direction v1.4. Branch: `feat/p1-combat-readability`. |
| 2026-07-30 | Design pack | Inherited — `p1-combat-core` design pack **v2** addendum (no independent pack; pointer in this folder). |
| 2026-07-30 | Spec | HOTFIX SPEC **v1 FINAL** — G10 (a)–(f), M10, R7/R8; sim-coupling guards; full G1–G9 regression; zero open clarification questions. |
| 2026-07-30 | Stage 3 | Composer — branch `feat/p1-combat-readability`; telegraph constants, `earliestWallHit`, `combatTelegraphs`, boot wire, tests (105), README; `npm run test:run` + `npm run build` green. |
| 2026-07-30 | PR opened | #5 → `integration` (commit d58ec5a) |
| 2026-07-30 | Review round 1 | Grok: REQUEST CHANGES — verify 105/105 + build 0 @ `70cbead`; G9 `combatVfx` untouched; sim constants/`integrateCombat` frozen; coupling + G10(e) present. Blocker: aim-line `geo.translate(0,0.5)` + midpoint pose breaks R8/G10(c) muzzle→wall. Formal `gh pr review --request-changes` may be blocked (self-PR); verdict in PR comment. |
| 2026-07-30 | Revision round 1 | Composer — aim-line start pose fix + `getAimLineEndpointsForTest`; 106/106 + build green. |
| 2026-07-30 | Review round 2 | Grok: **APPROVE** — verified `aac89d9`: `orientHorizontalSegment` poses at muzzle (matches `geo.translate(0,0.5)`); `getAimLineEndpointsForTest` asserts muzzle→wall; **106/106** + build 0. Zero open blockers. Stage 4 technical approval granted. Self-PR: verdict in PR comment. |
| | Gate 1 (Kimi) | |
| | Gate 2 (Director) | |
| | Director iterations (§3.5a) | cycle 1 in progress (this hotfix) |
| | Escalations | none |

**Final state:** Stage 4 approved · **Parent design pack version:** v2 · **Visual direction:** v1.4 · **Design doc:** v1.13 · **Spec:** HOTFIX v1 FINAL · **PR:** #5
