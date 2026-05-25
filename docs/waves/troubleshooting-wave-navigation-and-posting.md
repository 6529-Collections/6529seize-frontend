# Wave Navigation and Posting Troubleshooting

## Overview

Use this page when wave links open the wrong thread, serial jump links miss the
target drop, tabs look wrong, quick vote is unavailable, or posting/submission
is blocked.

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
- Legacy wave link: `/waves?wave={waveId}` (redirects to `/waves/{waveId}`)
- Thread query values: `drop`, `serialNo`, `divider`

## Entry Points

- Open a saved or shared `/waves/{waveId}` link.
- Open a saved or shared `/messages/{waveId}` link.
- Open deep links that include `drop`, `serialNo`, or `divider`.
- Recover from hidden quick-vote, blocked posting/submission, or missing-tab
  states inside a thread.

## User Journey

1. Confirm route family first: `/waves/{waveId}` or `/messages/{waveId}`.
2. Reopen the thread from the sidebar/list and copy a fresh link.
3. Remove stale query keys (`drop`, `serialNo`, `divider`) and retry from the
   thread root.
4. Refresh once.
5. If posting is blocked, match the exact footer message in
   [Posting and Submission Checks](#posting-and-submission-checks).

## Common Scenarios

- A saved/shared link opens the wrong thread or bounces back to `/waves` or
  `/messages`.
- A signed-out direct `/waves/{waveId}` link shows the locked preview instead
  of the full thread.
- A `serialNo` or `drop` deep link does not reopen the expected in-thread
  context.
- A memes quick-vote trigger is missing or the quick-vote dialog cannot load.
- Posting, submissions, or tab visibility do not match what the user expects.

## Route and Link Checks

- Link opens the wrong thread:
  verify whether the target is a wave thread (`/waves/{waveId}`) or a direct
  message thread (`/messages/{waveId}`), then update saved/shared links.
- Signed-out direct `/waves/{waveId}` link shows a locked preview instead of the
  full thread:
  expected for resolvable member-only waves. Connect a wallet to continue into
  chat, tabs, and posting surfaces.
- Signed-out direct `/waves/{waveId}` link shows `This wave isn't available publicly`:
  the wave could not be resolved for public preview. Connect a wallet to check
  whether your account can access it, or reopen a different wave from the list.
- Legacy link uses `/waves?wave={waveId}`:
  expected behavior is redirect to `/waves/{waveId}` while preserving other
  query values. Save the normalized URL after load.
- Thread URL opens, then returns to `/waves` or `/messages`:
  the selected wave id is unavailable or stale. Reopen from sidebar/list and
  copy a fresh link.
- Thread does not load and shows access/setup gates:
  resolve the shown state first (`Connect wallet`, profile setup prompt, or
  `This content is not available`), then reopen the thread.
- URL has `drop={dropId}` but no single-drop view opens:
  remove `drop`, then reopen from thread actions. When both `drop` and
  `serialNo` exist, drop-open handling takes precedence.
- `serialNo` link does not jump immediately:
  older targets can require history fetch first. Keep the thread open until
  loading settles, then retry the jump action.
- `serialNo` and `divider` disappear after load:
  expected when `serialNo` parses as a valid integer. They are one-time setup
  values.
- `serialNo` is ignored:
  invalid values are ignored. `divider` applies only when `serialNo` is valid.

## Posting and Submission Checks

- Footer shows `Connect your wallet to participate in this wave`:
  both chat and submission are blocked because the current viewer is signed out.
- Footer shows `You cannot participate in this wave at the moment`:
  both chat and submission are blocked for your current context, but not
  because the current viewer is signed out.
- Footer shows `Wave is closed`:
  chat is disabled for the current chat-type wave context.
- Footer shows a chat restriction:
  `Please log in to participate in chat`, `Proxy users cannot participate in chat`,
  `You don't have permission to chat in this wave`, or
  `Chat is currently disabled for this wave`.
- Footer shows a submission restriction:
  `Please log in to make submissions`, `Proxy users cannot make submissions`,
  `You don't have permission to submit in this wave`,
  `Submissions haven't started yet`, `Submission period has ended`, or
  `You have reached the maximum number of drops allowed`.
- Memes submission cannot continue:
  upload artwork, complete required fields, fix inline validation errors, then
  submit again.

## Quick Vote Checks

- Quick-vote trigger is missing on desktop web:
  quick vote appears only on non-`/messages` waves shells and only when you
  still have remaining voting power plus at least one unrated memes
  submission.
- Quick-vote trigger is missing in app/mobile thread view:
  it appears only in the main non-DM wave view and is hidden on other tabs or
  while a single-drop overlay is open.
- Quick-vote dialog shows `You're all caught up`:
  there are no unrated memes left for the current viewer, or remaining voting
  power is exhausted.
- Quick-vote dialog shows `Couldn't load your queue`:
  retry from `Try again`. If the error persists, reopen the wave and try quick
  vote again from a fresh thread state.

## Tabs and Empty-State Checks

- Expected tab is missing:
  tab availability changes by wave type and voting state. Chat-type waves hide
  the desktop tab row (`Chat`, `Leaderboard`, `Winners`, and related tabs).
- `Winners` is missing:
  it appears only after the first decision has passed.
- `Leaderboard` is missing:
  it can disappear after voting ends.
- `Sales` is missing:
  it appears only in curation waves.
- Leaderboard looks empty:
  `No drops to show`, `No curated drops yet`, and
  `No artwork submissions yet` are valid empty states.
- Sales looks empty:
  `No sales yet.` is valid until winning drops expose usable sale links.
- Winners/Outcome looks empty:
  `No Winners Yet`, `No winners yet`, and `No outcomes to show.` are valid
  until results are available.
- `/waves` shows no thread content on signed-out desktop web:
  `Select a Wave` is the expected placeholder when no wave is selected yet.
- `/messages` shows no thread content:
  `Select a Conversation` is expected when no conversation is selected.

## Edge Cases

- Temporary drops (`temp-*`) disable `Copy link`.
- Closing single-drop view removes `drop` from the URL.
- Signed-out preview mode on `/waves/{waveId}` does not open right sidebar
  surfaces or single-drop overlays.
- Unread-jump and pending-message controls can merge into one stacked control
  when both states are active.

## Failure and Recovery

- Reopen the thread from the sidebar/list and save a fresh normalized link.
- Remove stale `drop`, `serialNo`, and `divider` values before retrying the
  thread root.
- If a signed-out direct wave link shows only the locked preview, connect a
  wallet to continue into thread interactions.
- If posting or submissions stay blocked, use the exact footer copy to identify
  the current restriction and retry after resolving that state.
- If quick vote stays hidden, confirm that you are inside a supported waves
  surface and that the current viewer still has unrated memes plus remaining
  voting power.

## Limitations / Notes

- Posting availability changes in real time by auth, proxy state, wave
  eligibility, submission period, and per-user limits.
- Serial jump depends on the target serial being reachable in available history.
- `drop` overlays and `serialNo` jump navigation are separate mechanisms.

## Related Pages

- [Waves Index](README.md)
- [Wave Participation Flow](flow-wave-participation.md)
- [Public Wave Preview](feature-public-wave-preview.md)
- [Wave Chat Serial Jump Navigation](chat/feature-serial-jump-navigation.md)
- [Wave Chat Scroll Behavior](chat/feature-scroll-behavior.md)
- [Wave Chat Composer Availability](chat/feature-chat-composer-availability.md)
- [Wave Content Tabs](chat/feature-content-tabs.md)
- [Wave Drop Open and Copy Links](drop-actions/feature-open-and-copy-links.md)
- [Wave Leaderboard Drop States](leaderboard/feature-drop-states.md)
- [Memes Quick Vote](memes/feature-memes-quick-vote.md)
- [Memes Submission Workflows](memes/feature-memes-submission.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
