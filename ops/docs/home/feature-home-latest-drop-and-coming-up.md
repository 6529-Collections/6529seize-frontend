# Home Latest Drop and Coming Up

## Overview

On `/`, home has two data-driven sections:

- `Latest Drop` (or `Next Drop` when the mint-end grace period has elapsed and
  a next winner exists)
- `Coming up` (next in queue plus top current leaders)

Use this page for visibility rules, state switches, and route targets.

## Location in the Site

- Route: `/`
- `Latest Drop` actions:
  - Drop title: `/the-memes/{id}`
  - Artist handles: `/{handle}` (can render multiple handle pills)
  - Distribution plan link (inside `Edition Details`): `/the-memes/{id}/distribution`
  - Main Stage submission link (inside `Edition Details`, when mapped):
    `/waves/{mainStageWaveId}?drop={dropId}`
  - Mint action: `/the-memes/mint` (countdown state only)
  - Subscription info link: `/about/subscriptions`
  - Connected profile subscription link: `/{user}/subscriptions`
- `Next Drop` actions (top-section replacement mode):
  - Drop title: `/waves?wave={waveId}&drop={dropId}`
  - Mapped Meme card pill: `/the-memes/{id}`
  - Wave row link: `/waves/{waveId}`
  - Artist link: `/{handle}` (only when handle exists)
  - Subscription info link: `/about/subscriptions`
  - Connected profile subscription link: `/{user}/subscriptions`
- Current and upcoming The Memes detail pages:
  - Subscription info link: `/about/subscriptions`
  - Connected profile subscription link: `/{user}/subscriptions`
- `Coming up` actions:
  - Below 768px, cards stack vertically at full width with space between them.
    Tablet uses two columns and desktop uses three.
  - Card title: `/waves/{waveId}?drop={dropId}`
  - Card author: `/{handle}` or `/{primaryAddress}`
  - Collaborating cards combine the artist and accepted collaborators in one
    credit block. Up to four overlapping avatars include the artist first;
    two collaborator handles appear below the artist, with long names truncated.
    Remaining collaborators are counted in `+N` and `+N more`; `+N more` opens
    the drop's full credits. Visible names link to profiles, without level or
    trophy badges in the card.
  - Section `View all`: `/waves/{waveId}`

## Entry Points

- Open `/` directly.
- Return to `/` from any route.

## User Journey

1. Open `/`.
2. The top slot shows a loading placeholder until the initial artwork,
   mint-status, and next-winner checks finish. It then displays the selected
   artwork without briefly showing the previous drop first. Already loaded
   artwork stays visible during background refreshes.
3. The top slot then chooses one mode:
   - `Latest Drop` while the current mint is active and for the configured
     grace period after its scheduled end, or when no next winner is available.
   - `Next Drop` when the current mint is complete, its grace period has
     elapsed, and a next winner exists.
4. `Latest Drop` groups its details beside the artwork: title and artist;
   stats with `Edition Details` directly below; `Your allowance` when a wallet is
   connected; subscription awareness; then the countdown and mint action.
   `Edition`, `Status`, `Mint price`, and `Floor` share one row at 640px and
   wider, with a two-column layout on smaller screens.
   Countdown states are `Upcoming`, `Live`, `Mint Complete`, or `Error`. When
   the card has an explicit Main Stage mapping, edition details also includes
   `Main Stage Submission` → `View`.
   The homepage countdown keeps the complete phase heading, such as
   `Public Phase Ends In`, beside its status pill and the existing allowlist
   information icon when applicable. A separate dark row below centers the
   segmented timer. The panel and timer row use background contrast without
   outlines. Each number is zero-padded, such as `08m` and `05s`, with
   smaller unit labels. Days appear first when at least 24 hours remain. Zero
   days, hours, and minutes are still omitted; seconds always remain visible.
   A four-part timer uses two balanced rows in the narrowest content slots.
   The pill's slow ping stops under reduced motion. `Mint` remains below the
   box. Desktop keeps the previous reserved countdown height, with any extra
   space below the controls so the subscription row and countdown stay together.
   `Edition Details` opens and closes with a brief transition, or immediately
   when reduced motion is enabled. Collapsed links are excluded from keyboard
   navigation. File type and dimensions appear inside `Edition Details` when
   available; the artist row contains the artist identity without a media-type
   badge. Multiple artists have space between their profile links and wrap onto
   new lines on narrower screens. Long handles truncate within the card.
   `Next Drop` shows accepted collaborators below the artist with a separate
   `Collaborators` label and one compact profile per row, including available
   levels and badges.
