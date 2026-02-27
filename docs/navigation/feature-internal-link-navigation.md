# Internal Link Navigation

## Overview

Internal links move users between in-app routes and in-page sections without
leaving the product.
Most links open in the same tab.
Hash links jump to a section when the target ID exists.

## Location in the Site

- Open Data cards linking to `/open-data/*`.
- Delegation collection notes linking to `All Collections`.
- `NFT Activity` header links to `/nft-activity`.
- Profile TDH boost link to `/network/tdh#tdh-1-4`.
- Mapping-tool `#how-to-use` anchors.
- Drop markdown links in `/waves/{waveId}` and `/messages?wave={waveId}`.

## Entry Points

- Click an internal route link.
- Click a hash anchor.
- Open a drop that contains a URL.

## User Journey

1. User selects an internal link.
2. Standard route links navigate in the current tab.
3. Hash links jump to the target section when that ID exists.
4. In drop markdown, links render as either preview cards or plain clickable
   links.
5. Same-origin wave/group/drop links can render in-thread cards with link
   actions.
6. Browser back/forward returns to the previous route or hash position.

## Common Scenarios

- Open `/open-data/*` routes from Open Data hub cards.
- Open `All Collections` from a delegation collection page note.
- Open `/nft-activity` from a `View All` link in activity panels.
- Open `/network/tdh#tdh-1-4` from profile TDH boost breakdown.
- Jump to `#how-to-use` in delegation and consolidation mapping-tool pages.
- Open a drop markdown link and use preview-card `Open`/`Copy` actions when
  shown.

## Edge Cases

- Drop authors can hide previews for their own drop; links stay clickable and
  show one inline `Show link previews` control.
- Same-origin quote/drop preview rendering has cycle and depth guards; guarded
  links fall back to usable plain links.
- Preview fetch or rendering failures fall back to a generic preview or plain
  link.
- Hash links only scroll when the destination ID exists.
- Internal links explicitly marked with `target="_blank"` open a new tab.
- Browser modifiers (Cmd/Ctrl-click or middle-click) can still open a new tab.
- Invalid or malformed markdown URLs are not rendered as clickable links.

## Failure and Recovery

- If a destination route cannot be resolved, users see shared not-found or
  route-error screens and can return with browser back or navigation controls.
  - [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
- If preview rendering fails, fallback link behavior still lets users navigate.
- If a hash target is missing, users stay on the loaded page and can scroll.

## Limitations / Notes

- Hash jumping depends on stable section IDs in rendered page content.
- Route-level access rules and redirects still apply after link navigation.
- Drop markdown link behavior is origin-aware.
- Markdown links must be valid URLs to render as clickable links.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Legacy Route Redirects](../shared/feature-legacy-route-redirects.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
- [Link Preview Toggle](../waves/link-previews/feature-link-preview-toggle.md)
- [Wave Drop Quote Link Cards](../waves/drop-actions/feature-quote-link-cards.md)
- [Docs Home](../README.md)
