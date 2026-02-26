# Primary Address Reference Table

## Overview

The `Primary Address` about page (`/about/primary-address`) explains current
primary-address rules and shows a table of profiles whose selected primary
address differs from the default consolidation outcome.

## Location in the Site

- Route: `/about/primary-address`
- Sidebar path: `About -> Primary Address`
- Rendered inside the shared About page shell (`/about/{section}`)

## Entry Points

- Open `/about/primary-address` directly.
- Open `About -> Primary Address` from the sidebar menu.
- Open `/about/primary-address` from a shared deep link.

## User Journey

1. Open `/about/primary-address`.
2. The page shows `Loading...` while it requests `/primary_address.csv`.
3. After load, the page renders:
   - primary-address rule notes for single-address and consolidation scenarios
   - a table with profile handle, current selected primary address, and target
     address
4. Rows are sorted alphabetically by handle.
5. Selecting a profile-handle link opens `/{current_primary}`.

## Common Scenarios

- Review the rule summary before checking specific rows in the table.
- Scan the table to compare `Current Selected Primary Address` and
  `Primary Address Changed to`.
- Open an entry from the first column to jump to the corresponding profile
  route.

## Edge Cases

- If CSV content has no rows, the table renders headers with an empty body.
- Table links use the row's `current_primary` wallet path, not the handle path.
- The on-page explanatory copy includes a dated sentence about
  `Monday 29th April 2024`.

## Failure and Recovery

- If `/primary_address.csv` cannot be fetched, users see:
  `Error: Failed to fetch primary address data (<status>)`.
- If CSV parsing fails, users see:
  `Error: Failed to parse primary address data`.
- Refreshing the page retries the request.

## Limitations / Notes

- The table is data-driven from `/primary_address.csv`; there are no in-page
  filters, search controls, or pagination.
- The page is informational only and does not provide direct editing actions.
- Handles and address values depend entirely on current CSV contents.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Delegation Action Flows](../../delegation/feature-delegation-action-flows.md)
- [Docs Home](../../README.md)
