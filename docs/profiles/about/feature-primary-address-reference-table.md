# Primary Address Reference Table

## Overview

`/about/primary-address` is a public, read-only page.

It shows on-chain primary-address rules and a table loaded from
`"/primary_address.csv"`.

No wallet connection is required.

## Location in the Site

- Route: `/about/primary-address`
- Global sidebar: `About -> Primary Address`
- About page menu: `Primary Address` on `/about/{section}` pages

## Entry Points

- Open `/about/primary-address` directly.
- Open `About -> Primary Address` from the global sidebar.
- Open any `/about/{section}` page, then choose `Primary Address`.

## Access and Permissions

- Public route.
- No write actions.

## User Journey

1. Open `/about/primary-address`.
2. If no cached data exists, the page shows `Loading...` while it requests
   `"/primary_address.csv"`.
3. On success, the page shows:
   - heading `On-Chain Primary Address`
   - rule notes for `Single Address` and `Consolidations`
   - static dated sentence ending with `Monday 29th April 2024`
   - table columns `Profile Handle`, `Current Selected Primary Address`, and
     `Primary Address Changed to`
4. Rows are sorted alphabetically by `Profile Handle`.
5. Selecting a `Profile Handle` link opens `/{current_primary}`.
6. If loading fails, the query retries automatically before an error message is
   shown.

## Common Scenarios

- Read the rule summary, then inspect table rows.
- Compare `Current Selected Primary Address` and
  `Primary Address Changed to`.
- Open a handle row to jump to the linked profile route.

## Visible States

- Loading: `Loading...` on first load without cached data.
- Cached revisit: revisiting can reuse cached rows and skip `Loading...`; once
  cache is older than about 10 seconds, a background refresh can run on revisit.
- HTTP error: `Error: Failed to fetch primary address data (<status>)`
- Network failure: `Error: Failed to fetch`
- CSV parse error: `Error: Failed to parse primary address data`
- Empty-data success: table headers render with no rows and no empty-state copy

## Edge Cases

- Row links always use `current_primary`, not the handle value.
- If the CSV includes a header row, that row is rendered as normal table data.
- If a CSV row is missing columns, table cells can render blank.
- The page keeps static dated copy: `Monday 29th April 2024`.
- The table container scrolls horizontally on narrow screens.

## Failure and Recovery

- Wait for automatic retries to finish when requests fail.
- Refresh the page to force a new fetch immediately.
- If revisit navigation still shows stale rows, wait about 10 seconds and
  revisit, or hard-refresh now.

## Limitations / Notes

- No in-page search, filters, pagination, or retry button.
- The page is informational only; editing is not available here.

## Related Pages

- [Profiles About Index](README.md)
- [Primary Address Reference Table Flow](flow-primary-address-reference-table.md)
- [Primary Address Reference Table Troubleshooting](troubleshooting-primary-address-reference-table.md)
- [Delegation Action Flows](../../delegation/feature-delegation-action-flows.md)
- [Docs Home](../../README.md)
