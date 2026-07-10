# Product Impact Mixpanel Runbook

Use this runbook after deploying frontend telemetry changes to answer aggregate
auth and Waves feed impact questions in Mixpanel, then compare the same window
against AWS RUM and Sentry product-impact logs.

## Scope

The product-impact report uses only aggregate, low-cardinality event properties.
Do not add raw URLs, wallet addresses, profile IDs, user IDs, request IDs,
tokens, cookies, raw error messages, or unbucketed identifiers to Mixpanel
reports or dashboards.

## Events

Auth impact events:

- `Auth Reauth Prompt Shown`
- `Auth Session Upgrade Prompt Shown`
- `Auth Validation Failed While Connected`
- `Auth Forced Logout`
- `Auth Validation Cancelled`
- `Auth Session Refresh Succeeded`
- `Auth Session Refresh Recovered`
- `Auth Session Refresh Product Impact`

Waves feed impact events:

- `Wave Feed Load Started`
- `Wave Feed Load Succeeded`
- `Wave Feed Load Cancelled`
- `Wave Feed Load Failed`

## Safe Breakdowns

Use only these breakdowns:

- Auth: `client_type`, `page_group`, `route_pattern`, `reason`,
  `auth_state_before`, `auth_state_after`, `was_connected_wallet`,
  `product_failure`, `refresh_outcome`, `endpoint_family`, `status_bucket`
- Waves: `route_family`, `endpoint_family`, `load_source`, `status_bucket`,
  `error_kind`, `product_failure`, `duration_bucket`, `drop_count_bucket`,
  `had_cached_drops`, `is_native`, `visibility_state`, `online`

## Insights Setup

Create one Mixpanel Insights report named `Product Impact - Auth and Waves`.

Set chart type to `Line`, metric to `Total Events`, and time interval to
`Hourly`. Save dashboard views for these windows:

- Last 1 hour
- Last 3 hours
- Last 24 hours

Add the auth events as separate series:

- `Auth Reauth Prompt Shown`
- `Auth Session Upgrade Prompt Shown`
- `Auth Validation Failed While Connected`
- `Auth Forced Logout`
- `Auth Validation Cancelled`
- `Auth Session Refresh Succeeded`
- `Auth Session Refresh Recovered`
- `Auth Session Refresh Product Impact`

Add the Waves events as separate series:

- `Wave Feed Load Started`
- `Wave Feed Load Succeeded`
- `Wave Feed Load Cancelled`
- `Wave Feed Load Failed`

Recommended filters:

- `endpoint_family = auth_session_refresh` for auth refresh reports
- `endpoint_family = wave_drops_feed` for Waves feed reports

Recommended breakdowns:

- Auth overview: `client_type`, then `reason`
- Auth route impact: `page_group`, then `route_pattern`
- Auth outcome: `product_failure`, then `auth_state_after`
- Waves overview: `load_source`, then `status_bucket`
- Waves route impact: `route_family`
- Waves failure quality: `error_kind`, then `product_failure`

## Ratio Formulas

In Mixpanel Insights, add Formula series for exact aggregate ratios over the
same selected window.

Waves:

- `Succeeded / Started`
- `Failed / Started`
- `Cancelled / Started`
- `Product failures / Started`

Use these series mappings:

- `Started = Wave Feed Load Started`
- `Succeeded = Wave Feed Load Succeeded`
- `Failed = Wave Feed Load Failed`
- `Cancelled = Wave Feed Load Cancelled`
- `Product failures = Wave Feed Load Failed` filtered by
  `product_failure = true`

Auth:

- `Reauth prompts / Refresh succeeded`
- `Forced logouts / Refresh succeeded`
- `Validation failures while connected / Refresh succeeded`
- `Session upgrade prompts / Refresh succeeded`
- `Refresh recovered / Refresh succeeded`
- `Cancelled validations / (Refresh succeeded + Cancelled validations)`

Use these series mappings:

- `Refresh succeeded = Auth Session Refresh Succeeded`
- `Refresh recovered = Auth Session Refresh Recovered`
- `Reauth prompts = Auth Reauth Prompt Shown`
- `Forced logouts = Auth Forced Logout`
- `Validation failures while connected = Auth Validation Failed While Connected`
- `Session upgrade prompts = Auth Session Upgrade Prompt Shown`
- `Cancelled validations = Auth Validation Cancelled`

If `Refresh succeeded` is zero in a window, use total auth validation volume
from all listed auth events as the denominator and note that refresh traffic was
not present in that window.

## Post-Deploy Checks

After deployment and real traffic:

1. Confirm all events above are present in Mixpanel Lexicon.
2. Check Last 1 hour, Last 3 hours, and Last 24 hours counts.
3. Verify `Wave Feed Load Cancelled` is nonzero during normal navigation churn
   and is not counted as `Wave Feed Load Failed`.
4. Verify `Wave Feed Load Failed` has low `product_failure = true` volume; if
   it spikes, compare by `status_bucket`, `error_kind`, and `route_family`.
5. Verify auth prompts and forced logouts are low relative to
   `Auth Session Refresh Succeeded`.
6. Compare the same UTC window in AWS RUM for route-level page errors and in
   Sentry for `wave_feed_load_failed`,
   `auth_session_refresh_product_impact`, and related product-impact logger
   entries.
