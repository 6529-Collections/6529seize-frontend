# Hover Cards and Tooltip Positioning

Parent: [Shared Index](README.md)

## Overview

Shared hover cards and tooltips stay anchored to their trigger during desktop
hover and keyboard-focus interactions. Placement is adjusted to keep content
readable when viewport bounds, scroll position, or card content changes while a
card is open. Profile hover cards can additionally surface top rep context when
that category data is available.

## Location in the Site

- Hoverable identity handles and avatars that open profile cards across wave
  feeds, leaderboard rows, mentions, and notification rows.
- Wave mention labels that open wave summary cards.
- Metric and stat labels that open compact helper tooltips.

## Entry Points

- Move the pointer over a supported hover target on a hover-capable device.
- Focus a supported trigger with keyboard navigation.
- Move pointer away or blur the trigger to close the card.

## User Journey

1. Hover or focus a tooltip trigger.
2. After the feature-specific show delay, a hover card/tooltip opens near the
   trigger.
3. The card chooses a placement that fits current viewport space.
4. While open, position updates when users scroll, resize the viewport, or when
   card content size changes.
5. Pointer leave or blur hides the card.

## Common Scenarios

- Hovering an author handle opens a compact profile card with identity details,
  follower summary, and quick actions when available.
- In profile cards that include rep breakdown data, users can see up to three top
  rep categories, ordered by rating and then contributor count.
- Each Top Rep entry shows a compact category label and a signed rating value.
- Hovering a wave mention opens a wave summary card with name, author, and
  drop/joined metrics.
- Tooltips near viewport edges can flip to another side to remain visible.
- Scrolling long pages while a card is open keeps the card aligned to the same
  trigger.

## Edge Cases

- Non-hover-capable layouts that disable hover wrappers show the trigger without a
  hover card.
- Cards whose content expands after opening (for example, delayed profile/wave
  data) are repositioned after the size change.
- If trigger layout shifts while a card is open, the card position is
  recalculated against the updated trigger location.
- Small viewports clamp card position to viewport padding when full ideal
  placement is not possible.
- If a profile has no rep categories yet, the card renders without the Top Rep
  section.

## Failure and Recovery

- If profile or wave details are unavailable, cards still open with available
  fallback content and can be retried by hovering/focusing again later.
- If pointer leaves before show delay completes, no card opens; users can
  re-hover to retry.
- If scrolling or viewport changes move content while a card is open, placement
  is recalculated without requiring manual close/reopen.

## Limitations / Notes

- Hover-card behavior depends on hover/focus input and is not a replacement for
  inline labels on touch-first interactions.
- Top Rep data is optional; absence of this data does not affect other profile
  card behavior or contents.
- Placement prioritizes viewport fit; the final side may differ from a preferred
  side when space is constrained.
- Show/hide timing can vary by feature using the shared tooltip wrapper.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Wave Discover Cards](../waves/discovery/feature-discover-cards.md)
- [Brain Wave List Name Tooltips](../waves/sidebars/feature-brain-list-name-tooltips.md)
- [Health Dashboard](../network/feature-health-dashboard.md)
- [Profile Stats Tab](../profiles/tabs/feature-stats-tab.md)
