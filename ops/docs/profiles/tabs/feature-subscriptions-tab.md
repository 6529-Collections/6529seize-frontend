# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab at `/{user}/subscriptions` shows meme subscription
balance, settings, top-up options, upcoming drops, and subscription history.

This page covers tab content only. Tab visibility and hidden-tab URL fallback
are documented in
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/subscriptions`
- Sections: `Subscribe`, `Top Up` (owner mode only), `Upcoming Drops`,
  `Subscription History`

## Entry Points

- Open `/{user}/subscriptions` directly.
- Open a profile and choose the `Subscriptions` tab.
- Use `Learn More` in the `Subscribe` section to open
  `/about/subscriptions`.

## Common Scenarios

- Owner mode:
  - connected profile matches the viewed profile
  - no active proxy session
  - settings and upcoming-drop actions are enabled
  - `Top Up` is shown
- Read-only mode:
  - any non-owner context (for example viewing another profile)
  - settings and upcoming-drop controls stay visible but disabled
  - `Top Up` is hidden
- Active proxy session:
  - subscriptions content is not rendered

## User Journey

1. Open `/{user}/subscriptions`.
2. Review `Subscribe`:
   - `Current Balance` (ETH and card estimate)
   - `Airdrop Address`
   - `Mode` (`Manual` or `Automatic`)
   - `Edition Preference` (`One edition` or `All eligible`)
3. In owner mode:
   - refresh balance
   - open the airdrop-address edit link (delegation registration flow)
   - update mode and edition preference
4. In `Top Up` (owner mode only):
   - choose `1 Card`, remaining `SZN`, `Year`, or `Epoch`
   - optionally expand `Show Deep Time Subscriptions` for `Period`, `Era`,
     `Eon`
   - or choose `Other` and enter a card count
5. In `Upcoming Drops`, toggle subscription rows and update quantity for
   subscribed rows.
6. In `Subscription History`, expand accordions for redeemed records, logs, and
   top-ups.

## Current Behavior

- `Mode` can show a UTC last-update timestamp.
- `Edition Preference` shows `Eligibility xN` and uses a toggle.
- `Top Up`:
  - sends ETH to the configured subscriptions address on the configured chain
  - on iOS with consent country `US`, shows `Top-up on 6529.io` instead of
    in-page send controls
  - shows modal states for wallet confirm, pending confirmation, success, and
    error
  - can show `View Tx` while pending or after success
  - keeps wallet-confirm and pending states open while work is in progress;
    success and error states can be dismissed with the close control, backdrop,
    or Escape
  - keeps long transaction errors contained in a scrollable status panel
- `Upcoming Drops`:
  - shows first 3 rows by default; `Show More` expands the list
  - first row can show phase metadata (phase, position, airdrop address,
    subscribed count)
  - subscribed rows show a quantity selector capped by eligibility count
- `Subscription History`:
  - `Redeemed Subscriptions`
  - `Log History`
  - `Top Up History`
  - pagination when a section has more than 10 rows

## Failure and Recovery

- Balance, airdrop-address, upcoming-drop, and history content use stable
  loading indicators until their requests finish; empty messages are not shown
  while those sections are still loading.
- When no airdrop address is available, the page shows
  `No airdrop address found`; owners can use `Set airdrop address` to open the
  existing delegation registration flow.
- Auth rejection stops updates; no write call is submitted.
- Failed settings or upcoming-drop updates keep current values and show an
  error toast.
- Failed subscription-count updates reset the selector to the previous value.
- Top-up without a connected wallet shows
  `You must have an active wallet connection to top up`.
- When no upcoming cards are available, `Upcoming Drops` shows
  `No upcoming drops found`.
- Empty history states:
  - `No Redeemed Subscriptions found`
  - `No logs found`
  - `No Top Ups found`

## Responsive Behavior

- The four main sections use the same panel structure and spacing.
- Subscription settings wrap without clipping on narrow screens.
- Upcoming-drop content and controls stack on mobile so dates, toggles, and
  quantity controls do not overlap.
- Top-up options and history rows wrap without horizontal page overflow.

## Edge Cases

- On minting day, first-row upcoming controls are locked and show
  `Minting Today`.
- `Send` stays disabled until a valid top-up option is selected.
- `Other` input uses integer parsing:
  - decimal input (for example `1.8`) sends as `1`
  - blank, non-numeric, `0`, and negative values are rejected with
    `Select a top-up option`
  - switching back to a preset clears `Other` input and top-up errors
- Upcoming rows include season/date labels and can extend into future seasons.

## Limitations / Notes

### Localization fallback debt

- Route or component: `/{user}/subscriptions` and
  `components/user/subscriptions/*`.
- Current fallback: the tab's user-facing copy and accessible names are
  hardcoded in canonical `en-US`; the profile tab does not yet expose a locale
  switch for this content.
- User impact: the English UI remains fully functional, but these controls and
  states are not translated yet.
- Remediation path: move the complete subscriptions message family into the
  shared i18n dictionaries together so visible copy, empty/loading states, and
  accessible names stay aligned across supported locales.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Delegation Action Flows](../../delegation/feature-delegation-action-flows.md)
- [Memes Subscriptions Report](../../api-tool/feature-memes-subscriptions-report.md)
