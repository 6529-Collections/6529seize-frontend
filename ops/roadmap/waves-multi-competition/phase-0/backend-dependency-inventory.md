# Backend Dependency Inventory

This inventory was inspected from the current backend main branch. Paths are
backend-repository relative. Classification uses `wave-only`,
`competition-specific`, or `mixed`; no high-risk dependency remains unknown.

## Entities and Tables

| Area | Current evidence | Classification | Native responsibility |
| --- | --- | --- | --- |
| Wave/configuration | `src/entities/IWave.ts`; `waves` | Mixed | Keep hub fields on wave; move participation, voting, timing, decisions, outcomes, lifecycle, and capability configuration to competition/version tables. |
| Archives and pauses | `waves_archive`, `waves_decision_pauses` | Competition-specific | Competition lifecycle audit and competition pauses; preserve legacy adapter reads. |
| Outcomes/distributions | `wave_outcomes`, `wave_outcome_distribution_items` | Competition-specific | Key by competition/outcome; retain outcome index projection for primary. |
| Drops/content | `src/entities/IDrop.ts`; `drops`, parts, mentions, reactions, polls, boosts, bookmarks | Mixed | Drop remains wave content. New entry association carries competition meaning. |
| Vote spend/state | `drops_votes_credit_spendings`, `drop_voter_states`, `drop_ranks` | Competition-specific | Key spend/state/rank by competition and entry; never infer scope from drop alone. |
| Vote history | `drop_real_vote_in_time`, `drop_real_voter_vote_in_time`, `winner_drop_voter_votes` | Competition-specific | Competition/entry history with unchanged primary projection. |
| Leaderboard/snapshots | `wave_leaderboard_entries` | Competition-specific | Competition leaderboard entries and snapshot identity; preserve ordering/tie semantics. |
| Decisions/winners | `wave_decisions`, `wave_decision_winner_drops` | Competition-specific | Idempotent competition decision and entry winner rows. |
| Voting-credit NFTs | `wave_voting_credit_nfts` | Competition-specific | Competition policy/version relation. |
| Metrics | `wave_metrics`, `wave_dropper_metrics`, `wave_reader_metrics` | Mixed | Wave aggregates remain; competition metrics add competition/mode dimensions. |
| Notifications | `identity_notifications`, `wave_group_notification_subscriptions` | Mixed | Retain wave/cause/related-drop fields; add optional competition and entry identity. |
| Special mappings | `meme_card_drop_mappings`, `minting_claims` | Competition-specific | Bind privileged result to capability-bearing competition entry plus stable drop. |

The canonical table-name inventory is in `src/constants/db-tables.ts`. Entity metadata is
loaded by `src/dbMigrationsLoop/index.ts`; the migration loop runs database
migrations and entity synchronization. Native schema work must use additive
tables/nullable columns and the existing migration mechanism, never an
in-place reinterpretation required by old readers.

The exact baseline table families inspected in `src/constants/db-tables.ts`
are: `waves`, `waves_archive`, `waves_metadatas`, `official_waves`,
`waves_decision_pauses`, `wave_outcomes`,
`wave_outcome_distribution_items`, `wave_voting_credit_nfts` and its archive,
`wave_decisions`, `wave_decision_winner_drops`, `wave_leaderboard_entries`,
`wave_metrics`, `wave_dropper_metrics`, `wave_reader_metrics`, wave score/drop
refresh requests, chat cooldowns, curations, pinned/profile waves, `drops`,
parts, relations, mentions, mentioned waves/groups, referenced NFTs, metadata,
media/uploads, reactions, boosts, curations, bookmarks, quick-vote skips, NFT
links, polls/options/votes, `drops_votes_credit_spendings`,
`drop_voter_states`, `drop_ranks`, real vote/voter histories,
`winner_drop_voter_votes`, identity notifications/subscriptions,
wave-group notification subscriptions, websocket connections/subscriptions,
`meme_card_drop_mappings`, `minting_claims`, and minting claim actions. Content
tables remain drop/wave-owned; the competition-specific families above gain
native competition/entry counterparts rather than being reinterpreted in
place.

## API and Route Surface

The frozen OpenAPI contains 183 GET operations. Static traversal of the actual
Express mount graph finds 296 externally reachable GET route shapes, including
113 route-only, authenticated operational, health, alias, and raw-contract
reads. See the [compatibility manifest](./public-get-compatibility-manifest.md)
and its machine snapshots for the exhaustive list.

