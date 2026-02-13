# 1383 - Participatory Drop Curation (Iteration 1)

## 1. Objective

Add curator-based preselection for competition waves so voters/buyers can filter submissions to curator-picked drops.

This applies to all competitive submission content, not only art.

## 2. Background

Current competitive waves rely on manual browsing of submissions. This does not scale for users who want a preselected set of strong submissions. Real-world curation patterns suggest a curator layer is useful before final voting/buying.

Iteration 1 introduces:
- Admin-managed curator groups per wave.
- Curator tagging of submissions.
- Leaderboard filtering by curator group.
- Per-user curation context on drops.

## 3. Terminology

- Admin: wave creator or any identity in wave `admin_group`.
- Submission: any drop with type `PARTICIPATORY` or `WINNER`.
- Curator: identity currently eligible through at least one curation group community group in that wave.
- Curated drop: a submission tagged by a curator.
- Curators group: config entity attached to one community group; each wave can have multiple curation groups.
- Community group: group from existing `community_groups` logic.

## 4. Scope and Rules

### 4.1 Wave Types

Curation features are only valid for waves of type:
- `RANK`
- `APPROVE`

`CHAT` waves are out of scope.

### 4.2 Submission Types

Curation tagging is only valid for drops of type:
- `PARTICIPATORY`
- `WINNER`

### 4.3 Locked Product Decisions

- Curation group name uniqueness scope: per wave (`wave_id + name`).
- Community group validity check for curation groups: group must exist and be non-private; no `visible/active` requirement.
- Leaderboard filter `curated_by_group` can be used by any caller who can access the wave endpoint.
- Add read endpoint `GET /waves/:waveId/curation-groups`.

## 5. API Contract

### 5.1 Curation Group Management

#### Create group

- Endpoint: `POST /waves/:waveId/curation-groups`
- Auth: required
- Allowed caller: Admin of the target wave
- Body:
  - `name: string` (1..50 chars)
  - `group_id: string` (community group id)
- Validation:
  - wave exists
  - wave type is `RANK` or `APPROVE`
  - caller is admin
  - `group_id` exists
  - `group_id` is not private
  - `name` is unique within wave
- Response: created curation group object

#### Update group

- Endpoint: `POST /waves/:waveId/curation-groups/:curationGroupId`
- Auth: required
- Allowed caller: Admin of the target wave
- Body:
  - `name: string` (1..50 chars)
  - `group_id: string`
- Behavior: same validations as create, overwrite target group fields
- Response: updated curation group object

#### Delete group

- Endpoint: `DELETE /waves/:waveId/curation-groups/:curationGroupId`
- Auth: required
- Allowed caller: Admin of the target wave
- Response: empty body

#### List groups

- Endpoint: `GET /waves/:waveId/curation-groups`
- Auth: optional
- Response: list of curation groups for wave

### 5.2 Curating Submissions

#### Add curation tag

- Endpoint: `POST /drops/:dropId/curations`
- Auth: required
- Body: empty
- Behavior:
  - add curator tag for acting user if not exists
  - no-op if already exists
- Preconditions:
  - drop exists
  - drop type is `PARTICIPATORY` or `WINNER`
  - drop wave type is `RANK` or `APPROVE`
  - acting user is currently eligible via at least one curation community group for this wave
- Response: empty body

#### Remove curation tag

- Endpoint: `DELETE /drops/:dropId/curations`
- Auth: required
- Body: empty
- Behavior:
  - remove curator tag for acting user if exists
  - no-op if not exists
- Preconditions:
  - same permission/eligibility checks as add
- Response: empty body

#### List drop curators

- Endpoint: `GET /drops/:dropId/curations`
- Auth: optional
- Query params:
  - `page: number` (default `1`)
  - `page_size: number` (default `50`, max `2000`)
  - `sort_direction: ASC|DESC` (default `DESC`, by curation creation time)
- Behavior:
  - returns curator profile mins for the given drop
  - caller must be able to read the drop (wave visibility rules apply)
- Response:
  - paged `ApiProfileMins` shape (`ApiProfileMinsPage`)
  - `data` contains `ApiProfileMin[]`

### 5.3 Leaderboard Filtering

- Endpoint changed: `GET /waves/:id/leaderboard`
- New optional query param: `curated_by_group`
  - type: string (curation group id)
- Behavior:
  - if omitted: existing leaderboard behavior unchanged
  - if present: only include drops that have at least one curation tag by a curator identity eligible for the selected curation group's community group

### 5.4 Drop Context Extension

`ApiDrop.context_profile_context` gets two new fields:

- `curatable: boolean`
  - true when authenticated user is currently eligible via any curation group in the drop's wave
