# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab at `/{user}/subscriptions` puts Subscription balance,
refresh and the owner-only Top up action inside the coverage panel, on its right
on wider screens. Learn more sits beside the Subscription minting title. Details
sits below the status description, beside the owner-only Choose drops shortcut. Minting settings groups Mode, Edition Preference
and Airdrop Address below the status, followed by Upcoming Drops and Subscription
History. Settings stack in one column on medium and smaller screens and share the subtle dark surface of
Upcoming Drops, which retains decorative timeline markers. History retains its
compact pill tabs and original tables. Redeemed rows use the original shortened address format.
Details and Top up open when needed.

This page covers tab content only. Tab visibility and hidden-tab URL fallback
are documented in
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/subscriptions`
- Sections: coverage answer and `Subscription balance`, `Minting settings`,
  `Upcoming Drops`, `Subscription History`, and a `Top up` dialog for owners

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
- Open a subscription top-up notification. It links to `Top up`
  (`/{user}/subscriptions#profile-subscriptions-top-up`); once loaded, the
  dialog opens and moves keyboard and screen-reader focus to its heading
  without scrolling the page behind it.
  Where Subscriptions are hidden (the iOS app outside the US) the tab
  redirects to Identity and nothing scrolls.
- Use the subscription-awareness action on Home or a Meme card.
- Use `Learn more` at the right of the `Subscription minting` title above the
  coverage card to open `/about/subscriptions`.
- Links to `#profile-subscriptions-overview`, `#profile-subscriptions-settings`,
  `#profile-subscriptions-upcoming`, and `#profile-subscriptions-history`
  scroll to and focus their section heading. `#profile-subscriptions-top-up`
  opens and focuses the Top up dialog automatically. Minting settings and History are
  already visible.

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

1. Open `/{user}/subscriptions` and read the coverage summary and Subscription
   balance. Covered, Plan a top up, Running low and Action required show the
   original funded-drop count with its colored status badge, including zero.
   When supplied, Funded through shows the Meme link and full date including
   the year. Covered uses a green check icon. This date is a projection.
   Without a funded-through point, the status explanation stays in the summary.
   An owner with Action required still sees the supplied top-up deadline here.
   The balance refresh icon shows its label on hover or keyboard focus.
2. Open `Details` below the status description, beside Choose drops for owners,
   for the `Subscription coverage` report. For Covered profiles,
   it contains the original status explanation, Balance capacity, Forecast use,
   and the projection note. Below 768px, report rows show labels on the left,
   values on the right and subtle dividers; wider screens keep the metrics grid.
   Status, the funded-drop count and Funded through stay
   in the summary above and are not repeated as report rows. The first upcoming
   drop stays in Upcoming Drops. Mode, its update date, eligibility and edition
   preference stay in Minting settings. The available mint count appears once
   as Balance capacity instead of repeating it beside the ETH balance.
   Next unfunded, recommendations and authoritative deadlines remain available
   when supplied, without empty None rows. A deadline already displayed in the
   summary is not repeated in Details. Owners retain Refresh coverage and the
   status-specific Set up, Top up subscriptions or Review settings action.
   Choose drops sits below the summary description instead. An explanation
   already shown above Details is not repeated.
3. Owners have `Top up` with Subscription balance on the right of the coverage
   panel. On phones, this group wraps below the summary controls.
   `Choose drops` sits on the left below the status description and scrolls to
   and focuses Upcoming Drops without opening Details.
   Top up opens a centered
   dialog on desktop or a bottom sheet on phones. Options retain the original
   blue radio controls and smooth color transitions, with a blue selected-row tint.
   Rows stay in place on hover. The original submit button includes its lightning
   icon and original wording.
   Choose Recommended or Minimum
   for next drop when supplied, 1 Card, Remaining SZN, Remaining Year,
   Remaining Epoch, or Other. Entering an Other count shows a separate ETH
   preview and the same amount on the Top up button.
   Recommended and Minimum each show their supplied projected funding outcome
   beneath the option before selection. `Show Deep Time Subscriptions` reveals
   Remaining Period, Era, and Eon and becomes `Hide Deep Time Subscriptions`.
   Close, Escape, or the backdrop dismisses the dialog and returns focus to
   the opener. Reopening retains the draft selection and Other count.
4. Use `Upcoming Drops` to review the first three drops and change individual
   selections or quantities. The `Show More` footer inside the timeline panel reveals the
   remaining rows. Minting
   Today rows are locked; focus, tap, or hover the label for the explanation.