Wave-sensitive reads are implemented in:

- `src/api-serverless/src/waves/waves.routes.ts`: wave, feed, leaderboard,
  curations, logs, voters, search, decisions, outcomes, distributions.
- `src/api-serverless/src/waves/waves-overview.routes.ts`: favourites, hot,
  and overview projections.
- `src/api-serverless/src/waves/waves-public.routes.ts`: unauthenticated public
  aliases that mask private waves as not found.
- `src/api-serverless/src/generated/routes/openapi-generated.routes.ts`: v2
  wave/drop reads, polls, metadata, official waves, subwaves, and mentions.
- `src/api-serverless/src/drops/drops.routes.ts` and drop-v2 handlers: drop,
  votes, replies, reactions, search, and create/update behavior.
- `src/api-serverless/src/notifications/notifications.routes.ts`: required-auth
  wave subscription reads.
- `src/api-serverless/src/og-metadata/og-metadata.handlers.ts` and meme-card
  mapping handlers: externally visible projections tied to wave/drop identity.

OpenAPI declares top-level bearer security, but actual route auth is not
uniform. Current middleware uses no JWT, `maybeAuthenticatedUser()` (optional),
or `needsAuthenticatedUser()` (required). `/api/*` also has a conditional
deployment gate: when `ACTIVATE_API_PASSWORD=true`, `x-6529-auth` is required
and rejection is HTTP 401. The runtime manifest freezes route-specific auth
and this additional gate. Visibility checks and private-wave not-found masking
remain part of the contract.

## Drop Lifecycle and Submission Validation

- `DropType` is `CHAT`, `PARTICIPATORY`, or `WINNER` in
  `src/entities/IDrop.ts`. Current participation and winner meaning is encoded
  on the drop.
- `src/api-serverless/src/drops/drop.validator.ts`,
  `drop-creation.api.service.ts`, `drops.routes.ts`, and wave API services
  validate wave visibility, participation groups, timing, requirements,
  application limits, terms, and signatures.
- `src/api-serverless/src/drops/drops.api.service.ts` and database queries
  filter participatory/winner drops and maximum applications by wave.
- `src/api-serverless/src/drops/api-drop.mapper.ts` supplies wave-minimum,
  signed, voting, winning, and Main Stage context to external drop responses.

Native entry creation must transactionally prove `(drop.wave_id =
competition.wave_id)`, validate the active config version, reject a terminal
legacy `WINNER` drop, and enforce one immutable `(competition_id, drop_id)`
association. The first-release policy also rejects another active, non-terminal
competition entry for the same drop; a later policy may relax only that
cross-competition guard as allowed by D-01. It writes the entry without changing
the drop. Legacy adapters continue deriving entries from participatory/winner
drops.

## Voting, Credits, and Leaderboards

- Voting and edit/log behavior is implemented under
  `src/api-serverless/src/drops/drop-voting.service.ts`, vote database modules,
  wave quick-vote routes, and wave score services.
- Credit meaning currently comes from wave voting credit type, category,
  creditor, scope, maximum votes, and NFT policies.
- Leaderboard reads/snapshots use wave/drop keys in wave APIs,
  `src/waves/wave-leaderboard.service.ts`, and the snapshot loop.
- Real-vote history, per-voter state, ranks, and winner vote snapshots are all
  wave/drop-keyed today.

Native writes require `(competition_id, entry_id, voter)` uniqueness and a
competition credit ledger namespace. Reads must define deterministic ordering
and tie breakers identical to legacy contracts for primary projections.

## Decisions, Pauses, Outcomes, and Side Effects

`src/waves/wave-decisions.service.ts` calculates due decisions, winners,
outcomes, Main Stage behavior, and announcements. Current scheduling uses
wave `next_decision_time`, decision strategy, participation/voting dates,
pauses, thresholds, and winner limits. Outcome services and APIs are keyed by
wave and index.

Native execution requires:

- an atomic executor lease keyed by competition and decision occurrence;
- a unique decision key `(competition_id, scheduled_at)`;
- unique winner, outcome, distribution, claim, mint, and announcement keys;
- a terminal/cancel check in the same transaction as lease acquisition;
- no side effects in `DISABLED` or `SHADOW` mode;
- legacy and native workers able to read both modes before activation.

## Websockets, Notifications, Caches, and Metrics

