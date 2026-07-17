# Frontend Telemetry Ownership and Lifecycle

`registry.json` is the operational inventory for frontend automatic providers
and custom signals. It records the question, owner, producer, destinations,
sampling, privacy contract, known external usage, lifecycle, replacement, and
review date. Update it in the same change as any custom signal.

## Provider ownership

- AWS RUM owns real-user browser performance: Core Web Vitals,
  browser/device cohorts, page views, and browser HTTP health.
- Sentry owns errors, client/server traces, slow code paths, and exact
  code-level spans and logs.
- Mixpanel owns user actions, feature adoption, and product funnels. Exact
  technical timings do not go to Mixpanel.
- Google tag page analytics is a preserved legacy overlap. Its external usage
  has not been verified, so this change does not remove it.

Two providers may observe the same flow only when they answer different
questions. The registry must say which question each destination owns. A
temporary or compatibility destination needs a replacement/removal plan and a
dated review.

## Current policy

The repo Mixpanel runbook names the auth and Wave feed events, but live
dashboard use could not be verified. Mixpanel therefore keeps every existing
Wave event unsampled for consented production sessions. Routine Sentry Wave
logs use a narrower policy: starts and normal cancellations are omitted, as are
cache, background-sync, and native-backfill successes. Only `server_initial`
and `initial_visible` successes are eligible for a 5% per-event sample, with
the sample rate and exact `duration_ms` attached. Warnings, failures, and
product-unavailable outcomes remain always eligible for Sentry delivery.
Cancellation remains a non-failure classification.

Using the observed release volume of about 55,700 routine Wave start, success,
and cancellation records versus 31 warnings, even the conservative assumption
that every routine record is sample-eligible bounds routine Sentry volume at
2,785 records while retaining all warnings: about a 95% reduction. The actual
reduction should be larger because most routine categories are omitted rather
than sampled.

Page-view provider overlap is intentional for now: manually normalized AWS RUM
page views answer browser performance questions, Mixpanel answers product
adoption questions, and the Google/Mixpanel product overlap remains unverified.
Mixpanel's `path` property now carries the normalized `route_pattern` value
instead of a raw pathname.
Known Waves/profile aliases retain their existing colon-parameter contracts;
fallback routes use the existing App Router-style bracket families. Fallback
`logical_page` values are derived from the same safe family. This preserves the
property names while removing handles and route identifiers; dashboards
grouping by literal paths or raw fallback logical pages may need migration.

AWS RUM page views are recorded manually by the provider because the pinned
SDK's automatic page-view plugin uses raw browser paths. A first-loaded privacy
plugin establishes the normalized initial page before the SDK's performance,
error, and HTTP plugins start; client navigation remains manually normalized.
Query strings, hashes, profile/wallet values, UUIDs, and dynamic route
parameters are excluded. Root profile handles collapse to `/[user]`, profile
CMS paths such as `/[user]/rep` collapse to `/[user]/[...cmsPath]`, and known
static roots remain literal. Unknown subroutes collapse to a bounded top-level
family, and consecutive equal families are deduplicated.

The same first-loaded AWS RUM boundary replaces exact CloudFront
`author_<uuid>` path segments with `author_id` in HTTP/resource telemetry and
redacts only the known WalletConnect stale-session-topic hash shape in JS error
messages and stacks. It does not change product requests, response status,
error classification, or external AWS configuration.

AWS RUM HTTP telemetry uses the SDK's official fetch and XHR plugins behind a
narrow record filter. It drops only HTTP failures whose error type is
`AbortError` or whose message is exactly `signal is aborted without reason` or
`Fetch is aborted`. Successful responses, non-2xx responses, timeouts, generic
network failures, near-match messages, and non-HTTP telemetry remain visible.
The filter runs before the privacy boundary, so every retained HTTP event still
receives the existing URL sanitization.

The AWS RUM compatibility event `drop_popup_ready` and the legacy AWS RUM-owned
events `ab_card_impression`, `ab_card_link_out`, and `ab_card_live_open` keep
their stable event names. The Art Blocks signals answer product questions, but
Mixpanel does not receive them today; moving them to Mixpanel is only an
intended replacement after usage and volume are verified.
Their attribute contracts changed to remove raw drop/wave/token/contract
identifiers and full paths. `ab_card_live_open` now uses a duration bucket.
External dashboards and alerts were not available for verification, so these
attribute changes carry migration risk. The registry gives them an August
sunset review rather than claiming compatibility is verified.

## Performance measurement semantics

The server route-data spans use the server-specific
`function.nextjs.server_data` operation and are inactive child spans with
`onlyIfParent: true`.
They measure only the duration of the wrapped route-data task and inherit the
existing sampled Sentry request trace and release. They do not make the span
active, so this change does not force nested automatic fetch spans to become
children. Task failures mark the span with Sentry's error status without
attaching the error or its message, then preserve the original route error.
Attributes are fixed route families, fixed data-path names, a bounded request
count where it can be proven, and anonymous/authenticated server cohort where
known. The initial Wave feed span omits request count because multipart drops
can add nested part requests.

`route_first_useful_content` is a cold-launch milestone. Its clock starts in
`instrumentation-client.ts`; it does not measure later client-side navigation.

- On `/waves` and `/waves/[wave]`, it is the first non-loading visible Waves
  content or terminal access gate. Existing metadata/message/drop milestones
  remain available for Wave detail diagnosis.
- On `/notifications`, it is the first settled user-visible state: a list,
  empty state, error state, proxy-disabled state, or signed-out/profile gate.
  Profile and Notifications loaders do not count.

The launch log's normalized `route_family` separates Waves index, Wave detail,
and Notifications cohorts. Adding `/notifications` to focused launch sampling
is intentional: one cold-launch log is eligible for 100% capture on
non-desktop Notifications launches, while desktop normal launches remain at
5%. Slow, timeout, and error launches remain always-captured. No new loop or
per-item log was added.

## Add, change, or retire a signal

1. Start with the monitoring or product question and choose its owning system.
2. Reuse an existing helper; do not add another generic telemetry facade.
3. Register the stable name and bounded attributes before adding the producer.
4. Use route/endpoint families, buckets, booleans, small enums, and anonymous
   cohorts. Never send secrets, wallet addresses, handles, content, raw IDs,
   tokens, cookies, query strings, or uncontrolled-cardinality values.
5. Keep telemetry failure non-blocking and document sampling/volume.
6. For removal or attribute-contract changes, verify dashboards/alerts. If
   verification is unavailable, retain a compatibility path or record a dated
   migration/sunset plan.

## Ranked follow-up audit debt

1. Verify live Mixpanel, AWS RUM, Google, and Sentry dashboard/alert usage, then
   retire compatibility destinations that have no owner.
2. Migrate legacy push-notification diagnostic extras away from raw profile and
   error values. Drop-reaction telemetry was migrated to bounded route and
   endpoint families, booleans, counts, enums, status/error categories, and
   duration buckets on 2026-07-17.
3. Review temporary route-data spans after enough production traffic exists;
   keep only measurements tied to a continuing performance decision.
