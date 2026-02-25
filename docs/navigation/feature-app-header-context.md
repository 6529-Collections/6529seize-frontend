# App Header Context

## Overview

The top header reflects the current route context and keeps key identity and
navigation controls visible as users move across waves, messages, profile, and
collection routes.

## Location in the Site

- Any route rendered with the shared app shell.
- Especially visible on wave/message routes, profile routes, and `/`-scope
  pages that use the common header layout.

## Entry Points

- Open a route in `/waves`, `/messages`, a profile route like `/{user}`,
  or a collection route such as `/the-memes/*`, `/6529-gradient/*`,
  `/meme-lab/*`, `/nextgen/*`, `/rememes/*`.
- Open a wave from the list/sidebars while another context is already open.
- Start or return from wave/message create flows.

## User Journey

1. User opens a route in the app shell.
2. Header computes a title from route state:
   - `/waves/create` and `/messages/create` both show section names (`Waves`,
     `Messages`).
   - `/waves` and `/messages` with no active wave show section names.
   - `/waves/{id}` and `/messages?wave={id}` show the wave name for the active
     wave.
   - Collection routes like `/the-memes/{id}` become `The Memes #{id}`.
   - Rememe routes like `/rememes/{contract}/{tokenId}` become
     `Rememes {contract} #{tokenId}`, with abbreviated values.
   - Other routes use the last path segment, capitalized and formatted for
     display.
3. The left header control switches between menu and back affordances based on
   route context and navigation state.
4. Connected users can rely on identity avatar rendering in the same header area.

## Common Scenarios

- Wave list entry opens a wave: header title becomes the wave name.
- Navigating to collection routes shows numeric collection suffixes in the title.
- Returning to `/waves` or `/messages` removes wave-level title and shows section
  title.
- Profile routes use route-derived labels and fallback text where the display name is
  short or missing.
- Header title strings longer than the header width are shortened with
  middle-elision.

## Edge Cases

- While wave metadata is loading or refreshing, the header shows a loading
  indicator in place of the wave title.
- If a route has no matching collection token pattern, only the last path segment
  is used.
- Rememe and collection identifiers are shortened for readability; full values are
  not fully expanded in the header label.
- If no avatar image exists, the app keeps a shaped placeholder in that space.

## Failure and Recovery

- If active-wave metadata temporarily fails to resolve, the header reverts to
  fallback title logic and continues rendering the route context.
- If the page state is in flux while a title source updates, the header updates
  as route state stabilizes.

## Limitations / Notes

- Header title logic is visible behavior; exact internal routing details are
  implementation-only.
- Avatar rendering and resolved labels can vary by connection state and available
  profile data.

## Related Pages

- [Navigation Index](README.md)
- [Back Button](feature-back-button.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
