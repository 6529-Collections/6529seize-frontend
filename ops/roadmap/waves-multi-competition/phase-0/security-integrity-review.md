# Security and Integrity Review

## Assets and Trust Boundaries

Protected assets are wave visibility, admin authority, entries and authorship,
credit budgets, votes, leaderboards, decisions, winners, outcomes,
distributions, claims, mints, announcements, and the permanent legacy
projection. Requests, old clients, websocket messages, queues, scheduled
workers, backfills, and storage-mode changes cross trust boundaries.

The backend is authoritative for wave membership, competition lifecycle,
config version, credit, timing, and parent-child identity. Client-provided wave,
competition, entry, rank, winner, capability, or remaining-credit values are
never trusted.

## Threats and Controls

| Threat | Failure mode | Required controls | Verification |
| --- | --- | --- | --- |
| Signature replay in another competition | Valid entry/vote signature spends or submits elsewhere. | New structured domain binds action, actor, wave, competition, entry/drop, config version, payload hash, unique nonce, issue/expiry. Atomic nonce consumption scoped to actor/action/competition. | Replay same signature, swap each ID/version/action, expire it, race two requests; only one original succeeds. |
| Legacy signature reused natively | Current drop hash lacks native competition identity. | Accept legacy signature formats only on supported legacy-primary mutations. Native commands require the new domain; no server-side reinterpretation. | Old signature against native endpoint fails without creating drop/entry. |
| Config changes after signatures/entries/votes | Previously valid action is evaluated under different rules. | Immutable config versions; signatures bind version. Credit/signature/submission/timing/decision fields lock after first accepted entry; presentation/access groups remain versioned and editable. Current eligibility is checked on every action. | Concurrent PATCH/entry/vote tests; stale version returns 409, no partial writes. |
| Cross-competition credit spend | Parallel competition B consumes A's budget or cap. | Ledger uniqueness includes competition ID; all calculations query it explicitly. No wave-global native credit cache/key. | Equal actor/drop across A/B; independent remaining balances and caps. |
| Cross-wave/competition entry ID guessing | Attacker reads/votes/deletes an entry outside visible parent. | Load and authorize wave first; query child by all parent IDs; verify `drop.wave_id`; mask mismatch/not-found consistently. | Matrix of valid, wrong wave, wrong competition, private parent, unauthorized admin; no existence leak. |
| Unauthorized competition administration | Member publishes, edits, pauses, archives, assigns capability. | Re-evaluate current wave-admin group on every command, including proxy action scope. Capability assignment additionally requires operations allowlist and audit. | Role/proxy revocation races; revoked actor cannot use stale client state. |
| Capability confused with wave identity | Any competition in Main Stage wave creates claims/mints. | Explicit allowlisted capability relation; uniqueness constraint where required; legacy environment ID maps only immutable primary. | Second competition in same wave has no claim/mint behavior; duplicate capability assignment fails. |
| Dual execution during cutover | Legacy and native workers finalize same occurrence. | Storage ownership fixed outside guarded migration; audited storage/execution-mode CAS; one executor lease and unique `(competition, scheduled_at)` decision key. Shadow cannot acquire active lease or side-effect. | Race both worker versions and repeated queues/schedules; one decision, one mode owner. |
| Duplicate winners/outcomes/distributions | Retry creates inconsistent terminal records. | Transactional decision/winner/outcome writes with unique occurrence and entry/outcome keys. Idempotent retry returns existing result. | Inject timeout before/after commit; replay event; exact same records/order. |
| Duplicate claims/mints/announcements | At-least-once queues produce financial/public duplicates. | Stable idempotency keys containing capability, competition, decision, entry, and side-effect type; unique DB constraints; downstream idempotency; outbox state. | Redrive DLQ, duplicate message, worker crash at each boundary; at most one effect. |
| Completion race | Vote/entry/decision commits after terminal completion. | Lifecycle/version check in the mutation transaction or executor lease; terminal state prevents execution. No manual cancellation command. | Race completion against entry, vote and due decision; terminal invariants hold. |
| Entry reuse ambiguity | One drop appears with wrong rank/winner context. | Context is entry ID; endpoint checks selected entry. Legacy mapper considers primary entry only. Commands transactionally enforce one competition per drop for its lifetime. | Concurrent reuse attempts fail; independent drops in parallel competitions retain separate status/rank. |
| Old client mutation on native hub | Ambiguous write reaches arbitrary competition. | Native hubs project chat for GET; legacy competition mutations reject current-contract validation/authorization. Never choose active/newest. | Baseline client POST/vote attempts against native hub create no competition state. |
| Cache/query poisoning | Wave-keyed cached primary response contains native competition data. | Separate native cache namespaces; primary ID part of compatibility materialization; invalidation updates both precise native and affected legacy keys. Cache entries include schema/projection version. | Warm caches across publish/complete/migrate; assert primary/chat projection unchanged. |
| Event spoofing/out-of-order delivery | UI/worker shows or executes invalid state. | Server-issued event IDs/version; authenticated internal publishers; consumer dedupe and monotonic resource version; refetch on gaps. Events are notification, not command authority. | Reorder, duplicate, omit, and forge events; authoritative state converges. |
| Backfill corruption | Wrong primary, entry, or capability mapping becomes permanent. | Deterministic idempotent mapping, unique constraints, dry-run, checksums, checkpoints, orphan quarantine, manual approval for capability mappings. Never overwrite source. | Rerun produces same checksum; injected orphan cannot activate. |
| Legacy projection drift | Existing GET selects active/native competition or changes null/type/error behavior. | Immutable primary FK; chat fallback; frozen OpenAPI/router/golden CI; a native UI-default resolver must never change old GET routing. | Legacy-plus-newer-native fixture exercises every affected GET. |
| Enumeration through errors/timing | Private competition existence leaks. | Parent authorization before child detail; uniform masked 404 envelope; avoid materially distinct timing/cache status. | Compare response status/body and timing distributions for missing vs inaccessible. |
| Overbroad observability | Wallet, signature, terms, or private payload leaks to logs. | Structured allowlisted fields; restricted ID logs; hashed comparison values; never log signature, nonce, raw request, terms, or private content. | Log schema tests and production sampling review. |

