# Clarification Log — p1-audio-baseline

*Design clarification loop per charter §3.2a. Grok asks numbered questions; Kimi answers by number; answers are binding rulings. Design changes from this log require a design-doc version bump BEFORE spec finalization.*

**Working versions:** charter v1.13 · design doc v1.19 · visual direction v1.10 · design pack v1 · SPEC **v1 FINAL**.

| Q# | Grok's question | Kimi's ruling / TL binding | Doc change? |
|----|-----------------|----------------------------|-------------|
| — | *(none raised to Kimi at Stage 2 FINAL)* Pack v1 + design doc v1.19 fully settle G1–G9 / M1–M6 / R1–R8. Pre-kickoff Stage 2 prep topics (footstep model, gunfire/impacts, shell inventory, ambient lifecycle, spatialization baseline, non-goals, Gate 1 bar, assets, PA foundation) are answered by pack R1–R8 / G1–G9 / prereq table / acceptance criteria. | n/a — pack | R1/R2 → design doc v1.19 (already landed) |
| TL-A1 | Audio backend & asset format (pack anticipated) | **TL:** Native Web Audio API; shipped container `.ogg` (Vorbis); Vite serves/copies `assets/audio/`. No new npm deps. | no |
| TL-A2 | Variant selection randomness (pack anticipated) | **TL:** Round-robin per cue family via render-side counters only — never sim RNG / never `Math.random` into sim-readable state. | no |
| TL-A3 | Listener placement (pack anticipated) | **TL:** Follow camera = listener; debug-fly uses fly camera. Ambient + UI non-spatial. | no |
| TL-A4 | Autoplay unlock (pack anticipated) | **TL:** Resume `AudioContext` on first user gesture; start bed ASAP after resume (R7 contract). | no |
| TL-A5 | SFX concurrency caps (pack anticipated) | **TL:** Soft voice cleanup OK; **must not drop** required G2/G4 event reports. | no |
| TL-A6 | Headphone/stereo panning (pack anticipated) | **TL:** Minimal stereo via `PannerNode` distance model only (R6); no HRTF/convolution. | no |
| TL-A7 | `p2-ship-pa` foundation | **TL:** Modular `src/audio/` only this feature; no PA/duck/voice API reserved beyond clean package boundary. | no |

*Status: ☑ all questions resolved — spec may finalize. Open Q count: **0**. SPEC v1 FINAL written 2026-07-31.*
