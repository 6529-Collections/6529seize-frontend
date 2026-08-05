# Native API and Event Proposal

## API Direction

Use a new `/v3` resource namespace for native wave/competition semantics.
Existing unversioned and v2 GETs remain permanent compatibility façades. A new
version makes zero/one/many competition behavior explicit and prevents current
single-competition operation names from acquiring ambiguous meanings.

Public responses expose domain lifecycle and stable IDs, not storage-table or
worker implementation. Authorized operational diagnostics may expose
`storage_mode`, `execution_mode`, parity, and executor state through protected
deployment/operations APIs.

Competitions are resources owned by a wave. They are not waves, subwaves, or
chat destinations.

## Resource Shapes

### `WaveV3`

```yaml
required: [id, name, picture, created_at, capabilities, permissions]
properties:
  id: { type: string }
  name: { type: string }
  picture: { type: [string, "null"] }
  created_at: { type: integer, format: int64 }
  capabilities:
    type: object
    required: [chat, competitions]
    properties:
      chat: { type: boolean }
      competitions: { type: boolean }
  permissions:
    type: object
    required: [view, chat, administer]
    properties:
      view: { type: boolean }
      chat: { type: boolean }
      administer: { type: boolean }
```

### `Competition`

```yaml
required:
  - id
  - wave_id
  - type
  - title
  - lifecycle
  - computed_phase
  - config_version
  - participation
  - voting
  - decisions
  - permissions
  - created_at
  - updated_at
properties:
  id: { type: string }
  wave_id: { type: string }
  type: { type: string, enum: [RANK, APPROVE] }
  title: { type: string }
  description: { type: [string, "null"] }
  lifecycle:
    type: string
    enum: [DRAFT, PUBLISHED, ENDED, CANCELLED, ARCHIVED]
  computed_phase:
    type: string
    enum: [DRAFT, UPCOMING, PARTICIPATION_OPEN, VOTING_OPEN, DECIDING, COMPLETED, CANCELLED, ARCHIVED]
  config_version: { type: integer, minimum: 1 }
  participation: { $ref: "#/components/schemas/CompetitionParticipationConfig" }
  voting: { $ref: "#/components/schemas/CompetitionVotingConfig" }
  decisions: { $ref: "#/components/schemas/CompetitionDecisionConfig" }
  capabilities:
    type: array
    items: { type: string, enum: [MAIN_STAGE] }
  permissions: { $ref: "#/components/schemas/CompetitionPermissions" }
  created_at: { type: integer, format: int64 }
  updated_at: { type: integer, format: int64 }
  published_at: { type: [integer, "null"], format: int64 }
  ended_at: { type: [integer, "null"], format: int64 }
  cancelled_at: { type: [integer, "null"], format: int64 }
```

Configuration schemas carry explicit participation/voting scopes, credit
policy, periods, requirements, signature policy, terms, thresholds, winner
limits, outcome definitions, and decision strategy. Nullability is declared;
missing and null are not interchangeable.

### `CompetitionEntry`

```yaml
required:
  - id
  - wave_id
  - competition_id
  - drop_id
  - submitter
  - status
  - config_version
  - submitted_at
properties:
  id: { type: string }
  wave_id: { type: string }
  competition_id: { type: string }
  drop_id: { type: string }
  submitter: { $ref: "#/components/schemas/ApiProfileMin" }
  status: { type: string, enum: [ACTIVE, WITHDRAWN, DISQUALIFIED, WINNER] }
  config_version: { type: integer, minimum: 1 }
  submitted_at: { type: integer, format: int64 }
  rank: { type: [integer, "null"], format: int64 }
  won_at: { type: [integer, "null"], format: int64 }
  decision_id: { type: [string, "null"] }
```

Entry reads embed or link the unchanged current drop response. Winning fields
are entry-relative. If the same drop has more than one entry, each entry
returns its own rank/winner context.

## Native Reads