## Authorization Matrix

| Action | Anonymous | Visible member | Eligible participant/voter | Wave admin | Operations capability admin |
| --- | --- | --- | --- | --- | --- |
| Read public hub/competition | Yes | Yes | Yes | Yes | Yes |
| Read private hub/competition | Masked | Yes | Yes | Yes | Subject to membership |
| Create entry | No | No unless eligible | Participation rules | If also eligible; no implicit bypass | No implicit bypass |
| Vote | No | No unless eligible | Voting rules/credit | If also eligible; no implicit bypass | No implicit bypass |
| Create/edit draft | No | No | No | Yes | Yes if wave admin |
| Publish/pause/resume/archive/clone | No | No | No | Yes | Yes if wave admin |
| Assign/remove privileged capability | No | No | No | No | Yes plus wave-admin/domain validation |
| Change storage/execution mode | No | No | No | No | Protected operational control only |

Proxy authentication must require the existing relevant proxy action and is
evaluated server-side on each request. Administration never implies voting or
participation eligibility.

## Integrity Constraints

- Unique immutable legacy primary per wave; it cannot point to another wave.
- Competition `(id, wave_id)` parent integrity and terminal lifecycle monotonicity.
- Entry `(id, competition_id, wave_id, drop_id)` integrity; drop belongs to wave.
- One-competition-per-drop lifetime restriction enforced transactionally.
- Immutable submitted content and deletion/privacy controls apply to historical
  public projections as well as current entries.
- Vote/spend unique by competition, entry, voter, and version as appropriate.
- Decision unique by competition and scheduled occurrence.
- Winner unique by decision/entry; rank uniqueness follows strategy rules.
- Capability assignments audited and unique according to capability policy.
- Claim/mint/announcement unique by semantic idempotency key.
- Config versions append-only; referenced versions cannot be deleted.

Follow the backend schema rule against foreign keys. Enforce cross-table wave
equality and lifecycle/version checks transactionally with the applicable row
locks and uniqueness constraints.

## Cutover Safety Gate

A competition may move to active native execution only if schema, API, decision,
leaderboard, score/metric, notification, claim/mint, and announcement workers
are dual-aware; backfill/parity is green; no capability mismatch exists; and an
audited compare-and-set records expected prior mode. Rollback disables new
native execution first and keeps all data; it never deletes native rows or
rewrites legacy source.

## Residual Decisions

D-05/D-17 are resolved in the amended decision register. D-19 default selection
is an approved, unimplemented navigation feature: it grants no capability or
write authority and cannot change a signed command target, explicit selection,
legacy primary or execution owner. Test selection changes while forms are open
and while legacy/native competitions coexist.
