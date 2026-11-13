# Profile Identity Tab

## Overview

`Identity` is the default profile tab at `/{user}`.
It combines `Rep` and `NIC` on one route.

- After first profile setup, the connected owner can use a getting-started card
  above the Identity content to explore Waves and learn about The Memes.
- Desktop shows both surfaces at the same time.
- Rep and NIC support direction toggles: `Received` and `Given`.
- Mobile switches between `REP`, `NIC`, and `ID Statements` subviews
  inside the same URL.

## Location in the Site

- Canonical route: `/{user}`
- Legacy alias: `/{user}/identity` (permanent redirect to `/{user}` and keeps
  query params)
- Unsupported legacy route: /{user}/rep (not found)

Desktop (`>= lg`):

- Left: Rep direction toggle, summary, categories, grant and category edit
  actions, activity log
- Right: NIC summary, ID statements, and `Rate NIC` entry point

Mobile (`< lg`):

- Grouped text-only section buttons: `REP`, `NIC`, and `ID Statements`.
  The buttons have no numbers.
- `REP` subview: `Total REP` with Received/Given beside the heading, the active
  direction's total in the content, contributor summary, categories,
  received-only `Grant Rep`, and REP activity log
- `NIC` subview: inline Received/Given, the selected total, received status,
  top-rater avatars, `Rate NIC`, and NIC activity log
- `ID Statements` subview: a possessive profile heading, short public-data
  description, statement card, and the statement add action beside the heading
  when editing is allowed. The statement count appears inside this view.

## Entry Points

- Open `/{user}` directly.
- Switch to `Identity` from another profile tab.
- Click `NIC` or `Rep` in profile header stats.
- Open a profile from header search (lands on default profile tab).

## User Journey

1. Open a profile at `/{user}`.
2. Read rep and NIC summaries.
3. In `Rep`, switch between `Received` and `Given` as needed.
4. Use `+N more` or `Load more` to reveal additional rep categories when
   available.
5. If actions are available, open `Grant Rep` (received only) or `Rate NIC`.
6. `Rate NIC` opens a modal; submit to save or select `Cancel` to close.
7. Review activity logs and apply filters.
8. On mobile, switch between `REP`, `NIC`, and `ID Statements` as
   needed.

## Getting Started After Profile Setup

After you choose and save your first profile username, your own Identity tab
shows a `Getting started` guide with `Your profile is ready`. The welcome recommends starting with a Wave,
a space for conversation, art, and community decisions. About statements remain
available through the
[profile editor](../navigation/feature-header-summary.md).

When successful profile setup finishes on Identity, the welcome waits until
profile content is visible, then scrolls into view once without moving keyboard
focus. Reduced-motion preferences prevent
animated scrolling. Returning to Identity or reloading the page does not repeat
this arrival scroll. If you started setup while creating a Wave, you return to
that flow instead.

- `Find a Wave` opens [Wave Discovery](../../waves/discovery/feature-discover-sections-and-search.md)
  at `/discover`. Waves are spaces for conversations, creative work, and
  community decisions.
- `The Memes Main Stage` opens the network's configured Main Stage Wave, where
  you can browse art submitted to The Memes collection.
- `Before you submit art` opens the existing `Unlock submissions`
  nomination and eligibility popover on desktop, anchored to the action without
  a modal backdrop. Hover or click opens it; Enter or Space opens it with focus,
  Tab reaches `Get nominated`, and Escape closes it and restores trigger focus.
  Touch-first devices and the native app keep the dialog or sheet titled
  `Before you submit art`; its close control returns focus to the action.
  Both show progress toward the `MemesNominee` REP requirement and the same
  `Get nominated` action. Nomination
  eligibility is separate from submission and does not guarantee selection. See
  [Wave Leaderboard Drop Entry and Eligibility](../../waves/leaderboard/feature-drop-entry-and-eligibility.md).
- `How 6529 works` opens the [Join 6529 guide](../../navigation/feature-join-6529-journey.md)
  at `/join-6529`.

The welcome and exploration paths sit side by side on larger screens and stack
on phones. The two main buttons share a row at equal widths on phones and stack
at full width on very narrow screens. Exploration arrows and descriptions stay
visible. If Main Stage details
are unavailable, the welcome and `Find a Wave` remain available.

