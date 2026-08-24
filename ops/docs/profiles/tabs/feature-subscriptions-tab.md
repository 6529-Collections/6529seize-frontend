# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab at `/{user}/subscriptions` leads with a projected Meme
subscription runway, then shows balance, settings, top-up options, upcoming
drops, and subscription history.

This page covers tab content only. Tab visibility and hidden-tab URL fallback
are documented in
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/subscriptions`
- Sections: `Subscription minting`, `Minting settings`, `Top up` (owner mode
  only), `Upcoming Drops`, `Subscription History`

## Entry Points

- Open `/{user}/subscriptions` directly.
- Open a profile and choose the `Subscriptions` tab.
- On your own profile, use the profile-header subscription control. It appears
  beneath Preferences on desktop layouts, and as a full-width subtle row below
  the identity block on smaller layouts. The current state and contextual
  action share the row's second line, and the whole row opens the relevant
  settings, upcoming-drops, or top-up section.
- Use the subscription-awareness action on Home or a Meme card.
- Use `Learn more` in the `Subscription minting` section to open
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
2. Review `Subscription coverage`:
   - status and the number of consecutive intended drops fully funded from the
     next intended drop
   - compact configuration: `Automatic` or `Manual`, exact ETH balance,
     eligibility count, and edition preference
   - `Funded through` and `Next unfunded` Meme card/date when available
   - an authoritative `Top up by` deadline only when the backend supplies one
   - exact recommended top-up and its projected runway when available
3. Review `Minting settings`:
   - `Subscription balance` (exact ETH and raw mint capacity)
   - `Airdrop Address`
   - `Mode` (`Manual` or `Automatic`)
   - `Edition Preference` (`One edition` or `All eligible`)
4. In owner mode:
   - refresh balance
   - open the airdrop-address edit link (delegation registration flow)
   - update mode and edition preference
5. In `Top up` (owner mode only):
   - when supplied, choose `Recommended` to restore the healthy runway or
     `Minimum for next drop` to cover the next at-risk intended drop
   - choose `1 Card`, remaining `SZN`, `Year`, or `Epoch`
   - optionally expand `Show Deep Time Subscriptions` for `Period`, `Era`,
     `Eon`
   - or choose `Other` and enter a card count
6. In `Upcoming Drops`, toggle subscription rows and update quantity for
   subscribed rows.
7. In `Subscription History`, expand accordions for redeemed records, logs, and
   top-ups.

## Current Behavior

- Coverage status ramps with urgency and always pairs color with text and an
  icon:
  - `Covered`: at least 7 consecutive intended drops are fully funded
  - `Plan a top up`: 4-6 drops are fully funded
  - `Running low`: 2-3 drops are fully funded
  - `Action required`: 0-1 drops are fully funded
- Non-runway states distinguish profiles that are `Not set up`, have
  `No current eligibility`, have `No upcoming drops selected` in Manual mode,
  or cannot currently be forecast.
- `Automatic` mode does not expire when the balance runs out. The forecast says
  what the current balance funds; it does not claim that the mode itself runs
  until a date.
- `mint capacity` is the raw floor of balance divided by the subscription mint
  price. `Forecast use` is the capacity allocated within the current intended
  drop horizon.
- Coverage uses fully funded intended drops, not raw card credits, because
  eligibility, all-editions settings, manual choices, and opt-outs can change
  consumption per drop.
- `Mode` can show a UTC last-update timestamp.
- `Edition Preference` shows `Eligibility xN` and uses a toggle.
- `Top up`:
  - sends ETH to the configured subscriptions address on the configured chain
  - uses exact backend-provided ETH for recommended and minimum options,
    including partially funded next drops
  - refreshes coverage and the existing subscription data after confirmation
  - on iOS with consent country `US`, shows `Top-up on 6529.io` instead of
    in-page send controls
  - shows modal states for wallet confirm, pending confirmation, success, and
    error
  - can show `View Tx` while pending or after success
  - keeps wallet-confirm and pending states open while work is in progress;
    success and error states can be dismissed with the close control, backdrop,
    or Escape
  - keeps long transaction errors contained in a keyboard-focusable,
    scrollable status panel
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
- If coverage cannot be calculated or fetched, the page states that settings
  have not changed and owners can retry. It does not guess a funded-through
  date or top-up deadline.
- If a next intended drop is unfunded but no authoritative cutoff is available,
  the page says so and shows its projected mint date without presenting that
  date as a safe deadline.
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
- `Choose a top-up amount` stays disabled until a valid option is selected.
- `Other` input uses integer parsing:
  - decimal input (for example `1.8`) sends as `1`
  - blank, non-numeric, `0`, and negative values are rejected with
    `Select a top-up option`
  - switching back to a preset clears `Other` input and top-up errors
- Upcoming rows include season/date labels and can extend into future seasons.
- Coverage is a projection based on the current balance, eligibility, settings,
  selections, and published schedule; changes to those inputs can change the
  runway.

## Limitations / Notes

### Localization fallback debt

- Route or component: `/{user}/subscriptions`,
  `components/user/subscriptions/*`, and the shared
  `components/common/OnchainTransactionModal.tsx` status surface.
- Untranslated surface: subscription controls plus the shared transaction
  status, transaction-link, close-control, and backdrop accessible names.
- Current fallback behavior: all supported locales use hardcoded canonical
  `en-US`; the profile tab and shared modal do not yet expose a message family
  for this content.
- User impact: the English UI remains fully functional, but these controls and
  states are not translated yet.
- Owner or follow-up issue: frontend i18n backlog.
- Expected remediation path: move the complete subscriptions and on-chain
  transaction message families into the shared i18n dictionaries together so
  visible copy, empty/loading states, and accessible names stay aligned across
  supported locales.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Delegation Action Flows](../../delegation/feature-delegation-action-flows.md)
- [Memes Subscriptions Report](../../api-tool/feature-memes-subscriptions-report.md)
