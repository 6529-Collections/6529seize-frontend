# Get Started with 6529 Desktop

Parent: [Desktop index](README.md)

## Overview

6529 Desktop, also called Core, is the Windows, macOS, and Linux app with local Core wallets, Ethereum indexing workers, independent TDH calculation, and a bundled IPFS node. These Core tools are separate from the mobile app and desktop-browser website.

Get the official installer from [6529 Apps](https://6529.io/about/6529-apps), choose your operating system, install, and open the app.

Open the dedicated 6529 Desktop sidebar menu (monitor icon). Its entries are Wallets, ETH Transactions, TDH Calculation, My IPFS when available, and About.

First open 6529 Desktop > ETH Transactions > RPC Providers > Providers List. Choose Set Active on a provider, or Add RPC Provider, enter an Ethereum mainnet RPC URL, Test it, give it a Provider Name, Add, then Set Active. Saving a provider alone does not enable it.

With an active RPC provider and the app running, Transactions and NFTDelegation sync automatically, and NFTs discovers and refreshes local NFT data. Initial history sync may take time; inspect worker progress and Logs instead of repeatedly resetting.

Then open 6529 Desktop > TDH Calculation. TDH runs daily at 00:15 UTC; after prerequisite workers catch up you can use the TDH worker Advanced Options > Recalculate TDH Now. Compare Your Node and 6529.io at the same Last Block.

Wallets lets you create or import a Core wallet for signing, but importing a wallet or seed phrase is not required to run indexing and TDH. My IPFS opens the bundled node WebUI; About shows version, ports, updates, and App Logs.

The bot can explain these controls but cannot inspect or operate your local node. Never send it wallet passwords, recovery phrases, private keys, or RPC URLs containing credentials.

## Location in the Site

These controls live inside the installed desktop application under the
**6529 Desktop** sidebar menu. Core-only routes are not public website links.

## Entry Points

Open the monitor icon in the app sidebar. If a control described here is absent,
check your installed version under **6529 Desktop > About**; a mobile or browser
session does not expose Core workers.

## User Journey

1. Download and install Core from the official Apps page.
2. Open **6529 Desktop > ETH Transactions**.
3. Expand **Providers List** and choose **Set Active**, or add/test/name a provider and then activate it.
4. Leave the app running while Transactions, NFTDelegation, and NFTs catch up.
5. Inspect **TDH Calculation**; use **Recalculate TDH Now** after the inputs are ready, or let its daily schedule run.
6. Explore optional Wallets and My IPFS; use About for version and diagnostics.

## Common Scenarios

### Configure or change RPC

In 6529 Desktop open 6529 Desktop > ETH Transactions > RPC Providers and expand Providers List. Workers require an active RPC provider, not merely a saved one.

To use a listed provider, click Set Active and check its Active indicator. Only one provider is active at a time; selecting another deactivates the previous one and recreates the workers with the selected endpoint.

For your own provider, choose Add RPC Provider, paste its Ethereum mainnet RPC URL, click Test, enter a unique Provider Name after validation, click Add, then Set Active in Providers List. The test reads the current block and its logs; passing it does not guarantee historical requests will succeed.

Invalid RPC URL means the test could not read the block/logs. Check the endpoint, network, provider credentials, and service availability. For throttling, rate-limit or history errors, inspect worker Logs and use an endpoint with adequate Ethereum historical log access and request allowance. Do not assume a paid provider is required.

Deactivate leaves that provider saved but inactive. With no active provider, scheduled workers are disabled. Built-in default providers cannot be deleted; an inactive custom provider exposes Delete.

RPC provider configuration is for the local Ethereum workers; it is different from the IPFS RPC port shown in About. The TDH page TestNet Mode Phase 1 label does not mean you should select an Ethereum testnet endpoint.

Do not post your full authenticated RPC URL or API key in chat or logs shared for support. Share the provider name and a redacted error instead.

## Edge Cases

Saving a provider leaves it inactive. A valid latest-block RPC test may still
be followed by historical-log errors or throttling during a long sync. Initial
NFT discovery can wait for mint transactions to arrive. Wallet connection and
RPC activation are independent; importing a wallet is not an onboarding prerequisite.

## Failure and Recovery

Inspect the failing worker’s Logs, check provider availability and request
allowance, and use an appropriate working Ethereum endpoint. Let checkpoint
progress finish before recalculating TDH. For a persistent same-block mismatch,
follow [Sync and recovery](troubleshooting-sync-and-recovery.md).

## Limitations / Notes

The help bot explains documented controls. It cannot read or change your local
node, confirm a repair remotely, decrypt wallets, or promise a sync duration.
Never provide it passwords, private keys, recovery phrases, or credential-bearing
RPC URLs. Use the installed app's confirmation text before a recovery action.

## Related Pages

- [Desktop index](README.md)
- [Workers and TDH](feature-workers-and-tdh.md)
- [Sync and recovery](troubleshooting-sync-and-recovery.md)
- [Wallets, IPFS, and About](feature-wallets-ipfs-and-about.md)
