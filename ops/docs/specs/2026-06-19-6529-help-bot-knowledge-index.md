---
title: 6529 Help Bot Knowledge Index
version: 0.1
status: draft
created: 2026-06-19
---

# 6529 Help Bot Knowledge Index

## Problem Statement

Users often ask practical product questions in Waves instead of finding the
right page or control themselves. Some questions are glossary-like, for example
`what is TDH`, while others are workflow questions, for example `how do I create
a wave` or `how do subscriptions work`.

The 6529 Help Bot, also referred to as the helper chatbot, needs reliable
product knowledge and accurate 6529.io links. The backend should not inspect the
frontend repository, GitHub, or a live rendered page while a user waits for an
answer. The frontend should provide a structured, versioned help corpus that can
be synchronized by the backend and used for retrieval-augmented generation.

## Goals

- Define frontend-owned source material for 6529 Help Bot answers.
- Make frontend routes, page meanings, UI entry points, and user-facing docs
  available to the backend through a generated help index.
- Support broad natural-language questions without requiring a predefined list
  of questions.
- Preserve accurate canonical 6529.io links in generated answers.
- Make important UI affordances discoverable, such as the `+` button that opens
  wave creation from the Waves panel.
- Keep the live bot answer path fast by publishing an index that the backend can
  cache.

## Non-Goals

- Implement the bot runtime in the frontend.
- Add a user-facing help center UI in this iteration.
- Index every component or every line of source code.
- Let the LLM infer routes or UI locations from raw code at answer time.
- Replace existing user-facing docs under `ops/docs`.

## Terminology

- 6529 Help Bot: the product-facing bot identity that users mention in Waves.
- Helper chatbot: a friendly alias for the same capability.
- Help corpus: all indexed records and chunks available for retrieval.
- Help index: the generated artifact consumed by the backend.
- Curated record: a manually authored record for a term, workflow, route, or UI
  action.
- Doc chunk: a searchable chunk generated from existing product docs.
- UI affordance record: a structured record describing a control, location,
  prerequisite, and result.

## Source Ownership

The frontend should own source-of-truth records for frontend concepts and
navigation because the frontend owns:

- routes and route metadata
- sidebar and page entry points
- user-visible UI labels
- page-level product documentation under `ops/docs`
- affordances such as buttons, menus, tabs, and empty-state calls to action

The backend should own runtime copies, embeddings, job orchestration, LLM calls,
message reactions, and bot replies.

## Proposed Help Sources

### 1. Curated Glossary Records

Use curated records for core terms where the bot must be concise and accurate:

- TDH
- xTDH
- Rep
- CIC
- NIC
- Waves
- Drops
- Groups
- Subscriptions

Recommended fields:

```json
{
  "id": "network.tdh",
  "kind": "glossary",
  "title": "TDH",
  "aliases": ["tdh", "total days held"],
  "facts": [
    "TDH stands for Total Days Held.",
    "TDH is a time-weighted NFT holding metric.",
    "TDH uses days held, edition-size weighting, and active boosters."
  ],
  "canonical_path": "/network/tdh",
  "related_paths": ["/network/definitions", "/network/tdh/historic-boosts"],
  "tags": ["network", "tdh", "metric"]
}
```

### 2. Curated UI Affordance Records

Use UI affordance records for common actions users miss even when the control is
visible.

Example:

```json
{
  "id": "waves.create.entrypoint.sidebar",
  "kind": "ui_affordance",
  "intent": "create_wave",
  "title": "Create a wave from the Waves panel",
  "aliases": ["create wave", "make a wave", "new wave", "start a wave"],
  "facts": [
    "Click the + button at the top-right of the Waves panel.",
    "The action opens the Create Wave flow.",
    "Create controls require a connected profile.",
    "Wave types are Chat, Rank, and Approve."
  ],
  "canonical_path": "/waves/create",
  "ui": {
    "surface": "waves_panel",
    "control": "+ button",
    "position": "top-right of the Waves panel",
    "requires": ["connected profile"]
  },
  "tags": ["waves", "create", "ui-action"]
}
```

The exact schema can evolve, but the important product rule is that the LLM
should not discover the `+` button live. The UI location should be authored or
generated ahead of time.

### 3. Generated Route Records

Generate records from App Router pages where safe:

- static path where derivable from `app/**/page.tsx`
- metadata title and description where present
- route owner area, for example `network`, `waves`, `profiles`, or `tools`
- related docs detected from `ops/docs` references

Generated route records should be low confidence unless paired with curated docs
or route metadata. They are useful for retrieval, but curated records should
select canonical links for important questions.

### 4. Product Doc Chunks

