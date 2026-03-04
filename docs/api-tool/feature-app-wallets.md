# App Wallets Management

## Overview

App Wallets lets users create, import, and manage app-local wallets from the
Tools area when secure native storage support is available.

- List route: view wallets and open create/import actions.
- Import route: validate mnemonic or private key before saving.
- Detail route: view balance and address actions, reveal recovery data, download
  recovery file, and delete wallet.

## Location in the Site

- Route family: `/tools/app-wallets`, `/tools/app-wallets/import-wallet`,
  `/tools/app-wallets/{appWalletAddress}`.
- Web sidebar path: `Tools -> Other Tools -> App Wallets`.
- Native app sidebar path: `Tools -> App Wallets`.
- Menu row appears only when app-wallet support is enabled at runtime.
- Direct route access still works; unsupported environments show an inline
  unsupported message panel.

## Entry Points

- Open `App Wallets` from Tools navigation when visible.
- Open `/tools/app-wallets` directly.
- From list route, open `Create Wallet`, `Import Wallet`, or a wallet card.

## User Journey

1. Open `/tools/app-wallets`.
2. If supported, review wallets or select `Create Wallet` / `Import Wallet`.
3. For imports, open `/tools/app-wallets/import-wallet`, pick `Mnemonic` or
   `Private Key`, validate input, then complete import in modal.
4. Open `/tools/app-wallets/{appWalletAddress}` to manage one wallet.
5. Use detail actions: copy address, open Etherscan, reveal mnemonic/private
   key (unlock required), download recovery file (unlock required), or delete
   wallet after confirmation.

## Validation and Constraints

- Wallet name: alphanumeric characters and spaces only.
- Wallet password (create/import/unlock): at least 6 characters, no whitespace.
- Mnemonic import: 12 words, lowercase alphabetic characters per field.
- Private-key import: must parse as a valid key before import action appears.

## States and Edge Cases

- Unsupported environments show:
  `App Wallets are not supported on this platform` or
  `Update to the latest version of the app to use App Wallets`.
- List route states include `Fetching wallets`, `No wallets found`, and wallet
  cards.
- Import validation failures show inline error and retry guidance.
- Some imported wallets have no mnemonic (`Mnemonic phrase not available for
  this wallet`).
- Visiting `/tools/app-wallets/{appWalletAddress}` for a missing wallet shows
  `Wallet with address ... not found`.
- Deleting the currently connected wallet is blocked until disconnect.
- Wallet detail balance area can show loading or `Error` when balance lookup
  fails.

## Failure and Recovery

- Create, import, and delete failures show error toasts and keep the user on
  the current route for retry.
- Unlock failures for reveal/download show `Failed to unlock wallet`; retry by
  reopening unlock modal.
- Invalid import input keeps `Validate`/`Import` blocked until corrected.
- If recovery-file write/share fails, the route shows `Unable to write file`;
  retry from wallet detail after unlocking again.

## Limitations / Notes

- App Wallets depend on native secure storage; unsupported environments disable
  wallet management behavior.
- Wallets are app-local and managed per installed app environment.
- This page documents user-visible behavior, not cryptographic internals.

## Related Pages

- [API Tool Index](README.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
- [Navigation and Shell Controls Troubleshooting](../navigation/troubleshooting-navigation-and-shell-controls.md)
- [Docs Home](../README.md)
