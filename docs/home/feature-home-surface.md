# Home Page Surface

## Overview

The homepage `/` has been redesigned into a stacked surface with multiple functional sections in this order:

1. Hero text header.
2. Latest Drop panel.
3. Mission statement block.
4. Coming up section.
5. Boosted Drops.
6. Explore Waves.

The page is now visually separated into full-width section groups and intentionally hides some cards when source data is unavailable.
The homepage latest-drop area renders one of two card states:

- A current mint countdown/state card when the featured mint is active or unresolved.
- A next-drop preview card when a current mint has ended and a next winner exists.

The homepage now-minting section uses multi-card placeholders while its data is loading so the section layout remains stable before active card data resolves.

## Location in the Site

- Route: `/`
- Main entry point from primary navigation and root-level links.

## Entry Points

- Open `/` directly from browser.
- Open from any app route that links back to home.

## User Journey

1. Open `/`.
2. The hero header displays the brand label and primary headline without a descriptive subtitle line.
3. The latest-drop block resolves to one of two modes:
   - **Mint card mode**: shows mint title, countdown/status, and minting stats from the current collection card.
   - **Next Drop mode**: when a current mint has completed and a next winner is available, the latest-drop block swaps to a `Next Drop` card that shows scheduled mint time, artwork/media, and next-card metadata.
4. The `NEXT MINT` tile in the latest-drop block shows the next scheduled mint start date and time from the shared mint schedule in local timezone.
5. The informational center text and quote block render after latest-drop.
6. The Coming up section loads the next queued card set and current leaders.
7. Boosted Drops renders a capped set of boosted cards from the global boosted-feed source.
8. Explore Waves loads a limited set of active waves and links to `/waves`.

## Common Scenarios

- First-load with data available:
  - Hero header and latest-drop are visible immediately.
  - If the current mint is active, latest-drop shows its current mint countdown and status.
  - Mission section appears as supporting copy.
  - When current mint has ended and a next winner is available, latest-drop shows a `Next Drop` preview card with image, author, and wave metadata.
  - Coming up, Boosted Drops, and Explore Waves sections show after their respective feed data arrives.
- Boosted Drops feed appears:
  - Cards are presented in a fixed 1/2/3-column responsive grid (mobile / tablet / desktop), with no horizontal-scrolling row behavior.
  - Up to six cards are shown on small and medium breakpoints (`2×3`), and up to nine cards on large screens (`3×3`), based on currently available boosted feed items.
  - Card bodies can include preview links, media, and boosted-count badges.
  - Clicking a boosted card opens the card's wave context.
- Explore Waves feed appears:
  - The section headline reads `Tired of bot replies? Join the most interesting chats in crypto` with the helper line `Most active waves`.
  - Up to six wave cards render in a fixed responsive grid (mobile / tablet / desktop: `1 / 2 / 3` columns) without horizontal scrolling.
- Each card links to its wave route.
- The `View all` action is shown beneath the card grid.
- Message previews in each card show plain text in the snippet, so pasted URLs appear as text rather than clickable links in the compact preview.
- `View all` actions:
  - Boosted Drops has no global expand link.
  - Explore Waves links to `/waves` for the full list.

## Edge Cases

- Latest-drop loading or errors continue to be handled in the existing Now Minting surfaces.
- On the `/` latest-drop card, the `NEXT MINT` timestamp can differ from the displayed card’s created-at value because it is derived from the shared mint schedule.
- If boosted-feed data is unavailable or empty, the Boosted Drops section is omitted.
- If hot-waves data is unavailable or empty, Explore Waves is omitted.
- If the network request errors for Explore Waves, that section is omitted rather than rendering a persistent error card.
- The redesigned homepage no longer renders the previous submission carousel segment in this slot.
- In the latest-drop area, the "next-drop" fallback card appears only when the current mint is finished and replacement drop data is available; if no next-drop is ready, the site keeps the mint countdown card in its completion state instead.
- In Coming up, the next-winner card appears ahead of current leaderboard entries while the current mint has not ended; the leaderboard list adjusts so it still shows a total of two or three cards (including the replacement card).
- Message links in Explore Waves previews are non-actionable in the compact list; users open links by navigating into the wave detail context.

## Failure and Recovery

- If a section-level fetch fails and no cached data exists, that section does not render until successful data is available again.
- Retry the page flow by refreshing `/`; sections re-evaluate from their source queries.
- Global navigation remains available from unchanged areas while any section is hidden.

## Limitations / Notes

- This page is a composite of multiple feature surfaces; section-level behavior (countdowns, drop leaderboards, wave cards) is documented in their area pages.
- The homepage no longer provides a horizontally scrolling boosted feed control set in this redesign.
- The hero, boosted, and waves sections are fixed-grid layouts at their current breakpoints; there is no drag-to-scroll card rail.

## Related Pages

- [Home Index](README.md)
- [Media Memes](../media/memes/README.md)
- [Now Minting Countdown](../media/memes/feature-now-minting-countdown.md)
- [Latest Drop Stats Grid](../media/memes/feature-latest-drop-stats-grid.md)
- [Wave Drop Content Display](../waves/drop-actions/feature-content-display.md)
- [Docs Home](../README.md)
