# Wave Troubleshooting

## Overview

Use this page when wave links open the wrong place, jump links miss their
target, tabs look wrong, or posting is unavailable.

## Location in the Site

- Wave thread route: `/waves/{waveId}`
- Direct-message thread route: `/messages?wave={waveId}`
- Legacy wave route: `/waves?wave={waveId}` redirects to `/waves/{waveId}` and
  keeps other query values
- Deep-link query values: `drop`, `serialNo`, `divider`
- `serialNo` and `divider` are one-time hints and are removed after initial
  load

## Entry Points

- A shared link opens the wrong route or thread.
- A target drop does not appear after opening a `serialNo` link.
- Posting is blocked when you expected to post.
- Leaderboard, outcomes, or submission surfaces look empty.

## User Journey

1. Confirm route format and whether the thread is wave or direct message.
2. Confirm that current wave state allows your action.
3. Confirm tab visibility and drop-target behavior for this wave type.
4. Retry from canonical links or refresh the thread.

## Common Scenarios

- Shared link opened the wrong route:
  verify whether it should be `/waves/{waveId}` or `/messages?wave={waveId}`.
- Legacy link uses `/waves?wave={waveId}`:
  open it and let it normalize to `/waves/{waveId}`.
- `serialNo` link does not jump immediately:
  wait for older-drop fetch to finish, then retry jump controls.
- `serialNo`/`divider` disappeared from the URL:
  expected; those query values are consumed once on load.
- Cannot post in chat:
  if composer shows `Wave is closed`, posting is disabled for that wave.
- Expected tab is missing:
  wave type/state can hide tabs; use the available tab set.
- `Copy link` is unavailable:
  temporary drops (`temp-*`) do not support copy.
- Memes submission is blocked:
  fix required Artwork or Additional Information fields, then retry.
- Leaderboard or outcomes look empty:
  confirm the wave currently has eligible data, then refresh.

## Edge Cases

- Chat-only waves do not render the desktop tab strip.
- Direct-message wave actions can keep the thread URL as
  `/messages?wave={waveId}`.
- `drop` links open drop context in-thread; closing that view removes `drop`
  from the URL.
- Unread-divider and pending-message controls can appear together on mobile.

## Failure and Recovery

- If wave loading looks stale, refresh to resync metadata and tab availability.
- If older-drop pagination fails, keep thread open and retry by scrolling.
- If a `serialNo` jump stalls, keep browsing and retry after data backfills.
- If posting or submission fails due to validation, fix required fields and
  retry.
- If route-level rendering fails entirely, use
  [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
  for fallback behavior.

## Limitations / Notes

- Route failures and in-thread state issues use different recovery paths.
- Action availability can change by wave type, voting state, and user
  permissions.

## Related Pages

- [Waves Index](README.md)
- [Wave Participation Flow](flow-wave-participation.md)
- [Wave Chat Scroll Behavior](chat/feature-scroll-behavior.md)
- [Wave Chat Composer Availability](chat/feature-chat-composer-availability.md)
- [Wave Content Tabs](discovery/feature-content-tabs.md)
- [Wave Drop Open and Copy Links](drop-actions/feature-open-and-copy-links.md)
- [Wave Leaderboard Drop States](leaderboard/feature-drop-states.md)
- [Memes Submission Workflows](memes/feature-memes-submission.md)
