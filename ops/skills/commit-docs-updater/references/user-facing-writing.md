# User-Facing Writing Guide

Use this checklist for every page touched by commit-guided doc updates.

## Page Status

Every content page should be one of:

- `Complete`: full scenario coverage is documented.
- `Stub`: intentionally partial coverage with explicit TODO markers.

Do not mix both styles on the same page.

## Required Content by Status

### Complete Page

Required sections:

1. `Overview`
2. `Location in the Site`
3. `Entry Points`
4. `User Journey`
5. `Common Scenarios`
6. `Edge Cases`
7. `Failure and Recovery`
8. `Limitations / Notes`
9. `Related Pages`

### Stub Page

Required sections:

1. `Overview`
2. `Location in the Site`
3. `Entry Points`
4. `Known Behavior`
5. `Not Yet Documented`
6. `Related Pages`

## Writing Rules

- Write for product users first, not maintainers.
- Prefer scenario-based examples over code details.
- Use precise behavior statements.
  - Good: `If wallet connection fails, the action button stays disabled.`
  - Bad: `Handles wallet failures gracefully.`
- State limitations and non-goals clearly.
- Keep tense and terminology consistent across related pages.
- Describe current behavior only; do not narrate development history.
- Never include commit identifiers, commit subjects, PR references, or `what changed` sections.
- Keep implementation detail out unless needed to explain visible behavior.
- Use links to support browsing:
  - include a parent index link near the top when helpful
  - include 2-5 related page links when relevant
- Keep headings consistent within an area/subarea.
- Use `Limitations / Notes` exactly; do not introduce `Limitations` variants.

## Forbidden Phrasing

- Avoid: `After commit abc123...`
  - Use: `Current behavior is...`
- Avoid: `This commit migrated...`
  - Use: `The site now...`
- Avoid section headers like:
  - `What Changed`
  - `Change Log`
  - `Commit Notes`

## TODO Marker Style

- `TODO: Document <user-facing scenario/edge case>.`
- Keep TODOs user-facing and concrete.
- Keep TODOs only in `Stub` pages.

## Scope Discipline

- Use the target commit only to discover impacted user-facing areas.
- Only describe user-visible behavior in those areas.
- If related areas are untouched, reference existing pages instead of expanding scope.
- Do not backfill old features that were not part of scoped user impact.
- Ignore tests, tooling, and internal-only refactors that do not change user behavior.
