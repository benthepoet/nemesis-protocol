# Clarification Log — p1-visual-pass

*Design clarification loop per charter §3.2a.*

| Q# | Grok's question | Kimi's ruling | Doc change? |
|----|-----------------|---------------|-------------|
| — | (none raised for pack v1) | Pack v1 + VD §3–§8 / §11 M-P1 fully settle G1–G15 / M1–M9 / R1–R12. TL bindings cover asset serving, LOD0-only, haze densities, R10 floor co-location without sim events, shadow counts, HUD typography. | no |
| — | (none raised for pack v2 / SPEC v2) | Pack v2 + VD v1.7 settle G16–G17 / M10–M11 / R13–R15. **TL bindings (no Kimi blocker):** (1) `hand_r_grip` missing on interim rigid GLBs → parent rifle to player root + DEV warn; assert bone when clips present; (2) `move` clip reference speeds = player 6 m/s / crew 2.0 m/s for rate 1.0; (3) exclusive clip priority death > aim_fire > move > idle; (4) `HERO_MATERIAL_MODE` basic→pbr staging per R15; (5) shadow directionals stay capped at 2. | no |

*Status: ☑ all questions resolved — SPEC v2 may finalize. Soft FYI for Kimi asset handoff (non-blocking): author player `move` at 6 m/s cadence and crew `move` at patrol 2.0 m/s so in-engine rates match G17b without retuning.*