| Method and path | Purpose | Required filters/order | Success/error |
| --- | --- | --- | --- |
| `GET /v3/waves/{wave_id}` | Read hub-only resource | — | 200; masked 404 |
| `GET /v3/waves/{wave_id}/competitions` | List zero/one/many competitions | `status[]`, `phase[]`, `sort=created_at|starts_at|updated_at`, `direction`, cursor, limit | 200 page; 400 cursor/filter; masked 404 |
| `GET /v3/waves/{wave_id}/competitions/{competition_id}` | Read one competition | IDs must agree | 200; masked 404 |
| `GET .../{competition_id}/versions` | Audited configuration versions | newest-first cursor | 200 page; admin-only fields omitted for non-admin |
| `GET .../{competition_id}/entries` | Entries with stable context | `status[]`, `submitter`, `sort=submitted_at|rating|rank`, cursor, limit | 200 page; 400; masked 404 |
| `GET .../{competition_id}/entries/{entry_id}` | One entry/drop context | all parent IDs checked | 200; masked 404 |
| `GET .../{competition_id}/leaderboard` | Ordered entry leaderboard | explicit sort/direction plus cursor/limit; current tie rule declared | 200 page; 400; masked 404 |
| `GET .../{competition_id}/voters` | Competition voter summary | optional entry, sort, cursor, limit | 200 page; 400; masked 404 |
| `GET .../{competition_id}/entries/{entry_id}/votes` | Entry voters/vote log view | sort/cursor/limit | 200 page; 400; masked 404 |
| `GET .../{competition_id}/decisions` | Decisions and winners | time sort/direction, cursor/limit | 200 page; masked 404 |
| `GET .../{competition_id}/winners` | Winner entries | decision/status filters, cursor/limit | 200 page; masked 404 |
| `GET .../{competition_id}/outcomes` | Outcomes | stable outcome ID and legacy index when applicable | 200 page; masked 404 |
| `GET .../{competition_id}/outcomes/{outcome_id}/distribution` | Distribution items | cursor/limit/direction | 200 page; masked 404 |
| `GET .../{competition_id}/pauses` | Pause history | chronological cursor/limit | 200 page; masked 404 |

Every collection returns:

```yaml
required: [data, next_cursor, has_more]
properties:
  data: { type: array }
  next_cursor: { type: [string, "null"] }
  has_more: { type: boolean }
```

Cursors are opaque, signed or server-validated, and bound to resource, filters,
sort, and direction. Default and maximum limits are specified per OpenAPI
operation. Stable final tie breakers use immutable IDs or existing legacy
serial rules; no page may duplicate or omit a row under a stable snapshot.

## Commands

All commands require JWT, current authorization, `Idempotency-Key`, and the
expected `config_version` where configuration affects validity. Command
responses use 200/201 for completed writes, 202 only for a genuinely
asynchronous operation, 400 validation, 401 auth, 403 authorization, masked
404 parent/child mismatch, 409 lifecycle/config/idempotency conflict, and 422
valid syntax that violates domain eligibility.

| Method and path | Command |
| --- | --- |
| `POST /v3/waves/{wave_id}/competitions` | Create draft; wave-admin only; returns 201. |
| `PATCH /v3/waves/{wave_id}/competitions/{competition_id}` | Update allowed draft/presentation fields with `If-Match` config version. |
| `POST .../{competition_id}/actions/publish` | Validate and publish one immutable config version. |
| `POST .../{competition_id}/actions/end` | End and disable further entry/vote execution without inventing results. |
| `POST .../{competition_id}/actions/cancel` | Cancel, preserve history, disable execution; compensation is a separate future command. |
| `POST .../{competition_id}/actions/archive` | Hide from default active listings while retaining direct reads/audit. |
| `POST .../{competition_id}/actions/clone` | Create a new draft ID from terminal config; never reopen. |
| `POST .../{competition_id}/pauses` | Start a pause with reason/idempotency key. |
| `POST .../{competition_id}/pauses/{pause_id}/actions/resume` | End a current pause exactly once. |
| `POST .../{competition_id}/entries` | Atomically create a new ordinary drop plus entry, or associate an eligible existing `drop_id`; first UI uses new drop and one active-entry restriction. |
| `POST .../{competition_id}/entries/{entry_id}/actions/withdraw` | Submitter withdrawal under lifecycle policy. |
| `POST .../{competition_id}/entries/{entry_id}/actions/disqualify` | Audited admin moderation action. |
| `PUT .../{competition_id}/entries/{entry_id}/votes/me` | Create/replace viewer vote with signed config version; idempotent by actor/entry. |
| `DELETE .../{competition_id}/entries/{entry_id}/votes/me` | Remove viewer vote when allowed; signed/idempotent policy. |

