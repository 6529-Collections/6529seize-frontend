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

## Location in the Site

- Troubleshooting for profile shell routes under `/{user}` and their supported
  tab subroutes.
- Related profile header, tab-bar, and shared-link navigation states.

## Entry Points

- Open this page after a profile URL, tab redirect, or tab content state looks
  wrong.
- Start from the failing profile route if possible so the symptom can be
  matched against the sections below.

## User Journey

1. Reopen the failing profile route.
2. Confirm the target profile resolves and the route is supported.
3. Check whether the tab should be visible for the current viewer, device, and
   Waves context.
4. Match the observed symptom to the route, tab-visibility, or content section
   below.
5. Apply the listed recovery step, then retry the route once.

## Quick Checks

1. Open `/{user}` first, then retry the tab route.
2. Confirm `{user}` resolves to a real profile (handle or wallet).
3. Confirm tab visibility rules for your current context.
4. Refresh once for transient request failures.

## Common Scenarios

- A hidden tab opens briefly, then falls back to another visible profile tab.
- A direct `/{user}/brain` link shows a blank shell while Brain availability is
  still resolving.
- Legacy or removed routes such as `/{user}/identity` or `/{user}/stats`
  behave differently from supported tab routes.

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
    checking whether the profile belongs to you. On direct `/{user}/brain`
    links, the fallback also waits for client hydration, wallet reconnection,
    or connected-profile restoration to decide whether Waves is available.
  - Action: switch context or use a visible tab URL.

- Symptom: followers stat does not open `/{user}/followers`.
  - Meaning: expected behavior; followers opens an in-page modal, not a tab
    route.
  - Action: use the modal.

## Content and Data Issues

- Symptom: direct `/{user}/brain` deep link shows a blank content shell before
  content appears or the route changes.
  - Meaning: Brain access is still resolving during client hydration, wallet
    reconnection, or connected-profile restoration.
  - Action: wait for loading to settle. If the route redirects to `/{user}`,
    Brain is unavailable in the current context. If it stays on
    `/{user}/brain`, the feed or its empty state should load next.

- Symptom: `/{user}/brain` shows `No Drops to show`.
  - Meaning: empty feed or failed drop fetch.
  - Action: refresh; if the profile has no public drops, the empty state can be
    expected.

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

## Edge Cases

- Hidden-tab fallback keeps the current query string.
- Clicking a profile tab keeps only `address` and drops other query keys.
- On `/{user}/collected`, `activity`, `wallet-activity`,
  `wallet-activity-page`, and `distribution-page` can be used inside `Details`;
  switching profile tabs drops those keys because tab navigation keeps only
  `address`.
- Canonical-handle redirects can normalize repeated query keys to one
  comma-separated value.
- On mobile Identity, `Rep` opens first; switch to `NIC` for NIC actions and
  statements.
- In Subscriptions, first upcoming-drop controls can lock on minting day.

## Failure and Recovery

- Refresh once after transient fetch or redirect failures.
- Retry from `/{user}` if a deeper tab route looks suspect, then navigate back
  to the target tab.
- Replace removed or unsupported saved links with the documented supported
  routes.
- Re-test tab visibility under the expected account, device, and country
  context when behavior differs across sessions.

## Limitations / Notes

- Some blank or empty states are expected when the selected profile has no
  public data for that section.
- Hidden-tab fallback is context-dependent and can wait for client-side access
  checks before redirecting.
- This page covers profile routing and tab issues only; deeper feature-specific
  problems are documented on the related pages below.

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
