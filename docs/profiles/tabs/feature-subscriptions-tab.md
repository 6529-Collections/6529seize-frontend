# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab shows a profile's subscription status and history for
upcoming drops. Eligible users can update subscription settings, top up ETH,
set edition preference, and manage per-drop upcoming subscription counts.

## Location in the Site

- Route: `/{user}/subscriptions`
- Primary sections:
  - `Subscribe` (balance, airdrop address, mode, edition preference)
  - `Top Up` (eligible editing sessions only)
  - `Upcoming Drops`
  - `Subscription History`

## Entry Points

- Open `/{user}/subscriptions` directly.
- Switch to `Subscriptions` from another profile tab.
- Follow a shared profile link that lands on the subscriptions route.

## User Journey

1. Open the subscriptions route for a profile.
2. Review current subscription balance and airdrop address.
3. If viewing your own connected profile (without proxy mode), update:
   - subscription mode (`Manual` or `Automatic`)
   - edition preference (`One edition` or `All eligible`)
   - edition preference count (`1` to total eligible count)
   - top-up amount using preset or custom card-count options
4. Review and optionally update upcoming drop subscriptions.
5. Use history accordions to review redeemed subscriptions, logs, and top-ups.

## Common Scenarios

- Own profile management:
  - refresh current balance
  - change airdrop address via delegation link
  - toggle mode and set edition preference (`One edition` / `All eligible`)
  - top up using quick options such as `1 Card`, `Remaining SZN`, `Remaining Year`,
    and `Remaining Epoch`
  - set per-drop subscription quantity from `1` up to your eligibility count
  - reveal `Show Deep Time Subscriptions` to include `Remaining Period`,
    `Remaining Era`, and `Remaining Eon`
  - enter a custom card count with `Other`
- Read-only viewing for minting-day controls:
  - the first upcoming row cannot be toggled or re-quantified when it is
    `Minting Today`
- Read-only viewing for another profile:
  - settings are visible but edit controls are disabled
  - top-up section is not shown
- Expand `Upcoming Drops` to show beyond the first three rows.
- On iOS in the US, use `Top-up on 6529.io` from the top-up panel instead of
  in-page send controls.

## Edge Cases

- On iOS outside the US, the `Subscriptions` tab is hidden from profile tabs.
- If a user loads a hidden `subscriptions` route, profile tab logic redirects
  to the first visible tab.
- On minting day, subscription toggles/count updates for the first upcoming row
  are disabled and `Minting Today` messaging is shown for that row.
- Upcoming rows include season and mint date labels and can span future seasons
  when the requested row count exceeds remaining rows in the current season.
- Upcoming row dates are anchored to the UTC mint day, so the first row stays
  aligned with the current mint date throughout mint day instead of advancing
  early by local timezone/time-of-day.
- Top-up action requires selecting a valid option before `Send` is enabled.
- Per-drop subscription count is capped by the profile's eligibility count.
- `Mode` and `Upcoming Drops` rows show updated UTC last-update/time context:
  - `Mode` includes the last settings update timestamp when available.
  - The first upcoming row displays current phase/position, airdrop address,
    and currently subscribed quantity for that drop.

## Failure and Recovery

- If authentication is rejected, settings are not changed.
- If update calls fail, the UI keeps previous values and shows an error toast.
- If history lists are empty, users see explicit empty states (for example `No
  logs found`).
- If top-up send is attempted without a connected wallet, the modal returns:
  `You must have an active wallet connection to top up`.
- Top-up flow shows modal states for wallet confirmation, pending transaction,
  success, and error. Pending/success states can include a transaction link for
  on-chain verification, and users can retry after closing an error state.

## Limitations / Notes

- Edit actions require an authenticated session for the same profile being
  viewed.
- When a proxy profile is active, subscription edit actions are disabled.
- Top-ups send ETH to the configured subscriptions contract and chain only.
- Preset top-up options depend on currently remaining mint counts and can change
  over time.
- Edition preference changes affect whether subscriptions are requested for one
  eligible edition or all eligible editions.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Memes Subscriptions Report](../../api-tool/feature-memes-subscriptions-report.md)
