# Profile Routes and Tabs Troubleshooting

## Overview

Use this page when:

- a profile URL does not load
- a tab disappears or auto-redirects
- tab content looks blank or partial

Scope:

- profile routes: `/{user}`, `/{user}/brain`, `/{user}/collected`,
  `/{user}/xtdh`, `/{user}/subscriptions`, `/{user}/proxy`
- legacy aliases: `/{user}/identity`, `/{user}/waves`, `/{user}/groups`,
  `/{user}/followers`
- unsupported route: `/{user}/rep`

## Quick Checks

1. Open `/{user}` first, then retry the tab route.
2. Confirm `{user}` resolves to a real profile (handle or wallet).
3. Confirm tab visibility rules for your current context.
4. Refresh once for transient request failures.

## Route Issues

- Symptom: `USER OR PAGE` is shown.
  - Meaning: unresolved profile, unsupported route (`/{user}/rep`), or unknown
    `/{user}/<subroute>`.
  - Action: correct the URL and use a supported route.
  - Shared behavior: [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)

- Symptom: `/{user}.html` (or `.htm`, `.php`, `.asp`, `.aspx`, `.jsp`) shows
  `USER OR PAGE`.
  - Meaning: profile routes treat file-extension probe suffixes as invalid user
    slugs.
  - Action: remove the suffix and open a valid handle or wallet route (for
    example `/{user}`).

- Symptom: URL redirects to another handle.
  - Meaning: canonical-handle normalization.
  - Action: save the canonical URL.

- Symptom: `/{user}/stats` shows `USER OR PAGE`.
  - Meaning: the standalone `Stats` route was removed.
  - Action: open `/{user}/collected` and use `Details` for profile stats behavior.

- Symptom: legacy route redirects look inconsistent.
  - Meaning:
    - `/{user}/identity` redirects to `/{user}` and keeps query params.
    - `/{user}/waves`, `/{user}/groups`, `/{user}/followers` redirect to
      `/{user}` and drop query params.
  - Action: replace old links with `/{user}` or a supported tab route.
  - Details: [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)

## Tab Visibility and Redirect Issues

- Symptom: tab is missing on one device/session but visible on another.
  - Meaning:
    - `Brain` needs Waves enabled.
    - `Subscriptions` is hidden on iOS when consent country is not `US`.
    - `Proxy` is visible only on your own profile.
  - Action: retest with expected account, device, and country context.

- Symptom: tab URL opens, then moves to another tab.
  - Meaning: current tab is hidden in current context; app falls back to first
    visible tab. On `/{user}/proxy`, the fallback waits until the app finishes
    checking whether the profile belongs to you.
  - Action: switch context or use a visible tab URL.

- Symptom: followers stat does not open `/{user}/followers`.
  - Meaning: expected behavior; followers opens an in-page modal, not a tab
    route.
  - Action: use the modal.

## Content and Data Issues

- Symptom: `/{user}/brain` is blank or shows `No Drops to show`.
  - Meaning: Waves-disabled context, empty feed, or failed drop fetch.
  - Action: refresh; if Waves is unavailable, use `/{user}`.

- Symptom: the Brain `Activity` card shows `Unable to load activity.` or
  `No activity in last 12 months.`
  - Meaning: the profile activity request failed, or the resolved identity has
    no public posts in the last 12 months.
  - Action: refresh once; if the empty state is expected, use the feed and wave
    sidebar for broader Brain context.

- Symptom: Collected `Details` shows `-`, `No transactions`,
  `No distributions found`, or `No TDH history found`.
  - Meaning: empty data for selected scope/filter, or failed request.
  - Action: adjust `address`/details filters and refresh.

- Symptom: subscriptions controls are disabled.
  - Meaning: read-only context (not owner mode).
  - Action: open your own profile without active proxy context.

- Symptom: `/{user}/subscriptions` looks blank.
  - Meaning: active proxy session suppresses subscriptions content.
  - Action: exit proxy context and reopen the route.

- Symptom: top-up fails immediately.
  - Meaning: no valid option selected, or no active wallet connection.
  - Action: choose a valid top-up option, connect wallet, retry.

- Symptom: header data looks incomplete.
  - Meaning:
    - followers can fall back to `0` when count fetch fails
    - `Profile enabled: ...` can be omitted when profile-created log is missing
    - about text can be missing when BIO statement is unavailable
  - Action: refresh and retry.

## Query and Mobile Edge Cases

- Hidden-tab fallback keeps the current query string.
- Clicking a profile tab keeps only `address` and drops other query keys.
- On `/{user}/collected`, `activity`, `wallet-activity`, and `page` can be used
  inside `Details`; switching profile tabs drops those keys because tab
  navigation keeps only `address`.
- Canonical-handle redirects can normalize repeated query keys to one
  comma-separated value.
- On mobile Identity, `Rep` opens first; switch to `NIC` for NIC actions and
  statements.
- In Subscriptions, first upcoming-drop controls can lock on minting day.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Troubleshooting Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Brain Tab](../tabs/feature-brain-tab.md)
- [Profile Brain Activity Heatmap](../tabs/feature-brain-activity-heatmap.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../tabs/feature-collected-tab.md)
- [Profile Subscriptions Tab](../tabs/feature-subscriptions-tab.md)
- [Profile Proxy Tab](../tabs/feature-proxy-tab.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
