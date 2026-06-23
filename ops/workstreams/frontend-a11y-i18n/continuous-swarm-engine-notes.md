# Continuous Swarm Engine Notes

Status: future architecture note, not part of the immediate testing sidequest.
Date: 2026-06-20.

## Purpose

Capture the future self-organizing queue idea without expanding the current
frontend testing strategy beyond its immediate goal. The near-term work remains:
fix local/CI/Playwright/reviewbot/deploy testing so the WCAG/i18n mega run can
move faster and safer.

The future direction is a 24/7 autonomous engineering system where Codex and
review bots cycle together until they stop adding useful findings or safe
patches. Review bots and tests feed Codex; they do not outrank Codex unless
they produce deterministic disaster-class evidence. A small invariant gate
controls merge and promotion safety.

## Core Idea

Codex is an execution worker, not a queue consumer by itself. A production swarm
system needs orchestration around Codex:

- a router that creates typed jobs;
- a queue that stores work;
- Codex workers that execute one bounded job at a time;
- analysis workers that produce findings;
- a conflict resolver that deduplicates and stabilizes findings;
- an invariant gate that decides what can merge;
- an artifact/state graph that records evidence, patches, and outcomes.

## Authority Model

Swarms generate hypotheses. Codex decides how to iterate on them. Invariants
decide the rare promotion-blocking truth.

Promotion-blocking authority should stay small and deterministic:

- auth/session correctness;
- wallet/signing correctness;
- destructive action safety;
- secret and artifact leakage;
- deployment SHA consistency;
- required Level 3+ evidence presence.

Everything else is advisory, an auto-fix candidate, or logged noise unless it
maps to a disaster-class hard invariant violation with reproducible evidence.

## Future Components

- Swarm Router: chooses which jobs run, how deep the fan-out goes, and what cost
  budget applies.
- Job Queue: stores typed work such as `wcag_fix`, `i18n_fix`,
  `test_generation`, `playwright_stabilize`, `security_probe`, and
  `ui_refactor`.
- Codex Worker Wrapper: checks out a target SHA, builds a constrained prompt,
  asks Codex for a patch, stores artifacts, and emits results.
- Analysis Workers: GLM/reviewbot/scanner/Playwright jobs that produce
  structured findings only.
- Conflict Resolver: deduplicates findings, resolves contradictions by
  invariant precedence and reproducibility, detects oscillation, and suppresses
  low-confidence noise.
- Mutation Engine: converts stable findings into patch PRs.
- Invariant Gate: minimal hard truth layer for merge/promotion.
- Artifact And State Graph: maps PRs, jobs, findings, patches, artifacts,
  invariant results, and merge decisions.

## Initial PR Classes

- Safe auto-PR candidates: docs, test scaffolding, i18n dictionary-only fixes,
  constrained accessible-name/label fixes with passing tests.
- Guarded PRs: UI behavior, routing, shared components, layout changes, and
  non-trivial WCAG/i18n migrations.
- Critical PRs: auth, wallet, upload, posting, moderation/admin, deploy,
  credentials, irreversible data, and security-critical surfaces.

Auto-merge should start narrower than auto-PR creation. Layout and UI behavior
fixes may be generated automatically, but should not auto-merge until browser
and visual evidence are trustworthy enough to avoid oscillation.

## Later Design Questions

- Queue backend: Redis, SQS, Postgres jobs, or another durable queue.
- State graph backend and schema.
- Codex worker invocation model and isolation.
- Prompt builder format for each job type.
- Cost throttling by job class and risk level.
- Conflict resolver algorithm and confidence calibration.
- Oscillation detection for repeated fix/break loops.
- GitHub PR creation, update, close, and merge automation.
- How to safely auto-merge safe classes after Codex plus review bots stop
  adding value.