5. `Coming up` resolves after app settings load and `memes_wave_id` is
   available.
6. `Coming up` then shows:
   - Optional `NEXT MINT` card (only when next winner exists, mint is not
     ended, and next-winner title differs from current mint title)
   - Top leaderboard cards from the same wave, sorted by prediction rating
7. `View all` opens `/waves/{waveId}` for that wave.

On mobile below 768px, `Coming up` is a vertical list of full-width cards
with 24px between them. Scroll the page to see the remaining cards. Tablet
uses two columns and desktop uses three. Status and mint date or TDH have a
dedicated row above the artwork that wraps when needed without covering it;
the title and artist links sit below. Artwork retains its
proportions without cropping. On phones, loaded still images use their natural
height at the card width, like Latest Drop. Tablet and desktop keep the 3:4
artwork frame. Keyboard users can tab through the links to
bring each card into view.

The Coming up subtitle keeps “Next in queue and current vote leaders.” and
adds the next scheduled decision when available. Times use the viewer's device
time zone, including daylight-saving changes, in 24-hour format. Decisions on
the viewer's current day say “Next decision today at …”; the following day uses
“tomorrow.” Decisions two to six calendar days away show the weekday; decisions
seven or more days away show the short month and day, without a year. The full
local date, time, and timezone remain available on hover. The time appears after the page loads and is omitted when the
schedule is missing or the decision time has passed, until updated wave data
provides another future decision. It describes the voting decision, not minting.

## Common Scenarios

- Mint active, next winner available:
  - Top slot: `Latest Drop`.
  - `Coming up`: `NEXT MINT` + top 2 leaders.
- Mint active, no next winner:
  - Top slot: `Latest Drop`.
  - `Coming up`: up to 3 leaders.
- Mint ended, next winner available:
  - Top section keeps `Latest Drop` through the configured grace period, then
    replaces it with `Next Drop`.
  - The `Next Drop` panel can show subscription awareness or controls for the
    canonical next mint.
  - When the winning drop includes an explicit Meme card mapping, the panel
    shows a `The Memes #{id}` pill linked to that card.
  - `Coming up` hides `NEXT MINT` and shows up to 3 leaders.
- Leaderboard still loading while `NEXT MINT` is ready:
  - `NEXT MINT` stays visible beside two loading placeholders when no leader
    cards are available yet. The placeholders disappear when the leader request
    finishes.
- `Coming up` initial load with no ready cards and no `NEXT MINT` card:
  - Three skeleton cards render while the required requests are loading.
- Returning to `Coming up` during the same app session:
  - Recently loaded leader cards remain available for up to five minutes after
    leaving the page. Older results refresh in the background when returning.
  - Pull-to-refresh keeps loaded leader cards visible while updating them.
  - A failed update keeps those cards visible.
  - Closing the app or changing the signed-in identity can clear saved cards.
- Slow current-artwork or mint-status details:
  - Leader cards can appear independently.
  - `NEXT MINT` appears only after the current artwork and mint status are
    known; an unresolved current artwork is not treated as a different mint.
- `Coming up` after load with no cards:
  - The full section is hidden.
- In `Coming up` leader cards:
  - first place can show `LEADING`
  - other positions use `{ordinal} PLACE` (for example `2nd PLACE`)

## Edge Cases

- If no current meme card is available after load and `Next Drop` conditions
  are not met, the top slot is hidden.
- If next-winner title matches current mint title (case-insensitive and
  trimmed), `Coming up` suppresses the `NEXT MINT` card.
- Main Stage submission and Meme card links are omitted when their explicit
  backend mapping is unavailable; home does not infer a relationship.
- The home `Next Drop` artwork panel includes a labeled local-time `Mint Date`
  alongside its wave, submission time, and rating details. These statistics sit
  below the title and creator, above `Your allowance` and subscriptions.
- On phone browsers and the mobile app, still artwork fills the panel width
  at its natural aspect ratio and keeps its details below the image.
- On iOS outside the US, the countdown `Mint` button is hidden.
- On iOS outside the US, or while the iOS country check is still loading, The
  Memes subscription row is not shown.
