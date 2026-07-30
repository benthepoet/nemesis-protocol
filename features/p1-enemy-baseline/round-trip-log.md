# Round-Trip Log — p1-enemy-baseline

*One line per event, oldest first. Audit trail for the pipeline (charter §5).*

| Date | Event | Detail |
|------|-------|--------|
| 2026-07-30 | Kickoff | Director, phase P1 (roadmap v1.7, P1 #5; dependency p1-combat-core Gate-2 accepted; hold released — "Kick off") |
| 2026-07-30 | Design pack | v1 (design doc v1.13 → **v1.14** bumped doc-first by this pack — rulings R2/R3/R4/R5/R6/R7; visual direction v1.4 → **v1.5** — ruling R9; charter v1.13). G1..G10, M1..M8, R1..R11. Stand-in disposition ruled REPLACE (R1); security-crew reference board v1 delivered (`references/references.md`) |
| 2026-07-30 | Spec | **v1 FINAL** — Grok 4.5, Stage 2. Charter v1.13 · design doc v1.14 · visual v1.5 · design pack v1. Zero clarification questions (pack R1–R11 + anticipated topics sufficient). 20 tasks, G1–G10 / M1–M8 full traceability. Ready for Composer Stage 3 on `feat/p1-enemy-baseline` |
| 2026-07-30 | Stage 3 | Composer 2.5 Fast — branch `feat/p1-enemy-baseline`; spec v1 FINAL; tasks 1–20; `npm run test:run` 121 passed; `npm run build` green |
| 2026-07-30 | PR opened | https://github.com/benthepoet/nemesis-protocol/pull/6 |
| 2026-07-30 | Review round 1 | Grok Stage 4 — **REQUEST CHANGES** (6 blockers / 3 minors). Tasks 1–17 + 19 impl look spec-aligned; local `npm run test:run` 121/121 + build green; no CI workflows configured. **Hold merge.** T18 verification incomplete: vacuous E10 assert; missing E6/E19/E20/E27–E28; E8 allows PATROL. Composer must revise tests (and any defects they expose) then push for round 2. |
| 2026-07-30 | Revision round 2 | Composer — T18 blockers 1–6: E10 real fire/dmg/cadence; E6 wall LOS + E4 leave-reset; E8 forbid PATROL @ AL1; E19 crew→player dmg+respawn; E20 friendly-fire pass-through; E27–E28 tracer/wind-up asserts. `npm run test:run` **130/130**; `npm run build` green. Awaiting Grok round 2. |
| | Gate 1 (Kimi) | pass / fail → findings |
| | Gate 2 (Director) | accept / amend / reject → feedback ref |
| | Director iterations (§3.5a) | cycle <n>: diagnosis <design/spec/impl> |
| | Escalations | <E-IDs if any> |

**Final state:** in pipeline (Stage 1 delivered) · **Design doc version at acceptance:** —
