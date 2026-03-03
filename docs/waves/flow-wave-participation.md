# Wave Participation Flow

## Overview

This flow covers the normal wave journey: find a wave, open its thread, read
and interact with drops, post when eligible, and share links that reopen the
same context.

## Routes and URL State

- Discovery and list surfaces: `/discover`, `/waves`, and `/messages`
- Standard wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages?wave={waveId}` (no `/messages/{waveId}`
  route)
- App create routes: `/waves/create` and `/messages/create`
- Web create mode uses query state on stream routes:
  `create=wave` or `create=dm`
- Legacy profile alias: `/{user}/waves` redirects to `/{user}`
- Legacy wave route: `/waves?wave={waveId}` redirects to `/waves/{waveId}` and
  keeps other query params
- `serialNo={n}` targets a drop for initial in-thread jump
- `divider={n}` is only used with `serialNo` to place an unread divider
- After initial jump setup, `serialNo` and `divider` are removed from the URL
- `drop={dropId}` opens a single-drop overlay in the current thread context
- Closing the single-drop overlay removes `drop` from the URL

## Entry Points

- Open a wave card from `/discover` or `/waves`.
- Open a direct-message thread from `/messages`.
- Open a shared wave link, for example:
  `/waves/{waveId}?serialNo={serialNo}` or
  `/messages?wave={waveId}&serialNo={serialNo}`.
- Open a shared single-drop link using `drop={dropId}`.
- Start create-wave from desktop create controls (`create=wave`) or
  `/waves/create` in app mode.
- Start create-DM from desktop create controls (`create=dm`) or
  `/messages/create` in app mode.

## Main Journey

1. Open a wave from a list surface.
2. The app opens `/waves/{waveId}` (standard wave) or
   `/messages?wave={waveId}` (direct message).
3. The thread renders:
   - Chat-only for chat-type waves.
   - Tabbed views for eligible waves (`Chat`, `Leaderboard`, `Winners`,
     `Outcome`, and wave-specific tabs).
4. Read and navigate drops with unread markers, serial jumps, and search jump
   actions.
5. Use drop actions (reply, react, vote, open drop, copy link, boost, and other
   available actions) based on wave and drop eligibility.
6. Submit new content when participation is allowed.
7. Share links so others can reopen the same wave or target drop.

## Key User-Visible States

- If no wave is selected on desktop list routes, the UI shows selection
  placeholders (`Select a Wave` or `Select a Conversation`).
- Access requires an authenticated wallet plus a profile handle.
- Proxy sessions cannot access wave/message participation surfaces.
- Tab choice is stored per wave and restored when still valid for that wave.
- If a saved tab is no longer available, the UI falls back to the wave's
  default available tab.
- When posting is blocked, thread content stays readable and the composer area
  shows blocked states (for example `Wave is closed` or
  `You cannot participate in this wave at the moment`).
- If `drop` and `serialNo` are both present, the single-drop overlay remains
  active while serial/divider bootstrap params are consumed and cleaned up.

## Failure and Recovery

- If a wave is not found, the app removes stale wave routing state and returns
  to the relevant base list route.
- If a serial-target jump is delayed or times out, users remain in the thread
  and can continue browsing.
- While drops are loading, the thread shows a loader; if no drops exist, it
  shows `Start the conversation`.
- Temporary drops (`temp-*`) keep some actions limited; link copy is disabled
  until the drop is persisted.

## Related Pages

- [Waves Index](README.md)
- [Wave Discovery Index](discovery/README.md)
- [Wave Chat Index](chat/README.md)
- [Wave Drop Actions Index](drop-actions/README.md)
- [Wave Creation Index](create/README.md)
- [Wave Winners Tab](leaderboard/feature-winners-tab.md)
- [Wave Outcome Lists](feature-outcome-lists.md)
- [Memes Submission Workflows](memes/feature-memes-submission.md)
- [Wave Troubleshooting](troubleshooting-wave-navigation-and-posting.md)
