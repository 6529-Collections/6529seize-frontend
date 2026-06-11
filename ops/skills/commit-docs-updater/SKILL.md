---
name: commit-docs-updater
description: Maintain user-facing Markdown documentation in `ops/docs` using one commit as discovery input, while actively curating global docs information architecture. Organize docs into clear area-based folders, maintain navigable indexes, and keep content focused on current user-visible behavior only.
---

# Commit Docs Updater

Keep `ops/docs` continuously accurate as a site guide and navigable information architecture. A commit is discovery input only, never part of docs narration.

## Inputs

- Optional commit reference (`<commit>`).
- If no commit is provided, use `HEAD`.
- Treat exactly one commit as scope. Do not expand to ranges unless explicitly requested.

## Core Rules

- Commit-guided, not commit-written:
  - Use commit diff only to identify what user-facing areas might need docs updates.
  - Never include commit hashes, commit subjects, PR/change-log framing, or "what changed in commit" sections in `ops/docs`.
- User-facing only:
  - Document behavior users can observe in UI/UX, routing, messaging, states, and outcomes.
  - Ignore non-user-facing changes such as tests, snapshots, internal refactors, type-only cleanup, tooling, and internal file moves unless they cause user-visible behavior changes.
- Information architecture is part of the job:
  - Reorganize `ops/docs` when structure is flat, fuzzy, or hard to navigate.
  - Use area-based folders, clear file names, and index pages that support browsing.
  - Move, rename, split, merge, or remove docs pages when needed for clarity.
- Timeless docs language:
  - Describe current behavior, not development history.
  - Write pages so they stay valid without needing commit context.
- Current-state only:
  - Keep docs reflecting the latest structure and behavior.
  - Do not keep legacy compatibility pages, shim pages, or old-path placeholders.
- Scale rules:
  - Root `ops/docs/README.md` must stay concise (target `<=20` task links in `I am trying to...`).
  - If an area exceeds `12` content pages, create subarea folders with their own `README.md` indexes.
  - If an area has a topic cluster above `8` pages, split that cluster into a subarea even if total area pages are below `12`.
- Ownership rules:
  - Each user-facing behavior has one canonical docs page.
  - Cross-area visibility is handled through links, not duplicate pages.
- Scope discipline:
  - Use commit scope to detect impacted capabilities, then apply enough structural cleanup to keep the docs system coherent.
  - Do not write non-user-facing technical history.

## Workflow

1. Resolve target commit.
```bash
target="${1:-HEAD}"
git rev-parse --verify "${target}^{commit}"
commit="$(git rev-parse --short=12 "${target}^{commit}")"
```

2. Capture commit scope.
- Run `ops/skills/commit-docs-updater/scripts/commit_scope.sh [commit]`.
- Review patch and changed files:
```bash
git show --stat --patch --find-renames --find-copies "${target}^{commit}"
```
- Derive impacted capabilities, user-visible behavior, and edge scenarios.

3. Filter to user-visible impact.
- For each changed area, classify whether behavior is user-visible.
- Include only user-visible impacts in docs updates.
- Skip non-user-facing deltas:
  - tests (`__tests__`, snapshots, mocks)
  - lint/format/config-only changes
  - internal refactors with unchanged user behavior
  - dependency or infra changes with no user-facing effect
- If no user-visible impact exists, make no `ops/docs` edits and report that explicitly.

4. Assess global docs architecture.
- Read `references/doc-structure-strategy.md`.
- Inspect whether `ops/docs` is discoverable from root `README.md` and area/subarea indexes.
- If docs are flat or ambiguous, perform structural cleanup in this same update.
- Use area folders first, then subareas when scale rules are hit.

5. Map user-facing impacts to canonical docs locations.
- Update existing pages when ownership is clear.
- Create pages when no page owns the capability.
- Move/rename pages when current location or name is misleading.
- Split mixed-concern pages and merge duplicate pages when needed.
- Remove obsolete pages that no longer describe current behavior.

6. Maintain navigation surfaces.
- Root `ops/docs/README.md` must be a usable start point for browsing.
- Each area folder should have `README.md` index when the area has multiple pages.
- Each subarea folder should have `README.md` when scale rules trigger subareas.
- Area and subarea indexes should be grouped using: `Overview`, `Features`, `Flows`, `Troubleshooting`, `Stubs`, `Related Areas`.
- Ensure readers can move from index -> feature page -> related pages.
- If adjacent capability is relevant but not fully documented yet, create a lightweight stub page with explicit TODO markers.

7. Write user-facing documentation.
- Follow `references/user-facing-writing.md`.
- Cover:
  - what users can do
  - expected behavior in normal flows
  - alternate, edge, and failure scenarios
  - limitations or non-goals when relevant
- Prefer concrete scenarios over implementation details.
- Keep content commit-agnostic and user-guide oriented.

8. Enforce scope guardrails.
- Do not rewrite unaffected docs for style-only cleanup.
- Do not include sections titled "What Changed", "Commit Notes", or similar change-log wording.
- Do not include non-user-facing implementation details unless they explain visible behavior.
- Do not leave docs in a half-migrated structure; complete moved/renamed link updates in the same change.

9. Validate.
- Run `ops/skills/commit-docs-updater/scripts/validate_docs_links.py`.
- Re-scan touched docs for statements that conflict with current behavior.
- Re-scan touched docs for forbidden commit-centric wording.
- Ensure root and area indexes reference moved/new/deleted files correctly.

10. Report output.
- Include:
  - docs files changed
  - docs files moved/renamed/deleted
  - folders/indexes added or updated
  - user scenarios and edge/failure behaviors added or updated
  - non-user-facing areas intentionally skipped with reasons
  - coverage gaps captured as TODO stubs (if any)

## Restructuring Rules

- Restructure aggressively enough to keep docs navigable and logically grouped.
- Allowed:
  - split oversized page that blocks a clean update
  - move or rename pages to canonical area/subarea folders and names
  - merge duplicate pages that describe the same capability
  - remove obsolete pages that no longer reflect current behavior
  - add/update root, area, and subarea index pages
- Not allowed:
  - preserving outdated structure for historical reasons
  - leaving stale references after moving or renaming pages
  - duplicating one behavior across multiple canonical pages

## Naming Rules

- Use lowercase kebab-case.
- Use `feature-*`, `flow-*`, and `troubleshooting-*` page prefixes.
- Avoid redundant area prefixes inside area/subarea folders.
  - Example: use `ops/docs/waves/create/feature-dates-step.md`, not `feature-wave-create-dates-step.md`.
- Prefer stable behavior terms over implementation names.

## Quality Bar

Every updated page should let a new reader answer:

- What does this part of the site do?
- What can users do, step by step?
- What should users expect in common scenarios?
- What happens in edge or failure scenarios?
- What limitations or constraints should users know?

The docs system as a whole should let a reader answer:

- Where do I start reading for this site area?
- How do I find related functionality quickly from the current page?
- Is this documentation describing the current product state only?
