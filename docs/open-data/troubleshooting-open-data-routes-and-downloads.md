# Open Data Routes and Download States

Parent: [Open Data Index](README.md)

## Overview

Use this page when an Open Data route is missing, blank, or not loading as expected.

## `Meme Subscriptions` is missing in hub/sidebar on iOS

- Causes:
  - In the native iOS app, the link is hidden when cookie-country is not `US`.
  - In the native iOS app, the link can be temporarily hidden while
    cookie-country is still loading.
- Recovery:
  1. Open `/open-data/meme-subscriptions` directly.
  2. If needed, confirm whether you are on native iOS and whether country check
     has finished.

## `Failed to load community downloads. Please try again.`

- Affected routes:
  - `/open-data/network-metrics`
  - `/open-data/rememes`
  - `/open-data/royalties`
- Note: if the failure happens after a page change, previously loaded rows stay
  visible under the error banner.
- Recovery:
  1. Reload the current route.
  2. If the issue continues, open a different Open Data dataset route to confirm
     whether the problem is route-specific.

## Route shows heading but no table or error

- Most common route: `/open-data/meme-subscriptions`.
- Cause: that route has no inline loading or error banner, so initial loading
  and initial-load failure can look the same.
- Recovery:
  1. Reload `/open-data/meme-subscriptions`.
  2. Re-open the route directly instead of from the hub.

## `Nothing here yet` is shown

- Meaning: the route responded with zero rows.
- Recovery:
  1. Try another dataset route.
  2. Return later when new exports are published.

## Pagination controls are not visible

- Cause:
  - API-backed routes show pagination only when total results are greater than
    25.
  - `/open-data/team` never shows pagination because it uses a fixed static
    links table.
- Recovery: this is expected behavior for smaller result sets.

## Download link does not open

- Cause: links open in a new tab and can be blocked by browser settings.
- Recovery: allow new tabs/popups for the site and retry the link.

## `/open-data/team` has no loading or API error banner

- Cause: the Team route uses a hard-coded links list, not an API request.
- Recovery:
  1. If links are visible, this is expected behavior.
  2. If a link does not open, allow new tabs/popups and retry.

## Related Pages

- [Open Data Index](README.md)
- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
