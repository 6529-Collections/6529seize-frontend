# Primary Address Reference Table Troubleshooting

## Overview

Use this page when `/about/primary-address` does not load expected data or
opens an unexpected profile route.

## Location in the Site

- Route: `/about/primary-address`
- Global sidebar path: `About -> Primary Address`
- About menu path: `Primary Address` on `/about/{section}`

## Failure and Recovery Cases

1. Error does not appear immediately after a failed request
   - Cause: the query retries automatically before failing.
   - Recovery: wait for retries to finish, then use the final error text to
     pick the right recovery path below.

2. HTTP request returns non-2xx
   - Message: `Error: Failed to fetch primary address data (<status>)`
   - Recovery: refresh to retry `"/primary_address.csv"`.

3. Network request fails before an HTTP response
   - Message: `Error: Failed to fetch`
   - Recovery: verify connection, disable blocking extensions if needed, then
     refresh.

4. CSV parsing fails
   - Message: `Error: Failed to parse primary address data`
   - Recovery: refresh. If it persists, the CSV payload likely needs
     correction.

5. Table headers show but no data rows
   - Message: none (successful empty-data render)
   - Recovery: verify whether `"/primary_address.csv"` currently has data rows.

6. First data row looks like CSV headers
   - Symptom: row values appear as `handle`, `current_primary`, `new_primary`.
   - Recovery: expected when the CSV includes a header row; this page renders
     it as data.

7. Row link opens an unexpected profile path
   - Cause: each `Profile Handle` link always targets `/{current_primary}`.
   - Recovery: compare `Profile Handle` and `Current Selected Primary Address`
     before selecting a row link.

8. Dated sentence appears stale
   - Symptom: text still references `Monday 29th April 2024`.
   - Recovery: expected current behavior; this is static page copy.

9. Reopening the route still shows old data
   - Cause: cached query data is reused on revisit; freshness is about
     10 seconds.
   - Recovery: hard-refresh to fetch now, or wait about 10 seconds and revisit.

## Limits of Recovery

- There is no in-page retry button.
- There are no in-page filters or search controls.
- Malformed CSV fields can render blank cells instead of validation errors.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Reference Table Flow](flow-primary-address-reference-table.md)
- [Profiles About Index](README.md)
- [Profiles Route Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