5. Use `Minting settings` between the coverage panel and Upcoming Drops. Mode,
   Edition Preference and Airdrop Address stack in one column below 1280px,
   with subtle row dividers, labels on the left and values on the right. The
   mode date, eligibility and full wallet address sit beneath their corresponding
   values or labels. Wider screens use the inline layout. Mode uses the original
   Manual / Automatic switch; Edition Preference uses One edition / All eligible.
   Both labels remain visible, with the saved choice emphasized. Tab focuses a
   switch and Space changes it through the existing authentication and save flow.
   Controls are disabled while settings load or an update is pending and for
   visitors. The original edition explanation is owner-only; the mode explanation
   remains below Upcoming Drops. Eligibility remains beside Edition Preference.
   The full address,
   ENS name, tooltip and owner edit link remain available. The mode's UTC
   last-update timestamp appears under its saved value, without added wording. Visitors can read saved values
   but cannot change them. Direct settings links still focus the section heading.
6. In the always-visible `Subscription History` section, choose Redeemed
   Subscriptions, Log History, or Top Up History. The selected pill is light;
   inactive pills are transparent with subtle outlines and a faint fill on hover.
   The labels have no counts. Pills stay on one horizontally scrollable row on
   narrow screens. One history view is shown at a time, retaining its original
   entry text, dates, addresses, transaction
   links, empty state, and independent pagination.

## Current Behavior

- Settings use compact inline controls on the same subtle dark surface as
  Upcoming Drops and wrap without truncating addresses.
  Upcoming Drops uses a date-first timeline with the original mode explanation
  below its heading for the owner only. Show More stays in the panel footer.

- Top up uses a compact list of fully clickable rows, with radio selectors on
  the left, card counts and original labels in the middle, and ETH amounts on
  the right. Blue radio and selected-row colors transition smoothly while rows
  stay in place; reduced motion disables the transitions. Other has a distinct
  bordered count input and ETH preview.
  The dialog retains both supplied funding projections. A full-width confirmation
  button and recipient address follow all amount choices.
  During a transaction, the existing transaction-status dialog replaces the
  amount picker. Dismissing success or error returns to the amount picker.
- Coverage status ramps with urgency and pairs its color with text:
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
- `Mode` is editable in Minting settings above Upcoming Drops. Its original
  UTC last-update timestamp appears below the saved value, without "since".
- `Mode` and `Edition Preference` use the original shared switches, with both
  choices visible and a native keyboard-focus indicator. The original accessible
  names are Automatic subscription mode and All eligible editions. The
  authentication, save payloads, success/error feedback and refresh behavior
  remain unchanged. A failed or rejected update retains the saved value.
  `Edition Preference` also shows `Eligibility xN` and its original owner-only
  explanation. These choices wrap within the settings row when needed.
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
  - each row leads with the UTC date, retaining the abbreviated weekday and
    month plus the year, or `Minting Today` with its existing tooltip
  - the season sits beside the date in muted text; the Meme number is smaller below
  - first row can show phase metadata (phase, position, airdrop address,
    subscribed count)
  - a subscribed first row shows `No subscription allocation` once distribution
    is published and the finalized subscription list has no record for that
    profile; a phase-less finalized record remains pending, and no message
    appears for unsubscribed rows, unpublished distribution, or failed lookups
  - phase and publication details refresh once per minute while the tab is visible
  - subscribed rows show selected quantity / current eligibility, such as `2 / 2`
  - subscribed rows keep the numeric quantity selector with every value from 1
    through current eligibility when eligibility is positive; at zero eligibility,
    it shows a single `0` option and is disabled without changing the saved request
  - untouched automatic rows in Automatic / All eligible mode follow eligibility
    increases and decreases when consolidated balances are refreshed
  - choosing a quantity saves a manual override for that card, including later
    future cards; automatic eligibility updates never overwrite it
  - a saved manual quantity above eligibility is displayed at the eligibility
    limit without changing the saved request: manual 11 displays `10 / 10` at
    eligibility 10, then `11 / 12` after eligibility recovers to 12 and data is
    refreshed
  - final quantities are capped by eligibility and available balance; refreshing
    upcoming quantities does not change historical finalized allocations
- `Subscription History`:
  - `Redeemed Subscriptions`
  - `Log History`
  - `Top Up History`
  - a separate heading and compact pills are always visible, with no expand/collapse
    control; the selected history is preserved while data refreshes or the
    window resizes
  - Redeemed Subscriptions loads first; Log History and Top Up History load when
    selected. Recently loaded pages are reused when switching histories, and each
    history keeps its own page number
  - after a confirmed transaction or balance refresh, the selected history
    refreshes immediately; other cached histories refresh when selected
  - pagination when a history has more than 10 rows

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

- The answer card, Minting settings, and Upcoming Drops keep a
  consistent layout at each width.
- Subscription settings wrap without clipping on narrow screens.
- Upcoming-drop titles and dates wrap beside bordered quantity pickers and
  toggles without horizontal scrolling. Top up becomes a bottom sheet on phones,
  with internally scrollable options and a full-width confirmation button.
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
