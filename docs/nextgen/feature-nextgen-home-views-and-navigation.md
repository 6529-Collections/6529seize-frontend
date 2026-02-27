# NextGen Home Views and Navigation

Parent: [NextGen Index](README.md)

## Overview

The NextGen home route supports four top-level views: `Featured`,
`Collections`, `Artists`, and `About`.

## Location in the Site

- NextGen home and featured view: `/nextgen`
- Collections directory view: `/nextgen/collections`
- Artists directory view: `/nextgen/artists`
- About view: `/nextgen/about`

## Entry Points

- Open `/nextgen` directly.
- Use the NextGen header tabs (`Featured`, `Collections`, `Artists`, `About`).
- Use browser back/forward after switching views.

## User Journey

1. Open `/nextgen`.
2. Use the header tabs to switch between featured content and directory views.
3. In `Featured`, open `Explore Collection` to move into a collection route.
4. In `Collections`, filter by status and open a collection card.
5. In `Artists`, open artist or collection links from grouped artist cards.
6. In `About`, read static project background and return to another view.

## Common Scenarios

- `Featured` includes a hero section, countdown/mint CTA, slideshow preview, and
  featured artist.
- `Collections` supports status filtering (`ALL`, `LIVE`, `UPCOMING`,
  `COMPLETED`) plus pagination.
- `Artists` groups collections by artist address and lists linked collections.
- Mobile layouts show the shared collections dropdown below the NextGen header.

## Edge Cases

- Unknown `/nextgen/{view}` values resolve to the featured content shell.
- If featured collection payload is missing, the route shows a question-mark
  placeholder image.

## Failure and Recovery

- Directory fetch failures can result in empty surfaces without a dedicated
  inline retry control.
- Refreshing `/nextgen` or reopening the route retries home-view requests.

## Limitations / Notes

- Header-view state is route-based, but collection/artists filter state is not
  encoded for shareable deep links.
- `Artists` view is not paginated.

## Related Pages

- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [Docs Home](../README.md)
