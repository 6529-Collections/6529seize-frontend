# Wave Discovery

## Overview

`/discover` shows `Worth Checking Out` first and `Active Votes` second.
Worth Checking Out remains the default. Both are available without connecting a wallet,
subject to wave visibility rules.

## Active Votes

Open `/discover?view=active-votes`, or select `View all` in the Active Votes
sidebar heading. The page shows the total accessible count and compact discovery
cards with cover artwork on the left, single-line ellipsized
titles and single-line description previews. Approval waves show how many
submissions are open for voting. Other waves show the voting end or next result
when available, otherwise `Voting open`. Submission counts appear as text;
zero submissions use muted text. Score, Hot and REP remain visible beneath the
plain-text description. Metrics wrap when needed on narrow cards. Cover artwork
fills the full card height along the left edge. A subtle border separates each
card from the page and brightens on hover without lifting the card or zooming
the artwork.
The Memes - Main Stage appears first whenever it has active voting. Remaining
waves with active leaderboard entries appear above waves with zero. Within
each group, the waves with the highest total Wave REP appear first.
Use `Load more` to browse additional results.

This includes ongoing TDH, TDH + xTDH, and card-set TDH votes, regardless of
whether you have joined or pinned the wave. Upcoming, ended, completed and unresolved-result waves are
excluded. DMs, subwaves of DMs and inaccessible waves are excluded, even when
you can read the DM parent. Visibility does not guarantee
that your profile meets a wave's voting rules.

Initial loading uses matching shimmer cards. No-active-votes and request-failure
states are explicit. Select
`Try again` after a request failure. The count and list refresh periodically.

## Worth Checking Out

Open `/discover?view=recommendations&sort=QUALITY` from the sidebar's
`View all` link in the Worth Checking Out sidebar heading. The existing discovery grid, sort options,
and score filters remain available. Switching views preserves those
URL settings. Recommendations focus on waves outside the viewer's followed set.
Signed-out visitors see the heading `Active discussions`, without following
language. Signed-in personal views say `Active discussions you are not yet
following`. The Newest sort uses `Newest waves` for everyone.

Use Balanced, Quality, Hot, REP, Newest, or Latest Posts to choose the order.
On compact layouts, select the current sort button to open all six choices in a
bottom sheet. Selecting a choice closes the sheet. Escape, the close button, or
the backdrop closes it without changing the sort. Wider content areas show the
six choices inline.

The same control row includes All, Score 50+, Hot 60+, and REP 60+ threshold
buttons. Swipe or scroll the row when it does not fit the available width. The
scrollbar is hidden, and dark edge fades indicate which side has more controls
offscreen. Use the edge arrows with a mouse, or swipe the row on touchscreens.
The fades and arrows disappear when all controls fit.
Newest and Latest Posts disable score thresholds and reset them to All.
Sort and threshold choices remain in the URL when switching between discovery
tabs. Use `Score formula` beside the heading to open the score explanation; on
compact layouts, the calculator icon has the same accessible name and tooltip.
The score page keeps the originating Discover view, including its sort and
threshold. In the app, use Back in the header to return to that view. The page's
`Back to previous page` link provides the same return path on the web.

Selecting a wave opens its thread. Existing auth and access rules still apply
when interacting there.

## Navigation and Search

The `Discovery` destination remains available in web navigation, app drawer,
mobile navigation and header search Pages results. The Profile Waves Feed content header has a labeled `Discover Waves` link
with a compass, aligned right on desktop and below the description on smaller
screens. The sidebar uses each section’s `View all` link.

In the native app, opening `Discover Waves` from Profile Waves Feed shows a
header `Back` button that returns to the feed at its saved reading position.
Switching Discover tabs, sort, or score filters keeps this return path. Opening
Discovery directly or from main navigation keeps its usual menu control.

The sidebar's `Find a wave…` searches accessible waves across collections;
there is no new relevance algorithm or route-local search on `/discover`.

## Related Pages

- [Wave List Navigation](../sidebars/feature-wave-list-navigation.md)
- [Discover Cards](feature-discover-cards.md)