- The Memes subscription row is not part of the server HTML or the first render
  on any platform, because the page cannot yet tell whether it is the iOS app.
  Where the server renders a page that includes it (Meme card and upcoming Meme
  routes), a blank, invisible space of the row's height is reserved so the
  content below does not jump, and the row replaces it right after the page
  loads on web and Android. As soon as the page identifies the iOS app the space
  is removed and nothing is shown while the country check loads, except on a
  device whose last completed country check was US: there the blank space stays
  through the check, so a US result swaps the row in without a shift, and a
  non-US or unknown result removes the space. Without a US result remembered
  (first launch, another country, a failed check, or unavailable browser
  storage) nothing is shown while the check loads; a US result then inserts the
  row, and a non-US, unknown, or failed result leaves nothing. The remembered
  result only keeps the blank space; the row and its requests always wait for
  the current check. The space holds no text, icons, links, or controls.
- Latest Drop and mapped Next Drop cards omit `Your allowance` while no wallet
  address is available, including during initial connection. Once connected,
  compact wrapping pills list each nonzero Phase 0, Phase 1, Phase 2,
  or Public allocation, spelling out Airdrop and Allowlist counts; Public can
  contain Airdrop only.
- The allowance row distinguishes loading, an unpublished distribution, a
  published distribution with no matching allocation, and an unavailable
  lookup. It reports planned allocation, not whether it is still unused or
  mintable now.
- Latest Drop subscription awareness is read-only and links to subscription
  info/profile subscriptions without querying the upcoming-meme status endpoint
  for the current or already-dropped card.
- The current/latest `/the-memes/{id}` detail page uses the same awareness-only
  subscription row beside the mint countdown.
- When an unresolved `/the-memes/{id}` URL is the canonical next Meme and the
  Main Stage winner is explicitly mapped to that id, the page reuses the same
  artwork panel above the calendar without waiting for the current mint or the
  homepage grace period. Its Meme pill is static because the user is already on
  that card route, and subscription awareness stays inside the artwork panel.
- Other unresolved upcoming `/the-memes/{id}` pages keep the standalone
  subscription awareness widget followed by the next-mint calendar panel.
- Awareness-only rows do not embed the profile subscription editor. They show a
  blue read-only `Subscription Minting` box, a non-mutating on/off toggle,
  optional `xN` user subscribed count when already subscribed, an
  `xN subscribers` total, a contextual profile-subscriptions action, and a
  question-mark info link. The toggle stays beside the title and the contextual
  profile action is aligned at the far right. Counts, coverage, and the info
  link use the full width below. Labels can wrap; the narrowest cards place the
  action below the details, still aligned right, to avoid squeezing controls.
- For a connected non-proxy profile, the awareness row can also show the
  compact runway summary, for example
  `Automatic · 0.18 ETH · 4 drops funded`. Its action follows the coverage
  state: setup/settings for non-minters, upcoming choices for Manual mode with
  no selections, and top-up for low coverage.
- Detailed forecast fields, eligibility controls, quantity selectors, and
  subscription mutation controls are intentionally not shown in
  home/latest-card awareness rows.
- Without a connected profile, the subscription row can still show a read-only
  off toggle awareness state, a `Set up` action that opens wallet connection,
  and a link to `/about/subscriptions`.
- With a connected profile, the subscription row can link to
  `/{user}/subscriptions`; profile-specific subscription status/count only
  render when the related read-only APIs return data.
- Subscription changes and top-ups must be received by 00:00 UTC on the day
  before a Meme Card mint. Once a card is closed, enabling Automatic mode or
  making a first top-up does not mark it as subscribed. Its saved subscription
  choice is retained, and its total subscription count comes from the finalized
  list.
- On `/about/subscriptions`, users who can continue directly see a primary
  `Manage` action. Users who still need the wallet/profile handoff see
  `Connect to Subscribe`; it opens wallet connection and
  then routes to profile subscriptions once connected.
- In countdown error state, the `Next drop ...` status strip is not shown.
- On touch devices, interactive HTML media can require `Tap to load` before
  playback.
- Until app settings include `memes_wave_id`, `Coming up` stays hidden.

## Failure and Recovery

- If the latest artwork data fails to load, the top slot shows an error and
  a `Try again` button. The button shows `Trying again…` during the retry.
- A mint-status failure does not hide the artwork. Mint-dependent stats show
  `Unavailable`, and the countdown shows its error state until status recovers.
- Loaded artwork stays visible during background refreshes, including a
  refresh that fails. The homepage switches to `Next Drop` only after mint
  completion is confirmed, the grace period has elapsed, and a winner is ready.
