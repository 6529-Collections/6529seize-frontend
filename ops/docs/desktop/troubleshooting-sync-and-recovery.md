# Desktop TDH Sync and Recovery

Parent: [Desktop index](README.md)

## Overview

Choose the recovery action for the observed problem. A stale checkpoint, missing
transfer, inconsistent ownership, and stale NFT metadata need different steps.

## Location in the Site

These controls live inside the installed desktop application under the
**6529 Desktop** sidebar menu. Core-only routes are not public website links.

## Entry Points

Open the monitor icon in the app sidebar. If a control described here is absent,
check your installed version under **6529 Desktop > About**; a mobile or browser
session does not expose Core workers.

## User Journey

For an out-of-sync 6529 Desktop node, first open 6529 Desktop > TDH Calculation and compare Your Node and 6529.io Last Block, total TDH, and Merkle Root. Different blocks are not a same-snapshot mismatch; missing reference data is not proof of local corruption.

Check 6529 Desktop > ETH Transactions > Providers List for an Active Ethereum RPC provider, then inspect Transactions, NFTDelegation, and NFTs progress and Logs. Let initial syncing and queued prerequisites finish. Fix provider errors before rebuilding data.

When the inputs are caught up, use TDH Calculation > TDH worker > Advanced Options > Recalculate TDH Now and confirm. Compare again after completion at the same Last Block.

If a same-block mismatch persists and transaction history is suspect, use ETH Transactions > Transactions > Advanced Options > Reconcile. Choose a specific starting block if known, or Reconcile full history. It compares Ethereum transfer logs through the captured local checkpoint, repairs only missing/inconsistent/orphaned records, and rebuilds affected ownership. Full-history reconciliation can take significant time.

Use Transactions > Advanced Options > Rebuild Ownership only when the stored transaction history is believed correct but local ownership balances are inconsistent. It cannot recover missing transfers. After history/ownership repairs complete, recalculate TDH.

If NFTs or metadata are missing or inconsistent, use NFTs > Advanced Options > Full Refresh first; it refreshes chain/metadata without deleting local NFT rows. If rediscovery is needed, NFTs > Advanced Options > Reset opens Reset All NFTs, which deletes local NFT records and resyncs them. There is no button named Full Recovery.

More disruptive transaction recovery is Transactions > Advanced Options > Reset to Block: it deletes transactions after the chosen block and rebuilds ownership before resync. Use Min Block in that dialog for a full resync from the earliest supported block; Transactions does not expose a separate Reset button. Read the confirmation, choose the smallest justified recovery, allow inputs to catch up, then recalculate TDH. These local repairs do not change on-chain holdings and are not reasons to delete wallets or the app database.

For a persistent failure, share app version and OS from 6529 Desktop > About, the two Last Block values, failing worker/status, and a redacted error or transaction hash. The bot cannot inspect the device; never share wallet secrets or credential-bearing RPC URLs.

## Common Scenarios

### Repair transaction history

In 6529 Desktop go to 6529 Desktop > ETH Transactions > Transactions > Advanced Options > Reconcile. The dialog is Reconcile Transactions.

Choose Reconcile from a specific block and enter the first suspect block, or Reconcile full history from the displayed earliest block (13360860). The run ends at the local transaction checkpoint captured at start; it is not forward sync to the live chain tip.

Reconciliation compares Ethereum transfer logs to the local index and repairs missing, inconsistent, or orphaned records. It rebuilds ownership for affected tokens, and marks TDH for recalculation when repairs are made. It does not blindly delete all history.

Use an active working RPC provider and let active Transactions/TDH work finish; the action can be disabled or rejected while conflicting work runs. Full history can take significant time and RPC requests.

Progress is saved. If reconciliation is interrupted, restarting the app with an active RPC provider resumes it from its saved range. Do not start a competing reset while a reconciliation is active.

After repairs and normal sync finish, open TDH Calculation > Advanced Options > Recalculate TDH Now. Repairing history alone can leave the displayed TDH result stale.

For correct transaction records but wrong balances use Rebuild Ownership; for metadata issues use NFTs Full Refresh. Reset to Block, including its Min Block option for a full resync, is more disruptive and is not equivalent to Reconcile.

### Rebuild ownership or roll back transactions