The card is tied to the browser session in which the profile was created. It
can remain visible when you return to your own Identity tab in that session.
Select `Dismiss` in the guide's header (accessible name `Dismiss guide`) to remove it without
confirmation. Dismissal does not change your profile or prevent you from exploring
Waves; the card has no reopen action. You can open `/join-6529` separately for guidance.

Visitors, signed-out viewers, and active profile proxies do not see this card.
An ordinary visit to an existing profile in a new browser session does not
show the profile-creation welcome.

## Rep Behavior

- Rep has two directions:
  - `Received`: incoming rep to the viewed profile
  - `Given`: outgoing rep from the viewed profile
- `Total Rep` and contributor counts update with the active direction.
- The summary count is unique identities. A receiver with REP in several
  categories counts once overall and once in each applicable category. Category
  counts therefore need not add up to the summary count.
- Avatars beside the REP and NIC summary totals open those profiles.
  Select the rater/receiver count and chevron to open the full list.
- Direction-specific contributor labels:
  - `Received`: `rater` / `raters`
  - `Given`: `receiver` / `receivers`
- When signed in and viewing another profile, your existing contribution uses `You assigned:` with the same grouped number
  format as Total REP, without a plus sign. Negative totals retain their minus
  sign. On mobile and medium screens, this summary stays beside `Grant Rep`
  as a group at the right of the category heading. When space is tight, the
  summary moves below the button and stays right-aligned.
- Category headers show the name, total, up to three top-contributor avatars and
  rater/receiver count. Long names truncate. The tag opens the contributor
  panel, with separate desktop profile links on its avatars. Tags have no separate edit
  pencil; editing is available inside the panel when permitted.
- When signed in and viewing another profile, a nonzero personal amount is visible on each category tag, after a
  subtle dot separator: `You assigned:` in Received and `Assigned to you:` in
  Given. Your own profile omits these personal labels in both directions; each
  category total appears once. In your own Given view it is the total you
  assigned across that category’s receivers. Values use grouped integers, with a
  minus sign for negative amounts.
  Narrow tags place this on a second line with vertical padding and a gap below
  the title. Wider full-row tags place it beside the category name and total,
  with contributor avatars and count kept at the right. Tags grow to fit the
  personal amount comfortably.
- Category avatars are 24px. On desktop, hovering an avatar enlarges it and
  shows the profile name and REP contribution; clicking it opens that profile.
  The rest of the tag opens the contributor list. On touch devices, tapping
  anywhere on the tag, including its avatars, opens the list; profiles are
  linked inside that list. Avatars beside the summary totals still link to profiles.
- Select a category to open its list. Desktop Received and Given categories
  use the same compact tags, arranged side by side and wrapping as needed.
  The open tag keeps its size and position. A short filled bridge joins it to a
  full-width contributor panel directly below its row. Tags and panels use
  subtle fills. Tags have a faint border that strengthens slightly on hover;
  the joined panel has no outline. The count appears only in the category tag.
  Mobile and the native app use a draggable bottom sheet. One category opens at
  a time. Select the same category again, press Escape, or close the sheet.
- On mobile, the sheet fits above the keyboard and scrolls the focused amount
  into view after the keyboard settles.
- Lists show linked profiles and amounts, highest first. Long lists scroll;
  `Load more` retrieves additional contributors. The quiet `Open category ↗`
  action opens the global category view. It sits on the left of the footer
  when there are no unsaved changes, on desktop and mobile.
- Category list starts at 5 items.
- `+N more` reveals 10 additional already-loaded categories at a time.
- When the visible list reaches the end of the categories already loaded in the
  current direction but more server pages exist, the same control changes to
  `Load more`, requests the next categories page, shows `Loading...` while that
  request is in flight, and stays disabled until the next page finishes
  loading.
- `Received` and `Given` keep separate expanded category counts while you stay
  on the same profile route, so switching directions does not collapse the
  other direction's list back to 5 immediately.
- Opening a different profile route resets both directions to that profile's
  own category list, beginning again at 5 visible items.
- `Grant Rep` opens the existing category selection flow on every layout.
- In `Received`, eligible viewers open a category and edit their own pinned
  `You` row. Your own Received view is read-only.
- In your own `Given` view outside proxy mode, each receiver's amount is editable
  inside the category. This is the main way to adjust REP. Select the receiver
  count and chevron in the summary to open the complete sortable receiver list,
  with the same saving and allowance rules.
