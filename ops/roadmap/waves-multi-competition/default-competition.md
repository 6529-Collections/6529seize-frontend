# Default Competition

[Master roadmap](./README.md) · [Phase 6](./phase-6-progressive-rollout.md)

## Status and Meaning

- Product policy: Approved on 2026-10-01 (D-19).
- Implementation: Implemented on development branches; delivery Phase 2
  review and CI are tracked in the linked PRs. Not merged or deployed. See [delivery evidence](./native-delivery/default-competition-delivery.md).
- Scope: Phase 6 product follow-up using Phase 2 competition context; assess
  backend selection/read support and frontend wave navigation together.

A wave entered without an explicit destination opens **Chat** and remains there
after all asynchronous competition queries resolve. The **default competition**
is the competition used when the user opens a competition tab without
explicitly choosing a competition. The familiar competition tabs,
including leaderboard, winners, outcomes and My Votes where applicable, open
that competition's corresponding view. Chat remains shared wave content.

The default is computed from the wave's competitions. It is not a stored admin
choice, the last competition visited, or the immutable legacy primary.

## Agreed Selection Policy

Apply these rules to readable competitions eligible under the timing/lifecycle
contract below:

1. Exclude unpublished drafts, including drafts that were archived without
   ever running. Draft administration remains available separately.
2. If there is exactly one eligible competition, it is the default.
3. If exactly one competition is active, it is the default.
4. If several are active, choose the one that has been running longest: the
   earliest competition start, not the oldest creation timestamp.
5. If none is active and future competitions exist, choose the one starting
   soonest. **Upcoming takes precedence over previously ended competitions.**
6. Otherwise choose the competition that ended most recently. Archived
   competitions that previously ended remain eligible for this fallback;
   archiving does not change their ending time or revive them as active.
7. If no eligible competition exists, keep the wave usable as a chat hub with
   the normal empty competition state and permitted creation entry points.

A competition whose **decisions are paused still counts as active** while it
is otherwise running. Pause/resume does not restart its age or change its
position among simultaneous active competitions. An upcoming competition does
not become active just because it has a pause configured.

Resolve equal start/end timestamps deterministically by immutable competition
ID, using the same ordering on server and client. Selection must consider all
eligible competitions, not only the first page or a collection's current filter.

## Timing and Eligibility Contract Work

Implementation must define one authoritative selection input for both legacy
and native competitions:

- Active includes a started competition still deciding after entries/voting
  close; it is not merely “currently accepts a vote.” Completed competitions
  must not remain active because of stale client time or a pause banner.
- Derive effective start/end consistently from the domain's participation,
  voting, decision and lifecycle semantics. Document normalization for nullable
  legacy dates, open-ended contests and archived completed history before
  implementation is considered complete. Do not substitute creation, update or
  archive time for a known competition start/end.
- Retained cancellation-only records are not eligible defaults. They count as
  neither active/upcoming nor completed history: `cancelled_at` is not an end
  timestamp. Keep authorized explicit reads available; any inclusion in default
  selection requires a separate product decision. This adds no cancel command.
- Read visibility controls eligibility for selection. Participation/voting
  group restrictions control actions, not whether a readable competition can be
  the default. Admin draft access must not make drafts the default.

These are implementation details to resolve against the existing domain and
cover with fixtures; they do not alter the agreed priority order above.

## Navigation and State

- Default competition views share one wave-level row with Chat and render
  directly below it, including single-competition waves and defaults in
  multi-competition waves. Only an explicitly opened non-default competition
  uses nested detail navigation. Configuration and voter views remain available
  for native defaults in the wave row.
- Wave entry without an explicit destination stays in Chat. Resolve the default
  as competition context without replacing the wave route or changing its view.
  Competition tabs use its ID consistently for timers, entry/vote actions and
  cache keys. This applies to single-competition and multi-competition waves.
- Explicit competition/entry deep links and an explicit user selection take
  precedence. Opening an older competition must keep showing that competition
  across its tabs, reload and Back/Forward.