`src/api-serverless/src/ws/ws-message.ts` currently defines drop update/delete,
rating, reaction, typing, subscription, auth, notification, media, and
attachment messages. Drop delete and typing carry `wave_id`; other drop
messages carry the existing drop projection. New optional `competition_id` and
`competition_entry_id` fields are additive. Existing type strings, payload
fields, and `wave_id` remain unchanged.

Identity notification causes and storage are in
`src/entities/IIdentityNotification.ts`; records carry cause, related drops,
and `wave_id`. Subscription and unread caches are wave-based. Candidate,
overview, unread, following, and score caches live under the wave services.
Native events must invalidate both competition keys and the old wave/drop keys
needed by legacy projections.

Metrics are recorded in the wave metric entities and
`src/metrics/MetricsRecorder.ts`. Native telemetry adds `competition_id`,
`storage_mode`, `execution_mode`, config version, computed phase, and worker
version while preserving current wave aggregates.

## Signatures

`src/api-serverless/src/drops/drop-hasher.ts` hashes the canonical drop request
plus participation terms and excludes signature fields. The verifier in
`drop-signature-verifier.ts` supports current text-hash, raw-byte, structured,
and Safe/EIP-1271 strategies. Structured messages already carry a nonce and
payload hash, but the current signed drop contract does not establish a native
competition/config-version replay boundary.

Native entry and vote signatures therefore use a new structured domain with
action, actor, wave, competition, entry/drop, config version, nonce, issue
time, and expiry. Existing signature formats remain accepted only on supported
legacy mutations; they are not repurposed for native competition commands.

## Claims, Minting, and Special IDs

Current special configuration is read from environment/settings:

- `MAIN_STAGE_WAVE_ID` is used by the API drop mapper, settings, metrics, TDH,
  meme-card mapping, decisions, minting claims, and identities.
- `CURATION_WAVE_ID`, `ANNOUNCEMENTS_WAVE_ID`, and `QUORUM_WAVE_ID` are exposed
  by settings and consumed by specialized presentation/workflows.
- `DEPLOYER_ANNOUNCEMENTS_WAVE_IDS` drives mint and winner announcements.
- Additional configured art-curation, subscription, alert, CI, and release-note
  wave IDs are operational routing dependencies.

Phase 1 introduces explicit capability records and a legacy mapping from each
special wave ID to its immutable primary competition. Uniqueness and
authorization constraints prevent two active `MAIN_STAGE` competitions.
Claims/minting must resolve the capability-bearing entry and use stable
idempotency keys; no code may choose a competition by newest/active ordering.

## Independently Deployable Workers

| Deployable | Trigger/concurrency evidence | Native obligation |
| --- | --- | --- |
| `dbMigrationsLoop` | Manually deployed migration Lambda | Add schema before readers/writers; migrations idempotent/restartable. |
| `api` | Independent API Lambda | Permanent legacy façade plus native resources. |
| `waveDecisionExecutionLoop` | Every minute; reserved concurrency 1 | Dual-read modes, executor lease, idempotent decisions; active last. |
| `waveLeaderboardSnapshotterLoop` | Every five minutes; concurrency 1 | Competition snapshot identity and parity. |
| `waveDropMetricsRefreshLoop` | SQS plus dirty-mode schedule and DLQ | Competition dimension and dual invalidation. |
| `waveScoreRefreshLoop` | SQS/SNS plus dirty-mode schedule and DLQ | Preserve wave aggregate; understand native events. |
| `claimsBuilder` | SQS, concurrency 1, DLQ | Capability/entry identity and exactly-once claim key. |
| `claimsMediaArweaveUploader` | SQS | Stable claim/entry linkage and retry idempotency. |
| `mintAnnouncementsLoop` | Scheduled | Deduplicate announcement by competition outcome. |
| `tdhLoop`, `nftsLoop`, notification/push workers | Independent workflow services | Understand explicit capability/event IDs before native activation. |

The complete service allowlist and verification targets are in
`.github/workflows/deploy.yml`; event/source definitions are in each service's
Serverless configuration. Zero-downtime ordering is captured in the rollout
plan.

## Backend Estimate Boundary for Roadmap Phase 1

Phase 1 can now be estimated as additive competition, config-version, entry,
capability, lifecycle-event, and immutable legacy-primary mapping schema;
read-only repository/adapters; OpenAPI native reads; and contract/parity test
scaffolding. It does not require native voting/decision writes, data deletion,
or redefining the vocabulary.
