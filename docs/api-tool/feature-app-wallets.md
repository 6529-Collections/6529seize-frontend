# App Wallets Management

## Overview

App Wallets lets users create, import, and manage app-local wallets from the
Tools area.

- List route: view saved wallets and open create/import actions.
- Import route: validate mnemonic or private key, then save as a wallet.
- Wallet-detail route: view balance, reveal recovery data, download recovery
  file, and delete the wallet.

## Location in the Site

- Route family: `/tools/app-wallets`, `/tools/app-wallets/import-wallet`,
  `/tools/app-wallets/{app-wallet-address}`.
- Navigation path: `Tools -> Other Tools -> App Wallets`.
- Sidebar visibility: appears only when app-wallet support is enabled at
  runtime.

## Entry Points

- Open `Tools -> Other Tools -> App Wallets` from sidebar navigation when the
  row is available.
- Open `/tools/app-wallets` directly.
- From list route, open `Import Wallet` or select any wallet card.

## User Journey

1. Open `/tools/app-wallets`.
2. If supported, review existing wallets or use `Create Wallet` /
   `Import Wallet`.
3. For imports, open `/tools/app-wallets/import-wallet`, pick `Mnemonic` or
   `Private Key`, validate inputs, then finish import in the wallet modal.
4. Open `/tools/app-wallets/{app-wallet-address}` to manage one wallet.
5. Use detail actions: copy address, open Etherscan, reveal mnemonic/private
   key (unlock required), download recovery file (unlock required), or delete.

## Common Scenarios

- Create a new app wallet with a name and password.
- Import an existing wallet from a 12-word mnemonic or private key.
- Open one wallet detail route to copy address and inspect chain balance.
- Reveal sensitive wallet data only after password unlock.
- Download and share a wallet recovery file from detail route.

## Edge Cases

- Unsupported environments show:
  `App Wallets are not supported on this platform` or
  `Update to the latest version of the app to use App Wallets`.
- List route states include `Fetching wallets`, `No wallets found`, and wallet
  cards.
- `App Wallets` sidebar row is hidden when support is disabled.
- Import mnemonic accepts lowercase alphabet words only.
- Import validation can fail and shows an inline error plus retry guidance.
- Some imported wallets have no mnemonic (`Mnemonic phrase not available for
  this wallet`).
- Visiting `/tools/app-wallets/{app-wallet-address}` for a missing wallet shows
  `Wallet with address ... not found`.
- Deleting the currently connected wallet is blocked until disconnect.

## Failure and Recovery

- Create/import/delete failures show error toasts and keep user on current
  route for retry.
- Unlock failures for reveal/download show `Failed to unlock wallet`; retry by
  reopening unlock modal.
- Invalid import input keeps `Validate`/`Import` flow blocked until corrected.
- If recovery-file write/share fails on device, retry from wallet detail after
  unlocking again.

## Limitations / Notes

- Password rules in create/import/unlock modals:
  at least 6 characters, no whitespace.
- Wallet names accept alphanumeric characters and spaces only.
- Wallet storage depends on native secure storage support; behavior is
  intentionally disabled otherwise.
- This area documents user behavior only, not cryptographic implementation
  details.

## Related Pages

- [API Tool Index](README.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
- [Navigation and Shell Controls Troubleshooting](../navigation/troubleshooting-navigation-and-shell-controls.md)
- [Docs Home](../README.md)
