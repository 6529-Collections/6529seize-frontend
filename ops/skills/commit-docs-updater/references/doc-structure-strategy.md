# Doc Structure Strategy

Use this guide to keep `ops/docs` easy to browse, logically grouped, and current-state only.

## Goals

- Make `ops/docs/README.md` the clear start point.
- Group docs by user-facing product area, not commit history.
- Keep names and ownership predictable.
- Keep root navigation concise and delegate detailed catalogs to area/subarea indexes.
- Keep docs aligned with current behavior, with no legacy path preservation.

## Canonical IA Model

Prefer this baseline unless the repo has a stronger product map:

- `ops/docs/README.md` (global map and entrypoint)
- `ops/docs/<area>/README.md` (area index)
- `ops/docs/<area>/<subarea>/README.md` (optional; required when scale thresholds are hit)
- `ops/docs/<area>/<...>/feature-*.md`
- `ops/docs/<area>/<...>/flow-*.md`
- `ops/docs/<area>/<...>/troubleshooting-*.md`

## Scale Thresholds

Create subareas when either threshold is met:

- area has more than `12` content pages, or
- one topic cluster has more than `8` pages.

Root index constraints:

- Keep root `I am trying to...` list concise (target `<=20` links).
- Put long catalogs in area/subarea indexes, not root.

## Index Template

Area and subarea indexes should use these sections:

1. `Overview`
2. `Features`
3. `Flows`
4. `Troubleshooting`
5. `Stubs`
6. `Related Areas`

Rules:

- `Features` should list all `feature-*` pages owned by that index scope.
- `Flows` should list `flow-*` pages.
- `Troubleshooting` should list `troubleshooting-*` pages.
- `Stubs` should explicitly call out partial coverage pages.
- Keep section order stable for scanability.

## Decision Tree

### Step 1: Inventory Current Docs

- List all docs files/folders.
- Identify oversize areas and candidate clusters.
- Identify duplicate/overlapping pages.
- Identify missing indexes (`ops/docs/README.md`, area `README.md`, needed subarea `README.md`).

### Step 2: Filter to User-Facing Impact

Use commit scope only to discover impacted areas:

- Include user-visible routes, UI states, interactions, messaging, errors, and limits.
- Exclude tests, mocks, internal refactors, lint/format, tooling, and infra unless they changed user-visible behavior.

If no user-facing behavior changed, do not edit docs.

### Step 3: Assign Canonical Ownership

For each impacted behavior, assign one canonical location:

- Single capability -> `feature-*` page in one area/subarea.
- Multi-step journey -> `flow-*` page in owning area/subarea.
- Error handling across a capability set -> `troubleshooting-*` page.
- Cross-area behavior -> one owner page plus links from related areas.

### Step 4: Choose Structural Operation

Apply one or more operations:

- Update: page already has clear ownership and scope.
- Create: no page owns the capability.
- Move/Rename: page location/name is misleading.
- Split: page mixes unrelated domains or is too broad.
- Merge: two pages document one capability with overlap.
- Remove: page no longer reflects current product behavior.
- Stub: capability must be discoverable but full details are not yet documented.

### Step 5: Normalize Naming and Paths

- Use lowercase kebab-case.
- Keep names concise and behavior-specific.
- Avoid commit/version terms in file/folder names.
- Avoid redundant area prefixes in filenames inside area/subarea paths.
  - Good: `ops/docs/waves/create/feature-dates-step.md`
  - Bad: `ops/docs/waves/create/feature-wave-create-dates-step.md`

### Step 6: Build Navigation Surfaces

Update navigation in the same change:

- Root `ops/docs/README.md`:
  - area map with one-line descriptions
  - curated task-oriented links
  - troubleshooting entry links
- Area/subarea `README.md`:
  - follow index template sections
  - include related-area hops
- Each content page:
  - include `Related Pages`
  - include parent index link when helpful

### Step 7: Complete Migration in One Pass

When moving/renaming pages:

- Update all internal links immediately.
- Remove stale links and stale pages.
- Do not leave duplicate old-path files.
- Do not leave `moved to` shim pages.

## Coverage Gap Policy

If a nearby area is relevant but not fully documented:

- Create a lightweight stub page in canonical location.
- Mark missing sections with explicit TODO markers.
- Link the stub from area/subarea and root indexes when relevant.
- Keep TODOs user-facing (`Document retry behavior for X`), never implementation backlog notes.

## Output Style Rule

- Commit details are input context only.
- Final docs must read as stable user guides, not change logs.
- Do not include commit hashes, commit subjects, or commit-titled sections.
- Keep content anchored to current product behavior only.