- Signed-out visitors and viewers without rating permission see read-only lists.
- Empty states are direction-aware:
  - Desktop: `This identity hasn't received any rep yet.` /
    `This identity hasn't given any rep yet.`
  - Mobile: `No rep received yet.` / `No rep given yet.`

### Grant Rep Dialog

- On desktop, Grant Rep and Rate NIC keep their top edge at about 14% of the
  viewport height while content grows downward. The rater and receiver lists
  for REP keep that positioning. NIC rater and receiver lists start about 10%
  down and grow to at most 80% of the viewport height. Long content scrolls
  inside. Mobile keeps the bottom sheet.
- Category search accepts 3-100 characters.
- Results appear after a short debounce as compact category pills, including the
  typed category and matching categories returned by the existing search.
- Similar categories remain independent and selectable. The exact
  `MemesNominee` pill is marked as counting toward the 50,000 REP submission
  requirement. When the typed value differs from it only by capitalization,
  spacing, punctuation, or Unicode width, the exact pill is surfaced first; the
  typed value remains available and look-alikes use subdued styling. Search
  guidance stays neutral until a category is selected. Selecting exact
  `MemesNominee` confirms the requirement in green; selecting a look-alike
  instead shows an amber informational note explaining that the categories are
  separate and only exact `MemesNominee` counts toward the requirement. All
  other category pills keep their existing behavior.
- Selecting an option validates availability. You can type an amount while
  rating data loads; submitting stays disabled until the current contribution
  and allowance are available.
- If availability fails, inline error is shown.
- Editing text after category selection clears selected category and amount.
- Amount accepts integers. Type the desired amount in Grant REP and Rate NIC.
  The plus/minus symbols indicate signed amounts and are not buttons.
- Enter the desired total, including any existing contribution.
- REP and NIC amounts show digit grouping, such as `12,345`, while unfocused.
  Focusing an amount shows plain digits for editing; the saved value is unchanged.
- The saved contribution prefills an untouched amount. Once you type, your
  draft stays in place through delayed responses and background refreshes.
- In non-proxy mode, amount clamps to allowed min/max on blur.
- `Grant Rep` stays disabled until category is selected, amount changed, amount
  is valid, and submit is idle.

### Edit an existing Rep category

- Open a tag. In another profile's `Received` view, your current
  contribution appears first in a pinned `You` row only if you have already
  given REP in that category, including a negative contribution. Use `Grant Rep`
  to add REP where you have no contribution. Authorized proxies use their
  grantor's contribution and allowance.
- On desktop, opening an existing contribution focuses its amount without
  selecting the digits. Mobile opens with the sheet title focused and does not open the
  keyboard automatically.
- Type the desired total, including negative integers. Enter zero to remove a
  rating. Other people's received contributions are read-only.
- Editable amounts use the Grant REP input's plus/minus symbols. Numbers are
  grouped while unfocused; focusing shows plain digits without selecting them. Read-only amounts
  are plain numbers.
  A changed field shows its signed adjustment beside the input. Increases use
  emerald and decreases use rose, including the proposed total in the footer.
  The footer compares the current and proposed category totals, with `Cancel` and `Save`.
  With no changes, it shows `Open category` and the available REP allowance
  for an eligible editor. Enter saves. Escape or Cancel discards the draft;
  Escape again closes the list. On desktop, saving keeps the same category open
  and updates its amounts immediately. Category tags keep their order while a
  panel or sheet is open; closing it restores the current ranking by total.
- In your own `Given` category, edit one or more receiver amounts. The footer
  compares the current and proposed category totals with an arrow, alongside
  `Cancel` and `Save`; neither amount is crossed out. On desktop, the receiver
  list and footer appear in the full-width panel joined below the category tag.
  Save applies changes sequentially,
  returning released credit before spending it elsewhere.
- Fields wait for the allowance to load. On failure, use `Try again`. Save is
  unavailable for invalid amounts or a combined allocation beyond the allowance.
- After a fully successful save, the mobile and native category sheet closes,
  dismissing the keyboard and returning focus to the category tag. Updated totals
  and the success message confirm the change. The desktop expandable stays open.
  During saving, the sheet header and drag handle stay in place; Back, Close,
  Escape and dragging are temporarily disabled so the sheet does not jump.
  Totals, counts and activity refresh before completion. If saving fails or only
  some updates succeed, the sheet stays open with failed edits available to retry;
  confirmed writes are kept.

