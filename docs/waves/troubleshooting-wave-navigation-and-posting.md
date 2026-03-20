# Wave Navigation and Posting Troubleshooting

## Overview

Use this page when wave links open the wrong thread, serial jump links miss the
target drop, tabs look wrong, or posting/submission is blocked.

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages?wave={waveId}`
- Legacy wave link: `/waves?wave={waveId}` (redirects to `/waves/{waveId}`)
- Thread query values: `drop`, `serialNo`, `divider`

## Fast Recovery Flow

1. Confirm route family first: `/waves/{waveId}` or `/messages?wave={waveId}`.
2. Reopen the thread from the sidebar/list and copy a fresh link.
3. Remove stale query keys (`drop`, `serialNo`, `divider`) and retry from the
   thread root.
4. Refresh once.
5. If posting is blocked, match the exact footer message in
   [Posting and Submission Checks](#posting-and-submission-checks).

## Route and Link Checks

- Link opens the wrong thread:
  verify whether the target is a wave thread (`/waves/{waveId}`) or a direct
  message thread (`/messages?wave={waveId}`), then update saved/shared links.
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

- Footer shows `You cannot participate in this wave at the moment`:
  both chat and submission are blocked for your current context.
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
- `/messages` shows no thread content:
  `Select a Conversation` is expected when no `wave` query is active.

## Edge Cases

- Temporary drops (`temp-*`) disable `Copy link`.
- Closing single-drop view removes `drop` from the URL.
- Unread-jump and pending-message controls can merge into one stacked control
  when both states are active.

## Limitations / Notes

- Posting availability changes in real time by auth, proxy state, wave
  eligibility, submission period, and per-user limits.
- Serial jump depends on the target serial being reachable in available history.
- `drop` overlays and `serialNo` jump navigation are separate mechanisms.

## Related Pages

- [Waves Index](README.md)
- [Wave Participation Flow](flow-wave-participation.md)
- [Wave Chat Serial Jump Navigation](chat/feature-serial-jump-navigation.md)
- [Wave Chat Scroll Behavior](chat/feature-scroll-behavior.md)
- [Wave Chat Composer Availability](chat/feature-chat-composer-availability.md)
- [Wave Content Tabs](chat/feature-content-tabs.md)
- [Wave Drop Open and Copy Links](drop-actions/feature-open-and-copy-links.md)
- [Wave Leaderboard Drop States](leaderboard/feature-drop-states.md)
- [Memes Submission Workflows](memes/feature-memes-submission.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
