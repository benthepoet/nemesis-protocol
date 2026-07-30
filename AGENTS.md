# AGENTS.md — Nemesis Protocol (working title)

Co-op boarding shooter (Alien Swarm lineage) built in **three.js** (WebGL2/WebGPU, browser). Camera: **angled top-down, ~60° pitch** for the prototype — first/third-person pivot evaluated after P1. Prototype scope: **one ship, one deck** — board, fight through, destroy, extract. Full design in `docs/design/`.

**This file is the entry point for all agents.** Read it first, then follow the bootstrap rules below.

> **Team principle: we strive for accuracy and pleasant aesthetics.** Accuracy — faithful to the design doc, the spec, and the reference boards. Aesthetics — conformant to `docs/design/visual_direction.md`. Every rule in the charter protects one of these two.

---

## Repository layout

```
├── AGENTS.md                     ← you are here
├── LICENSE                       ← MIT (code)
├── LICENSE-ASSETS                ← CC BY 4.0 (art assets)
├── docs/
│   ├── design/
│   │   ├── boarding_mission_gameflow_design.md   ← SOURCE OF TRUTH for rules/flow (v1.10)
│   │   ├── feature_roadmap.md                    ← phase→feature breakdown = the backlog
│   │   └── visual_direction.md                   ← art bible: lighting, VFX, palette (v1.1)
│   └── team/
│       └── team_structure.md                     ← team charter: roles, pipeline, gates (v1.11)
├── assets/
│   ├── mockups/                  ← deck plan + mission flow SVGs, schematic PNG
│   └── AGENTS.md                 ← asset conventions (naming, regeneration)
├── features/
│   └── _TEMPLATE/                ← per-feature folders: design-pack.md, spec.md,
│                                   clarification-log.md, round-trip-log.md (charter §5)
├── tools/
│   └── mockups/                  ← SVG generator scripts (regenerate, don't hand-edit SVGs)
├── .cursor/
│   └── agents/                   ← Cursor subagent configs (grok/kimi/composer)
├── .opencode/
│   └── agents/                   ← OpenCode subagent configs — same roles,
│                                   permission-hardened; either harness works
├── .gitignore                    ← reference-image commit policy + build output
└── app/                          ← live HTML preview of mockups (generated, don't edit by hand)
```

**Agent configs:** identical role bodies in both harnesses — only frontmatter differs. OpenCode's permission layer additionally hard-enforces the charter's authority matrix (e.g., Composer physically cannot edit design docs or merge). Model slugs are placeholders in both — fill per your provider setup.

## Team model (summary — charter is binding)

1 human **Director** + 3 agents. The charter at `docs/team/team_structure.md` governs all work; what follows is orientation only.

| Agent | Role | Does | Never does |
|-------|------|------|------------|
| **Kimi K3** | Game Designer & Art Lead | Owns design doc; goal sets (G#), mechanics callouts (M#), prereq assets; Gate 1 acceptance; translates Director feedback | Implementation decisions |
| **Grok 4.5** | Technical Lead | Implementation specs (tasks traced to G#/M#); PR reviews; merges; hotfix specs | Design/rule/visual changes |
| **Composer 2.5 Fast** | Junior Developer | Implements specs to the letter on feature branches; opens PRs; revises per review | Any deviation, design call, or gap-filling |

**Pipeline:** Stage 0 kickoff (Director) → Stages 1–2 parallel (Kimi design pack ∥ Grok spec, with clarification loop §3.2a) → Stage 3 implementation (Composer, branch + PR) → Stage 4 review loop on the PR (Grok↔Composer, max 5 rounds) → **Gate 1** (Kimi: design/visual) → **Gate 2** (Director: final). Gate 2 feedback routes Director → Kimi → next iteration (§3.5a).

## Bootstrap rules (every agent, every session — charter §8)

1. Read this file, the **current** charter, and the **current** design doc before starting.
2. Read the feature's round-trip log (and for Composer: the spec + clarification log).
3. **Cite the versions you are working from** at the top of every deliverable.
4. **Stale-version rule:** if a cited version doesn't match the current file, STOP and request current docs. Never proceed from memory; never re-litigate settled rulings.

## Conventions that apply everywhere

- **Design doc is the single source of truth.** Rules are cited by section (e.g., "§6.4"). A mechanic not in a feature's mechanics callout **does not exist** for that feature — no inferring from genre convention or engine capability.
- **Traceability:** every spec task cites goal/mechanic IDs (G#/M#); commits cite them too (e.g., `G2,M3 @ spec v3 — two-key window timer`).
- **Design changes are doc-first:** version bump + changelog line BEFORE implementation targets the change.
- **Branches/PRs:** `feat/<phase>-<name>` → PR to `integration` (review surface) → `master` only on Gate 2 acceptance. Feedback lives on the PR; if it isn't on the PR, it isn't a round.
- **Escalations** (charter §4): 5-round cap on the review loop → E1 → Director. Clarification questions have no cap — ask early.
- **Feature artifacts live in `features/p<phase>-<slug>/`** (copied from `features/_TEMPLATE/`): Kimi writes `design-pack.md`, Grok writes `spec.md`, both share `clarification-log.md`; everyone appends to `round-trip-log.md`. These paths are canonical.

## Licensing

Open source: **MIT** for code, **CC BY 4.0** for art assets (`assets/`, mockups, schematics). Rules for agents: never ship third-party material that isn't original or license-compatible (CC0/CC BY with attribution logged); web reference images are inspiration only — never shipped and never committed (commit the `references.md` index; license-clean refs allowed under `references/cleared/` — see `.gitignore`).

## Current state

- Design doc **v1.11**, visual direction **v1.2**, roadmap **v1.5**, team charter **v1.13**, mockups **v2.2** (deck plan) / flow overlay companion.
- Shipped: `p1-project-scaffold` (P1 #1), `p1-deck-geometry` (P1 #2), `p1-player-controller` (P1 #3). Next: `p1-combat-core` (P1 #4).
- Rulings in force: solo-first with netcode-ready architecture (netcode P2–P3 window); enemy roster = ship's crew as defense (aliens deferred, post-prototype); gamepad first-class input parity; MIT + CC BY 4.0.
- Roadmap: P1 core loop → P2 gating & alarm → P3 destructibility & depressurization → P4 androids + prototype bosses (Charge-Defender, Warden). Feature-level breakdown: `docs/design/feature_roadmap.md`.