In 6529 Desktop > ETH Transactions > Transactions > Advanced Options, Rebuild Ownership, Reset to Block, and Reconcile have different effects. Let the current worker and conflicting TDH work finish before using them.

Rebuild Ownership rebuilds every locally indexed NFT balance from existing transaction history. It leaves transaction records and the sync checkpoint unchanged. Use it only when transaction history is believed correct; it cannot discover missing transfers.

Prefer Reconcile for missing or inconsistent historical transfers: it checks chain logs and repairs affected records without a blanket history deletion.

Reset to Block rolls back to the chosen block: transactions after it are deleted, ownership is rebuilt at that point, and later syncing reimports forward from there. The dialog offers Min Block for the earliest supported worker block, 13360860. Choose a block based on the observed problem rather than guessing.

To fully resync Transactions from the beginning, use Reset to Block > Min Block and confirm. Transactions does not expose a standalone Reset button. Rolling back to the earliest supported block removes later local history for reimport; this is a more disruptive fallback than reconciliation and requires time and RPC access.

Once repair/resync and prerequisite workers complete, use TDH Calculation > TDH worker > Advanced Options > Recalculate TDH Now. A stale-result warning is expected after history changes until a successful recalculation.

Worker recovery changes local indexed data, not on-chain NFTs or balances. Do not delete the whole app database or a Core wallet as a transaction-repair step.

### Recover NFT records and metadata

Open 6529 Desktop > ETH Transactions > NFTs. Data shows the locally indexed NFTs; Logs shows discovery and refresh progress. These records cover The Memes, Gradients, Meme Lab, and NextGen.

For outdated metadata or inconsistent indexed NFT details, open NFTs > Advanced Options > Full Refresh and confirm Full Refresh NFTs. It refreshes all indexed NFTs from chain and metadata without deleting local NFT data.

For a missing local NFT history requiring rediscovery, NFTs > Advanced Options > Reset opens Reset All NFTs. Confirming deletes all local NFT rows and starts discovery from the beginning. This is more disruptive than Full Refresh and is not named Full Recovery in the UI.

An NFT can wait for its mint transaction to be indexed. A Waiting for transaction sync message calls for checking Transactions progress/provider/history first; resetting NFTs repeatedly cannot repair missing transfers.

Finish active NFT work and respect TDH worker conflicts before a refresh/reset. Check Logs for RPC or metadata retrieval errors; a failing upstream source needs attention rather than repeated resets.

After NFT recovery and transaction/delegation sync complete, recalculate TDH if the node result needs rebuilding. NFT refresh/reset does not change your on-chain holdings, delete your Core wallet, or replace a transaction-history reconciliation.

### Inspect local data

Open 6529 Desktop > ETH Transactions > Transactions > Data to inspect the locally indexed transfers. Use its collection filters, sorting, pagination, and transaction-hash search to investigate a known transfer.

A missing local result can mean that the worker has not reached that block, the contract is outside the indexed 6529 collections, or history needs reconciliation. Check the transaction checkpoint and Logs before resetting.

Open NFTs > Data for locally indexed NFT details, collection and season filters, and search. This data view describes the node database, not a live query of your wallet holdings.

Use Reconcile for suspect transfer history, Rebuild Ownership for inconsistent balances with correct history, and NFTs Full Refresh for stale NFT metadata. Finish repair and catch-up before recalculating TDH.

The bot cannot query these local tables. You can provide a public transaction hash, token/collection, observed checkpoint, and redacted error for more specific guidance.

## Edge Cases

Reconciliation is bounded by the checkpoint captured when it starts. It cannot
substitute for forward sync. A full-history run can be long and resumes after
restart; avoid replacing it with a reset simply because it has not finished.
The UI name **Full Refresh** is distinct from **Reset All NFTs**. Neither
requires deleting Core wallets, reinstalling the app, or removing its database.

## Failure and Recovery

If the same-block mismatch remains after the relevant repair and a fresh TDH
calculation, collect the version, OS, both block numbers, failing worker, and
redacted log error for support. Do not promise that any single reset always
fixes a mismatch. If the reference API is unavailable, restore that comparison
before declaring local corruption.

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
- [Wallets, IPFS, and About](feature-wallets-ipfs-and-about.md)
