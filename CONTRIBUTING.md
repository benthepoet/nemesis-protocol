# Contributing — Nemesis Protocol

This repo uses the **two-tier branching model** from the team charter (§6).

## Long-lived branches

| Branch | Role |
|--------|------|
| `master` | Production / Gate 2 acceptance only — must always build |
| `integration` | Integration target for feature PRs after Stage 4 technical approval |

Local clones may already have both `master` and `integration` checked out.

## Feature workflow

1. Branch from `integration`: `feat/<phase>-<slug>` (example: `feat/p1-project-scaffold`).
2. Implement per the feature spec; open a PR **into `integration`** when Stage 3 verification passes.
3. **Grok 4.5 (Technical Lead)** reviews in Stage 4 and merges approved feature PRs to `integration`.
4. After **Gate 1** (Kimi) and **Gate 2** (Human Director), Grok merges `integration` → `master`.

Do not commit directly to `master` or `integration` during feature work. Do not merge or force-push shared branches unless you are the Technical Lead following charter policy.