### Localization fallback debt

- Surfaces: the Grant REP and Rate NIC dialogs under the profile Identity tab,
  including their desktop/mobile entry points, the category editor, and Current /
  Adjustment summaries. The category editor's title, allowance labels, input
  label, actions, feedback, and loading/retry states use `en-US` fallback
  messages in untranslated locales.
- Current fallback: `rep.categories.grant.*` messages use the canonical `en-US`
  source copy in locales without translated entries, including the REP amount
  label. New management lists, sort options and save controls use canonical
  en-US fallback messages and locale-aware numbers. Outside these surfaces,
  dialog titles, NIC labels and actions,
  unavailable-state Cancel buttons, proxy labels, and rating feedback retain
  existing English strings. Shared adjustment summaries also retain English
  strings. Rating summaries retain the existing comma-separated number formatting.
- User impact: supported non-English locales can see English copy and number
  formatting while both rating flows remain functional.
- Owner/follow-up: frontend localization maintainers can migrate the remaining
  strings and number formatting and add translations during the next profile
  localization pass.

## NIC and Statements Behavior

- NIC has `Received` and `Given` views on desktop and mobile.
- Both directions use a compact summary with a score, avatars and a count,
  matching REP. Avatars open individual profiles; the borderless count button
  and chevron open the full list. Owners can adjust their Given ratings there.
- On desktop, the NIC total is green, the received status sits beside its
  label, and the avatars, count and chevron appear below the total.
- `Received` shows the viewed profile's incoming NIC, status and raters.
  Select the rater count and chevron to inspect the full list.
  NIC lists also show the count above their rows; REP keeps counts in the
  profile summary.
- `Given` shows outgoing NIC and receivers. It does not assign an identity
  status to an outgoing total. On mobile, Received/Given sits beside the NIC
  heading, and the selected total appears below it in the content. A dash appears while the
  selected total is loading or unavailable.
  Select the receiver count and chevron to inspect or manage the full list.
- `Rate NIC` is available only in `Received` when the viewer can rate the target.
  On mobile, it sits on the right of the raters summary row. Your existing NIC
  rating stays beside the button when there is room, or below it and right-aligned
  when space is tight.
- The NIC editor loads the current total and allowance before enabling Save.
  If loading fails, select `Retry`. A background refresh keeps an entered draft.
- Enter the desired total, then select `Save`, or `Cancel` to leave without saving.
- Statement ownership: [Profile Identity Statements](feature-identity-statements.md).

## All Receivers for REP and NIC

1. Open your own profile, choose REP or NIC, and select `Given`.
2. Select the receiver count and chevron in the summary to open the full list.
   Recipients default to `Highest total first`. Owners and visitors can use `Sort by` in Received and Given to
   choose `Most recently adjusted`. `Load more` continues in the selected
   order, 25 people at a time. Reopening defaults to highest total first.
3. In REP, each row shows the receiver's linked handle, total and `Adjust`.
   Categories are not expanded under every receiver. Select `Adjust`, choose
   the existing category, then enter the desired total. A successful Save closes
   the entire management dialog or mobile bottom sheet and returns focus to the
   receiver-count button. Reopening shows the refreshed first page. Back returns one step and preserves the loaded list
   and scroll position; Cancel closes management without saving. New REP
   categories stay with `Grant Rep`. The expandable category tags remain the
   main way to adjust multiple receiver amounts together.
4. In NIC, edit the amount directly beside each person. A fixed footer shows
   available credit, or the current and proposed totals with `Cancel` and a
   green `Save` after an edit. Save applies all changed rows and stays in the
   refreshed list. Cancel resets drafts in place; Close exits. Escape resets
   drafts, then closes. While saving, Close stays visible but disabled, keeping
   the sheet header steady. Released credit is returned before other changes spend it.

Enter signed whole-number totals; zero removes a rating. Save is unavailable
for invalid numbers or changes beyond the allowance. Failed edits remain for
retry. Lists have loading, empty, retry and `Load more` states. Visitors see
public ratings with sorting but without adjustment controls. REP Received shows each
rater and their total, without expanding that person's categories.

