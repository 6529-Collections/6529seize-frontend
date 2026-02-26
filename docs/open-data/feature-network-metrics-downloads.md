# Network Metrics Downloads

Parent: [Open Data Index](README.md)

## Overview

`/open-data/network-metrics` shows consolidated network metric export files. The
page title and heading use `Consolidated Network Metrics`.

## Location in the Site

- Route: `/open-data/network-metrics`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> Network Metrics`

## Entry Points

- Open the `Network Metrics` card on `/open-data`.
- Open `/open-data/network-metrics` directly.

## User Journey

1. Open `/open-data/network-metrics`.
2. The page loads with a `Consolidated Network Metrics Downloads` heading.
3. A paginated table appears with `Date` and `Link` columns.
4. Select a date row link to open the downloaded file in a new tab.
5. Use pagination to move through older result pages.

## Common Scenarios

- Download the most recent consolidated network-metrics file set.
- Browse older exports by changing page.
- Re-open later from bookmarks to continue where they left off.

## Edge Cases

- On first load, if no result page data exists yet, the table area can show an
  empty-state layout.
- The consolidated metrics view replaces the old dedicated consolidated metrics
  route; users should use `/open-data/network-metrics`.
- If a browser blocks new tabs, download links may not open automatically.

## Failure and Recovery

- While loading, a centered loading message is shown.
- If download metadata fails to load, the page shows
  `Failed to load community downloads. Please try again.`
- In a load failure, users can retry by reloading the page.

## Limitations / Notes

- This route uses the shared community download list component, so dataset
  structure and available fields match that pattern.
- The endpoint URL used by the app is backend-managed and can change without
  docs updates.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
