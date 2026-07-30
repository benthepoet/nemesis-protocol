# Reference Boards — p1-visual-pass (milestone M-P1, visual_direction §11)

**Boards v1 | gathered 2026-07-30 | feature p1-visual-pass | owner: Kimi K3**

Scope: the three tangible-asset families this feature originates — **player boarder**, **rifle**, **deck materials & lighting**. The **security crew** board is inherited from `features/p1-enemy-baseline/references/references.md` (board v1, 2026-07-30) — its design synthesis is binding for the hero crew model and is not duplicated here.

**Commit policy (charter v1.11):** only this index is committed. Image files are third-party copyrighted, local-only, gitignored — never committed, never shipped. No license-clean images collected yet (`cleared/` empty).

---

## Board A — Player boarder (hero model, M1)

Fiction: the player is a vacuum-rated boarding operative — pressure suit + light boarding armor, mag-boots (design doc §6.4), rifle primary. Reads allied at a glance (`#69f0ae`, VD §3) against the hostile crew.

| # | Reference | Covers | Notes |
|---|-----------|--------|-------|
| A1 | [Alien Swarm concept art archive — Valve Archive](https://valvearchive.com/Games/Alien%20Swarm/Art/) (© Valve) | Silhouette, top-down readability | The genre lineage (AGENTS.md). Marine kit designed to read from above — shoulder/pauldron asymmetry, backpack mass, weapon line. Directly applicable to our 60° camera. |
| A2 | [Keos Masons — Isaac Suit V1, Dead Space remake (ArtStation)](https://www.artstation.com/artwork/Ke1aJy) (© Electronic Arts) | Materials, PBR response | Turnarounds + texture closeups of a pressure suit: armored shell over fabric undersuit, wet/specular response — VD §1 north-star material quality, §5 PBR workflow. |
| A3 | [Daria Rashev — Isaac Clarke costume concepts (ArtStation)](https://nim.artstation.com/projects/49akyq) (© Electronic Arts) | Silhouette, proportion sheets | Concept iterations: how much armor is "boarding armor" vs full combat rig — restraint before bulk. |
| A4 | [Dead Space: Creating (and Recreating) Isaac's Suit — IGN First](https://www.ign.com/articles/dead-space-creating-and-recreating-isaacs-suit-ign-first) (EA Motive interviews) | Functional design rationale | Every element justified (mag-boot heel lights, thruster placement) — the "machinery, not movie sets" pillar (VD §2.1) applied to a character. |
| A5 | [Security Suit — Dead Space Wiki](https://deadspace.fandom.com/wiki/Security_Suit) (© Electronic Arts) | Silhouette, armed-operative read | Security-force RIG: pauldrons + padding over the base suit — the step up from crew workwear to armed boarder. |

**Design synthesis (binding for M1):** player boarder = **pressure-suit base layer** (A2, A4) + **light boarding armor** — pauldrons, chest plate, mag-boots (A3, A5). Compact backpack/life-support mass that reads from above (A1). Helmeted (no face work at top-down). Allied identity: `#69f0ae` suit-light accents (spine/shoulder strips — VD §3 allied) on a hull-steel-neutral suit; red never appears (VD §3 crossing rule). Rigid single-pose combat stance per pack R8.

## Board B — Rifle (hero model, M3)

Fiction: a shipboard automatic rifle — industrial tool, not showcase prop. Carries the muzzle anchor for tracers/aim-line/muzzle-flash (pack R6).

| # | Reference | Covers | Notes |
|---|-----------|--------|-------|
| B1 | [John Michael Guerrero — Armat M41A Pulse Rifle](https://johnmichaelguerrero.art/projects/3q9Xyg) (© John Michael Guerrero / 20th Century Fox) | Silhouette, configuration variants | The industrial sci-fi rifle archetype: shrouded barrel, top carry mass, boxy receiver — reads at distance from above. |
| B2 | [Travis Ballard — M41A game-res model (ArtStation)](https://ravis231.artstation.com/projects/1e9bX) (© Travis Ballard) | Game-ready pipeline | Explicit game-res pass (6.7k polys, 2048² maps) — the fidelity/efficiency target for a top-down hero weapon. |
| B3 | [Andrew Bradbury — M41A Pulse Rifle (ArtStation)](https://xraydeltaone.artstation.com/projects/L38odA) (© Andrew Bradbury) | Functional component rationalization | Every surface rationalized into working parts — the VD §2.1 "no functionless surfaces" bar for weapons. |
| B4 | [Jarrod Hahn — Pulse Rifle prop (ArtStation)](https://jarrodhahn.artstation.com/projects/PBry1) (© Jarrod Hahn) | Normal-map material workflow | In-game prop pipeline: normal maps carrying panel detail — applicable to our 2K-hero texture budget (VD §8). |

**Design synthesis (binding for M3):** bullpup-adjacent industrial rifle, shrouded barrel with a **clearly readable muzzle plane** (anchor parity, pack R6), top-line mass that reads from 60° above. Materials: gunmetal hull-steel family (VD §3 `#1a232e`–`#2a3644`) with worn high edges; small `#69f0ae` allied marker (no red). No underbarrel attachments — the design doc knows one firing mode at P1 (§10 rifle rows).

## Board C — Deck materials & lighting (M4, M5, M6)

Fiction: the ISV *Nemesis* is a working warship — machinery first, haunted house second (VD §1). Covers hull-steel surfaces, authored wear, practical fixtures, corridor haze, and the AL0/AL1 lighting rows.

| # | Reference | Covers | Notes |
|---|-----------|--------|-------|
| C1 | [Inside the Design of Alien: Isolation — AvPGalaxy / Creative Assembly](https://www.avpgalaxy.net/games/alien-isolation/develop-audience-alien-isolation-report/) | Materials methodology, restraint | "Used universe" discipline: surfaces built from systems, dread through restraint — VD §1 north star, §2 pillar 1. |
| C2 | [Brad Wright — Alien: Isolation interiors (ArtStation album)](https://bradwright.artstation.com/albums/9915924) (© Creative Assembly) | Paneling, trim, interior dressing | Spaceport/Anesidora interiors: retro-mechanical panel breaks, trim rhythm, signage placement — direct input for the trim-sheet strategy (VD §5). |
| C3 | [Brad Wright — Alien: Isolation environment concept (ArtStation)](https://bradwright.artstation.com/projects/oQkW) (© Creative Assembly) | Corridor lighting mood | Corridor as a lit tunnel with practical-driven pools of light — the AL0 per-room key + practicals model (VD §4.1). |
| C4 | [The Art of Alien: Isolation — Kotaku gallery](https://kotaku.com/the-art-of-alien-isolation-1645956534) (multiple artists, © Creative Assembly) | Environment breadth, wear patterns | Pre-production environment set: where grime concentrates (thresholds, hand height, frames) — the authored-wear placement rule (VD §5). |
| C5 | [Digital Foundry — Dead Space remake tech review](https://www.digitalfoundry.net/articles/digitalfoundry-2023-dead-space-remake-tech-review-this-is-what-a-best-in-class-remake-looks-like) | Volumetric haze, PBR materials | Frustum-aligned voxel fog everywhere — light shafts + low-hanging mist; the corridor-haze baseline target (VD §4.2, §7 rule 1 placement). |
| C6 | [GDC — 'Dead Space': Harnessing the Power of Light and Darkness](https://gdcvault.com/play/1029020/-Dead-Space-Harnessing-the) (EA Motive lighting team) | Fixture-driven lighting system, ACES | Systematic light-fixture development + ACES pipeline integration — the practical-fixture kit approach for M5 (renderer already ACES). |
| C7 | [Inside Dead Space #4: The Intensity Director — EA](https://www.ea.com/news/inside-dead-space-4-the-intensity-director) | Lighting as state language | "Ship in disrepair" lighting: moving between lit pools, fixtures rarely fully functional — AL0's 80%-fixtures-live treatment and the alert spreading visibly (VD §4.1, pillar 2). |

**Design synthesis (binding for M4–M6):** deck = **hull-steel trim sheet + panel sets** with wear authored at hand height / thresholds / door frames (C2, C4); colder tones hull-adjacent (VD §5). Lighting = **fixture-first**: visible practical fixtures justify every light pool (C3, C6); AL0 = warm-neutral with ~80% fixtures live (C7); AL1 = amber rotating beacons **added**, unaffected rooms untouched (VD §4.1). Haze = low, thin, below the gameplay mid-plane (C5, VD §7 rule 1). Section accents come from gels/trim/signage per VD §3 — navigable by tint (pack G6).
