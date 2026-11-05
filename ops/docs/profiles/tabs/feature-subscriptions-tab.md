# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab at `/{user}/subscriptions` shows the coverage answer,
Subscription balance and Forecast use without an expander. Balance, the available
mint count, Forecast use and the owner-only Top up action share the bottom of the
coverage panel and wrap when needed. The information button beside Forecast use
opens the shared tooltip with the projection note and, for Covered profiles, the
status explanation. Learn more sits on the right of the Subscription minting heading
at every screen size. Covered owners see Top up without extra Choose drops or
Review settings shortcuts. All states use the main Top up button without a duplicate
Top up subscriptions link. Other navigation actions remain unchanged. Only owners in No upcoming drops selected see Choose drops. When available, it sits beside Top up below the metrics,
right-aligned on desktop and in an equal-width pair on phones. Top up opens the same dialog used by other owner states. The coverage card keeps
its existing gradient.

Below 640px, Subscription balance and Forecast use sit side by side, with each value below its label. Available mints sit below the balance on the left, and the owner refresh button stays beside the balance label. Below 384px, the two groups stack to retain readable labels and values. Wider screens keep the inline statistics and refresh beside the amount. When Choose drops is available, it shares an equal-width mobile button row with Top up: Top up on the left and Choose drops on the right. Covered owners keep the single full-width Top up button.

From 1024px, Subscription minting occupies the wider left column and Minting settings
sits in the right column, with its three settings stacked. In that sidebar,
setting labels are brighter, values and supporting details sit beneath them on
the left, and owner switches sit on the right. Both original owner choice labels
remain visible. Airdrop Address uses the original short address format, with the full address available on hover, focus or tap. Below 1024px,
Minting settings and Subscription History become two compact rows together after
Upcoming Drops. The settings row summarizes the saved mode and edition preference.
Settings and history open their full content in the shared mobile bottom sheet; settings uses the full-height sheet. Learn more opens the existing subscriptions guide. Inside settings,
visitor settings use three columns from 768px and owner settings use two; phones
stack the groups with dividers. Owner labels remain above their controls.
History retains its compact pill tabs and original entries. Redeemed rows
use the original shortened address format. Owners in every coverage state open Top up when needed.

This page covers tab content only. Tab visibility and hidden-tab URL fallback
are documented in
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/subscriptions`
- Sections: coverage answer and `Subscription balance`, `Minting settings`,
  `Upcoming Drops`, `Subscription History`, and owner-only `Top up` (a desktop
  dialog or mobile bottom sheet)

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
  dialog opens and focuses its heading in every owner coverage state, including
  Not set up and No upcoming drops selected, without scrolling the page behind it.
  Where Subscriptions are hidden (the iOS app outside the US) the tab
  redirects to Identity and nothing scrolls.
- Use the subscription-awareness action on Home or a Meme card.
- Use `Learn more` on the right of the `Subscription minting` heading at any
  screen size to open `/about/subscriptions`.
- Links to `#profile-subscriptions-overview`, `#profile-subscriptions-settings`,
  `#profile-subscriptions-upcoming`, and `#profile-subscriptions-history`
  scroll to and focus their section heading on desktop. Below 1024px, settings
  and history links open the matching sheet and focus its heading instead.
  Resizing from desktop to a smaller screen does not open a sheet, even when
  its section is already in the URL. Closing a sheet clears its matching URL hash,
  and reconnecting effects does not reopen a dismissed sheet. Explicit deep links
  continue to open their section. Resizing to desktop closes an open sheet;
  tap the compact row to reopen it after returning to a smaller screen.
  `#profile-subscriptions-top-up` opens and focuses the Top up dialog automatically.

## Common Scenarios

- Owner mode:
  - connected profile matches the viewed profile
  - no active proxy session
  - settings and upcoming-drop actions are enabled
  - `Top Up` is shown
- Read-only mode:
  - any non-owner context (for example viewing another profile)
  - saved settings and upcoming subscription choices are shown as read-only values
  - `Top Up` is hidden
