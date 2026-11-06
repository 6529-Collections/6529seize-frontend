# First-party telemetry collector

The collector measures page views, Core Web Vitals, product events and page
health without any outside company. It replaces Google Analytics, Mixpanel and
AWS RUM after a two-week overlap (owner decision C52). It posts to the
same-origin `/e`, which the edge routes to our backend.

## What it sends

One JSON batch per page view and one when the page hides, by
`navigator.sendBeacon("/e")` with a `fetch` keepalive fallback. The Capacitor
and desktop apps send the same JSON to the same path. Wire format v1 lives in
`services/analytics/telemetry/wire.ts`, the only module that knows the backend
schema.

| Record | Fields |
|---|---|
| `pv` page view | App Router route template (for example `/waves/[wave]`), page group, previous route template or `entry`, external referrer hostname on entry only, device class, platform, browser family, signed-in boolean, optional `fp` |
| `vitals` | LCP, INP, CLS, TTFB and FCP for the landing route, sent once when the page first hides |
| `health` | per page view: asset load failures by kind, failed and slow API requests by endpoint template, WebSocket drops and reconnects, long tasks over 200 ms, unhandled errors by kind |
| `ev` product event | a registry event name plus at most six enum or boolean properties |

Route templates come from `useParams()`: each segment that holds a dynamic
param becomes its name. A page that renders the shared 404 component is sent as
`/[other]`. A last guard replaces any remaining uppercase or identifier-shaped
segment with `[x]`.

## What it never sends

- Full URLs, query strings, page titles.
- Handles, wallet addresses, wave, drop or profile IDs.
- Message text, keystrokes, form contents.
- Sign-in tokens or other secrets.
- Raw browser traits, user agents or screen sizes.

It sets no browser storage and assigns no identifiers. Everything it holds is
in memory for the current page load.

## The `fp` hash (C52a)

The page view may carry `fp`: a short hash of time zone, primary language,
screen size rounded to 100 px, device class, browser family and major version,
and the UTC day, so the value changes every day. The server mixes it into its
daily-salted unique-visitor count and discards it. No `fp` is sent when the
cookie banner's country is in the EU or EEA, the UK, or unknown. While the
country lookup is pending, the page-view batch waits for it, up to the lookup's
5-second timeout; if the page hides first, the batch goes without `fp`.

## Product events

During the overlap, `trackAnalyticsEvent` and `trackAuthImpactEvent` also hand
each event to the collector before Mixpanel's delivery checks. Only events in
the registry in `wire.ts` are kept: the Homepage, Profile (Collected), auth,
Wave feed and Wave feature pilot events behind the four Mixpanel reports. A
property must be on that event's allowlist and must be a boolean or a short
enum token; anything else is dropped. The backend checks the exact enums.

## Flag and rollout

- `NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY="true"` turns it on. Staging
  builds set it; production builds leave it unset until the overlap starts.
- The edge `/e` behavior must exist on an environment before the flag is on
  there.
- Budget: about 4 KB brotli including the vitals observers. The Jest test
  `collectorBundleSize` fails above 5 KB.

## Testing

- `6529 run test --testPathPatterns=services/analytics/telemetry` covers the
  wire format, the privacy sweep, `fp` rules, health counters, vitals and
  batch limits.
- On staging, open DevTools > Network, filter for `/e`, and check each batch's
  payload: route templates only, no `fp` from an EU/EEA/UK connection.

## Related Pages

- [Developer Operations](README.md)
- [Product-impact Mixpanel runbook](product-impact-mixpanel-runbook.md)
- [Wave feature usage pilot](wave-feature-usage-pilot.md)
- [Cookie consent and performance analytics](../shared/feature-cookie-consent-and-performance-analytics.md)
