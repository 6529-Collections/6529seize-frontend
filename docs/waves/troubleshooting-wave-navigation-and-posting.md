# Wave Troubleshooting

## Overview

Use this page when wave routes, tabs, jumps, posting actions, or drop-link
behavior do not match expectations.

## Location in the Site

- Wave routes: `/waves`, `/waves/{waveId}`, and `/waves/create`
- Direct-message wave routes: `/messages?wave={waveId}`
- Wave link targets using `drop`, `serialNo`, and `divider` query parameters

## Entry Points

- A shared wave link opens an unexpected route or context.
- A target drop does not appear after opening a `serialNo` link.
- A wave looks read-only when you expected to post.
- Leaderboard, outcomes, or submission surfaces look empty or blocked.

## User Journey

1. Confirm route format and wave context first.
2. Confirm that the active wave state allows the action you want.
3. Confirm tab and drop-target behavior for the current wave type.
4. Retry from canonical links or by refreshing the thread context.

## Common Scenarios

- Shared link opened unexpected route:
  verify whether the link should be `/waves/{waveId}` or
  `/messages?wave={waveId}`.
- Legacy links use `?wave=...`:
  open the link and let it normalize to canonical `/waves/{waveId}`.
- `serialNo` link does not jump immediately:
  wait for historical-page fetch, then retry scroll/jump controls.
- Cannot post in chat:
  verify whether the wave is currently closed (`Wave is closed`) or whether the
  current context is read-only.
- Expected tab is missing:
  confirm whether the wave supports that tab in its current state, then use the
  first available tab fallback.
- `Copy link` is unavailable:
  check whether the drop is temporary or clipboard permissions are blocked.
- Memes submission is blocked:
  fix artwork or Additional Information validation errors, then retry.
- Leaderboard/outcomes appear empty:
  validate that the wave currently has eligible drops/outcomes and refresh to
  retry data loading.

## Edge Cases

- Chat-only waves do not render a tab strip.
- Some direct-message wave actions route through `/messages` even when equivalent
  wave routes exist under `/waves/{waveId}`.
- `drop` and `serialNo` have different behavior; links carrying both values use
  drop-open behavior first.
- Unread-divider and pending-message controls can combine on mobile contexts.

## Failure and Recovery

- If wave loading appears stale, refresh the route to resync wave metadata and
  tab availability.
- If pagination fails while reading older drops, keep the current thread open
  and retry by scrolling again.
- If a `serialNo` jump stalls, continue browsing manually; controls remain usable
  while data backfills.
- If copy fails, retry after granting clipboard permission or switching to a
  secure browser context.
- If posting or submission fails due validation, correct required fields and
  retry without leaving the flow.
- If route-level rendering fails entirely, use
  [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
  for fallback behavior.

## Limitations / Notes

- Route-level troubleshooting and in-thread state troubleshooting are separate:
  route errors use shared app boundaries; wave interaction issues recover
  in-place.
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
