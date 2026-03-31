# Primary Address Reference Table Flow

## Overview

This flow covers how users open `/about/primary-address`, review the page
content, and open a profile route from a table row.

## Location in the Site

- Route: `/about/primary-address`
- Global sidebar path: `About -> Primary Address`
- In-page About menu path: `Primary Address` on `/about/{section}`

## Preconditions

- None. The route is public.

## Entry Points

- Open `/about/primary-address` directly.
- Open `About -> Primary Address` from the global sidebar.
- Open any `/about/{section}` page and choose `Primary Address`.

## Flow Steps

1. Open `/about/primary-address`.
2. If no cached rows exist, the page shows `Loading...` while it fetches
   `"/primary_address.csv"`.
3. On success, review the heading, rule notes, dated summary text, and table
   columns:
   `Profile Handle`, `Current Selected Primary Address`, and
   `Primary Address Changed to`.
4. Table rows are sorted alphabetically by `Profile Handle`.
5. Every CSV row is rendered as table data, including a CSV header row if one
   exists.
6. Select a `Profile Handle` link to open `/{current_primary}`.
   Links do not use the handle value.
7. If loading fails, the query retries automatically before it shows a final
   error message:
   - `Error: Failed to fetch primary address data (<status>)`
   - `Error: Failed to fetch`
   - `Error: Failed to parse primary address data`
8. Reopening the route can reuse cached rows and skip `Loading...`.
   After about 10 seconds, revisiting can keep visible rows and refresh in the
   background.

## Exit Points

- Stay on `/about/primary-address` to continue reading rows.
- Move to `/{current_primary}` from any table row.
- Refresh the page to force a new CSV fetch now.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Reference Table Troubleshooting](troubleshooting-primary-address-reference-table.md)
- [Profiles About Index](README.md)
- [Profiles Navigation Flow](../navigation/flow-navigation.md)
