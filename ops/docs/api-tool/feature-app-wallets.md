# App Wallets Management

## Overview

`/tools/app-wallets*` lets users create, import, and manage app-local wallets.

- `/tools/app-wallets`: list wallets and open create/import actions.
- `/tools/app-wallets/import-wallet`: validate mnemonic or private key, then
  import.
- `/tools/app-wallets/{appWalletAddress}`: manage one wallet (balance, recovery
  actions, delete).
- Wallets are saved in native secure storage.
- App-wallet actions require native runtime support (Capacitor +
  SecureStorage plugin).

## Location in the Site

- Route family: `/tools/app-wallets*`
- Web sidebar path: `About -> Safe Collecting -> App Wallets`
- Native app sidebar path: `About -> Safe Collecting -> App Wallets`
- The menu row appears only when app-wallet support is enabled.
- Direct route access still works when unsupported, but all app-wallet routes
  show an unsupported panel:
  - `App Wallets are not supported on this platform` (web / non-native)
  - `Update to the latest version of the app to use App Wallets` (native app
    without plugin support)
  - `TAKE ME HOME` links to `/`

## Entry Points

- Open `App Wallets` from Tools navigation when visible.
- Open `/tools/app-wallets` directly.
- On list route, select `Create Wallet`, `Import Wallet`, or any wallet card.
- In Capacitor, open the shared `Connect` sheet and select `App Wallets` to
  connect an existing app-local wallet or open `Create App Wallet` without
  visiting the tools route.

## User Journey

1. Open `/tools/app-wallets`.
2. If supported, choose `Create Wallet`, `Import Wallet`, or an existing wallet.
3. Create flow:
   - open `Create Wallet`,
   - enter wallet name + password,
   - submit `Create`.
4. Import flow: open `/tools/app-wallets/import-wallet`, pick `Mnemonic` or
   `Private Key`, validate input, then finish in the `Import Wallet` modal
   (name + password).
5. Open `/tools/app-wallets/{appWalletAddress}` to manage one wallet.
6. On wallet detail, use:
   - address actions (`View on Etherscan`, copy address),
   - recovery actions (`Reveal` mnemonic/private key, `Download Recovery File`;
     each requires unlock),
   - `Delete` (with confirmation).

## Input Rules and States

- Wallet name accepts only alphanumeric characters and spaces.
- Wallet password (create/import/unlock): minimum 6 characters; whitespace is
  rejected.
- Mnemonic import uses exactly 12 input fields. Each field accepts lowercase
  alphabetic characters only.
- Private-key import requires a non-empty value and successful validation.
- `Create` / `Import` stay disabled until wallet name and password are both
  present.
- `Validate` stays disabled until import input is complete (`12` mnemonic words
  or non-empty private key).

## Results and Detail Actions

- List route states include `Fetching wallets`, `No wallets found`, and wallet
  cards.
- Wallet cards are sorted by creation time (oldest first).
- Imported wallets show `(imported)` labels on list and detail.
- Wallet detail supports:
  - address copy and Etherscan link,
  - unlock-gated reveal/hide and copy for mnemonic and private key,
  - unlock-gated `Download Recovery File`,
  - delete with confirmation.
- Recovery exports open the native share sheet with a temporary file. The app
  removes that file when the sheet closes on iOS and shortly after it closes
  on Android, whether the export was saved, shared, cancelled, or failed; it
  keeps no copy on the device.
- If an earlier app version left a recovery file for the wallet in the app's
  Documents folder, wallet detail shows `Recovery file saved on this device`
  with a `Remove saved recovery files` action. The notice explains that a
  plaintext file holds the recovery phrase and private key in readable form and
  asks the user to save the phrase somewhere safe first. Nothing is removed
  until the user chooses the action. The notice is hidden when the folder
  cannot be listed.
- Wallet avatars are generated on the device from the wallet address; no
  avatar image is requested from another service.
- Visiting `/tools/app-wallets/{appWalletAddress}` for a missing wallet shows
  `Wallet with address ... not found`.
- Wallet detail balance area can show loading or `Error` when balance lookup
  fails.
- On Sepolia, balance adds a `(sepolia)` suffix.
- Importing the same address again replaces the existing stored entry for that
  address.
- The native `Connect -> App Wallets` list uses the same stored wallets and
  existing unlock/connect flow. The `External Wallets` destination omits these
  app-local connectors.
- A connected app wallet never signs or sends on its own. Each message,
  structured-data signature and transaction first opens an app dialog that
  shows the wallet address and exactly what will be signed:
  - a message shows its full text (raw data shows as hex),
  - structured data shows its data type, the requesting app name, network,
    contract and content,
  - a transaction shows the full recipient address (or
    `New contract deployment`), the amount in ETH, the network, and whether
    it calls a contract (with the 4-byte function selector).
  `Cancel` (or closing the dialog) rejects the request the same way any wallet
  does. Signing in with an app wallet therefore shows the sign-in message once
  for approval. Requests are shown one at a time.
- App wallets use the same Ethereum RPC providers, in the same order, as the
  rest of the app's wallet connection.

## Edge Cases

- Some imported wallets have no mnemonic:
  `Mnemonic phrase not available for this wallet`.
- Deleting the currently connected wallet is blocked:
  `You are currently connected with this wallet - Disconnect first!`.
- Unlocked sensitive fields re-hide when toggled back to hidden.

## Failure and Recovery

- Create, import, and delete failures show error toasts and keep the user on
  the current route for retry.
- Mnemonic character validation failures show:
  `Mnemonic word can only contain lowercase alphabet characters`.
- Unlock failures for reveal/download show `Failed to unlock wallet`; retry by
  reopening unlock modal.
- Invalid import input keeps `Validate`/`Import` blocked until corrected.
- If recovery-file write/share fails, the app shows `Unable to write file`;
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
