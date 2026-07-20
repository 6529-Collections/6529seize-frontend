# Domain Contract and Ownership Matrix

## Vocabulary

- **Wave** — durable discussion hub and authorization/visibility boundary. It
  can exist with zero competitions and retains chat, membership, moderation,
  following, REP, and aggregate activity.
- **Competition** — one `RANK` or `APPROVE` contest owned by one wave, with its
  own configuration, lifecycle, credit namespace, execution identity, and
  audit history. It is not a subwave.
- **Competition entry** — stable association between a competition and a drop.
  It owns submission/winner status; the drop remains durable content.
- **Legacy primary competition** — immutable competition identity assigned to
  each baseline `RANK` or `APPROVE` wave. It is the only competition projected
  through legacy wave-scoped GET contracts, forever.
- **Native hub** — wave created without a legacy primary competition. Legacy
  GETs see a contract-valid `CHAT` projection even when native competitions
  exist.
- **Stored lifecycle** — `DRAFT`, `PUBLISHED`, `ENDED`, `CANCELLED`, or
  `ARCHIVED`. Upcoming, participation open, voting open, deciding, and complete
  are computed phases, not additional stored states.
- **Storage mode** — `LEGACY_ADAPTER` or `NATIVE`, fixed for a competition.
- **Execution mode** — `DISABLED`, `SHADOW`, or `ACTIVE`, changed through an
  audited compare-and-set transition.
- **Capability** — explicit privileged integration assignment such as
  `MAIN_STAGE`; never an implicit consequence of an arbitrary wave ID.

## Field Ownership

The current entity evidence is `src/entities/IWave.ts` and
`src/entities/IDrop.ts` in the backend. Current API mapping lives in
`src/api-serverless/src/waves/waves.mappers.ts` and
`src/api-serverless/src/drops/api-drop.mapper.ts`.

| Field or behavior | Current owner | Target owner | Legacy projection | Migration phase |
| --- | --- | --- | --- | --- |
| Wave ID, serial, name, picture, description | Wave | Wave | Unchanged | N/A |
| Creator, created/updated timestamps | Wave | Wave | Unchanged | N/A |
| Parent/subwave relationship | Wave | Wave | Unchanged; never used for competition identity | N/A |
| Visibility group/scope | Wave | Wave | Unchanged | N/A |
| Admin group | Wave | Wave | Unchanged and authorizes competition commands | N/A |
| Chat enabled, chat group, authenticated-only, slow mode | Wave | Wave | Unchanged | N/A |
| Following, favourites, muting, pinned drop | Wave/profile | Wave/profile | Unchanged | N/A |
| REP ratings, wave score, reader/dropper metrics | Wave | Wave aggregate; competition dimensions optional | Existing fields unchanged | 2–7 |
| `type` `CHAT/RANK/APPROVE` | Wave | Competition `RANK/APPROVE`; chat remains wave | Original legacy type; native hub returns `CHAT` | 1–7 |
| Competition title/description/presentation | Wave name/description or UI convention | Competition | Original wave fields | 1–3 |
| Participation group/scope | Wave | Competition | Original primary config | 1–5 |
| Participation requirements | Wave | Competition config version | Original primary config | 1–5 |
| Per-user application/drop limits | Wave | Competition | Original primary config | 1–5 |
| Participation terms/signature requirement | Wave | Competition config version | Original primary config | 1–5 |
| Participation start/end | Wave | Competition | Original primary dates | 1–5 |
| Voting group/scope | Wave | Competition | Original primary config | 1–5 |
| Credit type/category/creditor | Wave | Competition credit policy | Original primary config | 1–5 |
| Credit scope, max votes, negative-vote policy | Wave | Competition credit namespace/policy | Original primary semantics | 1–5 |
| Voting terms/signature requirement | Wave | Competition config version | Original primary config | 1–5 |
| Voting start/end | Wave | Competition | Original primary dates | 1–5 |
| Minimum voting threshold | Wave | Competition | Original primary config | 1–5 |
| Decision strategy, first/next decision, repeat interval | Wave | Competition scheduler state | Original primary schedule | 1–5 |
| Max winners, winning threshold, time lock | Wave | Competition | Original primary config | 1–5 |
| Decision pauses | Wave pause | Competition pause | Original primary pauses | 1–5 |
| Outcomes and distributions | Wave/index | Competition/outcome ID | Original primary outcomes | 1–5 |
| Drop content, creator, serial, reactions, replies | Drop | Drop | Unchanged | N/A |
| Participatory/winner drop type | Drop | Compatibility projection from entry | Original primary-relative type | 1–5 |
| Entry ID, submission time/status/config version | Implicit in drop/type | Competition entry | Derived for primary; absent for chat projection | 1–5 |
| Winner rank/time/decision reference | Drop type + wave decision | Competition entry + decision winner | Original primary-relative winner context | 1–5 |
| Vote and credit-spend rows | Wave/drop | Competition/entry | Original wave/drop view | 1–5 |
| Voter state, ranks, real-vote history | Wave/drop | Competition/entry | Original primary view | 1–5 |
| Leaderboard row and snapshots | Wave/drop | Competition/entry | Original primary ordering/ties | 1–5 |
| Decisions and winner rows | Wave/drop | Competition/entry | Original primary decisions | 1–5 |
| Minting claim and meme-card mapping | Drop + special wave convention | Entry + capability + drop | Original primary result | 1–5 |
| Winner/claim/mint announcements | Wave/drop convention | Competition/entry idempotent side effect | Retain `wave_id` and old cause | 4–6 |
| Websocket drop/vote/delete events | Wave/drop | Wave/drop plus optional competition/entry | Retain existing payload and `wave_id` | 2–4 |
| Notification causes/subscriptions | Wave/drop/profile | Wave plus optional competition/entry | Retain cause and related-drop fields | 2–6 |
| Cache keys and invalidation | Wave/drop | Separate wave and `(wave, competition[, entry])` keys | Existing keys remain populated | 2–7 |
| Metrics and logs | Wave/worker | Wave + competition + storage/execution mode | Existing dimensions retained | 1–7 |
| Special wave IDs | Environment/config | Capability assignment plus legacy mapping | Existing ID continues to resolve primary | 1–5 |
| Configuration audit | Partial updated fields/logs | Immutable version records | Original config exposed unchanged | 1–4 |
| Lifecycle audit | Derived dates/drop transitions | Stored lifecycle events | Derived legacy behavior unchanged | 1–4 |

