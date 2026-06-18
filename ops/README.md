# Operations

`ops/` is the top-level home for repository operations: agent guidance,
roadmaps, workstream state, runbooks, and other project-maintenance material.

`ops/docs/` is reserved for product and user-facing documentation. If a reader
is learning how the 6529 app behaves, route them to `ops/docs/`. If a reader is
learning how the repository is operated, planned, automated, or managed by
agents, keep that material in the relevant `ops/` area.

## Structure

- [Docs](docs/README.md): product and user-facing documentation.
- [Skills](skills/README.md): repo-local Codex/OpenAI Agent skills, including
  skill prompts, scripts, references, and agent metadata.
- [Roadmap](roadmap/README.md): planning, sequencing, milestones, and future
  work that should not live in product docs.
- [Scripts](scripts/README.md): operational scripts for docs maintenance,
  agent workflows, and repo operations that are not app build/runtime scripts.
- `workstreams/`: active or archived workstream briefs, manager memory,
  handoffs, and evidence logs when a workstream needs durable state.
- `state/`: durable operational state used by automation or manager workflows
  when a narrower folder does not own it.

Create `workstreams/` and `state/` only when there is real content to store.

## Placement Rules

- Put user-visible app behavior, flows, feature guides, and troubleshooting in
  `ops/docs/`.
- Put repo operating practices, skills, roadmaps, plans, runbooks, agent state,
  and automation notes in `ops/`.
- Put operational scripts in `ops/scripts/`; keep app build/runtime scripts in
  top-level `scripts/` when repo tooling expects them there.
- Update `ops/docs/` when user-facing behavior changes.
- Update `ops/` when process, planning, validation, automation, or agent
  guidance changes.
- Do not store secrets, private environment values, credentials, local machine
  paths, or production data in operational docs or state.
