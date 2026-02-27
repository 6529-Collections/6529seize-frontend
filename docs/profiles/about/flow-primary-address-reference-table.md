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
- Open any `/about/*` page and choose `Primary Address`.

## Flow Steps

1. Open `/about/primary-address`.
2. Wait through `Loading...` while `"/primary_address.csv"` loads.
3. Review the rule summary and table rows.
4. Use `Profile Handle` links to open `/{current_primary}` profile routes.
5. If loading or parsing fails, the flow stops on an error message until
   refresh.

## Exit Points

- Stay on `/about/primary-address` to continue reading rows.
- Move to `/{current_primary}` from any table row.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Primary Address Reference Table Troubleshooting](troubleshooting-primary-address-reference-table.md)
- [Profiles About Index](README.md)
- [Profiles Navigation Flow](../navigation/flow-navigation.md)
