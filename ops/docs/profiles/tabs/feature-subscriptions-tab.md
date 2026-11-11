# Profile Subscriptions Tab

## Overview

The `Subscriptions` tab at `/{user}/subscriptions` separates the coverage answer
from its supporting facts. The top zone contains the status, headline, brief
message and owner actions. The quiet bottom zone contains Subscription balance,
available mints, Forecast use and, when not already named by a deadline, Next
unfunded. All dates keep their original full-year format and UTC deadline times.
The original coverage-card gradient is unchanged.

Owners see primary Top up for Action required, Running low and Not set up, with
a transparent outlined Top up in other states. Only No upcoming drops selected
shows primary Choose drops first and secondary Top up second. Actions sit beside
the message on desktop and beneath it on phones; the two phone actions share a
row. Visitors have no owner actions, and Loading shows skeletons without actions.

Facts use 14px labels and desktop values. Desktop facts wrap into compact inline
rows. On phones, Subscription balance and Forecast use sit side by side, with
16px values just below their labels and N mints available below the balance
without parentheses. They stack below 384px. The owner refresh sits beside the
balance label on phones and at the end of the balance row on desktop.
The Forecast use information button retains the shared projection tooltip.
Learn more remains beside the Subscription minting heading. There is no Details,
Review settings shortcut or second Top up action.

From 1024px, Subscription minting occupies the wider left column and Minting settings
sits in the right column, with its three settings stacked. In that sidebar,
setting labels are brighter, values and supporting details sit beneath them on
the left, and owner switches sit on the right. The existing owner switches keep their selected-value labels. Airdrop Address uses the original short address format, with the full address available on hover, focus or tap. Below 1024px,
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

In the iOS app, the profile tab can show existing subscriptions, history,
upcoming choices, and settings in read-only mode. The promotional subscription card is omitted from the
profile header. On every platform the `Subscriptions` tab and its requests
are left out of the server HTML and the first
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
  - the iOS app, or any non-owner context (for example viewing another profile)
  - saved settings and upcoming subscription choices are shown as read-only values
  - `Top Up` is hidden
- Active proxy session:
  - subscriptions content is not rendered

## User Journey

1. Open `/{user}/subscriptions`. The coverage card has two zones: the status,
   funded-drop headline, short explanation and owner actions above; balance,
   available mints and Forecast use below. Covered is green, Plan a top up is
   neutral, Running low is amber and Action required is red. Visitors see neutral
   status text except Covered. Each state keeps its existing headline and data.
   Funded through appears when at least one drop is funded. A supplied authoritative
   Top up by cutoff follows for owners in Plan a top up, Running low and Action
   required. The zero- and one-funded-drop Action required explanations are omitted
   because the count and deadline already convey them. States without a status
   keep their existing explanation for owners and visitors.
2. Read Subscription balance, available mints and Forecast use in the quiet facts
   zone. Desktop keeps each fact inline in 14px text. Phones place the two facts
   side by side, with 14px labels above 16px values and `N mints available` below
   the balance without parentheses. They stack below 384px. Summary dates keep their original full-year format, and deadlines retain
   their UTC time. Next unfunded remains in
   the facts only when no deadline line already names that drop. The Forecast use
   information button retains its projection note and Covered-owner explanation.
   Hover, focus or tap opens the shared tooltip; Escape or tapping elsewhere
   dismisses it. The settings and upcoming-drop facts remain in their own sections.
3. Owners open Top up beside the message on desktop or beneath it on phones.
   It is white and filled for Action required, Running low and Not set up, and
   transparent with a subtle outline otherwise. No upcoming drops selected
   shows primary Choose drops first and secondary Top up second, under the
   message on desktop and side by side on phones. Choose drops still scrolls to
   and focuses Upcoming Drops. Loading shows no actions, and visitors have no
   owner actions. Top up opens the same desktop dialog or mobile bottom sheet;
   new collectors do not see the amount form until they open it.
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
   beneath the option before selection. Before sending either one, the page
   checks that its amount needs exactly the shown number of cards at the
   current card price; otherwise nothing is sent and the error asks you to
   refresh and try again. If the server's card price differs from the price
   the page shows, no top-up is sent and the error names both prices. `Show Deep Time Subscriptions` reveals
   Remaining Period, Era, and Eon and becomes `Hide Deep Time Subscriptions`.
   Close, Escape, or the backdrop dismisses the dialog and returns focus to
   the opener. Reopening retains the draft selection and Other count.