### Exact current wave-field ledger

This ledger prevents a grouped row above from hiding an entity field. It is
exhaustive for `WaveBase`, `WaveEntity`, `WaveArchiveEntity`, pause, and outcome
entities at the baseline.

| Current entity fields | Target owner | Notes |
| --- | --- | --- |
| `id`, `serial_no`, `name`, `picture`, `description_drop_id`, `created_by`, `created_at`, `updated_at` | Wave | Stable hub identity and presentation. |
| `parent_wave_id`, `visibility_group_id`, `admin_group_id`, `is_direct_message` | Wave | Competition is never represented through parent/subwave or DM identity. |
| `chat_enabled`, `chat_group_id`, `chat_slow_mode_cooldown_ms`, `chat_links_disabled`, `admin_drop_deletion_enabled` | Wave | Hub chat/moderation behavior. |
| `voting_group_id`, `voting_credit_type`, `voting_credit_scope`, `voting_credit_category`, `voting_credit_creditor`, `voting_signature_required`, `voting_period_start`, `voting_period_end`, `max_votes_per_identity_to_drop`, `forbid_negative_votes` | Competition config version | Primary projection retains every current field/null/enum. |
| `participation_group_id`, `participation_signature_required`, `participation_max_applications_per_participant`, `participation_required_metadata`, `participation_required_media`, `participation_period_start`, `participation_period_end`, `participation_terms` | Competition config version | Exact requirements and array order retained. |
| `submission_type`, `identity_submission_strategy`, `identity_submission_duplicates` | Competition participation strategy | Preserve `IDENTITY` strategy/duplicate enum semantics. |
| `type`, `winning_min_threshold`, `winning_max_threshold`, `winning_threshold_min_duration_ms`, `max_winners`, `time_lock_ms`, `decisions_strategy`, `next_decision_time` | Competition config/scheduler | `CHAT` becomes no competition; legacy API values remain exact. |
| `archive_id`, archived `id`/`serial_no`, `archival_entry_created_at`, all archived `WaveBase` fields | Wave archive plus versioned legacy source | Retain enough history for permanent projection/audit. |
| Pause `id`, `wave_id`, `start_time`, `end_time` | Competition pause | Primary adapter retains original interval and ID behavior. |
| Outcome `wave_id`, `wave_outcome_position`, `type`, `subtype`, `description`, `credit`, `rep_category`, `amount` | Competition outcome | Stable native ID plus legacy position mapping. |
| Distribution `wave_id`, `wave_outcome_position`, `wave_outcome_distribution_item_position`, `amount`, `description` | Competition distribution item | Stable native ID plus legacy ordered-position mapping. |

`wave_voting_credit_nfts` and its archive preserve contract, token, and ordering
as part of the competition credit policy/version. API-derived
`total_no_of_decisions`, `no_of_decisions_done`, `no_of_decisions_left`,
`next_decision_time`, authenticated eligibility/admin flags, subscribed
actions, contributor overviews, metrics, REP/score, pinned, identity-wave, and
subwave indicators remain in their current legacy response shapes; native
versions derive them from the explicit wave/competition context rather than an
implicit active competition.

## Dependent-System Ownership

| Subsystem | Classification now | Target key/owner | Compatibility obligation |
| --- | --- | --- | --- |
| Wave and overview GETs | Mixed | Wave plus legacy façade | Primary or chat projection; fields/order unchanged |
| Drop feeds/search/replies | Mixed | Wave content with optional competition filter | Old unfiltered feed and drop shapes unchanged |
| Submissions/leaderboards/voters | Competition-specific but wave-keyed | Competition/entry | Old paths bind primary only |
| Decisions/pauses/outcomes | Competition-specific but wave-keyed | Competition | Old paths bind primary only |
| Notifications/websockets | Mixed | Wave event plus optional competition/entry | Old fields and causes remain valid |
| Query caches/tabs/timers | Mixed | Hub state plus selected competition state | Legacy screens remain single-context |
| Claims/minting/Main Stage | Competition-specific and privileged | Capability-bearing competition | Legacy primary mapping remains immutable |
| Migration/worker deployment | Mixed operational | Per-competition mode | Additive, idempotent, independently deployable |

There are no `unknown` high-risk owners remaining. Every current competition
field and dependent subsystem maps to wave, competition, entry, or an explicit
compatibility/operations owner. Detailed file evidence is in the backend and
frontend inventories.

## Invariants

1. A competition belongs to exactly one wave; an entry's drop belongs to that
   same wave.
2. Competition IDs and entry IDs are globally stable and never recycled.
3. Parallel competitions never share derived credit spend or executor state.
4. Every signature binds action, actor, wave, competition, entry/drop,
   configuration version, nonce, issued time, and expiry.
5. A terminal competition cannot return to an active lifecycle.
6. One competition has exactly one storage mode and at most one active
   execution owner.
7. Legacy projections are deterministic: immutable primary or chat, never an
   arbitrary native competition.
8. Winning changes entry state; drop identity and chat history remain stable.