Received and Given use the same subtle row background, circular avatar, linked handle
and right-aligned amount styling. Read-only values are plain numbers; eligible
editors get an amount input on the right in the category editor and NIC list.
REP receiver management keeps its existing Adjust flow.

Management is available to the connected owner outside proxy mode. Existing
proxy allocation entry points and permissions are unchanged. Linked handles
change color on hover without an underline. Mobile keeps the existing
bottom sheets and keyboard support; the NIC footer stays visible above the
safe area and software keyboard.

## Activity Log Behavior

- Direction filters retain compact tabs on desktop and mobile.
- Entries are compact rows separated by thin dividers.
- NIC changes explicitly name NIC, including historical activity stored as CIC.
- REP changes put the category before Rep and the recipient. The running total
  appears at the end in neutral grey. Added amounts are green; reductions are rose.

- The NIC log shows NIC rating edits and identity changes. REP and wave REP
  rating edits are excluded. The log-type and direction filters still apply.
- Desktop combined log includes:
  - matter tabs: `All`, `REP`, `NIC`
  - direction tabs: `All`, `Incoming`, `Outgoing`
  - NIC-only log-type filter when matter is `NIC`
- Mobile:
  - `REP` subview uses REP log with direction tabs
  - `NIC` subview uses NIC log with direction tabs and NIC log-type filter
- Loading uses three compact row placeholders before the activity entries appear.
- Changing the window between mobile and desktop layouts may briefly show the
  activity loading placeholders. While you stay on the same profile, each
  layout keeps its selected filters and current page when you return to it.
- Empty results show `No Activity Log`.
- If the first NIC activity page cannot load, `Unable to load activity log.`
  replaces the placeholders. Use `Retry` to try again. A failed later page
  keeps the current entries and paging controls available.

## Permissions and Visibility Rules

- Rep/NIC actions require a connected account with a profile handle.
- Outside proxy mode, you cannot rate your own profile.
- In proxy mode:
  - Rep actions require `AllocateRep`
  - NIC actions require `AllocateCic`
  - proxy grantor profile cannot be the target
- Mobile `REP`/`NIC`/`ID Statements` switching does not change URL state.

## Common Scenarios

- Desktop viewers compare `Rep` and `NIC` side by side on the same route.
- Mobile viewers switch between `REP`, `NIC`, and `ID Statements`
  without leaving `/{user}`.
- Profiles with many rep categories use `+N more`, then `Load more`, to reveal
  additional categories incrementally.
- Eligible viewers open `Grant Rep` from the received-rep surface or `Rate NIC`
  from the NIC surface.

## Edge Cases

- `Received` and `Given` keep separate expanded-category counts while you stay
  on the same profile route.
- Category spelling remains exact. Similar spellings stay separate and
  selectable, matching the existing Grant REP behavior.
- Mobile keyboards do not auto-capitalize or autocorrect category input.
- Opening a different profile resets the visible category counts back to that
  profile's initial list state.
- Outside proxy mode, self-rating is blocked even when the rest of the profile
  remains visible.
- Legacy `/{user}/identity` redirects into `/{user}`; unsupported
  `/{user}/rep` stays not-found instead of opening the default tab.

## Failure and Recovery

- Rep submit failures show an error toast and keep dialog values.
- NIC submit failures show an error toast and keep entered value.
- If loading a later categories page fails, already visible categories stay on
  screen; use `Load more` again or refresh the route to retry.
- Selecting `Cancel` closes NIC rating without applying changes.
- Statement fetch failures show an error panel with `Retry`; consolidated
  addresses remain available while statement groups are unavailable.
- Replace old `/{user}/rep` bookmarks with `/{user}`.

## Limitations / Notes

- Getting-started card messages use canonical `en-US` copy in locales without
  translations. The reused nomination guidance retains its
  existing English fallback copy. Actions and destinations remain available;
  frontend localization maintainers can translate these surfaces in a later
  profile localization pass.
- The NIC activity loading-error message and `Retry` use `en-US` fallback copy
  where translations are unavailable; frontend localization maintainers can
  translate those message keys without changing this flow.
- This page documents the combined default profile tab only; other profile tabs
  have separate route and behavior rules.
- Action availability still depends on wallet, profile-handle, and proxy
  permission context at runtime.
- Mobile subview switching is local UI state and does not create a distinct URL
  for `REP`, `NIC`, or `ID Statements`.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Identity Statements](feature-identity-statements.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