- Keep competition discovery/switching available even when a default exists.
  Wave-level chat, about and administration retain their wave scope.
- Re-evaluate implicit default selection on relevant data/lifecycle changes
  and time boundaries. Do not silently retarget an open submission/voting form
  or overwrite explicit selection; commands keep their original competition ID.
- Handle loading, stale data, denied access, missing competition and selection
  failure locally, with chat still usable. Never display one competition's
  leaderboard beneath another competition's title or send a vote to a fallback.
- Desktop, mobile and supported app routes use the same policy. Update product
  docs and the help corpus when the behavior is implemented and shipped.

## Legacy Compatibility

`default competition` is mutable navigation context.
`legacy_primary_competition_id` is an immutable old-API mapping. A native
competition can become the UI default in an existing wave while legacy GETs
continue projecting the original primary. Native hubs still project as chat
through those GETs. Do not change their shapes, selection or authorization.

Explicit old drop links preserve their actual entry/competition context. The
default carries no execution ownership, voting privilege or Main Stage
capability; those remain attached to the designated competition.

## Implementation and Zero-Downtime Delivery

1. Inspect backend phase/date mapping, list pagination and native/legacy reads,
   then define a shared selection contract. If server support is needed, add it
   through OpenAPI and generated clients without repurposing legacy fields.
2. Implement deterministic selection with legacy/native parity fixtures and
   suitable query/index cost. Prefer one authoritative policy over independent
   frontend guesses or scanning a partially loaded list.
3. Keep ordinary wave entry in Chat and wire competition tabs to the resolved context;
   preserve explicit routing, shared chat and command identity.
4. Deploy any additive backend read support first, then merge/deploy dependent
   frontend. This selection feature needs no legacy-data cutover. Determine
   actual affected deploy units from the implementation diff.
5. Validate relevant staging journeys before production promotion. Rollback
   restores previous navigation while preserving competitions and data; it does
   not change storage ownership or the legacy primary.

## Acceptance Scenarios

| Wave state / action | Expected result |
| --- | --- |
| Ordinary wave entry, with delayed/loading/error default data | Chat content and selection persist; no automatic competition redirect. |
| Explicit competition-view link or intentional tab selection | Requested competition view remains selected after background queries. |
| No competitions, or only drafts/archived never-published drafts | Chat hub and empty competition state. |
| One readable published competition | It is default whether upcoming, running or completed. |
| One archived completed competition | It remains the historical default. |
| One active plus any upcoming/completed/archived competitions | Active wins. |
| Multiple active competitions | Earliest start wins, regardless of creation order. |
| Oldest active has decisions paused | It remains default; resume does not reset its start. |
| No active, with upcoming and completed history | Soonest upcoming wins. |
| No active/upcoming, with completed and archived completed history | Latest end wins; archive time is irrelevant. |
| Equal starts or ends; winner is beyond first list page | Stable ID tie-break; correct result across all pages. |
| Admin can see drafts; member cannot vote in selected competition | Drafts excluded; readable default identical, action permissions respected. |
| Otherwise-preferred competition is not readable by this viewer | Exclude it before selection; use the next eligible competition or empty state without revealing the hidden record. |
| Only retained cancellation records, or cancellation newer than a completed competition | No default in the first case; choose completed history in the second, never use cancellation time as end time. |
| Legacy primary plus a native competition selected by the policy | UI tabs use native default; old GETs still return legacy primary. |
| Explicit link to a non-default competition, then reload/Back/Forward | Explicit competition and view retained. |
| Implicit default changes while a form is open | No silent command retargeting or data mixing. |
| Upcoming start, competition end, completion or archive boundary | Implicit selection refreshes using authoritative timing and lifecycle. |

Use focused selector/API contract tests for the complete matrix, and real
browser tests for wave landing, tab routing, explicit links, time-boundary
refresh and desktop/mobile state isolation. Cover Rank, Approve, legacy and
native records. Record remaining domain normalization decisions and evidence
before declaring this follow-up complete.
