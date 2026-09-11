# Desktop Workers and TDH

Parent: [Desktop index](README.md)

## Overview

Open 6529 Desktop > ETH Transactions > App Workers for Transactions, NFTDelegation, and NFTs. The TDH worker is on 6529 Desktop > TDH Calculation.

Transactions indexes transfers related to the 6529 contracts every minute. NFTDelegation follows delegation and consolidation events every minute. NFTs discovers and refreshes The Memes, Gradients, Meme Lab, and NextGen every two minutes, with periodic full refreshes. These are local indexes, not an index of every Ethereum contract.

With an active RPC provider, non-TDH workers start when the schedulers initialize and then follow their schedules. TDH normally runs daily at 00:15 UTC. Keep the app running and the computer awake for scheduled work; do not promise a fixed initial sync duration.

Worker cards show their schedule, status, progress, and message. Expand Logs for details. Idle or Completed between runs is normal; Disabled calls for checking the active RPC provider. A waiting message can mean a prerequisite checkpoint or another worker must finish.

Advanced Options > Run Now requests an immediate run without changing the schedule. Stop ends the current non-TDH execution, but the next scheduled run can start again; it is not a permanent disable switch.

TDH is coordinated with NFT/delegation work and transaction repairs. Respect a busy or queued response rather than repeatedly clicking recovery actions. Transactions must reach the TDH target block, and NFTDelegation must reach it too.

An interrupted transaction reconciliation resumes from its saved range on restart with an active provider. An interrupted TDH calculation reruns from scratch on restart; it does not continue a partially calculated result.

## Location in the Site

These controls live inside the installed desktop application under the
**6529 Desktop** sidebar menu. Core-only routes are not public website links.

## Entry Points

Open the monitor icon in the app sidebar. If a control described here is absent,
check your installed version under **6529 Desktop > About**; a mobile or browser
session does not expose Core workers.

## User Journey

6529 Desktop > TDH Calculation independently computes TDH from local indexed data. Your Node is compared with the reference 6529.io result. The TDH row is all TDH across the whole system, not your personal profile TDH.

TDH is scheduled daily at 00:15 UTC while the app runs with an active RPC provider. It calculates the daily snapshot using an Ethereum block before the UTC day boundary, not a continuously changing live balance.

Transactions and NFTDelegation must both reach the target block before TDH can proceed. A message such as Waiting for Transactions or Waiting for NFTDelegation reports the target and current checkpoint; allow that worker to catch up and check its Logs if it stalls.

For a manual calculation, open the TDH worker Advanced Options > Recalculate TDH Now and confirm Run TDH Calculation Now. It replaces local TDH calculation data; it does not repair missing transaction history. Finish any underlying history/NFT repair and prerequisite sync first.

Compare Last Block first, then total TDH and Merkle Root. Different snapshot blocks can explain different values. A Merkle Root hashes the address/TDH results; a missing reference root is N/A and is not proof your node is wrong.

The page describes TestNet Mode Phase 1: comparison with the 6529.io reference. Phase 2 node-only consensus is described as future behavior, not something already active. This label is separate from Live/Test backend builds and does not switch Ethereum to a testnet.

Transaction repairs or resets can mark the existing result stale and show Transaction history changed — recalculation required. Recalculate after repair completes or wait for the next scheduled TDH run. Marking stale alone does not immediately start a fresh calculation.

If the app closes during TDH work, an active provider allows a fresh rerun on restart after worker guards permit it. The bot cannot read your local TDH values or fix your node remotely.

## Common Scenarios

| Observation | Meaning and next step |
| --- | --- |
| Idle/Completed between runs | Normal scheduled operation; inspect the last completion. |
| Disabled | Check that an RPC provider is Active. |
| Waiting for Transactions/NFTDelegation | That checkpoint must reach the displayed target block. |
| Waiting for another worker | The scheduler is avoiding incompatible concurrent work. |
| Different Last Block | Compare equivalent snapshots before diagnosing a TDH mismatch. |
| Reference Merkle Root N/A | Missing reference evidence, not a confirmed local mismatch. |
| Transaction history changed | Finish the repair and recalculate TDH. |

## Edge Cases

The schedule runs while Core is open; a sleeping/offline computer cannot be
assumed to perform its daily calculation. Reopening Core resumes pending
reconciliation and reruns interrupted TDH when enabled, but a normal launch
does not itself promise a new TDH run. **Stop** is not permanent disablement.

## Failure and Recovery

Resolve input and provider problems first. If a completed calculation differs
at the same block, follow [Sync and recovery](troubleshooting-sync-and-recovery.md).
Do not mistake global node TDH for a single profile’s score or claim that a local
reset changes the website’s reference result.

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
