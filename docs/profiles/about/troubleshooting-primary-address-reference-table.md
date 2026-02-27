# Primary Address Reference Table Troubleshooting

## Overview

Use this page when `/about/primary-address` does not load expected data or
opens an unexpected profile route.

## Location in the Site

- Route: `/about/primary-address`
- Global sidebar path: `About -> Primary Address`
- About menu path: `Primary Address` on `/about/{section}`

## Failure and Recovery Cases

1. HTTP request returns non-2xx
   - Message: `Error: Failed to fetch primary address data (<status>)`
   - Recovery: refresh to retry `"/primary_address.csv"`.

2. Network request fails before an HTTP response
   - Message: browser fetch error text (commonly `Error: Failed to fetch`)
   - Recovery: verify connection, disable blocking extensions if needed, then
     refresh.

3. CSV parsing fails
   - Message: `Error: Failed to parse primary address data`
   - Recovery: refresh. If it persists, the CSV payload likely needs
     correction.

4. Table headers show but no data rows
   - Message: none (successful empty-data render)
   - Recovery: verify whether `"/primary_address.csv"` currently has data rows.

5. First data row looks like CSV headers
   - Symptom: row values appear as `handle`, `current_primary`, `new_primary`.
   - Recovery: expected when the CSV includes a header row; this page renders
     it as data.

6. Row link opens an unexpected profile path
   - Cause: each `Profile Handle` link always targets `/{current_primary}`.
   - Recovery: compare `Profile Handle` and `Current Selected Primary Address`
     before selecting a row link.

7. Dated sentence appears stale
   - Symptom: text still references `Monday 29th April 2024`.
   - Recovery: expected current behavior; this is static page copy.

## Limits of Recovery

- There is no in-page retry button.
- There are no in-page filters or search controls.
- Malformed CSV fields can render blank cells instead of validation errors.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Reference Table Flow](flow-primary-address-reference-table.md)
- [Profiles About Index](README.md)
- [Profiles Route Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
