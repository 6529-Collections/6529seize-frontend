# Profile xTDH Tab

## Overview

The `xTDH` tab at `/{user}/xtdh` has two views:

- `Granted`: grants created by the viewed profile.
- `Received`: collections, tokens, and contributors sending xTDH to the viewed profile.

The profile tab label shows `Beta`, and the xTDH test/demo banner is always visible.

This page owns shared tab-shell behavior. View-specific behavior is owned by:

- [Profile xTDH Granted View](feature-xtdh-granted-view.md)
- [Profile xTDH Received View](feature-xtdh-received-view.md)

Profile tab visibility and profile-route fallback rules are owned by:
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/xtdh`
- Parent route: `/{user}`

## Query Parameters

- `tab=<value>` controls both top-level view selection and granted-status deep links.
- `tab=received` opens `Received`.
- `tab=pending|revoked|failed` opens `Granted` and selects that status tab.
- `tab=active|granted` opens `Granted` and selects `Active`.
- Unknown `tab` values fall back to `Granted` `Active`.
- If `tab` is missing, the route redirects to `tab=granted` before opening the
  xTDH content. The profile tab and Active status selector use this URL directly.

View-specific query keys:

- [Profile xTDH Granted View](feature-xtdh-granted-view.md)
- [Profile xTDH Received View](feature-xtdh-received-view.md)

## Entry Points

- Open `/{user}/xtdh` directly.
- Switch to `xTDH` from another profile tab.
- Click the `xTDH` value in the profile header stats row.
- Open a shared `/{user}/xtdh?...` link.

## Shared Header Behavior

- The stats header shows `Generating`, `Inbound`, `Outbound`, `Net`, and `Granted rate`.
- Below medium widths, the stats form one compact summary card with Net first and
  Generating, Inbound, and Outbound in rows. Desktop retains its summary layout.
- Granted and Received use text buttons without a background. Below medium
  widths, the buttons use compact text; desktop uses larger text.
- First load shows skeleton cards.
- Fetch failure shows inline error text and `Retry`.
- In owner mode, the `Outbound` card is a quick action that switches to `Granted` and scrolls to `Create New Grant`.

## Access and Owner Mode

- Anyone who can view the profile can open this tab.
- Owner mode is enabled only when a connected profile is present, no active profile proxy is set, and the connected profile matches the viewed profile by consolidation key or lowercased handle.
- Outside owner mode, the tab is read-only.

Owner-only actions:

- use `+ Grant` beside the Granted/Received switch to open the existing create form,
- create a grant,
- stop or revoke grants in `Pending` or `Granted` status,
- use the `Outbound` quick action in the stats header.

## User Journey

1. Open `/{user}/xtdh`.
2. Review the shared stats header.
3. Choose `Granted` or `Received`.
4. Continue with the view page:
   [Profile xTDH Granted View](feature-xtdh-granted-view.md) or
   [Profile xTDH Received View](feature-xtdh-received-view.md).

## Failure and Recovery

- If profile route resolution fails before tab render, shared not-found behavior applies:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md).
- Granted-list and received-list failures are documented on their owner pages.

## Limitations / Notes

- xTDH is in test/demo mode. Data can reset after the test period.
- The `Outbound` quick action is hidden outside owner mode.
- The owner shortcut keeps its Outbound name and uses the existing Create New
  Grant heading as its screen-reader description.
- Localization is partial: stats, the grant heading and owner action names use
  message keys, with missing translations falling back to `en-US`. Remaining
  filter/status labels, grant-form copy, confirmations and received controls
  retain English copy. Profile UI maintainers own migrating these remaining
  strings and their accessible names together in a later localization pass.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile xTDH Granted View](feature-xtdh-granted-view.md)
- [Profile xTDH Received View](feature-xtdh-received-view.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [xTDH Network Overview](../../network/feature-xtdh-network-overview.md)
- [xTDH Rules and Distribution Formula](../../network/feature-xtdh-formulas.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
