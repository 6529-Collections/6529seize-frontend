# Public Wave Read-Only View

## Overview

Signed-out users who open a direct wave link on web can read publicly resolvable
waves without connecting a wallet.

The signed-out view keeps the normal wave shell and exposes a read-only subset
of the thread experience:

- `Chat`
- `Leaderboard`
- `Winners`
- `Outcome`
- `Sales`
- `FAQ`
- in-thread search
- share/copy wave link
- single-drop overlays opened from the thread or safe tabs

The signed-out view does not expose mutation surfaces:

- posting or submissions
- voting
- reactions
- curation actions
- reply or quote actions
- right-sidebar controls
- single-drop chat side panel
- `My Votes`

## Location in the Site

- Direct wave route: `/waves/{waveId}` while signed out on web.
- Web renders the read-only thread inside the normal waves shell.
- Native app still uses the regular connect-wallet gate.

## User Journey

1. Open a direct wave link while signed out on web.
2. The app resolves the wave for public viewing.
3. While the wave is loading, the page shows `Loading wave...`.
4. When the wave resolves publicly, the signed-out user sees the wave in
   read-only mode instead of the old locked preview card.
5. The user can browse safe tabs, search the thread, copy/share the wave link,
   and open read-only single-drop overlays.
6. To post, vote, react, curate, or access gated surfaces, connect a wallet.

## Common Scenarios

- Shared `/waves/{waveId}` links can now show the actual thread contents in a
  signed-out web session when the wave is publicly resolvable.
- On desktop web, the left waves list remains visible while the right thread
  pane shows the read-only wave.
- If a signed-out desktop user returns to `/waves` without a selected wave, the
  thread pane still shows `Select a Wave` with a connect-wallet CTA.
- Single-drop overlays opened from `?drop={dropId}` stay read-only and do not
  expose the side chat panel.

## Failure and Recovery

- If the wave cannot be resolved publicly while signed out, the thread pane
  shows `This wave isn't available publicly` with a connect-wallet CTA.
- If you need posting, reactions, voting, curation, or `My Votes`, connect a
  wallet and reopen the same route.

## Limitations / Notes

- This read-only flow applies only to direct `/waves/{waveId}` routes on web
  while signed out.
- Native-app waves routes still use the regular connect-wallet gate.
- Public read-only mode intentionally hides all mutation-capable surfaces.

## Related Pages

- [Waves Index](README.md)
- [Wave Participation Flow](flow-wave-participation.md)
- [Wave Troubleshooting](troubleshooting-wave-navigation-and-posting.md)
- [Wave Header Controls](header/feature-wave-header-controls.md)
- [Wave Sidebars Index](sidebars/README.md)
