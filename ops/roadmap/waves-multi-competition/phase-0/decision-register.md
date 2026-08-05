# Decision Register

Status values are `APPROVED`, meaning the rule is the implementation baseline,
or `DEFERRED`, meaning an owner must resolve it before the named roadmap phase.
Deferred choices do not prevent the additive Phase 1 schema and read API from
being estimated.

| ID | Status | Decision and rationale | Owner | Gate |
| --- | --- | --- | --- | --- |
| D-01 | APPROVED | The native schema permits one drop to have entries in more than one competition. The first UI permits at most one active, non-terminal competition entry per drop; this reduces moderation and signature ambiguity without foreclosing later reuse. | Product + frontend | Reconsider before roadmap Phase 6 only if multi-entry UX is desired. |
| D-02 | APPROVED | A submission remains an ordinary stable chat drop plus a separate competition-entry activity record and competition-filtered read view. Winning mutates entry state, never drop identity or content type. | Backend + frontend | Roadmap Phases 1–4. |
| D-03 | APPROVED | Followers receive competition `PUBLISHED`, material schedule change, `CANCELLED`, `ENDED`, and winner announcements. Entry notifications are limited to the submitter, mentions/replies, and explicit admin moderation; there is no follower-wide notification per entry. | Product + notifications | Copy and batching may be refined in roadmap Phase 6 without changing event identity. |
| D-04 | APPROVED | Drafts are editable. After publication, presentation text may change with an audit version; eligibility, credit, signature, decision strategy, and timing fields become immutable after the first accepted entry or vote. A pre-activity schedule change creates a new config version and a lifecycle event. | Backend + security | Roadmap Phases 1, 3, and 4. |
| D-05 | DEFERRED | Cancellation always stops new entries, votes, and decision execution; preserves entries/votes read-only; and cannot create winners, outcomes, claims, mints, or refund activity implicitly. Product must decide whether any future consumable credit system warrants an explicit compensating-credit command. Current derived voting budgets are not silently rewritten. | Product + backend | Must resolve before roadmap Phase 4 enables native mutations. |
| D-06 | APPROVED | An `ENDED` or `CANCELLED` competition cannot reopen. Admins clone configuration into a new draft with a new ID. This preserves audit, signatures, decisions, and links. | Product + backend | Roadmap Phase 3. |
| D-07 | APPROVED | Canonical detail URL: `/waves/{wave_id}/competitions/{competition_id}`. Entry links add `?entry={competition_entry_id}`; drop/serial links remain valid and may redirect or select context only after authorization. | Frontend | Roadmap Phase 2. |
| D-08 | APPROVED | Wave administrators control all competitions in the first native release. No separate competition-admin group is introduced. Authorization is still checked on every command against current wave-admin membership. | Product + backend | Roadmap Phases 1 and 3. |
| D-09 | APPROVED | All 296 mounted GET route shapes in the runtime manifest are permanently compatible. This includes 183 OpenAPI operations, authenticated reads, public aliases, health/raw-contract endpoints, and route-only reads. Interactive Swagger UI rendering is documentation, not a stable API response; `/openapi.yaml` and `/openapi.json` are included. | API owners | Permanent. |
| D-10 | APPROVED | Privileged behavior is assigned through explicit, allowlisted competition capabilities such as `MAIN_STAGE`. Capability assignment is an audited admin/operations action, unique where required, never inferred solely from a wave ID. Legacy special-wave IDs map to their immutable primary competition until migration completes. | Backend + operations | Roadmap Phases 1, 4, and 5. |
| D-11 | APPROVED | `CHAT` is a wave capability, not a competition type. Native competitions are `RANK` or `APPROVE`; zero competitions is a valid hub state. | All domain owners | Permanent. |
| D-12 | APPROVED | Competition visibility inherits from the wave. Participation and voting eligibility remain competition-owned. Entries cannot broaden wave visibility. | Product + security | Roadmap Phase 1. |
| D-13 | APPROVED | Parallel competitions have independent credit namespaces. A cross-competition wallet or budget is out of scope and would require a separately named policy and endpoint. | Backend + product | Roadmap Phase 4. |
| D-14 | APPROVED | Each competition has immutable `storage_mode` and controlled `execution_mode`. Only one executor may own a competition at a time; all side effects use idempotency keys. | Backend + operations | Roadmap Phases 1 and 4. |
| D-15 | APPROVED | Legacy wave-scoped GETs bind permanently to `legacy_primary_competition_id`. They never select newest, active, featured, or first-by-sort native competition. A native hub without that ID projects as chat and hides native competitions from legacy GETs. | API owners | Permanent. |
| D-16 | APPROVED | Mutation compatibility is separate from the permanent GET guarantee. Old wave-scoped mutations continue for legacy primary competitions while supported; native hubs reject ambiguous competition mutations with the existing contract-valid authorization/validation envelope and direct capable clients to competition-scoped commands. | API owners | Detailed deprecation schedule before roadmap Phase 4. |
| D-17 | DEFERRED | Cancelled and archived competitions remain directly deep-linkable to authorized members. Product must choose whether they also appear by default in the hub history or behind a status filter. APIs always support explicit status filtering, so the choice is presentation-only. | Product + design | Must resolve before roadmap Phase 6 broad rollout. |
| D-18 | APPROVED | Native resources use `/v3/waves/{wave_id}/competitions...`. Existing unversioned and v2 GETs remain permanent compatibility façades rather than acquiring zero/one/many semantics. | API owners | Roadmap Phase 1. |

## Decision Change Control

Changing an approved decision requires an amendment in this register, an
impact review against the permanent GET manifest, and a migration/rollback
plan. Any change to signing identity, credit scope, legacy projection, or
execution ownership is security-sensitive and must be decided before code is
enabled.