4. Use `Upcoming Drops` to review the first three drops and change individual
   selections or quantities. From 640px, `Show More` reveals the remaining rows
   inline. On phones it opens the full list in the shared bottom sheet; Close,
   Escape or Show Less returns to the three-row preview and restores focus.
   Phone rows keep the date first and the title beneath it. The quantity selector
   and toggle stay together beside the title when there is room, or below it
   together on narrower rows. Minting Today artwork aligns with the top of the
   text on phones, and the Meme name stays on one line. Visitors keep static quantity
   and subscription status. One amber boundary follows the last funded drop,
   using the existing Funded through wording. If no funded-through point is
   supplied, Next unfunded appears before the next unfunded drop instead.
   Every row shows its own season beside the date or Minting Today, including
   rows revealed by Show More. The boundary appears when its row is visible,
   including in the three-row preview. Minting Today rows stay locked;
   focus, tap, or hover the label for the explanation. Below 768px, a More button expands the supplied Phase, Subscription Position,
   Airdrop Address and Subscription Count below the row. More sits beside the title so the control stays close to its text. Desktop keeps those
   details visible below the title; the tooltip only explains the mint-day lock.
5. Use Minting settings beside the coverage panel from 1024px. Below that width,
   tap its compact row after Upcoming Drops to open the shared, content-sized
   settings sheet. Mode, Edition Preference and Airdrop Address remain in a
   column, with their original values, plain UTC update date and eligibility.
   Owner switches retain their original emerald design; Manual or Automatic
   and One edition or All eligible still follow their saved state. Loading uses
   skeleton controls, and failed reads show Unavailable without editable values.
   Pending updates retain their disabled controls and existing authentication,
   save, success/error feedback and refresh behavior. Visitors see static values.
   The original edition explanation remains owner-only in the shared information
   tooltip beside its value; the mode explanation stays below Upcoming Drops.
   The shortened wallet address retains its full accessible name and hover,
   focus or tap tooltip, and the owner edit action is unchanged. Direct settings
   links focus the section or sheet heading. Close, Escape or the shared dimmed
   backdrop dismisses the sheet and restores focus to its row.
6. Open `Subscription History`: it is inline on desktop, or a compact row below
   Minting settings on screens below 1024px. In its sheet or section, choose Redeemed
   Subscriptions, Log History, or Top Up History. The selected pill is light;
   inactive pills are transparent with subtle outlines and a faint fill on hover.
   The labels have no counts. Pills stay on one horizontally scrollable row on
   narrow screens. One history view is shown at a time, retaining its original
   entry text, dates, addresses, transaction links, empty state and independent
   pagination. Phone redeemed rows place the title and Etherscan link first,
   address and time second, and Balance after redemption third. Top-up rows keep
   amount and transaction link first, then sender and time. Time has no separate
   bordered footer row.

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
  place, with uncropped 80 × 113 artwork from 640px and 48 × 68 artwork on phones.
  Below 640px, today's artwork sits above the full-width text, so its controls
  align with the right edge of the later rows. The owner quantity picker and
  switch stay paired beside the Meme name when there is room, or below it on
  narrower rows, still aligned right. Visitors keep quantity and subscription status together with
  the same responsive placement. Below 768px, More expands the original mint-day allocation details as text
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
  - is available on web and Android
  - shows modal states for wallet confirm, pending confirmation, success, and
    error
  - can show `View Tx` while pending or after success
  - keeps wallet-confirm and pending states open while work is in progress;
    success and error states can be dismissed with the close control, backdrop,
    or Escape
  - keeps long transaction errors contained in a keyboard-focusable,
    scrollable status panel
- `Upcoming Drops`:
  - one amber `Funded through` boundary follows the supplied last funded drop;
    with no funded-through point, `Next unfunded` precedes the supplied next
    unfunded drop instead. There are no repeated row tags or additional Top up
    links; stale coverage does not mark rows
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
  be refreshed. Retry fetches the subscription data again. Missing balance,
  settings, airdrop-address and upcoming-drop data show Unavailable after a
  failed request, rather than a zero balance, an empty list or an indefinite
  loading label. A successfully loaded zero balance or empty list keeps its
  normal display.
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
