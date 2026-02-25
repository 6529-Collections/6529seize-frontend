# Internal Link Navigation

## Overview

Internal links across content-heavy pages use in-app route navigation and hash
section jumps. Users normally stay in the same browser tab and move directly to
the destination route or section.

## Location in the Site

This behavior appears in multiple areas, including:

- Editorial and archive-style pages such as `/about/*`, `/author/*`,
  `/category/*`, `/education/*`, `/museum/*`, `/news/*`, and `/om/*`.
- About and policy content modules that link to internal routes.
- Community and open-data entry points.
- Delegation and collection navigation links.
- Activity, leaderboard, Meme Lab, and rememe entry links.

## Entry Points

- Click an internal route link in page content.
- Click an internal CTA in a content module.
- Click an in-page hash link (for example, `#requirements` or `#content`).

## User Journey

1. User selects an internal link.
2. The app navigates to the linked route in the current tab.
3. If the link uses a hash target, the page jumps to that section after load.
4. Browser back/forward returns to previous route or hash position.

## Common Scenarios

- Open linked posts from author and category pages.
- Open linked collection pages from museum index pages.
- Open open-data destinations from community download surfaces.
- Open `All Collections` from delegation views.
- Open full activity from the `View all` action in activity panels.
- Open Meme Lab cards or rememe detail routes from list views.
- Jump to an on-page section such as `view requirements`.

## Edge Cases

- Some internal links intentionally open in a new tab when they include
  `target="_blank"` (for example, selected informational links).
- Hash links only scroll when the destination element ID exists.
- Links to older paths can still resolve through legacy redirects before the
  final destination loads.

## Failure and Recovery

- If a destination route cannot be resolved, users see the shared not-found
  surface or shared route error screen and can return with browser back or
  sidebar navigation.
  - [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
- If redirected destinations are unavailable, users see the destination
  route's failure state and can retry by refreshing or reopening the link.
- If a hash target is missing, users remain on the same page and can scroll
  manually to the needed section.

## Limitations / Notes

- Hash jumping depends on stable section IDs in page content.
- Route-level access rules and redirects still apply after link navigation.
- Users can still open internal links in a new tab via browser actions (for
  example, Cmd/Ctrl-click or middle click).

## Related Pages

- [Navigation Index](README.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Legacy Route Redirects](../shared/feature-legacy-route-redirects.md)
- [Docs Home](../README.md)
