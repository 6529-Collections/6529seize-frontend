# Open Data Routes and Download States

Parent: [Open Data Index](README.md)

## When to Use This Page

Use this page when an Open Data route is missing, looks blank, shows an error,
or a download link does not open.

## Quick Route Map

- Hub route (cards only): `/open-data`
- API routes with inline loading and error banners:
  `/open-data/network-metrics`, `/open-data/rememes`, `/open-data/royalties`
- API route without inline loading/error banners:
  `/open-data/meme-subscriptions`
- Static links route (no API fetch): `/open-data/team`

## `Meme Subscriptions` card is missing on `/open-data` (native iOS)

- Meaning: this is a visibility rule on the hub card, not a route outage.
- Why it happens:
  - The card is hidden on native iOS when cookie-country is not `US`.
  - The card can stay hidden briefly while country-check is still loading.
- What to do:
  1. Open `/open-data/meme-subscriptions` directly.
  2. Wait for country-check to finish, then reopen `/open-data`.
  3. On web, open `Tools -> Open Data -> Meme Subscriptions` from the sidebar.

## `Failed to load community downloads. Please try again.`

- Affected routes:
  - `/open-data/network-metrics`
  - `/open-data/rememes`
  - `/open-data/royalties`
- Meaning: the dataset request failed on that route.
- Note: if this happens after changing pages, older rows can stay visible under
  the error banner.
- What to do:
  1. Reload the same route.
  2. Open another Open Data dataset route to check if the failure is route-specific.

## Route shows heading only (no table, no loading banner, no error banner)

- Most common route: `/open-data/meme-subscriptions`
- Meaning: this route does not render inline loading or inline error banners.
- What this usually means:
  - First load is still in progress, or
  - First request failed and nothing has rendered yet.
- Later page-request failures keep the previously loaded rows visible and show
  no inline error.
- What to do:
  1. Reload `/open-data/meme-subscriptions`.
  2. Reopen `/open-data/meme-subscriptions` directly.

## `Nothing here yet` is shown

- Meaning: the request succeeded with zero rows.
- This is an empty success state, not a route failure.
- What to do:
  1. Try another dataset route.
  2. Return later when new export files are published.

## Pagination controls are not visible

- Meaning:
  - API routes show pagination only when total results are greater than `25`.
  - `/open-data/team` never shows pagination because it uses a static links table.
- What to do: treat this as expected behavior for small result sets.

## Download link does not open

- Meaning: Open Data links open in a new tab and may be blocked by browser
  popup settings.
- What to do: allow new tabs/popups for the site and retry the link.

## `/open-data/team` has no loading or API error banner

- Meaning: expected behavior. The Team route is a fixed links table and does
  not call a dataset API.
- What to do:
  1. If links are visible, this is expected behavior.
  2. If a link does not open, allow new tabs/popups and retry.

## Related Pages

- [Open Data Index](README.md)
- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Team Downloads](feature-team-downloads.md)
