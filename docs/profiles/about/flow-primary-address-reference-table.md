# Primary Address Reference Table Flow

## Overview

This flow covers how users reach `/about/primary-address`, review the table,
and jump to a profile route from a table row.

## Location in the Site

- Route: `/about/primary-address`
- Global sidebar path: `About -> Primary Address`
- In-page menu path: `About -> Primary Address` inside `/about/{section}`

## Preconditions

- None. The route is public.

## Entry Points

- Open `/about/primary-address` directly.
- Open `About -> Primary Address` from the global sidebar.
- Open any `/about/{section}` page and choose `Primary Address`.

## Flow Steps

1. Open `/about/primary-address`.
2. On first load without cached data, wait through `Loading...` while
   `"/primary_address.csv"` loads.
3. Review the rule summary and table rows.
4. Use `Profile Handle` links to open `/{current_primary}` profile routes.
5. If loading fails, the query retries automatically before the error message
   is shown.
6. Reopening the route can render cached rows immediately and skip `Loading...`.
   After about 10 seconds, revisit can also trigger a background refresh.

## Exit Points

- Stay on `/about/primary-address` to continue reading rows.
- Move to `/{current_primary}` from any table row.
- Refresh the route to force a new CSV fetch immediately.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Reference Table Troubleshooting](troubleshooting-primary-address-reference-table.md)
- [Profiles About Index](README.md)
- [Profiles Navigation Flow](../navigation/flow-navigation.md)
