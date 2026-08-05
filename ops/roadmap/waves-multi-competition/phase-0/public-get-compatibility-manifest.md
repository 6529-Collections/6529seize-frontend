# Permanent External GET Compatibility Manifest

## Guarantee

Every externally reachable GET route mounted at this baseline is permanently
backwards compatible. The guarantee freezes:

- path and path/query parameter names, accepted values, defaults, validation,
  and optional/required behavior;
- deployment-gate, authentication, authorization, and private-resource masking
  behavior;
- success, empty, validation, unauthenticated, forbidden, and not-found status
  and error-envelope semantics;
- response fields, primitive/container types, formats, enum values,
  required/optional membership, and nullability;
- pagination shape and defaults, cursor/page/offset behavior, filtering,
  ordering, and tie behavior;
- deterministic legacy wave/competition projection and representative
  synthetic fixtures.

Fields and endpoints may be added where existing clients tolerate additive
data. A frozen field cannot be removed, narrowed, renamed, retargeted to a
different competition, or change null/required/type/enum meaning.

## Machine-Readable Census

The complete contract is split into two checked-in snapshots:

1. [Published OpenAPI snapshot](./baseline/public-get-openapi-snapshot.json):
   all 183 documented GET operations, their exact parameter and response
   objects, recursively reachable 357 component schemas, security schemes,
   formats, enums, required arrays, nullability, defaults, paging/filter/order
   descriptions, and error responses.
2. [Runtime route manifest](./baseline/runtime-get-route-manifest.json): all 296
   mounted GET route shapes, actual none/optional/required auth classification,
   cache middleware presence, declared response type where present, source
   evidence, and linkage to the OpenAPI operation. All 183 OpenAPI operations
   link to a runtime route; 113 runtime routes are not published in OpenAPI.

Both snapshots record the inspected backend source revision. The OpenAPI
snapshot uses stable two-space JSON; the runtime manifest keeps one complete
route record per line. Structural contract changes remain reviewable without
making the package exceed automated-review limits.

The runtime-only set includes public aliases, legacy data reads, authenticated
operational reads, health/raw-contract endpoints, and route-only APIs. They
remain covered even if they are documented later. The Swagger UI rendering at
`/docs` is interactive documentation rather than a stable API response;
machine-readable `/openapi.yaml` and `/openapi.json` are explicitly included.

## Authentication Precedence

The OpenAPI top-level bearer declaration does not accurately mean that every
route requires JWT. Permanent tests use this order:

1. For `/api/*`, if `ACTIVATE_API_PASSWORD=true`, the existing
   `x-6529-auth` deployment gate applies. Missing/invalid credentials keep the
   current HTTP 401 JSON behavior.
2. Route middleware then applies: `none`, optional JWT via
   `maybeAuthenticatedUser()`, or required JWT/explicit operational bearer as
   recorded in the runtime manifest.
3. Visibility and action-proxy checks retain current behavior. Optional auth
   may personalize responses. Private waves and drops continue using current
   not-found masking where implemented; they must not begin leaking existence
   through a new forbidden response.
4. The unauthenticated `/api/public/waves` aliases remain unauthenticated and
   return only public resources, masking private resources as not found.

The global gate cannot be silently broadened beyond `/api/*`, and route auth
cannot become stricter or looser for an existing GET without a new endpoint.
CI must exercise the gate both disabled and enabled; enabled-mode tests cover
missing, invalid, and valid `x-6529-auth` before each route's none/optional/
required auth matrix.

## Wave-Competition-Sensitive GET Families

The OpenAPI snapshot is authoritative for every individual parameter, status,
and schema. This table records how each affected family projects after native
competitions exist.

