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
- `Learn More` link: `/about/subscriptions`

## Access Modes

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

## States and Recovery

- Auth rejection stops updates; no write call is submitted.
- Failed settings or upcoming-drop updates keep current values and show an
  error toast.
- Failed subscription-count updates reset the selector to the previous value.
- Top-up without a connected wallet shows
  `You must have an active wallet connection to top up`.
- Empty history states:
  - `No Redeemed Subscriptions found`
  - `No logs found`
  - `No Top Ups found`

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

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Delegation Action Flows](../../delegation/feature-delegation-action-flows.md)
- [Memes Subscriptions Report](../../api-tool/feature-memes-subscriptions-report.md)