- Active proxy session:
  - subscriptions content is not rendered

## User Journey

1. Open `/{user}/subscriptions` and read the coverage summary and Subscription
   balance. Covered, Plan a top up, Running low and Action required show the
   original funded-drop count with its colored status badge above it, including zero.
   When supplied, Funded through shows the Meme link and full date including
   the year. The headline has no decorative status icon. This date is a projection.
   Owners in states without a funded-drop count keep their explanation in the summary. Visitors see the status, headline, funded-through date and factual numbers, without setup or action instructions. Funding warning states use their label, count and dates instead of a repeated general explanation.
   The balance refresh icon shows its label on hover or keyboard focus.
2. Read Subscription balance and Forecast use together near the bottom of the
   coverage panel. The available mint count appears once with the ETH balance,
   using the original `(N mints available)` wording. It is balance capacity in
   individual mints, distinct from the funded-drop count and edition preference.
   Hover, focus or tap the information button beside Forecast use for the
   `Subscription coverage` tooltip. It preserves the projection note and, for
   Covered owners, the status explanation. Escape or tapping elsewhere dismisses
   it. These supporting details no longer need an expandable report.
   Status, the funded-drop count and Funded through stay above the metrics.
   The first upcoming drop stays in Upcoming Drops. Mode, its update date,
   eligibility and edition preference stay in Minting settings. Individual drop
   quantities remain in Upcoming Drops.
   For owners, Recommended is the first option in Top up, preserving the exact ETH amount and funding projection. The summary and dialog omit the extra Top up by paragraph; the Recommended option explains the funding outcome without an additional guidance block. Visitors do not see top-up deadlines, recommendations or action guidance in any coverage state. US iOS owners can read the recommendation in Top up before continuing on the web. The general warning explanations are omitted because the status, funded count and dates already express them. Next unfunded is shown on its Upcoming Drops row instead of repeating it in the summary. If that token is outside the loaded upcoming list or the list is unavailable, its link and full date remain in the summary as a fallback. Each supplied fact appears once, with no empty None rows. Each state retains its own backend data and existing status thresholds. The owner balance refresh also reloads
   coverage, including when coverage is unavailable or stale. If a coverage refresh
   fails while prior data remains, the original stale-data warning appears directly
   above the cards. Owners have a Refresh coverage button beside it, wrapping below
   on narrow screens. The coverage card itself has no separate refresh control.
   The summary has no Review settings shortcut; settings remain in the adjacent desktop panel or the dedicated mobile settings row. Not set up keeps its original state and Top up; Automatic mode remains on the existing Mode switch, without a redundant Set up shortcut.
   Warning states use the main Top up button without a second Top up subscriptions link.
3. Owners in every coverage state use `Top up` near the balance and forecast
   metrics to open a centered desktop dialog or mobile bottom sheet. New collectors
   do not see the amount form until they open it. Visitors never see Top up.
   Only No upcoming drops selected offers owners `Choose drops`, beside Top up below the metrics on all
   screen sizes, with natural button widths on desktop and equal widths on phones.
   Choose drops scrolls to and focuses Upcoming Drops.
   Top-up options are compact horizontal cards in one column at every screen size.
   A radio sits on the left, the original label and card count in the middle,
   and the ETH amount on the right. Other keeps its input on the right and the
   calculated ETH preview beneath its label.
   Selection adds a blue background, outline and amount; the radio dot animates
   smoothly. Cards have subtle blue hover feedback without moving. All styling
   uses Tailwind and respects reduced motion. The original submit button includes its lightning
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
   selections or quantities. From 640px, `Show More` reveals the remaining rows
   inline. On phones it opens the full list in the shared bottom sheet; Close,
   Escape or Show Less returns to the three-row preview and restores focus.
   On narrow visitor rows without artwork, the Meme title uses the full width,
   with quantity on the left and saved subscription status on the right of a
   separate line below it. Wider rows retain the inline layout. Owner quantity
   dropdowns sit below the title under 640px and beside it from 640px upward.
   Every row shows its own season beside the date or Minting Today, including
   rows revealed by Show More. The expanded list marks the last funded
   drop using the supplied Funded through token. Minting Today rows stay locked;
   focus, tap, or hover the label for the explanation. Below 768px, a More button expands the supplied Phase, Subscription Position,
   Airdrop Address and Subscription Count below the row. Desktop keeps those
   details visible below the title; the tooltip only explains the mint-day lock.
