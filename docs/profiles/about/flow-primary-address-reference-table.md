# Primary Address Reference Table Flow

## Overview

This flow documents how users reach and read the `/about/primary-address` route.

## Location in the Site

- Route: `/about/primary-address`
- Sidebar path: `About -> Primary Address`
- Route family: `/about/{section}`

## Entry Points

- Open `/about/primary-address` directly.
- Open `About -> Primary Address` from the About menu or sidebar.
- Open a deep link to `/about/primary-address`.

## User Journey

1. Open `/about/primary-address`.
2. The app renders `Loading...` while `"/primary_address.csv"` is fetched.
3. The UI transitions to a table containing:
   - `Profile Handle`
   - `Current Selected Primary Address`
   - `Primary Address Changed to`
4. The table rows are sorted alphabetically by profile handle.
5. Click a row’s profile handle link to open `/{current_primary}`.

## Related Pages

- [Primary Address Reference Table](feature-primary-address-reference-table.md)
- [Profiles Navigation Flow](../navigation/flow-navigation.md)
- [Profile Navigation and Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
