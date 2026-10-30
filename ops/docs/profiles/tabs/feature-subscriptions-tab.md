# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab at `/{user}/subscriptions` leads with a projected Meme
subscription answer and balance, followed by Upcoming Drops. Details, Top up,
Minting Settings, and Subscription History open when needed.

This page covers tab content only. Tab visibility and hidden-tab URL fallback
are documented in
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/subscriptions`
- Sections: coverage answer and `Subscription balance`, `Upcoming Drops`,
  `Minting Settings`, `Subscription History`, and inline `Top up` for owners

## Entry Points

On native iOS when the detected country is not `US` or is unknown, the tab and
subscription actions are hidden. Direct links (including native deep links)
return to the profile's Identity tab without displaying subscription content
or an unavailable page. On iOS the return waits for the country check: the tab
and content stay hidden while it loads, a US deep link then opens the
`Subscriptions` tab in place, and a non-US, unknown, failed, or slow (over five
seconds) check redirects. Web and Android never wait for the country check.

On every platform the `Subscriptions` tab, the profile-header subscription
status, and their requests are left out of the server HTML and the first
render, because the page cannot yet tell whether it is the iOS app. They appear
right after the page loads where subscriptions are allowed. A direct
`/{user}/subscriptions` link stays selected and does not redirect during that
first render.

- Open `/{user}/subscriptions` directly.
- Open a profile and choose the `Subscriptions` tab.
- On your own profile, use the profile-header subscription control. It appears
  beneath Preferences on desktop layouts, and as a full-width subtle row below
  the identity block on smaller layouts. The current state and contextual
  action share the row's second line, and the whole row opens the relevant
  settings, upcoming-drops, or top-up section.
- Open a subscription top-up notification. It links to the `Top up` section
  (`/{user}/subscriptions#profile-subscriptions-top-up`); once the section has
  loaded the page scrolls to it and moves keyboard and screen-reader focus to
  its heading, with smooth scrolling skipped when reduced motion is on.
  Where Subscriptions are hidden (the iOS app outside the US) the tab
  redirects to Identity and nothing scrolls.
- Use the subscription-awareness action on Home or a Meme card.
- Use `Learn more` below Subscription History to open `/about/subscriptions`.
- Links to `#profile-subscriptions-overview`, `#profile-subscriptions-settings`,
  `#profile-subscriptions-top-up`, `#profile-subscriptions-upcoming`, and
  `#profile-subscriptions-history` scroll to and focus their section heading.
  Settings, Top up, and History open automatically when linked to.

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

1. Open `/{user}/subscriptions` and read the short coverage answer, next intended
   drop, and Subscription balance. A funded-through date is a projection.
2. Open `Details` for Status, Drops funded, Funded through, Next unfunded,
   Balance capacity, Forecast use, Mode with its last-update time, Eligibility,
   and Edition Preference. Status and mode explanations, recommendations,
   authoritative deadlines, the projection note, and Refresh coverage remain here.
3. Owners can open `Top up` inside the answer card. Choose Recommended or
   Minimum for next drop when supplied, 1 Card, Remaining SZN, or Other.
   `More` reveals Remaining Year, Remaining Epoch, and Deep Time Subscriptions
   (Remaining Period, Era, and Eon). Only the selected coverage option shows its
   supplied projected funding outcome. Cancel closes the panel and returns focus
   to the Top up button.
4. Use `Upcoming Drops` to review the first three drops, change individual
   selections or quantities, or turn Automatic mode on or off. `Show More`
   reveals the remaining rows. Minting Today rows are locked; focus, tap, or
   hover the label for the explanation.
5. Open `Minting Settings` to choose One edition or All eligible and read the
   full Airdrop Address. Owners can use its edit link to open delegation
   registration. Settings starts closed and summarizes the edition preference
   and address on wider screens.
6. Open `Subscription History` and choose Redeemed, Log, or Top Ups. Each tab
   retains the original entry text, dates, addresses, transaction links, empty
   state, and independent pagination.

## Current Behavior

- Coverage status ramps with urgency and pairs a colored dot with text:
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
- `Mode` and its UTC last-update timestamp are in Details. The Automatic
  switch is beside Upcoming Drops.