5. Use `Minting settings` beside the coverage panel from 1024px. On narrower
   screens, tap its compact row after Upcoming Drops to open the settings sheet. Mode,
   Edition Preference and Airdrop Address stack in one column below 768px,
   with subtle dividers between rows and labels above their selected values. The
   mode date and eligibility follow their values on the same line when space permits. From 768px, visitor
   settings sit side by side with supporting text wrapping within each setting. From 1024px, the three settings stack in the right column, with brighter labels above left-aligned values and supporting details. Owners have the original
   Manual / Automatic switch and One edition / All eligible switch. Only the selected
   value is shown, changing when the saved switch state changes. Owner labels sit
   above their controls: Mode and Edition Preference share two columns from 768px,
   with Airdrop Address below; the settings stack in the right column from 1024px.
   Phones stack the groups with dividers. Learn more stays a small link with a
   44px tap target. Tab focuses a
   switch and Space changes it through the existing authentication and save flow.
   Owner controls are disabled while settings load or an update is pending.
   Visitors see the saved Mode and Edition Preference as plain static values,
   without switches or inactive choices. Automatic has a small green indicator.
   The plain UTC Mode date and Eligibility follow the saved values beneath the labels in the desktop sidebar, with the same arrangement on phones and natural wrapping when space is limited. Loading settings
   shows a loading label rather than a guessed saved value. The original edition explanation is owner-only, in the info icon beside the selected edition value (hover, focus or tap); the mode explanation
   remains below Upcoming Drops. Eligibility remains beside Edition Preference.
   The wallet address is shortened beside the ENS name when available; its full
   value remains the accessible name and is shown in the tooltip on hover, focus
   or tap. The owner edit link remains available.
   The mode's UTC last-update timestamp keeps its original wording. Visitors can read saved values
   but cannot change them. Direct settings links focus the section or sheet heading.
   Close, Escape or the backdrop dismisses the sheet and returns focus to its row.
6. Open `Subscription History`: it is inline on desktop, or a compact row below
   Minting settings on screens below 1024px. In its sheet or section, choose Redeemed
   Subscriptions, Log History, or Top Up History. The selected pill is light;
   inactive pills are transparent with subtle outlines and a faint fill on hover.
   The labels have no counts. Pills stay on one horizontally scrollable row on
   narrow screens. One history view is shown at a time, retaining its original
   entry text, dates, addresses, transaction
   links, empty state, and independent pagination.

## Current Behavior

- Settings use compact inline controls on the same subtle dark surface as
  Upcoming Drops, with the full address available in its tooltip.
  Upcoming Drops uses date-first rows with the original mode explanation
  below its heading for the owner only. Minting Today has a primary-blue label
  and a dot that pings unless reduced motion is enabled. All rows share one panel
  with no nested row boxes.
  Later rows have no decorative dots. Today's artwork appears beside the label
  when the existing latest-Meme data matches its token and contract; missing,
  mismatched or failed artwork leaves the row usable without an image.
  The panel has vertical padding around the rows and
  footer, with subtle horizontal dividers between rows. Dates are emphasized above
  quieter Meme titles, including Minting Today. Its blue label takes the date's
  place, with uncropped 80 × 113 artwork at every screen size. On phones the owner
  switch stays beside the title and the quantity
  selector sits below it; visitors see quantity and subscription status together
  on the right. Below 768px, More expands the original mint-day allocation details as text
  below the row; desktop keeps them visible. Show More stays centered in the panel footer at every screen size.
  Visitors see non-interactive `Subscribed` or `Not subscribed` text
  instead of disabled drop switches, and plain selected / eligible quantities
  without chip backgrounds or dropdown arrows. Owners keep the existing editable switches, quantity
  pickers and mint-day locks.

