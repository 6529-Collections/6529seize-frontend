# Primary Address Reference Table Troubleshooting

## Overview

This page covers recovery and failure behavior for
`/about/primary-address`.

## Location in the Site

- Route: `/about/primary-address`

## Failure and Recovery

- If `"/primary_address.csv"` fails to load, the page shows:
  - `Error: Failed to fetch primary address data (<status>)`
  - Use the browser back button or refresh to retry the request.
- If the CSV is malformed, the page shows:
  - `Error: Failed to parse primary address data`
  - Refresh the page to retry parsing from the latest source file.
- If the CSV is valid but has no rows, the page still renders headers with an empty
  table body.
- If you encounter temporary data staleness, open the route again after a short
  delay to refresh the latest `/primary_address.csv` payload.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Flow](flow-primary-address-reference-table.md)
- [Profiles Route Errors](../troubleshooting/troubleshooting-routes-and-tabs.md)
