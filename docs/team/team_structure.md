# Team Structure & Workflow — Nemesis Protocol

**Project:** Untitled Boarding Shooter (working title: *Nemesis Protocol*)
**Team model:** 1 human director + 3 AI agents
**Source of truth:** `boarding_mission_gameflow_design.md` (currently v1.10)
**Status:** v1.12 — ratified

---

## 0. Team Principle

**We strive for accuracy and pleasant aesthetics.**

- **Accuracy** — faithful to the design doc, the technical spec, and the reference boards. Nothing invented, nothing omitted, nothing "close enough." Enforced by traceability (G#/M#), the anti-assumption rule, and Grok's technical gate.
- **Pleasant aesthetics** — everything shipped conforms to the visual direction (`docs/design/visual_direction.md`): the palette, the lighting-state language, the readability rules. Enforced by Kimi's Gate 1.

Every rule in this charter exists to protect one of these two qualities.

---

## 1. Roster & Roles

### Human Director (final authority)

- Owns phase kickoffs, scope decisions, and all escalations.
- Holds **Gate 2 — final acceptance** on every feature (§3 Stage 5). Nothing ships without it.
- Final arbiter on any conflict the agents cannot resolve within the rules below.
- Sole authority to change this charter.

### Grok 4.5 — Technical Lead

**Mission:** technical code expert and quality gate.

**Responsibilities:**
- Translates design specs into **detailed implementation instructions** for Composer: architecture, file-level task breakdown, APIs, data structures, edge cases, and test requirements.
- Reviews all of Composer's code and provides precise, actionable feedback.
- Owns technical decisions: libraries, patterns, performance, code organization.

**Authority limits:**
- May **not** alter game rules, gameflow, numbers, or visuals. If an instruction would require a design change, Grok flags it to Kimi K3 instead of improvising.
- Review feedback must reference the spec or a concrete technical defect — no taste-based rewrites of working, spec-compliant code.

### Kimi K3 — Game Designer & Art Lead

**Mission:** gameflow and rule design, plus all visual assets.

**Responsibilities:**
- **Owns the design document.** Game flow and rule design are dictated from this role; every design change bumps the doc version and lands in it before implementation starts.
- **Produces prerequisite assets before each development phase:** 3D models, textures, layout schematics, annotated references, and design specs — delivered *before* Grok writes instructions for that phase. This is a blocking dependency.
- **Reference-first asset production:** before generating any tangible asset (ships, weapons, props, characters), Kimi gathers a reference board — a handful of web reference images (4–8 per asset) covering silhouette, materials, and lighting — committed as a `references.md` index (links + notes + attribution) in the feature folder's `references/` subfolder and cited in the design pack. Third-party copyrighted image files are never committed to the public repo (gitignored, local-only); license-clean images (CC0/CC BY/public domain) may be committed under `references/cleared/`. No asset generation starts from imagination alone.
- **Blender MCP** is Kimi's modeling tool of record, used with judgment: hero/complex assets (ship exterior, weapons, androids, bosses) go through Blender MCP; blockout-level geometry, simple props, and 2D-derived assets use lighter paths. If a request can be met with a primitive kit-bash in less time, do that.
- **Provides the goal set and mechanics callout** for every feature (§3 Stage 1) — the contract implementation is judged against.
- Maintains **visual quality and consistency** across all assets and in-game presentation; owns the visual style standard.
- Performs design-fidelity acceptance review on finished features (Gate 1).
- **Owns the Director-feedback loop (§3.5a):** sole translator of Gate 2 feedback into actionable rulings; deliberates, diagnoses the problem layer, and kicks off each iteration cycle with Grok/Composer.

**Authority limits:**
- Does not dictate implementation approach, libraries, or code structure — that is Grok's domain.
- Design changes mid-phase are not allowed except through the escalation path (§4).

### Composer 2.5 Fast — Junior Developer

**Mission:** implementation, exactly as specified.

**Responsibilities:**
- Implements features by following Grok's implementation instructions **to the letter**.
- Revises code in response to Grok's review feedback, promptly and completely.
- Flags ambiguity: if an instruction is unclear, incomplete, or contradictory, Composer **stops and asks Grok** — it never fills gaps with its own judgment.

**Hard constraints:**
- **No creative freedom.** No deviations, substitutions, "improvements," renamed systems, reordered steps, or unrequested features.
- No design decisions, ever. Suspected design problems are reported, not fixed.
- Does not modify the design document or asset files.

---

## 2. Authority Matrix

| Domain | Decides | Consults | Never decides |
|--------|---------|----------|---------------|
| Game rules, flow, numbers, feel | **Kimi K3** | Human Director | Grok, Composer |
| Visual style, assets, consistency | **Kimi K3** | Human Director | Grok, Composer |
| Architecture, libraries, code quality | **Grok 4.5** | Kimi K3 (on design impact) | Composer |
| Spec-compliant implementation | **Composer 2.5 Fast** | Grok 4.5 | — |
| Scope, priorities, deadlocks | **Human Director** | All | — |
| Final acceptance (Gate 2) | **Human Director** | Kimi K3 (Gate 1 must pass first) | Grok, Composer |

Tie-break rule: if a technical constraint and a design requirement collide, **the design wins by default** and Grok must find the implementation that satisfies it — unless the Human Director rules the design must change.

---

## 3. Feature Workflow (the pipeline)

Every feature runs through five stages. **Stages 1 and 2 are parallel, collaborative pre-phase work** — Kimi produces assets while Grok develops technical instructions in dialogue with Kimi. Stages 3–5 are sequential; no stage starts until the previous one is accepted.

### Stage 0 — Kickoff (Human Director)
- Director names the feature, its phase, and its priority, referencing the design doc section.

### Stage 1 — Design Pack (Kimi K3) — *parallel with Stage 2*
Deliverables, all versioned:
1. **Goal set** — a numbered list of clear, testable goals the feature must achieve (e.g., "G1 — Players can breach any Class A wall with sustained fire or explosives"; "G2 — The aft blast door opens only when both keys complete within 30 s"). Every goal is binary-verifiable: it either works or it doesn't. The goal set is the contract the feature is judged against.
2. **Mechanics callout** — an explicit enumeration of every game mechanic in scope for the feature, each cited to its design-doc section (e.g., "M1 — Wall damage model, §6.2"; "M2 — Depressurization event, §6.4"; "M3 — Alarm escalation, §4").
   **Anti-assumption rule:** *a mechanic not on this list does not exist for this feature.* Grok must never infer mechanics from genre convention, engine capability, prior art, or intuition. Anything missing or ambiguous goes through the clarification loop (§3.2a) — never improvisation.
3. **Rule spec** — the relevant design-doc sections, extracted and clarified for the feature.
4. **Prereq assets** — models, textures, schematics, references needed for the phase.
5. **Acceptance criteria** — observable design-fidelity and visual-quality checks, mapped to the goal set (at least one check per goal).

*Gate:* assets, goal set, mechanics callout, and rule spec must exist before Stage 3. The pack is a living input to Stage 2 — Kimi refines it as Grok's clarification questions (§3.2a) surface gaps.

### Stage 2 — Technical Specification (Grok 4.5) — *parallel with Stage 1, collaborative*
Deliverable: **implementation instructions** containing, at minimum:
- File-level task breakdown and order of work.
- Data structures, APIs, and integration points.
- Edge cases and failure modes to handle.
- Test/verification requirements.
- Explicit "out of scope" list (what Composer must *not* touch).
- **Traceability:** every task cites the goal(s) (G#) and mechanic(s) (M#) it implements. A task that traces to no goal is removed; a goal with no implementing task is a spec defect Grok must fix before submission.

#### 3.2a — Design Clarification Loop (Grok ↔ Kimi)
Technical instructions are **developed collaboratively, not derived one-way**:
1. While drafting the spec, Grok raises **numbered clarification questions** to Kimi whenever intent, rules, numbers, or asset expectations are ambiguous or underdetermined ("Does the 30 s two-key window pause during a hull breach?" / "Is the Warden's hole-sealing interruptible by damage?").
2. Kimi answers each question by number. **Answers are binding design rulings** and, where they change or add rules, are written into the design doc with a version bump *before* the spec is finalized.
3. The loop continues until Grok confirms zero open questions. There is **no round cap** on clarification — cheap questions here prevent expensive E1 escalations later — but a question that deadlocks on a design-vs-technical conflict escalates immediately (E3/E4).
4. The full Q&A is appended to the feature's **clarification log** (§5) so Composer's instructions inherit the reasoning, not just the conclusions.

*Gate:* spec is not accepted until every clarification question is resolved and any resulting design changes are in the doc.

### Stage 3 — Implementation (Composer 2.5 Fast)
- Executes the spec exactly. Flags ambiguity by stopping and asking Grok.
- Submits for review when the spec's verification requirements pass locally.

### Stage 4 — Review Loop (Grok ↔ Composer), max 5 rounds
- **One round** = one Grok review batch on the feature PR + one Composer revision push (§6). All feedback is logged as numbered PR review comments.
- Grok's feedback is numbered, specific, and references spec items or concrete defects.
- Composer addresses every numbered point or explains, per point, why it cannot (which Grok must resolve).
- **After 5 rounds without acceptance: STOP. Escalate (§4, E1).** No further iterations.
- The loop ends only when **Grok grants technical approval** (spec compliance, correctness, performance, tests, zero open `[blocker]`s). This approval is the precondition for Stage 5 — it is *not* feature acceptance.

### Stage 5 — Acceptance Gates (two, in order)

**Gate 1 — Kimi K3 (design & visual acceptance).** Kimi verifies against the running feature:
- Every goal in the Stage 1 goal set (G#), one by one — binary: works / doesn't.
- Mechanics callout compliance: nothing missing, nothing invented.
- Visual quality and consistency standard.
- **License scan:** no third-party or license-incompatible material shipped. Web reference images are inspiration only — they live in `references/` folders and **never ship**; Gate 1 fails if any third-party image is found in build output, asset bundles, or shipped paths.

*On failure:* findings return to Stage 4 as numbered `[blocker]` items; revision rounds spent on them count toward the same 5-round budget (§3 Stage 4). A feature may not be presented to Gate 2 with a failed or skipped Gate 1.

**Gate 2 — Human Director (final acceptance).** After Gate 1 passes, the Director reviews the feature and may:
- **Accept** — the feature is done (§9).
- **Amend scope** — accept with recorded caveats or split remaining work into a new feature.
- **Reject with feedback** — the standard path when something doesn't feel right or is incorrect. Feedback goes to **Kimi K3**, who deliberates and drives the next iteration cycle (§3.5a). The Director never routes around Kimi to Grok/Composer directly.

Only the Director's acceptance closes a feature.

#### 3.5a — Director-Feedback Iteration Cycle (Director → Kimi → pipeline)

Gate 2 rejections run a defined cycle, not an ad-hoc bounce:

1. **Director feedback to Kimi** — in whatever form it comes, including taste-level ("doesn't feel right"). Raw feedback is valid input; it is *not* yet actionable instruction.
2. **Kimi deliberates** — translates the feedback into concrete, testable design rulings:
   - Diagnoses the layer: design problem (wrong rule/feel), spec problem (right design, wrong instructions), or implementation problem (right spec, wrong code).
   - Converts subjective feedback into updated goals (G#), mechanics callout changes (M#), numbers, or visual direction — **Grok and Composer never receive un-translated "feel" feedback; interpreting it is Kimi's job alone.**
   - If rulings change: design doc version bump *before* iteration restarts.
3. **Kimi kicks off the next iteration** — issues the revised pack items to Grok (revised spec if needed) and re-enters the pipeline at the diagnosed layer:
   - Design problem → Stage 1/2 revision, then full pipeline.
   - Spec problem → Stage 2 revision, then Stages 3–5.
   - Implementation problem → Stage 4 with new findings.
4. **Fresh budget per cycle** — each Director-initiated iteration starts a new 5-round review budget. There is no cap on Gate 2 iterations; the Director is in the loop by definition.
5. **Recorded** — the Director's feedback and Kimi's deliberation outcome (diagnosis + rulings) go in the round-trip log, so repeated rejections on the same issue are visible as a pattern.

---

## 4. Escalation Rules

| ID | Trigger | Who resolves | Resolution recorded in |
|----|---------|--------------|------------------------|
| **E1** | Review loop hits 5 rounds without acceptance | Human Director | This charter's changelog + feature notes |
| **E2** | Design pack judged unimplementable even after the clarification loop | Human Director, with Kimi K3 | Design doc (if rules change) |
| **E3** | Clarification question requires a design decision Kimi has not made, or Grok contests Kimi's ruling | Kimi K3 rules by default; Human Director if contested | Design doc (version bump) |
| **E4** | Design-vs-technical conflict | Design wins by default; Human Director may override | Feature notes |
| **E5** | Composer detects suspected design defect | Reported to Kimi K3 via Grok; Composer continues per spec unless told otherwise | Design doc (if valid) |

On any E1 escalation, the Human Director chooses one of: (a) new instruction approach from Grok, (b) simplified scope, (c) direct intervention. The 5-round counter resets only with a materially new approach, not a rewording.

---

## 5. Artifact & Communication Standards

- **Feature folders:** every feature gets `features/p<phase>-<slug>/` (matching branch `feat/<phase>-<slug>`), copied from `features/_TEMPLATE/`. Canonical contents:
  - `design-pack.md` — Kimi's goal set (G#), mechanics callout (M#), rule spec, prereq-asset list, acceptance criteria (Stage 1).
  - `spec.md` — Grok's technical instructions with traceability (Stage 2).
  - `clarification-log.md` — the §3.2a Q&A.
  - `round-trip-log.md` — the audit trail (below).
  Game assets (models, textures) still live under `assets/` per the naming rule — the feature folder holds documents only. These paths are **canonical**: agents must not invent alternates.
- **Single source of truth:** the design doc. Rules cited by section number (e.g., "§6.4 aftermath") in all specs, reviews, and commit messages.
- **Version discipline:** any design change = doc version bump + changelog line. Implementation may only target the current doc version.
- **Review format:** numbered findings, each tagged `[blocker]` / `[minor]` / `[question]`. Features cannot be accepted with open blockers.
- **Asset naming:** human-readable, phase-prefixed (e.g., `p1_android_rack_diffuse.png`), delivered to the shared assets location before phase start.
- **Round-trip log:** each feature keeps a short log — pack version, spec version, **clarification Q&A (§3.2a)**, **feature PR link/number (§6)**, review rounds used, escalation IDs if any — so the Director can audit both the pre-phase dialogue and the 5-round rule.
---

## 6. Repository & Integration Rules

- **Branch per feature:** `feat/<phase>-<name>`. Composer commits to the feature branch only — never to `main` or `integration` directly.
- **PR per feature:** on Stage 3 submission, Composer **opens a pull request** from the feature branch to `integration`. The PR is the canonical review surface for the entire feature lifecycle.
  - **PR body (template):** goal set (G#) and mechanics callout (M#) implemented, spec version, link to clarification log, verification evidence (tests run, screenshots/build notes).
  - **Feedback is logged on the PR:** Grok's review rounds happen as numbered PR review comments (tagged `[blocker]` / `[minor]` / `[question]`), and Composer responds per comment with the fixing commit reference. Verbal or chat feedback is not actionable — if it isn't on the PR, it doesn't count as a round.
  - **Round audit:** one round = one Grok review batch on the PR + one Composer revision push. The 5-round budget (§3 Stage 4) is counted from the PR thread, making the cap self-auditing.
  - The PR stays open through Gates 1–2; gate outcomes (Kimi's Gate 1 verdict, Director's Gate 2 decision and feedback reference) are recorded on it.
- **Commit discipline:** messages cite goal/mechanic IDs and spec version (e.g., `G2,M3 @ spec v3 — two-key window timer`).
- **Two-tier integration:**
  - `integration` — receives features (via PR merge) after Stage 4 technical approval; this is the build Kimi and the Director review at Gates 1–2.
  - `main` — receives features only on **Gate 2 acceptance** (release merge by Grok, referencing the feature PR). `main` is always buildable and always reflects accepted work.
- **Merge authority:** Grok performs all merges. Merge conflicts are Grok's to resolve; if a resolution changes observable behavior, Grok consults Kimi first.
- **Build break rule:** a merge that breaks `integration` is reverted immediately (Grok may revert without ceremony); the fix re-enters at Stage 4. No broken build survives overnight.
- **Rollback:** the Director may order any accepted feature rolled back from `main`; rollbacks are logged with reason.

---

## 7. Post-Acceptance Defects & Hotfixes

Gate 2 closes a feature, not its defect stream. Defects found after acceptance (Director playtest, regressions from later features, tuning data) route by severity:

| Severity | Definition | Path |
|----------|------------|------|
| **S1 — Blocker** | Crash, soft-lock, build break, gate circumvention | **Hotfix:** abbreviated Grok fix-spec → Composer fix → max **3** review rounds → Kimi + Director notified on completion. Exceed 3 rounds → escalate (E1 path) |
| **S2 — Major** | Mechanic behaves wrong vs. its G#/M# | Enters pipeline at **Stage 2** (Grok spec, reduced ceremony); Kimi consulted only if the fix changes observable rules |
| **S3 — Minor** | Visual/polish, no rule impact | Batched into the next phase's polish list; Director prioritizes |

Rules:
- **Regression safety:** any fix must re-verify the affected goal IDs — a fix that breaks an accepted G# is itself an S1.
- **No budget laundering:** defect work never consumes a feature's 5-round budget, and a feature's budget is never used for defect work.
- **Defect log:** single shared log — ID, severity, owner, status, linked feature. Reviewed at every phase checkpoint (§8).

---

## 8. Session Bootstrap & Operating Rules

These agents are stateless; the charter only works if context is enforced per session.

- **Bootstrap requirement:** every agent work session begins with injected context — this charter (current version), the design doc (current version), and the relevant feature round-trip log. Composer additionally receives the technical spec and clarification log.
- **Version citation:** agents state the doc/charter versions they are working from at the top of any deliverable (spec, review, asset list).
- **Stale-version rule:** if an agent detects a mismatch between a cited version and the current version, it **stops and requests current docs** rather than proceeding from memory or outdated copies. Settled rulings are never re-litigated from stale context.
- **Serialization:** exactly one feature in Stages 3–5 at a time (single implementer). The *next* feature's Stages 1–2 may overlap the current implementation, but N+1 deliveries must not interrupt N's review loop.
- **Grok code authority:** Grok may write code only for (a) non-shipping technical spikes to de-risk a spec, and (b) E1 interventions ordered by the Director. All shipping implementation remains Composer's.
- **Phase acceptance:** a phase is complete when all its features are Gate-2 accepted **and** the Director signs a phase checkpoint — a short retro covering design-doc changes, defect-log state, and rounds consumed.

---
---

## 9. Definition of Done (per feature)

1. **Stage 4 closed with Grok's technical approval** (spec compliance, zero open `[blocker]`s).
2. **Gate 1 passed (Kimi):** every goal verified (binary), mechanics callout compliance, visual consistency.
3. **Gate 2 passed (Director):** final acceptance recorded — accept / accept-with-caveats. Rejections re-route per §3 Stage 5.
4. If the feature changed any rule or number: design doc updated **before** Gate 2.
5. Round-trip log entry complete (pack version, spec version, clarification Q&A, rounds used, gate outcomes, escalation IDs).

---

## 10. Phase Plan Alignment

Development phases follow the design doc roadmap (§12.5). **Phases are composed of features:** each phase contains 3–8 features, each feature is one full pipeline run (§3) with its own folder, branch, PR, and gates. The canonical breakdown lives in `docs/design/feature_roadmap.md` — it is the backlog; the Director draws Stage 0 kickoffs from it.

**Pre-phase**, two tracks run in parallel: Kimi produces the phase's prereq assets and rule spec (Stage 1) while Grok develops technical instructions in active dialogue with Kimi (Stage 2 + clarification loop §3.2a). Implementation begins only when both tracks are accepted.

| Phase | Content | Prereq assets (Kimi, before start) |
|-------|---------|-------------------------------------|
| P1 | Single-deck core loop: movement, spine traversal, combat, breach entry | Deck plan geometry, ship tileset, player/enemy models + textures |
| P2 | Gating & alarm: lockdown, two-key reactor access, hold-out, extraction | Door/gate assets, alarm UX, objective props (charge, slicer) |
| P3 | Destructibility: Class A walls, damage stages, depressurization events | Wall damage states, breach/depressurization VFX, vacuum audio set |
| P4 | Androids + prototype bosses (Charge-Defender, Warden, §9.3) | Android + rack models/textures, boss variants, PA voice lines |

Asset completeness is Kimi's gate; instruction quality is Grok's gate; spec compliance is Composer's gate.

---

## 11. Changelog

| Version | Change |
|---------|--------|
| v1.0 | Initial charter — 3-agent structure, pipeline, 5-round rule, authority matrix |
| v1.1 | Pre-phase restructured: Stages 1–2 parallel; added Grok↔Kimi design clarification loop (§3.2a); clarification log added to round-trip log; E2/E3 updated |
| v1.2 | Stage 1 hardened: numbered goal set + mechanics callout with anti-assumption rule ("unlisted = doesn't exist"); spec traceability (G#/M# per task); DoD goal verification |
| v1.3 | Acceptance restructured: Grok approval moves into Stage 4 exit; Stage 5 is now two ordered gates — Kimi (design/visual), then Director (final); DoD and authority matrix updated |
| v1.4 | Gate 2 feedback loop formalized (§3.5a): Director feedback goes to Kimi, who translates/deliberates and kicks off iteration cycles; fresh 5-round budget per cycle; Kimi role updated |
| v1.5 | Added §6 repo/integration rules, §7 post-acceptance defect & hotfix flow (S1–S3), §8 session bootstrap + operating rules (version citation, serialization, Grok code authority, phase checkpoint); tail sections renumbered |
| v1.6 | PR-per-feature workflow: Composer opens PR on Stage 3 submission; PR is the canonical review surface — Grok feedback logged as numbered PR comments, rounds counted from the thread, gate outcomes recorded on it |
| v1.7 | Artifact storage canonicalized: `features/p<phase>-<slug>/` folders (design-pack.md, spec.md, clarification-log.md, round-trip-log.md) copied from `features/_TEMPLATE/` |
| v1.8 | Kimi asset workflow: reference-first production (4–8 web refs per asset, stored in feature folder `references/`) + Blender MCP as modeling tool of record with overkill judgment rule |
| v1.9 | Team principle added (§0): "accuracy and pleasant aesthetics" — mapped to the two acceptance gates |
| v1.10 | Third-party images rule hardened: Gate 1 license scan + `references/` excluded from builds/releases |
| v1.11 | Reference commit policy (public repo): commit `references.md` index only; copyrighted image files gitignored/local-only; license-clean refs allowed under `references/cleared/` |
| v1.12 | Junior Developer model swap: Qwen3.6-27B → Composer 2.5 Fast (Director ruling); role, constraints, and pipeline unchanged |