Draft creation and hub creation are separate operations. A client may create a
hub, receive its stable ID, and later create any number of competition drafts.
Failure of competition creation never rolls back or deletes the hub.

## Signing Envelope

Native entry, vote, and sensitive admin commands sign a canonical structured
payload:

```yaml
domain: "6529-competition-v1"
action: "ENTRY_CREATE | VOTE_SET | ..."
actor_profile_id: string
actor_wallet: string
wave_id: string
competition_id: string
competition_entry_id: string | null
drop_id: string | null
config_version: integer
payload_hash: string
nonce: string
issued_at: integer
expires_at: integer
```

The server atomically consumes nonce within the actor/action/competition
domain and rejects expired, reused, cross-wave, cross-competition, wrong-entry,
or old-config signatures. Legacy formats are never silently upgraded into this
domain.

## Events

Every native event has `event_id`, `event_version`, `occurred_at`, `wave_id`,
`competition_id`, and optional `competition_entry_id`/`drop_id`. Consumers
dedupe by event ID and tolerate additive fields.

| Event | Required event-specific data |
| --- | --- |
| `COMPETITION_CREATED` | lifecycle `DRAFT`, config version |
| `COMPETITION_UPDATED` | previous/new version, changed-field names |
| `COMPETITION_PUBLISHED` | published version and effective dates |
| `COMPETITION_PHASE_CHANGED` | previous/new computed phase |
| `COMPETITION_PAUSED` / `RESUMED` | pause ID and effective time |
| `COMPETITION_CANCELLED` / `ENDED` / `ARCHIVED` | terminal reason/time |
| `COMPETITION_ENTRY_CREATED` | entry/drop/submitter/config version |
| `COMPETITION_ENTRY_STATUS_CHANGED` | previous/new status, reason |
| `COMPETITION_VOTE_CHANGED` | entry, voter identity token, new aggregate/version; no private signature |
| `COMPETITION_LEADERBOARD_UPDATED` | snapshot/version marker |
| `COMPETITION_DECISION_COMPLETED` | decision ID/time and winner entry IDs |
| `COMPETITION_OUTCOME_CREATED` | decision/outcome ID |
| `COMPETITION_CLAIM_CREATED` / `MINT_RECORDED` | capability, entry/drop, idempotency key reference |

Existing websocket event types and payloads retain all current fields. When a
current drop/vote event concerns a native entry, optional `competition_id` and
`competition_entry_id` are added; `wave_id` remains mandatory. New competition
events are additive types old clients may ignore.

## Legacy Safety

- No existing GET path is removed or redirected.
- Existing competition waves use only immutable primary in old reads.
- Native hubs use chat defaults in old reads, regardless of native count.
- Old mutations never infer a native competition.
- New clients may combine hub chat reads with v3 competition resources.
- Internal storage/execution mode never changes a public resource ID or
  contract.

## OpenAPI Review Checklist

Before roadmap Phase 1 merge, each operation must declare security overrides,
all parameter bounds/defaults, every response and error schema, complete
required/null behavior, stable ordering/ties, cursor invalidation, child-parent
masking, lifecycle conflicts, and examples derived from the Phase 0 fixture
matrix. Generated backend/frontend code and OpenAPI drift checks are required.
