# xTDH Profile Tab

## Overview

The `xTDH` profile tab shows outgoing grant activity created by the profile and
incoming xTDH generated from held tokens.
It is in Beta and also lets identity owners create new grants when they are
viewing their own profile.

## Location in the Site

- Route: `/{user}/xtdh`
- Profile tab filter:
  - `tab=granted` (default): grants this profile has created
  - `tab=received`: received xTDH from held tokens
- Grants-list filters on the `Granted` view:
  - `tab=active|pending|revoked|failed`
  - `sub=all|active|ended|not_started` (on Active)
  - `sort=created_at|valid_from|valid_to|tdh_rate`
  - `dir=asc|desc`
- Received-view filters on the identity-scoped receiver surface:
  - `xtdh_received_sort=xtdh|xtdh_rate`
  - `xtdh_received_dir=asc|desc`
  - `xtdh_received_tokens_sort=xtdh|xtdh_rate`
  - `xtdh_received_tokens_dir=asc|desc`
  - `xtdh_token_contrib_sort=xtdh|xtdh_rate`
  - `xtdh_token_contrib_dir=asc|desc`
  - `xtdh_token_contrib_group=grant|grantor`

## Entry Points

- Open `/{user}/xtdh` directly.
- Open any profile route and switch to the `xTDH` tab.
- Click the `xTDH` quick stat from the profile header.
- Open a share link that contains `?tab=granted` or `?tab=received`.

## User Journey

1. Open `/[user]/xtdh`. If `tab` is missing, the route defaults to `granted`.
2. Review the summary card (generated xTDH, received xTDH, and unused rate).
3. Use `Granted` and `Received` tabs:
   - `Granted` shows grants this profile has created.
   - `Received` shows collections and tokens that are currently contributing
     xTDH to the viewed profile.
4. On `Granted`, switch between:
   - `Active`, `Pending`, `Revoked`, `Failed`
   - for `Active`, optionally filter `All`, `Ended`, `Active`, `Not Started`
5. On your own non-proxy profile, use **Create New Grant**:
   1. Select collection and token targets.
   2. Enter total daily grant amount.
   3. Review grant summary and set validity (or mark `Never expires`).
   4. Submit after wallet authentication.
6. Use list and sort controls in both granted and received workflows.

## Common Scenarios

- While on `tab=granted`, users can stop grants that are `Pending` or currently
  active:
  - **Stop Grant** ends a grant immediately at the current time.
  - **Revoke Grant** resets grant validity to the original start.
- Users can create:
  - full-collection grants
  - partial token grants
- `Never expires` grants keep accrual open until manually stopped/revoked.
- `tab=received` is useful for holders checking incoming xTDH by collection and
  token.
- On granted flows, the default sort is `created_at` descending; sort toggles and
  active status filtering are preserved in the URL for sharing.
- `Profile Header` links and tab transitions can preserve additional query state.

## Edge Cases

- The tab shows a Beta banner that explains test/demo behavior.
- Grant creation is hidden when:
  - no wallet is connected
  - the profile is a proxy view
  - the viewed profile is not your connected identity
- `Create New Grant` is blocked if:
  - no collection selected
  - tokens are not selected
  - amount is zero or exceeds available rate
  - validity date is in the past
- Validity controls require a future date/time unless `Never expires` is checked.
- The grants query can return partial result pages; `Load More` fetches additional
  grants and contributors.

## Failure and Recovery

- If grant stats fail to load, the page shows an error row with a retry action.
- Grant form validation failures are shown inline before submit.
- If wallet authentication is rejected, submit is blocked and an error message is
  shown.
- If grant submission fails after auth, users can correct values and retry.
- If list fetches fail, dedicated error states offer retry actions and do not clear
  the entire panel.

## Limitations / Notes

- This tab is Beta and may evolve separately from other profile tabs.
- xTDH grant actions are only available for the connected profile owner.
- Grants are persisted in backend systems and can be updated only by API actions or
  query state in the URL for sorting/filtering/pagination.

## Related Pages

- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [xTDH Network Overview](../../network/feature-xtdh-network-overview.md)
- [xTDH Rules and Distribution Formula](../../network/feature-xtdh-formulas.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