- Top up uses fully clickable compact cards, with small radio selectors at
  left, original labels and counts in the middle, and ETH amounts on the right. Blue radio and selected-row colors transition smoothly while rows
  stay in place; reduced motion disables the transitions. Other has a distinct
  bordered count input and ETH preview.
  Both presentations retain any supplied funding projections. A full-width confirmation
  button and recipient address follow all amount choices.
  During a transaction, the existing transaction-status dialog replaces the
  amount-picker dialog. Dismissing success or error returns
  to the amount picker.
- Coverage status ramps with urgency and pairs its color with text:
  - `Covered`: at least 7 consecutive intended drops are fully funded
  - `Plan a top up`: 4-6 drops are fully funded
  - `Running low`: 2-3 drops are fully funded
  - `Action required`: 0-1 drops are fully funded
- Status explanations use plain, professional wording without changing the
  state labels or actions. Manual mode, the purpose of choosing drops, eligibility
  limits and schedule-dependent refresh guidance remain explicit. `Action required`
  distinguishes an unfunded next drop from one remaining fully funded drop.
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
- `Mode` is editable in Minting settings. Its original
  UTC last-update timestamp follows the saved value, without "since".
- Owners use the original shared `Mode` and `Edition Preference` switches, with the
  selected value below each label and a native keyboard-focus indicator. The original accessible
  names are Automatic subscription mode and All eligible editions. The
  authentication, save payloads, success/error feedback and refresh behavior
  remain unchanged. A failed or rejected update retains the saved value.
  `Edition Preference` also shows `Eligibility xN` and its original owner-only
  explanation in the info icon beside the selected edition (hover, focus or tap). The selected edition and Eligibility share a line when space permits. Automatic is emerald with a dot; Manual and both edition values are neutral. The date and Eligibility wrap naturally when space is limited.
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
  - every row shows its season beside the date or `Minting Today`, including
    rows revealed by `Show More`; the section heading has no season label
  - the Meme number is smaller below the date
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
  - `Redeemed` (the list keeps its full `Redeemed Subscriptions` heading)
  - `Log History`
  - `Top Up History`
  - Redeemed rows keep the original entry text, quantity, shortened airdrop
    address, balance after redemption, date and transaction link. The quantity
    is a blue badge and rows have subtle dividers. Below 768px, Balance after
    redemption starts on its own row after the airdrop address; the date and
    circular Etherscan link share a separate footer with a faint divider. Wider
    screens place the date and link to the right. Log History keeps all original
    event text, additional information and dates, with neutral decorative dots,
    clearer text hierarchy and matching row dividers. Top Up History keeps the
    amount, ETH icon, full sender address, date and transaction link, with a green
    amount, the sender below and the same mobile footer. Etherscan links
    use the shared body-portal tooltip and standard tooltip styles on hover or
    keyboard focus, retaining the same transaction destination and new-tab behavior.
  - from 1024px, a separate heading and compact pills stay inline. Below that
    width, the Subscription History row at the bottom opens a shared bottom sheet
  - the selected history and each page number are preserved when the sheet closes
    and reopens, data refreshes, or the window resizes. Close, Escape or the
    backdrop dismisses the sheet and returns focus to its row
  - Redeemed Subscriptions loads first; Log History and Top Up History load when
    selected. Recently loaded pages are reused when switching histories, and each
    history keeps its own page number
  - after a confirmed transaction or balance refresh, the selected history
    refreshes immediately; other cached histories refresh when selected
  - pagination when a history has more than 10 rows
  - changing page returns to the history heading and focuses the active list
    after the requested page finishes loading, including cached pages. The
    selected history stays active. Background refreshes do not move the viewport;
    changing history tabs or profiles cancels a pending pagination scroll.

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
  warning in the summary.
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
