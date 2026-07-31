# Reference Boards — p1-audio-baseline

*Index only (charter v1.11): links + notes + attribution. Third-party audio/video material is inspiration only — never shipped, never committed beyond this index; license-clean files may go under `references/cleared/`. Gathered 2026-07-31 by Kimi K3 per the reference-first rule (charter §1, adapted to audio: reference **listening** boards) before any asset production. Working versions: visual direction v1.10 · design doc v1.19.*

*Tone anchor: these are the audio analogs of the VD §1 north stars — industrial believability first, dread through restraint. The ship sounds like machinery that happens to be dying, not a horror soundtrack.*

## Board G — Weapon, impact & footstep SFX (assets `p1_sfx_rifle_fire_*` / `p1_sfx_sidearm_fire_*` / `p1_sfx_impact_*` / `p1_sfx_footstep_*`)

*Target read: reports that survive repetition — 10 rps rifle fire must not smear into noise; sidearm A/B-distinct from rifle; impacts dry and brief; footsteps loopable at 2.2 steps/s without fatigue.*

| # | Reference | Link | Use | Attribution / license |
|---|-----------|------|-----|------------------------|
| G1 | *Alien: Isolation* (Creative Assembly, 2014) — pulse rifle & revolver foley | https://store.steampowered.com/app/214490/Alien_Isolation/ | Retro-mechanical gun reports: chunky, pre-digital character; how restraint keeps automatic fire listenable | © SEGA / Creative Assembly — inspiration only, not shipped |
| G2 | *Dead Space* remake (Motive, 2023) — weapon & surface-impact foley | https://store.steampowered.com/app/1693980/Dead_Space/ | Impact family separation (metal vs body); short tails that keep hits readable in dense fights | © EA / Motive — inspiration only |
| G3 | *Alien Swarm: Reactive Drop* (2017) — top-down shooter mix perspective | https://store.steampowered.com/app/563560/Alien_Swarm_Reactive_Drop/ | Genre lineage: how gunfire reads from a top-down camera — presence without first-person loudness | © Reactive Drop Team — inspiration only |
| G4 | *The Callisto Protocol* (Striking Distance, 2022) — industrial foley density | https://store.steampowered.com/app/1544020/The_Callisto_Protocol/ | Material believability of metal hits and boot-on-deck footsteps in a capital-ship interior | © KRAFTON / Striking Distance — inspiration only |
| G5 | Kenney — Audio packs (CC0) | https://kenney.nl/assets/category:Audio | Candidate **source** pool for UI ticks and impact bases (CC0 — shippable with attribution logged) | Kenney — CC0, license-clean |
| G6 | Freesound — CC0 search filter | https://freesound.org/search/?f=license:%22Creative+Commons+0%22 | Candidate **source** pool for rifle/sidearm/footstep bases (CC0 filter mandatory; per-file attribution logged in `p1_attribution.md`) | various authors — CC0 only |

## Board H — Ambient bed & shell-UI sounds (assets `p1_bed_ship_calm_loop` / `p1_bed_ship_alert_loop` / `p1_sfx_ui_*`)

*Target read: a ship that hums before it threatens. Calm layer = HVAC, distant machinery, hull stress; alert layer = the same bed tensed, not an alarm klaxon (R2). UI sounds = restrained console chrome matching the shell screens' character.*

| # | Reference | Link | Use | Attribution / license |
|---|-----------|------|-----|------------------------|
| H1 | *Alien: Isolation* — Sevastopol ambience (room-tone layering) | https://store.steampowered.com/app/214490/Alien_Isolation/ | The calm-bed benchmark: ventilation, distant clanks, electrical hum — dread through restraint, no music cues | © SEGA / Creative Assembly — inspiration only |
| H2 | *Dead Space* remake — USG Ishimura ambience & state-shift treatment | https://store.steampowered.com/app/1693980/Dead_Space/ | Alert-layer reference: how a bed tenses (added load, raised energy floor) without becoming a siren | © EA / Motive — inspiration only |
| H3 | *FTL: Faster Than Light* (Subset Games, 2012) — ship hum & UI restraint | https://store.steampowered.com/app/212680/FTL_Faster_Than_Light/ | Minimal UI confirm/focus language on a ship-command fantasy; bed that never fatigues over long sessions | © Subset Games — inspiration only |
| H4 | Sonniss — GDC Game Audio Bundle (royalty-free, license-clean) | https://sonniss.com/gameaudiogdc | Candidate **source** pool for ambience/machine loops (license-clean; attribution logged per file) | Sonniss — royalty-free, license-clean |
| H5 | OpenGameArt — CC0 ambient/sci-fi collections | https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=12 | Candidate **source** pool for bed layers and UI bases (CC0 entries only; attribution logged) | various authors — CC0 only |

*License note: G1–G4 and H1–H3 are third-party copyrighted reference — index-only per charter v1.11; nothing from these sources enters the repo or build. Shipped SFX come from the CC0/license-clean source pools (G5/G6, H4/H5) or original synthesis, with per-file attribution in `assets/audio/p1_attribution.md` (G9).*
