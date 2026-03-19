# Drop Forge Access and Claim Operations

## Overview

Use this page when Drop Forge routes are missing, access fallback appears, or a
craft/launch claim cannot move forward.

## Location in the Site

- `/drop-forge`
- `/drop-forge/craft`
- `/drop-forge/craft/{id}`
- `/drop-forge/launch`
- `/drop-forge/launch/{id}`

## Entry Points

- Open a Drop Forge route directly.
- Follow a missing-access report from search, sidebar, craft, or launch pages.

## User Journey

1. Open the affected Drop Forge route.
2. Identify whether the problem is:
   - access and visibility
   - queue loading
   - craft editing or publishing
   - launch initialization or airdrops
3. Match the symptom below.
4. Apply the recovery step and reopen the same route.

## Common Scenarios

- Symptom: `Drop Forge` is missing from search or sidebar.
  - Meaning: the current wallet does not have landing-route access, or
    permissions are still loading.
  - Action: open `/drop-forge` directly or reconnect with an allowed wallet.
- Symptom: `You have no power here`.
  - Meaning: the current wallet failed the route's access check.
  - Action: switch to a wallet with the required role before the timed redirect
    sends you back to `/`.
- Symptom: `Craft Claims` card is disabled on `/drop-forge`.
  - Meaning: the wallet can see the Drop Forge hub but lacks craft permission.
  - Action: use a distribution-admin wallet.
- Symptom: `Launch Claims` card is disabled on `/drop-forge`.
  - Meaning: the wallet lacks launch permission.
  - Action: use a claims-admin or Drop Forge admin wallet.
- Symptom: craft page says `Claim not found`.
  - Meaning: the claim ID does not resolve in the minting-claims API.
  - Action: verify the claim ID or reopen from the queue.
- Symptom: `Publish to Arweave` is disabled.
  - Meaning: the claim still has unsaved draft changes or is already publishing.
  - Action: save or revert pending changes, then retry publish.
- Symptom: launch page says `Finish crafting this claim before launching`.
  - Meaning: metadata has not been published to Arweave yet.
  - Action: open the linked craft claim, publish it, then return to launch.
- Symptom: phase actions are disabled in launch.
  - Meaning: the claim is not initialized yet, required metadata is missing, or
    the selected action currently has no runnable payload.
  - Action: initialize `Phase 0` first and confirm the selected phase fields.
- Symptom: an airdrop button stays disabled even though counts are loaded.
  - Meaning: the matching tracked action is already marked `Completed`, or a
    write is already pending.
  - Action: wait for the pending write to finish, or if you are a claims-admin
    wallet, turn off the matching `Completed` toggle before retrying.

## Edge Cases

- Queue pages can show `No claims found` even when the route is otherwise
  healthy.
- Craft queue auto-refreshes while claims are still uploading media, so list
  content can update without a manual refresh.
- Launch detail can show separate inline errors for claim loading, root loading,
  and airdrop-loading failures at the same time.
- Search can hide Drop Forge pages while a direct route still exists; visibility
  is access-dependent, not route-removal.

## Failure and Recovery

- Refreshing the current route retries queue and claim-detail fetches.
- Reconnect on the correct chain if you need the matching mainnet or Sepolia
  Drop Forge context.
- If a write action fails, stay on the page, correct inputs, and retry instead
  of leaving the claim route.
- If the fallback screen appears unexpectedly, reconnect and wait until
  `Checking permissions...` completes before retrying navigation.

## Limitations / Notes

- Drop Forge tooling is intentionally gated and will not show a public empty
  state for unauthorized wallets.
- Craft and launch permissions are independent, so one wallet may work for only
  half of the workflow.
- Route success still depends on the minting-claims and related API responses;
  access alone does not guarantee claim content exists.

## Related Pages

- [Drop Forge Index](README.md)
- [Craft Claims List and Detail](feature-craft-claims-list-and-detail.md)
- [Launch Claims List and Detail](feature-launch-claims-list-and-detail.md)
- [Drop Forge Craft-to-Launch Flow](flow-drop-forge-craft-to-launch.md)
- [Docs Home](../README.md)
