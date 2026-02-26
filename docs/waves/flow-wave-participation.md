# Wave Participation Flow

## Overview

This flow covers the common wave journey: finding a wave, opening its thread,
reading and interacting with drops, posting new content when allowed, and
sharing links that reopen the same context.

## Location in the Site

- Wave discovery and list surfaces: `/discover`, `/waves`, and `/{user}/waves`
- Wave thread routes: `/waves/{waveId}`
- Direct-message wave routes: `/messages?wave={waveId}`
- App-mode wave creation route: `/waves/create`

## Entry Points

- Open a wave card from discover, waves, or profile wave lists.
- Open a shared link with thread targeting:
  `/waves/{waveId}?serialNo={serialNo}` or
  `/messages?wave={waveId}&serialNo={serialNo}`.
- Open a legacy wave URL like `/waves?wave={waveId}` and let the app normalize
  it to `/waves/{waveId}`.
- Start a new wave from desktop create controls or from `/waves/create` in
  app mode.

## User Journey

1. Open a wave list and choose a wave card.
2. The app routes to `/waves/{waveId}` for standard waves or
   `/messages?wave={waveId}` for direct-message waves.
3. The wave thread renders with chat-only content or tabbed content (`Chat`,
   `Leaderboard`, `Winners`, and wave-specific tabs where available).
4. Read and navigate drops, including unread/divider jumps and serial-target
   link jumps.
5. Interact with drop controls (for example vote, react, open drop, copy link,
   curation, or media download) based on eligibility and drop type.
6. Post new content when the active wave allows submissions, including
   wave-specific flows like Memes artwork submission.
7. Share copied links so others can reopen the same wave and target drop.

## Common Scenarios

- Return to a previously opened wave and continue on the last valid tab.
- Open a shared `serialNo` link and jump to the targeted drop in-thread.
- Open a drop overlay (`drop` query) for focused single-drop interaction while
  staying in the same wave context.
- Start create-wave from desktop list/header/sidebar controls using
  `create=wave` URL state.
- Submit artwork in Memes waves from the leaderboard `Drop` action.

## Edge Cases

- Chat-type waves can render without the tab strip.
- If a saved tab is no longer available, the UI falls back to the first
  available tab for that wave.
- If chat is closed, thread content remains readable but composer actions are
  replaced by `Wave is closed`.
- Shared links with both `drop` and `serialNo` prioritize drop-open behavior.
- Legacy `/waves?wave=...` links are normalized to canonical `/waves/{waveId}`.

## Failure and Recovery

- If a serial-target jump cannot resolve immediately, users remain in the
  thread and can continue browsing while additional data loads.
- If chat or leaderboard pagination fails, already rendered content stays
  visible; retry by scrolling again or refreshing.
- If copy-link access is blocked by browser permissions, resolve permissions and
  retry copy.
- If content is unavailable for a tab (for example empty outcomes or empty
  leaderboard states), the UI shows explicit empty messaging instead of an
  indefinite loader.
- If posting or submission validation fails, users stay in the current flow
  until required fields are corrected.

## Limitations / Notes

- Tab selection is stored as UI state and is not encoded directly in the URL.
- Available tabs and actions depend on wave type, voting state, and user
  eligibility.
- `drop` and `serialNo` represent different navigation behaviors and should not
  be treated as interchangeable.

## Related Pages

- [Waves Index](README.md)
- [Wave Discovery Index](discovery/README.md)
- [Wave Chat Index](chat/README.md)
- [Wave Drop Actions Index](drop-actions/README.md)
- [Wave Creation Index](create/README.md)
- [Memes Submission Workflows](memes/feature-memes-submission.md)
- [Wave Troubleshooting](troubleshooting-wave-navigation-and-posting.md)