- `Edition Preference` shows `Eligibility xN` and uses two radio options with
  a visible selected state and keyboard arrow navigation.
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
  - only the next unfunded token identified by coverage gets a `Next unfunded`
    marker, with a Top up link for owners; stale coverage does not mark rows
  - shows first 3 rows by default; `Show More` expands the list
  - first row can show phase metadata (phase, position, airdrop address,
    subscribed count)
  - a subscribed first row shows `No subscription allocation` once distribution
    is published and the finalized subscription list has no record for that
    profile; a phase-less finalized record remains pending, and no message
    appears for unsubscribed rows, unpublished distribution, or failed lookups
  - phase and publication details refresh once per minute while the tab is visible
  - subscribed rows keep the numeric quantity selector with every value from 1
    through current eligibility when eligibility is positive; at zero eligibility,
    it shows a single `0` option and is disabled without changing the saved request
  - untouched automatic rows in Automatic / All eligible mode follow eligibility
    increases and decreases when consolidated balances are refreshed
  - choosing a quantity saves a manual override for that card, including later
    future cards; automatic eligibility updates never overwrite it
  - a saved manual quantity above eligibility is displayed at the eligibility
    limit without changing the saved request: manual 11 displays `10 cards` at
    eligibility 10, then `11 cards` after eligibility recovers to 12 and data is
    refreshed
  - final quantities are capped by eligibility and available balance; refreshing
    upcoming quantities does not change historical finalized allocations
- `Subscription History`:
  - `Redeemed Subscriptions`
  - `Log History`
  - `Top Up History`
  - the outer disclosure starts closed at every width; the tabs retain their
    selected state while the panel closes, data refreshes, or the window resizes
  - pagination when a tab has more than 10 rows

## Consolidation Changes

When wallet groups merge, their subscription balances are added, including any
existing destination balance once. The merged mode is `Automatic` if any source
or the destination had it enabled. `All eligible` is retained if any source or
the destination selected it, including a preference saved in `Manual` mode;
otherwise the preference is `One edition`.

For overlapping upcoming subscriptions to the same Meme Card:

- The merged group is subscribed if either active row was subscribed.
- A subscribed manual quantity takes precedence over automatic quantities,
  even when smaller. For example, manual 2 and automatic 8 merge to manual 2,
  even if the merged group uses `Automatic` / `All eligible`.
- If several subscribed manual requests conflict, the largest manual request
  is kept. With automatic requests only, the largest subscribed quantity is
  kept and remains eligible for automatic updates.
- The earliest priority timestamp among subscribed rows is kept. An
  unsubscribed row does not override an active request.

Distinct upcoming subscriptions, logs, and redeemed history move to the merged
group. Finalized allocations remain separate: distinct allocations move with
their existing delivery and allocation details; conflicting allocations for the
same card stay under their old group for manual reconciliation. They are not
automatically combined or discarded.

On a split, subscriptions follow the resulting group with the highest TDH;
they are not divided between the resulting groups. This can differ from the
group that [keeps the existing profile](../about/feature-primary-address-reference-table.md#profile-retention-when-a-consolidation-splits).

A failed subscription-group move rolls back that group's changes, preventing a
partly moved group. These rules apply when affected consolidations are
processed; they do not automatically recover rows stranded by earlier failures.

## Failure and Recovery

- Balance, airdrop-address, upcoming-drop, and history content use stable
  loading indicators until their requests finish; empty messages are not shown
  while those sections are still loading.
- If a subscription read fails, a warning identifies that some data could not
  be refreshed. Retry fetches the subscription data again.
- A failed coverage refresh keeps the last known forecast with a visible stale
  warning, including while Details is closed.
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

- The answer card, Upcoming Drops, and the bottom disclosure card keep a
  consistent layout at each width.
- Subscription settings wrap without clipping on narrow screens.
- Upcoming-drop titles and dates wrap beside bordered quantity pickers and
  toggles without horizontal scrolling. Top-up chips and segmented controls
  expand across the available width on phones.
- Top-up options and history rows wrap without horizontal page overflow.

## Edge Cases

- Subscription changes and top-ups must be received by 00:00 UTC on the day
  before a Meme Card mint. Once a card is closed, enabling Automatic mode or
  making a first top-up applies to later cards; the closed card's saved
  subscription choice is retained. Switching Automatic mode off also leaves
  the closed card unchanged.
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
- Untranslated surface: subscription controls, the Phase / Subscription Position /
  Airdrop Address / Subscription Count metadata in both row layouts, plus the
  shared transaction status, transaction-link, close-control, and backdrop
  accessible names.
- Current fallback behavior: these surfaces use hardcoded canonical `en-US`
  in all supported locales. The `No subscription allocation` status uses
  `profile.subscriptions.noAllocation` and is translated in all five locales.
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