Chunk existing docs under `ops/docs` by heading and paragraph group. Preserve:

- source file
- heading path
- route references
- related docs
- tags inferred from path
- last generated commit SHA

Example source areas for wave creation:

- `ops/docs/waves/create/README.md`
- `ops/docs/waves/create/feature-overview-step.md`
- `ops/docs/waves/create/feature-modal-entry-points.md`
- `app/waves/create/page.tsx`

For a user asking `Do we have docs how to create a wave?`, retrieval should find
these chunks and allow the backend LLM to answer with the `+` button location,
the `/waves/create` route, and a short summary of Chat, Rank, and Approve wave
configuration.

### 5. Frontend API and UI Behavior Summaries

For product areas where route docs point to frontend behavior, the index can
include short summaries generated from existing docs and selected component
metadata. Examples:

- where subscription reports live
- what the profile subscriptions tab is for
- where open-data subscription exports live
- how to start wave creation on desktop vs app

This source should summarize user-visible behavior only. Backend business rules
belong in backend-owned records.

## Optional Component Metadata Convention

Curated docs are enough for V1. For a stronger V2, add structured metadata to
important controls so the index can be generated more reliably.

Example:

```tsx
<button
  aria-label="Create Wave"
  data-help-id="waves.create"
  data-help-location="top-right of the Waves panel"
  data-help-intent="create_wave"
>
  <PlusIcon />
</button>
```

Rules:

- Metadata must complement accessible names, not replace them.
- Metadata should be reserved for important user actions, not every button.
- `data-help-id` values should be stable.
- CI should fail when a curated `data-help-id` is duplicated.

## Generated Artifact

The frontend should publish one generated help artifact:

```text
help-index.json
```

The artifact should include:

- schema version
- generated timestamp
- frontend commit SHA
- records array
- canonical base URL assumptions
- route validation summary

Recommended high-level shape:

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-19T00:00:00.000Z",
  "commit_sha": "example",
  "base_url": "https://6529.io",
  "records": []
}
```

The backend may consume the artifact from a deployed public URL, S3 object, or
repository release artifact. The answer path should consume only the backend's
cached copy.

## Validation Requirements

The frontend build or CI should validate:

- every `canonical_path` starts with `/`
- every `canonical_path` resolves to a known route or an explicitly external
  destination
- every related internal path resolves or is marked as intentionally dynamic
- record IDs are unique
- aliases are normalized and non-empty
- required records for critical terms/actions exist
- generated JSON matches schema

Initial critical records:

- `network.tdh`
- `network.xtdh`
- `waves.create.entrypoint.sidebar`
- `waves.create.flow`
- `waves.direct-message.create`
- `profiles.subscriptions`
- `tools.subscriptions-report`

## Retrieval Expectations

The index should support these query classes:

- exact term lookup: `what is TDH`
- workflow lookup: `how do I create a wave`
- location lookup: `where do I find subscription reports`
- feature explanation: `what are Rank waves`
- broad docs request: `Do we have docs how to create a wave and the features`

The index should not require exact question strings. It should provide enough
semantic material for the backend to retrieve relevant records and ask an LLM to
compose a short answer.

## Answer Link Rules

- User replies should point to 6529.io pages, not GitHub source files.
- GitHub source paths are for debugging, provenance, and PR review only.
- Prefer one canonical URL and at most two related URLs in normal bot answers.
- When the canonical route is dynamic, prefer the nearest stable landing page.
- If the best answer is an in-context UI action, include both the UI action and
  a stable fallback URL when available.

## Rollout Plan

### Phase 1: Curated Seed Corpus

- Add curated records for top glossary terms and common actions.
- Include wave creation and TDH as first test cases.
- Publish a static help index artifact from the frontend.

### Phase 2: Docs Chunking

- Chunk `ops/docs` and include route references.
- Add schema validation and route validation.
- Add backend sync from the published artifact.

### Phase 3: Component Help Metadata

- Add `data-help-*` metadata for high-value controls.
- Generate UI affordance records from annotated controls.
- Keep curated records as the higher-confidence source.

### Phase 4: Coverage and Evals

- Add eval questions for glossary, workflow, UI location, and broad docs
  requests.
- Track unanswered questions and add records where users are confused.

## Open Questions

- Should the frontend publish `help-index.json` through the deployed site,
  through S3, or as a repository artifact consumed by backend deployment?
- Should curated records live under `ops/help`, `content/help`, or another
  frontend-owned directory?
- Which user-facing name should ship first: `6529 Help Bot`, `6529 Help`, or
  another handle?
- Which controls should receive `data-help-*` metadata in the first pass?
- Should private or role-gated routes be indexed with public fallback wording?
