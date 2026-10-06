# Decision Register

Status values are `APPROVED`, meaning the rule is the implementation baseline,
or `DEFERRED`, meaning an owner must resolve it before the named roadmap phase.
Approval records product policy, not implementation completion. The Gate column
and production assessment distinguish shipped and planned scope.

| ID | Status | Decision and rationale | Owner | Gate |
| --- | --- | --- | --- | --- |
| D-01 | APPROVED | A native submission creates a dedicated competition drop. Existing chat drops cannot become entries, and a drop belongs to at most one competition for its lifetime, including after completion/deletion. Schema flexibility is not permission to reuse content. | Product + backend + frontend | Shipped policy; amendments required for future reuse. |
| D-02 | APPROVED | Competition drops appear in shared wave content with explicit competition/entry context. All submitted content is immutable, including unsigned entries. Winning changes entry state, never drop identity/type. Delete uses existing drop permissions; removed content is absent from public entry/history views while restricted audit is retained. No withdraw/disqualify actions. | Backend + frontend | Shipped policy, including history and moderation reads. |
| D-03 | APPROVED | Only winner notifications are emitted for competition lifecycle events. Publication, pause/resume and general lifecycle announcements are not sent to followers. Ordinary mention/reply notifications remain supported. Internal audit/cache events are not notification permission. | Product + notifications | Shipped policy. |
| D-04 | APPROVED | Drafts are editable; type locks at publication. After the first accepted entry, credit, signature, submission, timing, decision and outcome rules freeze. Presentation and participation/voting access groups remain editable with an audited config version. This does not permit editing entry content. | Backend + security + product | Shipped policy; current eligibility checked for each action. |
| D-05 | APPROVED | Published competitions finish through their configured rules; no manual end/cancel commands are exposed. Admins can pause/resume decisions, archive drafts/terminal competitions and clone terminal configurations. Retained cancellation enums/history do not imply a cancellation feature. Future consumable-credit/refund economics remain out of scope. | Product + backend | Shipped policy; supersedes the proposed cancellation command. |
| D-06 | APPROVED | Terminal competitions cannot reopen. Admins clone configuration into a new draft with a new ID and valid future dates. This preserves audit, signatures, decisions and links. | Product + backend | Shipped policy. |
| D-07 | APPROVED | Canonical detail URL: `/waves/{wave_id}/competitions/{competition_id}`. Entry links add `?entry={competition_entry_id}`; drop/serial links remain valid and may redirect or select context only after authorization. | Frontend | Roadmap Phase 2. |
| D-08 | APPROVED | Wave administrators control all competitions in the first native release. No separate competition-admin group is introduced. Authorization is still checked on every command against current wave-admin membership. | Product + backend | Roadmap Phases 1 and 3. |
| D-09 | APPROVED | All 296 mounted GET route shapes in the runtime manifest are permanently compatible. This includes 183 OpenAPI operations, authenticated reads, public aliases, health/raw-contract endpoints, and route-only reads. Interactive Swagger UI rendering is documentation, not a stable API response; `/openapi.yaml` and `/openapi.json` are included. | API owners | Permanent. |
| D-10 | APPROVED | Privileged behavior is assigned through explicit, allowlisted competition capabilities such as `MAIN_STAGE`. Capability assignment is an audited admin/operations action, unique where required, never inferred solely from a wave ID. Legacy special-wave IDs map to their immutable primary competition until migration completes. | Backend + operations | Roadmap Phases 1, 4, and 5. |
| D-11 | APPROVED | `CHAT` is a wave capability, not a competition type. Native competitions are `RANK` or `APPROVE`; zero competitions is a valid hub state. | All domain owners | Permanent. |
| D-12 | APPROVED | Competition visibility inherits from the wave. Participation and voting eligibility remain competition-owned. Entries cannot broaden wave visibility. | Product + security | Roadmap Phase 1. |
| D-13 | APPROVED | Parallel competitions have independent credit namespaces. A cross-competition wallet or budget is out of scope and would require a separately named policy and endpoint. | Backend + product | Roadmap Phase 4. |
| D-14 | APPROVED | Each competition has one authoritative storage mode and controlled execution mode. Ordinary commands cannot change ownership; Phase 5 may perform an audited guarded storage cutover with catch-up/parity/rollback gates. Only one executor may own a competition at a time; side effects are idempotent. | Backend + operations | Coexistence shipped; storage cutover not implemented. |
| D-15 | APPROVED | Legacy wave-scoped GETs bind permanently to `legacy_primary_competition_id`. They never select newest, active, featured, or first-by-sort native competition. A native hub without that ID projects as chat and hides native competitions from legacy GETs. | API owners | Permanent. |
| D-16 | APPROVED | Mutation compatibility is separate from permanent GET compatibility. Old wave-scoped mutations continue for legacy primary competitions while supported. Native hubs reject ambiguous mutations rather than selecting a default. Storage-aware old-write dispatch after migration remains Phase 5 preparation; no retirement date is established by this release. | API owners | Native-backed dispatch and support policy before legacy cutover. |
| D-17 | APPROVED | Current discovery has active/upcoming, completed history, all and admin-draft views; authorized deep links remain available. For the approved default-selection follow-up, drafts are excluded and archived competitions that previously ended remain eligible for the most-recently-ended fallback. An archived never-published draft is not completed history. | Product + frontend | Discovery shipped; default-selection extension implemented on development branches, not deployed. |
| D-18 | APPROVED | Native resources use `/v3/waves/{wave_id}/competitions...`. Existing unversioned and v2 GETs remain permanent compatibility façades rather than acquiring zero/one/many semantics. | API owners | Roadmap Phase 1. |
| D-19 | APPROVED | Ordinary wave entry stays in Chat. Default competition controls corresponding competition tabs without changing the initial view. One eligible competition wins; otherwise choose the only active or earliest-starting active; with none active choose soonest upcoming, otherwise most recently ended. Decisions paused still count as active. Drafts excluded; archived completed history eligible. Explicit competition selection and immutable legacy-primary APIs take precedence in their own contexts. | Product + backend + frontend | Approved 2026-10-01; implemented on development branches, PR review/CI tracked in delivery evidence, not deployed. See [full contract](../default-competition.md). |

## Decision Amendments — 2026-10-01

D-01–D-06 and D-17 incorporate the product decisions made during native release
validation, superseding the initial proposals for chat-drop attachment, reuse,
unsigned editing, withdrawal/disqualification, cancellation and lifecycle
announcements. D-14 distinguishes current immutable ownership from a future
controlled migration; D-16 explicitly retains the unfinished compatibility work.
D-19 records the newly approved product requirement and is not shipped behavior.

Use the [production assessment](../native-delivery/production-status-2026-10-01.md)
for delivery/acceptance evidence. Retained enum values or old baseline proposals
must not reintroduce superseded user actions. The frozen GET manifest and primary
mapping are unchanged. D-19 requires additive read/navigation work, backend-first
where needed, and reversible UI rollout; it requires no storage migration.

## Decision Change Control

Changing an approved decision requires an amendment in this register, an
impact review against the permanent GET manifest, and a migration/rollback
plan. Any change to signing identity, credit scope, legacy projection, or
execution ownership is security-sensitive and must be decided before code is
enabled.