- If latest-drop or coming-up content looks stale, refresh `/` to rerun home
  queries.
- If latest-drop actions fail, open routes directly:
  - `/the-memes/mint`
  - `/the-memes/{id}`
  - `/the-memes/{id}/distribution`
  - `/waves/{mainStageWaveId}?drop={dropId}`
- If `Coming up` card links fail, open:
  - `/waves/{waveId}`
  - `/waves/{waveId}?drop={dropId}`
- If `Next Drop` links fail, open:
  - `/waves/{waveId}`
  - `/waves?wave={waveId}&drop={dropId}` (single-drop target)

## Limitations / Notes

- The homepage top-slot grace period is configured by
  `HOME_LATEST_DROP_GRACE_PERIOD_MINUTES` in
  `helpers/mint-visibility.helpers.ts` and defaults to 10 minutes. The
  transition uses the calendar's scheduled mint-end instant as its shared
  deadline. The exact client render time can vary with the viewer's device
  clock and browser timer scheduling.
- `Coming up` uses prediction leaderboard ordering, not chronological ordering.
- Leader count is capped:
  - With `NEXT MINT` card: up to 2 leader cards
  - Without `NEXT MINT` card: up to 3 leader cards
- `Next Drop` uses mixed route styles:
  - title link: `/waves?wave={waveId}&drop={dropId}` (single-drop target)
  - wave row link: `/waves/{waveId}` (canonical wave route)
- The `Next Drop` Meme card pill uses the explicit `meme_card_id` returned in
  the winning drop’s submission context.
- `Coming up` cards use path-style routes (`/waves/{waveId}?drop=...`).
- `NEXT MINT` timestamps are displayed in the viewer's local timezone/locale.
- No auth or wallet gate is required to view these sections.

### Homepage loading-message localization fallback debt

- The artwork error, retry labels, Coming Up labels and loading status, and
  unavailable mint stats use the `en-US` fallback in partial `en-GB`, `de-DE`,
  `es-ES`, and `fr-FR` dictionaries.
- Non-English visitors may see these short messages in English. Frontend i18n
  follow-up should add reviewed translations for `home.latestDrop.*`,
  `home.comingUp.*`, and `home.nowMinting.stats.unavailable` and check their
  responsive presentation.

### `/about/subscriptions` localization fallback debt

- Route or component: `/about/subscriptions` and its subscription action.
- Untranslated surface: the restyled subscription guide and primary
  subscription action.
- Current fallback behavior: `en-GB`, `de-DE`, `es-ES`, and `fr-FR` use the
  complete `en-US` source messages for missing `about.subscriptions.*` keys.
- User impact: non-English locale users can see English subscription guidance;
  the page remains functional and locale-sensitive gas values still use the
  viewer's number and percentage conventions.
- Owner or follow-up issue: frontend i18n backlog.
- Expected remediation path: add reviewed translations for the
  `about.subscriptions.*` message family to each partial locale dictionary and
  repeat the responsive and assistive-technology QA pass.

## Homepage Presentation

- The homepage Next Drop card uses the same solid surface as the Waves cards,
  with quiet separators. The same panel on the upcoming Meme page retains its
  existing appearance.
- Both homepage Next Drop and Latest Drop states use the refined subscription
  row: a subtle background and border, a neutral title, and no shadow. Its
  controls, spacing, and behavior remain the same in both states.
- Artwork dimensions, grid proportions, details spacing, and type sizes are
  unchanged. Desktop image height follows the details column, so this refinement
  changes colour and decoration without changing that column's geometry.
- Wave, Submitted, Rating, and Mint date labels remain uppercase. All artist and
  collaborator information, media actions, allowance information, subscription
  controls, and existing disclosure behavior remain available.

## Related Pages

- [Home Index](README.md)
- [Home Landing and Section Navigation Flow](flow-home-landing-and-section-navigation.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Home Header and Mission Block](feature-home-header-and-mission.md)
- [Home Waves Discovery](feature-home-discovery-grids.md)
- [Now Minting Countdown](../media/memes/feature-now-minting-countdown.md)
- [Latest Drop Stats Grid](../media/memes/feature-latest-drop-stats-grid.md)
- [Wave Sort and Price Filters](../waves/leaderboard/feature-sort-and-group-filters.md)
- [Docs Home](../README.md)
