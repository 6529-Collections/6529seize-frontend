# Wave Participation Flow

## Overview

This flow covers the normal wave journey: find a wave, open its thread, read
and interact with drops, post when eligible, and share links that reopen the
same context.

## Location in the Site

- Discovery and list surfaces: `/`, `/waves`, and `/messages`
- Standard wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
- App create routes: `/waves/create` and `/messages/create`

## Routes and URL State

- Discovery and list surfaces: `/`, `/waves`, and `/messages`
- Standard wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
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

- Open a wave card from `/` (home sections) or `/waves`.
- Open a direct-message thread from `/messages`.
- Open a shared wave link, for example:
  `/waves/{waveId}?serialNo={serialNo}` or
  `/messages/{waveId}?serialNo={serialNo}`.
- Open a shared single-drop link using `drop={dropId}`.
- Start create-wave from desktop create controls (`create=wave`) or
  `/waves/create` in app mode.
- Start create-DM from desktop create controls (`create=dm`) or
  `/messages/create` in app mode.

## User Journey

1. Open a wave from a list surface.
2. The app opens `/waves/{waveId}` (standard wave) or
   `/messages/{waveId}` (direct message).
3. If the user is signed out on a direct `/waves/{waveId}` link, the app can
   show a locked public preview instead of the full thread.
4. The thread renders:
   - Chat-only for chat-type waves.
   - Tabbed views for eligible waves (`Chat`, `Leaderboard`, `Winners`,
     `Outcome`, and wave-specific tabs).
5. Read and navigate drops with unread markers, serial jumps, and search jump
   actions.
6. Open `Rules` from the desktop right sidebar or the mobile `About`
   information path to review automatic wave rules and any creator-added
   custom rules.
7. Use drop actions (reply, react, vote, open drop, copy link, boost,
   admin-only pinned-drop updates, and other available actions) based on wave
   and drop eligibility. In memes-wave contexts, quick vote can also appear
   from dedicated footer triggers when unrated memes remain.
8. Submit new content when participation is allowed.
9. Share links so others can reopen the same wave or target drop.

## Common Scenarios

- Signed-out direct `/waves/{waveId}` links can show a locked preview with wave
  name, description preview, joined count, post count, and a connect-wallet
  CTA.
- If no wave is selected on desktop list routes, the UI shows selection
  placeholders (`Select a Wave` or `Select a Conversation`).
- `Rank` and `Approve` rules show two layers: automatic rules generated from
  wave settings and optional creator rules. Creator rules that require
  acceptance are enforced by the existing submit terms/signature modal.
- When posting is blocked, thread content stays readable and the composer area
  shows blocked states (for example
  `Connect your wallet to participate in this wave`, `Wave is closed`, or
  `You cannot participate in this wave at the moment`).

## Edge Cases

- Tab choice is stored per wave and restored when still valid for that wave.
- If a saved tab is no longer available, the UI falls back to the wave's
  default available tab.
- Proxy sessions cannot access wave/message participation surfaces.
- If `drop` and `serialNo` are both present, the single-drop overlay remains
  active while serial/divider bootstrap params are consumed and cleaned up.

## Failure and Recovery

- If a wave is not found, the app removes stale wave routing state and returns
  to the relevant base list route.
- If a signed-out direct wave link resolves, the locked preview loads instead of
  the full thread; connect a wallet to continue past that preview.
- If a serial-target jump is delayed or times out, users remain in the thread
  and can continue browsing.
- While drops are loading, the thread shows a loader; if no drops exist, it
  shows `Start the conversation`.
- Temporary drops (`temp-*`) keep some actions limited; link copy is disabled
  until the drop is persisted.

## Limitations / Notes

- Full participation requires an authenticated wallet plus a profile handle.
- Direct-message threads do not use the signed-out public preview flow.
- Shared links can preserve overlay/jump query state, but those bootstrap rules
  still depend on the current route context.

## Related Pages

- [Waves Index](README.md)
- [Home Boosted Drops and Most Active Waves](../home/feature-home-discovery-grids.md)
- [Wave Chat Index](chat/README.md)
- [Wave Drop Actions Index](drop-actions/README.md)
- [Wave Creation Index](create/README.md)
- [Wave Creation Rules Step](create/feature-rules-step.md)
- [Public Wave Preview](feature-public-wave-preview.md)
- [Wave Winners Tab](leaderboard/feature-winners-tab.md)
- [Wave Outcome Lists](feature-outcome-lists.md)
- [Memes Quick Vote](memes/feature-memes-quick-vote.md)
- [Memes Submission Workflows](memes/feature-memes-submission.md)
- [Wave Troubleshooting](troubleshooting-wave-navigation-and-posting.md)
