# Wave Discovery

## Overview

`/discover` shows `Worth Checking Out` first and `Active Votes` second.
Worth Checking Out remains the default. Both are available without connecting a wallet,
subject to wave visibility rules.

## Active Votes

Open `/discover?view=active-votes`, or select `View all` in the Active Votes
sidebar heading. The page shows the total accessible count and compact discovery
cards with cover artwork on the left, single-line ellipsized
titles and single-line description previews. Tight padding keeps more cards visible. A prominent line beneath each wave name
shows the voting end or next decision when available, otherwise `Voting open`. Votes closing soonest appear first; open-ended votes appear last.
Use `Load more` to browse additional results.

This includes ongoing TDH, TDH + xTDH, and card-set TDH votes, regardless of
whether you have joined or pinned the wave. Upcoming, ended, completed and unresolved-decision waves are
excluded. DMs, subwaves of DMs and inaccessible waves are excluded, even when
you can read the DM parent. Visibility does not guarantee
that your profile meets a wave's voting rules.

Initial loading uses matching shimmer cards. No-active-votes and request-failure
states are explicit. Select
`Try again` after a request failure. The count and list refresh periodically.

## Worth Checking Out

Open `/discover?view=recommendations&sort=QUALITY` from the sidebar's
`View all` link in the Worth Checking Out sidebar heading. The existing discovery grid, sort options,
score filters and pagination remain available. Switching views preserves those
URL settings. Recommendations focus on waves outside the viewer's followed set.
Signed-out visitors see the heading `Active discussions`, without following
language. Signed-in personal views say `Active discussions you are not yet
following`. The Newest sort uses `Newest waves` for everyone.

Selecting a wave opens its thread. Existing auth and access rules still apply
when interacting there.

## Navigation and Search

The `Discovery` destination remains available in web navigation, app drawer,
mobile navigation and header search Pages results. The Profile Waves Feed content header has a labeled `Discover Waves` link
with a compass, aligned right on desktop and below the description on smaller
screens. The sidebar uses each section’s `View all` link.

The sidebar's `Find a wave…` searches accessible waves across collections;
there is no new relevance algorithm or route-local search on `/discover`.

## Related Pages

- [Wave List Navigation](../sidebars/feature-wave-list-navigation.md)
- [Discover Cards](feature-discover-cards.md)
