# Public Wave Preview

## Overview

Signed-out users who open a direct wave link can see a locked preview of that
wave before connecting a wallet.

The preview shows:

- wave name
- a compact description preview when one exists
- joined/member count
- post count
- a blurred thread-style background
- a `Connect Wallet` call to action

## Location in the Site

- Direct wave route: `/waves/{waveId}` while signed out on web.
- Desktop web renders the preview inside the normal waves shell.
- Small-screen web renders the preview card without desktop sidebars.
- Native app uses the regular connect-wallet gate instead of this preview.

## Entry Points

- Open a shared `/waves/{waveId}` link while signed out.
- Revisit a previously opened wave thread after your session expires or after
  logging out.

## User Journey

1. Open a direct wave link while signed out on web.
2. The app resolves the wave summary for that `waveId`.
3. While the summary is loading, the page shows `Loading wave...`.
4. When the wave resolves, the full thread is replaced with a locked preview
   card.
5. The preview shows the wave name, a compact description preview, joined count,
   and post count.
6. Select `Connect Wallet` to continue into the authenticated experience.

## Common Scenarios

- Shared links to member-only waves still show enough context for signed-out
  users to confirm they opened the intended wave.
- On desktop web, the left waves list can remain visible while the thread area
  shows the locked preview.
- If a signed-out desktop user returns to `/waves` without a selected wave, the
  thread pane shows `Select a Wave` with a connect-wallet CTA instead of the
  locked preview card.
- If a wave has no description preview, the title, counts, and connect action
  still render.

## Edge Cases

- Description preview text removes raw `http(s)` URLs, collapses whitespace, and
  shortens long text before display.
- Right sidebar surfaces are not available in this signed-out preview state.
- Single-drop overlays do not open from `?drop={dropId}` until the user
  connects.
- Direct-message routes do not use this preview flow.

## Failure and Recovery

- If the wave summary cannot be resolved publicly while signed out, the thread
  pane shows `This wave isn't available publicly` with a connect-wallet CTA.
- If a saved link opens `/waves` without a valid `waveId`, reconnect and reopen
  a direct wave link.
- If you need the full thread, reactions, or posting controls, connect a wallet
  and reopen the same route.

## Limitations / Notes

- This is a summary-only preview, not a readable thread.
- The preview does not expose posting, reactions, followers/about sidebars, or
  drop-detail overlays.
- The preview currently applies only to direct `/waves/{waveId}` routes on web
  while signed out.
- Native app routes do not use this preview flow.

## Related Pages

- [Waves Index](README.md)
- [Wave Participation Flow](flow-wave-participation.md)
- [Wave Troubleshooting](troubleshooting-wave-navigation-and-posting.md)
- [Wave Header Controls](header/feature-wave-header-controls.md)
- [Wave Sidebars Index](sidebars/README.md)
