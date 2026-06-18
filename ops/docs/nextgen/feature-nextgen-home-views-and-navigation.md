# NextGen Home Views and Navigation

Parent: [NextGen Index](README.md)

## Overview

- `/nextgen` uses one home shell with four views: `Featured`, `Collections`,
  `Artists`, and `About`.
- `Featured` is the default view.
- `/nextgen/collection/*`, `/nextgen/token/*`, and `/nextgen/manager` are
  separate route families outside this home-shell view switch.

## Location in the Site

- Featured: `/nextgen`
- Collections: `/nextgen/collections`
- Artists: `/nextgen/artists`
- About: `/nextgen/about`

## Entry Points

- Open `/nextgen` directly.
- Open a view URL directly (`/nextgen/collections`, `/nextgen/artists`,
  `/nextgen/about`).
- Use the NextGen header tabs.
- Use `Learn More` in `Featured` to switch to `About`.
- Click the NextGen logo to return to `Featured`.

## User Journey

1. Open `/nextgen`.
2. The header shows the NextGen logo, tab links, and `LFG: Start the Show!`.
3. In `Featured`, review the highlighted collection and open
   `Explore Collection`.
4. Switch to `Collections`, optionally filter by status, and open a collection
   card.
5. Switch to `Artists` to open profile and collection links from grouped rows.
6. Switch to `About` for project background content.

## Common Scenarios

- `Featured` shows hero details for the featured collection, an
  `Explore Collection` action, slideshow preview, and featured artist panel.
- Header `LFG: Start the Show!` opens the NextGen slideshow overlay.
- `Collections` supports `ALL`, `LIVE`, `UPCOMING`, and `COMPLETED`.
- Changing the collections status filter resets pagination to page `1`.
- `Collections` shows `No collections found` when a loaded filter/page has no
  results.
- `Artists` groups collections by artist wallet and lists collection links for
  each artist row.
- On `xl` and smaller layouts, the shared collections dropdown appears under
  the header.

## Edge Cases

- There is no dedicated `/nextgen/featured` route. `Featured` is `/nextgen`.
- Unknown `/nextgen/{view}` values fall back to `Featured` instead of not-found.
- For home-shell URLs, only the first segment is used for view matching.
  Example: `/nextgen/collections/anything` still opens `Collections`.
- Dedicated subroutes (`/nextgen/collection/*`, `/nextgen/token/*`,
  `/nextgen/manager`) are handled by their own routes, not this view matcher.
- If the featured payload resolves without a valid collection id, the route
  shows a question-mark placeholder image.

## Failure and Recovery

- Initial load for all home views depends on the featured-collection fetch on
  the server route.
- `Collections` and `Artists` fetch data client-side with no inline retry
  control.
- `Collections` has no explicit loading indicator.
- `Artists` has no explicit empty/error message.
- If a tab looks empty or stale after a failed request, refresh the route to
  retry the fetches.

## Limitations / Notes

- Tab switching uses client-side `history.pushState` and updates the URL
  without a full reload.
- Browser back/forward restores entries with stored `view` state, but returning
  to the initial entry can leave the previous tab visible until refresh.
- `Collections` filter and page state are not encoded in the URL.
- `Artists` view is not paginated.

## Related Pages

- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [Docs Home](../README.md)