- `curated: boolean`
  - true when authenticated user has already curated this drop

For unauthenticated users, existing null behavior for `context_profile_context` remains.

## 6. Data Model

### 6.1 `wave_curation_groups`

Columns:
- `id varchar(50)` primary key (UUID value generated in code)
- `name varchar(50)` not null
- `wave_id varchar(100)` not null
- `community_group_id varchar(100)` not null
- `created_at bigint` not null
- `updated_at bigint` not null

Indexes/constraints:
- unique index on `(wave_id, name)`
- index on `wave_id`
- index on `community_group_id`

### 6.2 `drop_curations`

Columns:
- `drop_id varchar(100)` not null
- `curator_id varchar(100)` not null
- `curator_rating bigint` not null (always `1` in iteration 1)
- `created_at bigint` not null
- `updated_at bigint` not null
- `wave_id varchar(100)` not null

Indexes/constraints:
- primary key on `(drop_id, curator_id)` for idempotency
- index on `(wave_id, drop_id)`
- index on `(wave_id, curator_id)`
- index on `curator_id`

### 6.3 Repository and Entity Requirements

- Add new table constants to `src/constants/db-tables.ts`.
- Add entities in `src/entities/` and export in `src/entities/entities.ts`.
- No foreign keys.
- Use bigint epoch milliseconds for timestamps.

## 7. Lifecycle and Cleanup Requirements

### 7.1 Wave deletion

When a wave is deleted:
- delete related `drop_curations` rows by `wave_id`
- delete related `wave_curation_groups` rows by `wave_id`

### 7.2 Drop deletion

When a drop is deleted:
- delete related `drop_curations` rows by `drop_id`

### 7.3 Identity merge

When identities are merged:
- remap `drop_curations.curator_id` from source to target
- deduplicate conflicts on `(drop_id, curator_id)` by keeping one row
- preserve deterministic timestamps (earliest `created_at`, latest `updated_at`)

### 7.4 Identity deletion

When identity/profile is deleted:
- delete `drop_curations` rows where `curator_id` is deleted identity

## 8. Authorization and Validation

### 8.1 Group CRUD authorization

Group CRUD endpoints require admin authorization in wave context.

### 8.2 Curator action authorization

Curator add/remove requires current eligibility from wave curation community groups at request time.

### 8.3 Expected error classes

- `400` for invalid input and unsupported wave/drop type
- `403` for unauthorized actions
- `404` for missing wave/drop/curation group

## 9. Implementation Work Breakdown

1. OpenAPI updates
- Add all new endpoints and schemas in `src/api-serverless/openapi.yaml`
- Extend `ApiDropContextProfileContext`
- Extend leaderboard query params

2. Model generation
- Run:
  - `cd src/api-serverless && npm run restructure-openapi`
  - `cd src/api-serverless && npm run generate`

3. Route and service wiring
- Add wave curation-group routes
- Add drop curation routes
- Add route input Joi validation
- Wire route modules in `app.ts`

4. DB and repository logic
- Implement curation group CRUD repository methods
- Implement drop curation idempotent upsert/delete
- Implement leaderboard filter query logic
- Implement drop-context enrichment queries

5. Cleanup and merge integration
- Integrate delete-by-wave and delete-by-drop hooks
- Integrate identity merge/delete hooks

## 10. Testing Plan

### 10.1 Unit tests

- Curation group validation rules
- Admin authorization checks
- Curator eligibility checks
- Idempotent add/remove tag behavior
- Drop context flags (`curatable`, `curated`)

### 10.2 Integration tests

- End-to-end curation-group CRUD in `RANK` and `APPROVE`
- Curator can tag/untag valid submissions
- Non-curator cannot tag/untag
- Leaderboard filter with `curated_by_group` returns expected subset
- Cleanup on wave/drop delete
- Merge dedupe behavior for duplicate `(drop_id, curator_id)`

### 10.3 Regression checks

- Existing leaderboard behavior unchanged when `curated_by_group` not present
- Existing drop payloads remain valid except for intentional new fields

## 11. Acceptance Criteria

- All endpoints described in Section 5 are available and documented.
- New tables and entities exist and are wired.
- `ApiDrop.context_profile_context` includes `curatable` and `curated`.
- Leaderboard supports `curated_by_group`.
- Required cleanup logic is integrated for wave/delete and identity merge/delete flows.
- Tests cover auth, filtering, idempotency, and lifecycle cleanup.

## 12. Assumptions

- Curation tags are per curator/drop and do not directly store curation group id.
- Group deletion does not retroactively delete curation tags by itself.
- `curator_rating` remains fixed at `1` for iteration 1.
