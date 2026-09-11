# Desktop Wallets, IPFS, and About

Parent: [Desktop index](README.md)

## Overview

Core wallets handle local signing, My IPFS opens the bundled content node, and
About exposes updates and diagnostics. They are independent tools; no wallet
secret is required to index transactions or calculate TDH.

## Location in the Site

These controls live inside the installed desktop application under the
**6529 Desktop** sidebar menu. Core-only routes are not public website links.

## Entry Points

Open the monitor icon in the app sidebar. If a control described here is absent,
check your installed version under **6529 Desktop > About**; a mobile or browser
session does not expose Core workers.

## User Journey

### Create, import, and connect a Core wallet

Open 6529 Desktop > Wallets for Core wallets stored on this computer. These are separate from mobile App Wallets and from connecting an external wallet or sharing a website login session.

Create Wallet opens Create New Wallet: choose a name and password and select Create. Core generates a wallet and stores its private key and recovery phrase encrypted with that password in the local database.

Import Wallet offers Mnemonic (the current form accepts 12 words) or Private Key. Enter it only in the trusted local app, Validate, check the resulting address, then Import Wallet with a name and password. Never send a phrase, key, or password to the help bot.

Use the Core wallet connector in the wallet connection flow to select a saved wallet and unlock it when prompted. Review signature/transaction requests before approving; an unlocked wallet and an authenticated 6529 session are distinct states.

Wallet details show the address and password-protected reveal/copy controls plus Download Recovery File. That download contains the decrypted private key and available mnemonic in a plaintext text file; keep it private and securely backed up, never send it to the bot. Private-key-only imports have no mnemonic.

Delete removes the saved local wallet record after confirmation; disconnect first if it is the currently connected wallet. It does not erase the Ethereum address or move on-chain funds. There is no documented bot/password-recovery service; the bot cannot decrypt or recover a forgotten wallet password.

A Core wallet is optional for node indexing and TDH calculation. You can run workers with an active RPC provider without importing any funded wallet, and connecting a wallet does not enable RPC workers.

### Explore My IPFS

6529 Desktop bundles a local IPFS daemon. Open 6529 Desktop > My IPFS to launch its WebUI when the app has resolved the local IPFS configuration; My IPFS is separate from ETH Transactions and the Ethereum RPC Providers list.

The app uses a local IPFS API, gateway, and swarm port. Find the actual IPFS Port, IPFS RPC Port, and IPFS Swarm Port in 6529 Desktop > About; do not assume a fixed port or share a localhost URL as a public link.

The Desktop IPFS file service pins added files and keeps a named entry under /6529-Desktop in the node file system. A CID identifies content; local storage/pinning is not a promise of permanent availability or replication elsewhere.

The bundled node uses configured bootstrap peers with automatic peer discovery/routing features restricted. Do not describe it as an unrestricted network crawler, a backup of every NFT, or proof that TDH consensus has completed.

If My IPFS is missing or the WebUI cannot connect, keep the app open, check About > App Logs for IPFS startup/connection errors and confirm the displayed ports. Restart the app normally if initialization failed; persistent errors need the app version, OS, and redacted log details.

The IPFS API and gateway are bound to loopback. Do not expose the local administrative API publicly, upload wallet secrets, or delete the IPFS repository to fix an unrelated TDH mismatch. IPFS storage and Ethereum transaction indexing are separate concerns.

## Common Scenarios

### Wallet backup and unlocking

Core wallets live in 6529 Desktop > Wallets on this device. The stored private key and, when present, mnemonic are encrypted with the wallet password; a connected website profile is not a backup.

Open the saved wallet details and use Download Recovery File after unlocking, or use the password-protected reveal/copy controls. The recovery download is a plaintext text file containing the private key and available mnemonic, not an encrypted wallet backup. Keep it private and securely backed up; never upload it or paste any wallet password, key, or phrase into the bot. Private-key-only imports have no mnemonic.

If you cannot unlock a wallet, verify that you selected the right saved wallet and are entering its wallet password. The bot cannot inspect the wallet, bypass encryption, reset its password, or recover missing secrets.

If you have an independent recovery phrase or private-key backup, the local Import Wallet flow can restore the corresponding address; validate the address before using it. Do not delete the only local copy while investigating a password problem.

Deleting a wallet or app database is not a TDH repair step. Transaction/NFT worker recovery only needs the relevant indexed-data controls, not your wallet secrets. Keep independently recoverable wallet backups before any app-data removal.

### App version, updates, and diagnostics

Open 6529 Desktop > About for the installed version, OS/architecture, app scheme, app port, IPFS ports, updater status, and App Logs. Opening About checks for updates.

The update area shows checking, available, downloading progress, downloaded, no-update, or error states. Use the action offered for that state; the bot does not know the latest available build unless it has current release evidence.

Use ETH Transactions > the affected worker > Logs for a worker-specific failure. Expand Advanced Options for recovery controls. Logs > Locate opens the log file location; selecting log text enables Copy Selection.

For a TDH issue include both Last Block values, the mismatched field, last calculation time, and the failing worker message. For a missing transfer include a public transaction hash and the expected block; distinguish a local-node mismatch from personal website TDH.

Share only relevant redacted diagnostic lines. Remove RPC API keys/credential URLs, passwords, private keys, and recovery phrases. The bot cannot inspect your filesystem, operate workers, or confirm the node is repaired without observations from you.

The native titlebar identifies a Live/Test backend where applicable. That backend target is distinct from TDH TestNet Mode Phase 1. Core-only menu controls and routes are unavailable on mobile and ordinary web browsers.

## Edge Cases

A private-key-only wallet cannot display a mnemonic it never had. A website
connection or Mobile connection transfer is not a backup of the locally saved
Core wallet. My IPFS can be absent when the local configuration is unavailable.
The IPFS RPC port is unrelated to the Ethereum RPC provider URL.

## Failure and Recovery

For an IPFS startup or updater error, inspect About > App Logs and report the
version, OS, and relevant redacted error. Avoid deleting local storage as a
generic remedy. For a forgotten wallet password, preserve the local copy and
use only independently backed-up recovery material in the local import flow.
The bot cannot recover the encryption password.

## Limitations / Notes

The help bot explains documented controls. It cannot read or change your local
node, confirm a repair remotely, decrypt wallets, or promise a sync duration.
Never provide it passwords, private keys, recovery phrases, or credential-bearing
RPC URLs. Use the installed app's confirmation text before a recovery action.

## Related Pages

- [Desktop index](README.md)
- [Get started](flow-getting-started.md)
- [Workers and TDH](feature-workers-and-tdh.md)
- [Sync and recovery](troubleshooting-sync-and-recovery.md)