| Existing family | Baseline behavior source | Permanent projection |
| --- | --- | --- |
| `/waves`, `/waves/{id}`, `/waves-overview*`, `/public/waves*`, `/v2/waves`, `/v2/official-waves`, profile-wave and OG wave reads | Wave routes, overview/public routes, generated routes, OpenAPI | Existing competition wave: immutable primary. Native hub: contract-valid `CHAT`; native competitions hidden. Filters, score/order, visibility, personalization, paging unchanged. |
| `/waves/{id}/drops`, `/waves/{waveId}/search`, `/v2/waves/{id}/drops`, `/v2/waves/{waveId}/search`, `/drops`, `/light-drops`, `/drop-ids`, `/v2/drops*` | Wave/drop routes and v2 handlers | Wave chat/drop content remains available. Competition-derived drop type, voting, and winner fields are relative only to immutable primary; native-hub competitions do not alter legacy fields. |
| `/v2/waves/{id}/competition-drops` | Generated v2 route | Despite its current name, it is a legacy single-competition view and binds to immutable primary. Native competition reads use new resources. |
| `/waves/{id}/leaderboard`, `/v2/waves/{id}/leaderboard` | Wave leaderboard routes | Original primary leaderboard only, with existing filters, totals, ordering, ties, paging, and viewer vote fields. Native hub returns the same contract-valid non-competition/empty behavior as chat. |
| `/waves/{id}/decisions`, `/v2/waves/{id}/decisions` | Wave decisions routes | Original primary decisions only; decision times, winner context, filters, ordering, and paging unchanged. Native hub exposes no native decisions. |
| `/waves/{waveId}/outcomes*` | Wave outcome routes | Original primary outcomes/distributions by legacy index only. Native hub returns current chat/missing-competition semantics, never a selected native outcome. |
| `/waves/{id}/voters`, drop vote/voter/log/download reads, quick-vote GET | Wave/drop voting routes | Original primary vote and credit meaning only. Cross-competition votes never appear or reduce legacy viewer credits. |
| `/waves/{id}/curations*`, polls, logs, REP, metadata, subwaves, mentions | Current wave/generated routes | Remain wave-scoped unless a field is currently competition-derived; any such field uses immutable primary. Competitions never appear as subwaves. |
| `/notifications*`, wave subscription, websocket-backed refetches | Notification routes | Existing cause, wave/drop fields, paging, auth, and unread behavior remain. Additive competition/entry identity is optional. |
| `/meme-cards/{id}/drop`, minting-claims GETs, Main Stage-derived identity/drop fields | Mapping/claim routes | Resolve the explicitly capability-bearing entry; for baseline special waves this is the immutable primary. Existing response/status behavior remains. |

## Projection Algorithm

For every existing wave-scoped GET:

```text
if wave.legacy_primary_competition_id exists:
    project exactly that competition through the frozen legacy mapper
else:
    project the wave as CHAT using the frozen contract-valid chat defaults
```

The algorithm must not inspect active status, dates, title, sort order,
featured state, capability, or number of native competitions to choose a
projection. The primary ID is immutable after assignment. Existing chat waves
have no primary unless a separately migrated baseline competition is proven;
new native hubs never receive one.

For legacy drop reads, `drop_type`, vote fields, winning context, rank, and
entry/submission meaning are projected relative to the primary. A drop entered
only in a native competition remains an ordinary chat drop to legacy GET
clients. Its stable content, replies, reactions, and mentions remain visible
according to current wave/drop rules.

## Parameter, Pagination, Filtering, and Ordering Rules

- The exact rules for documented operations are embedded in each OpenAPI path
  item and referenced schema, including numeric bounds, default page/page-size,
  cursor/offset names, sort enums, and required filters.
- The runtime manifest preserves aliases and runtime-only route shapes. Their
  handler validation and declared response types are baseline evidence; any
  future edit to one requires a golden request/response contract fixture before
  merge, even if unrelated to competitions.
- Empty pages remain successful empty pages where current contracts specify
  only 200. A new competition model cannot turn them into 404 or add a count.
- Existing sort defaults and stable/tie behavior are copied from current
  handlers and database queries into golden fixtures. Native primary adapters
  must compare ordered IDs and ranking values, not merely set equality.
- Native resources use cursor pagination and explicit sorting; they do not
  alter existing page/offset/cursor conventions.

## Status and Error Semantics

The OpenAPI response maps are frozen per operation. Current handlers also use
the common API exception envelope for validation (400), authentication (401),
authorization (403), and missing/masked resources (404), but tests must assert
the operation's recorded set rather than assuming all four exist everywhere.
Error code/status/message field types and null/absence behavior are part of the
golden fixture. Compatibility adapters must run authorization before returning
competition-derived data and preserve not-found masking.

## Representative Contract Fixtures

The [synthetic fixture matrix](./baseline/representative-fixtures.json) defines
CHAT, RANK, APPROVE, paused, completed, Main Stage, large-leaderboard,
unusual-credit, native zero/one/many, parallel, and error/pagination cases.
Fixture values are fictional and contain no production records. It declares
the expected legacy projection and native visibility for each case.

Permanent CI should combine:

1. an OpenAPI structural diff against the frozen path/schema snapshot;
2. a router census diff against the runtime manifest (removal or auth change
   fails; additions are reviewed and appended);
3. golden integration tests over the fixture matrix for success, empty,
   validation, authentication, authorization/masking, and not-found responses;
4. ordered parity tests comparing legacy storage and native primary adapters;
5. old generated-client smoke tests that deserialize all three wave types and
   ignore additive fields;
6. static consistency tests that reconcile the documented operation/schema/
   route counts and inventory table names with the machine manifests and
   `src/constants/db-tables.ts`.

## Mutation Compatibility Policy

The permanent guarantee applies to GET only. Existing wave-scoped mutations
remain supported for legacy primary competitions until a separately approved
deprecation policy says otherwise. They are never redirected to an arbitrary
native competition. Old clients posting competition-shaped mutations to a
native hub receive a current-contract validation/authorization error rather
than writing ambiguous state. New competition writes are commands with an
explicit competition ID, config version, idempotency key, and signature domain.

Removing a legacy mutation requires measured usage, published notice where
applicable, a client migration path, and an independent decision; it cannot
weaken any GET guarantee.
