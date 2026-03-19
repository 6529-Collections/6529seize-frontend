# Drop Forge Craft-to-Launch Flow

## Overview

This flow covers the normal handoff from claim preparation in craft routes to
on-chain launch setup in launch routes.

## Location in the Site

- Starts in `/drop-forge`
- Uses `/drop-forge/craft` and `/drop-forge/craft/{id}`
- Continues in `/drop-forge/launch` and `/drop-forge/launch/{id}`

## Entry Points

- Open `/drop-forge` and pick a section card.
- Open a craft or launch claim URL directly if you already know the claim ID.

## User Journey

1. Open `/drop-forge`.
2. Choose `Craft Claims`.
3. Open a claim at `/drop-forge/craft/{id}`.
4. Complete claim preparation:
   - save image changes
   - save animation changes
   - save core information
   - save metadata and traits
5. Publish the claim to Arweave after all pending draft changes are saved.
6. Open `/drop-forge/launch/{id}`.
7. If the launch page still says `Finish crafting this claim before launching`,
   return to the craft route and finish publishing first.
8. After published metadata is available, initialize `Phase 0`.
9. Continue with later phase updates and any required airdrops.
10. Revisit the launch route as needed for metadata-only updates, phase-window
    edits, or additional airdrop actions.

## Common Scenarios

- Single-wallet operator:
  - One wallet can sometimes see the landing route but only one of the two
    section cards, depending on its role assignments.
- Multi-role operator:
  - A wallet with both craft and launch permissions can complete the whole flow
    without switching wallets.
- Launch-first handoff:
  - Operators can open `/drop-forge/launch/{id}` first, then follow the inline
    craft link when metadata is still unpublished.

## Edge Cases

- Craft and launch permissions are distinct. A user may need to switch wallets
  between the two halves of the flow.
- Published Arweave links can exist before the launch route has fetched its
  on-chain state.
- Research airdrop flow depends on the initialized claim plus the current
  minted-total versus target edition-size delta.

## Failure and Recovery

- If permission fallback appears on either half of the flow, reconnect with a
  wallet that has the required section access.
- If publish fails in craft, resolve the draft or upload error first, then
  retry `Publish to Arweave`.
- If launch initialization fails, keep the claim page open, correct the phase
  inputs, and retry the action.

## Limitations / Notes

- Craft is the source of truth for claim assets and metadata.
- Launch does not replace craft editing; it consumes the published craft output.
- There is no one-click cross-route automation from landing to completed launch.
  The operator advances the workflow section by section.

## Related Pages

- [Drop Forge Index](README.md)
- [Drop Forge Hub and Section Navigation](feature-drop-forge-hub-and-navigation.md)
- [Craft Claims List and Detail](feature-craft-claims-list-and-detail.md)
- [Launch Claims List and Detail](feature-launch-claims-list-and-detail.md)
- [Docs Home](../README.md)
