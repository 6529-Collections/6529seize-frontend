# Primary Address Reference Table Troubleshooting

## Overview

Use this page when `/about/primary-address` shows missing rows, stale rows, or
unexpected row links.

## Location in the Site

- Route: `/about/primary-address`
- Global sidebar path: `About -> Primary Address`
- About Contents dropdown path: `Primary Address` on `/about/{section}`

## Quick Triage

- `Loading...` stays visible: request to `"/primary_address.csv"` is still in
  flight, blocked, or retrying. Wait, then refresh.
- `Error: Failed to fetch primary address data (<status>)`: endpoint returned a
  non-2xx status. Refresh and check if the same status repeats.
- `Error: Failed to fetch`: request failed before an HTTP response. Check
  connection or blocking extensions, then refresh.
- `Error: Failed to parse primary address data`: CSV payload could not be
  parsed. Refresh; if it repeats, the CSV payload needs correction.
- Rows look old after reopening the page: cached query data can be reused for
  about 10 seconds before a fresh request runs.

## Failure and Recovery Cases

1. Error does not appear immediately after a failed request
   - Cause: the query retries automatically before failing.
   - Recovery: wait for retries to finish, then use the final error text to
     pick the right recovery path below.

2. Table headers show but no data rows
   - Message: none (successful empty-data render)
   - Recovery: verify whether `"/primary_address.csv"` currently has parsable
     data rows.

3. Row link opens an unexpected profile path
   - Cause: each `Profile Handle` link always targets `/{current_primary}`.
   - Recovery: compare `Profile Handle` and `Current Selected Primary Address`
     before selecting a row link.

4. April 2024 date appears in the page
   - Symptom: text still references `Monday 29th April 2024`.
   - Recovery: expected current behavior; this is static page copy.

5. Revisit shows cached rows, then switches to an error
   - Cause: after cached rows render, the background refresh can fail and the
     page switches to the error state.
   - Recovery: refresh and use the matching fetch/parse recovery case above.

6. An address is hard to read on a small screen
   - Cause: wallet addresses can wrap across multiple lines.
   - Recovery: read the complete monospace value in its labeled stacked row;
     horizontal scrolling is not required.

## Limits of Recovery

- There is no in-page retry button.
- There are no in-page filters or search controls.
- CSV header rows, rows with the wrong column count, invalid addresses,
  incomplete rows, and repeated profile IDs are ignored.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Reference Table Flow](flow-primary-address-reference-table.md)
- [Profiles About Index](README.md)
- [Profiles Route Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
