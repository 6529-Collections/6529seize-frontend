# Wave Discovery

## Overview

`/discover` offers `Active Votes` and `Worth a Look` views. The default
view is recommendations. Both are available without connecting a wallet,
subject to wave visibility rules.

## Active Votes

Open `/discover?view=active-votes`, or select `View all active votes` in the
Waves sidebar. The page shows the total accessible count and named wave cards.
Cards show the voting end or next decision when available, otherwise `Voting
open`. Votes closing soonest appear first; open-ended votes appear last.
Use `Load more` to browse additional results.

This includes ongoing TDH, TDH + xTDH, and card-set TDH votes, regardless of
whether you have joined or pinned the wave. Upcoming, ended, completed and unresolved-decision waves are
excluded. DMs, subwaves of DMs and inaccessible waves are excluded, even when
you can read the DM parent. Visibility does not guarantee
that your profile meets a wave's voting rules.

Loading, no-active-votes, and request-failure states are explicit. Select
`Try again` after a request failure. The count and list refresh periodically.

## Worth a Look

Open `/discover?view=recommendations&sort=QUALITY` from the sidebar's
`View all recommendations` link. The existing discovery grid, sort options,
score filters and pagination remain available. Switching views preserves those
URL settings. Recommendations focus on waves outside the viewer's followed set.

Selecting a wave opens its thread. Existing auth and access rules still apply
when interacting there.

## Navigation and Search

The `Discovery` destination remains available in web navigation, app drawer,
mobile navigation and header search Pages results. The Waves header also has
`Discover Waves`.

The sidebar's `Find a wave…` searches accessible waves across collections;
there is no new relevance algorithm or route-local search on `/discover`.

## Related Pages

- [Wave List Navigation](../sidebars/feature-wave-list-navigation.md)
- [Discover Cards](feature-discover-cards.md)
