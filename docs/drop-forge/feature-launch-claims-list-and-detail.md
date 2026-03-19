# Launch Claims List and Detail

## Overview

Drop Forge launch routes are used to initialize or update on-chain mint claims
after craft metadata is ready.

The launch surface combines:

- a paginated launch-claims queue at `/drop-forge/launch`
- an operations page at `/drop-forge/launch/{id}`
- on-chain claim visibility and status
- auto-selected phase setup and updates
- artist/team/subscription/research airdrop actions
- claims-admin action-completion tracking for airdrop steps

## Location in the Site

- Queue route: `/drop-forge/launch`
- Detail route: `/drop-forge/launch/{id}`
- Landing-card entry: `/drop-forge` -> `Launch Claims`
- Header search page result: `Launch Claims` when the current wallet can access
  that section

## Entry Points

- Open `/drop-forge/launch` directly.
- Open `Launch Claims` from the Drop Forge landing page.
- Select a launch claim row to open `/drop-forge/launch/{id}`.
- Follow the craft-to-launch prompt from a published craft claim.

## User Journey

1. Open `/drop-forge/launch`.
2. The queue loads claim cards in pages of five.
3. Review each card:
   - claim number
   - season
   - edition size
   - name
   - primary status
4. Select a row to open `/drop-forge/launch/{id}`.
5. On the claim-detail page, review:
   - timeline row and primary status
   - media preview
   - details
   - traits
   - Arweave links
   - on-chain claim state
6. If metadata has not been published yet, follow the inline `Craft #{id}` link
   and finish the craft workflow first.
7. If metadata is published, the detail page auto-selects a launch tab:
   - `Phase 0 - Initialize Claim` before initialization
   - the first scheduled phase whose end time has not passed after
     initialization
   - `Airdrop to Research` after all scheduled phases have ended
8. Use the tab grid to switch between:
   - `Phase 0 - Initialize Claim`
   - `Phase 1`
   - `Phase 2`
   - `Public Phase`
   - `Airdrop to Research`
9. For the selected launch phase, review remaining editions, price, merkle-root
   data, and phase window fields, then run the initialize/update action.
10. Run phase-specific airdrops when those sections are populated.

## Common Scenarios

- Queue browsing:
  - Use pagination when more than five launch claims exist.
  - Open a specific claim by ID from the queue or direct URL.
- Metadata-only on-chain update:
  - When the on-chain claim still points at older metadata, the page shows a
    metadata-update block with `On-Chain Metadata`, `Updated Metadata`, and an
    `Update On-Chain` action.
- Phase initialization:
  - Start with `Phase 0 - Initialize Claim`.
  - After initialization, `Phase 1`, `Phase 2`, and `Public Phase` become
    available in phase selection.
- Phase auto-selection:
  - Before initialization, or when no phase schedules are available yet, the
    detail page opens on `Phase 0`.
  - After initialization, the page opens on the first scheduled phase whose end
    time has not passed yet.
  - After all scheduled phase windows have ended, the page opens on
    `Airdrop to Research`.
- Phase updates:
  - Adjust price and start/end windows for the selected phase.
  - Review merkle root and address/spot counts for allowlist phases.
- Airdrops:
  - `Phase 0` can expose `Artist Airdrops` and `Team Airdrops` with separate
    address/total summaries.
  - Subscription airdrops can appear per phase with address-count and total
    airdrop summaries.
  - Selecting `Phase 2` can show both `Phase 2 Subscription Airdrops` and
    `Public Phase Subscription Airdrops`.
  - Claims-admin wallets can get `Completed` toggles beside artist, team,
    subscription, and research airdrop sections when the backend exposes
    tracked action names.
  - Successful airdrops auto-mark the matched tracked action complete; the same
    toggle can also be flipped manually.
  - `Airdrop to Research` uses the target edition-size delta to compute the
    research quantity.

## Edge Cases

- Launch access is more permissive than craft access, so a user can reach
  launch pages without being able to edit the paired craft page.
- If metadata is not yet published, launch actions are replaced with the
  craft-first prompt instead of phase controls.
- `Phase 1`, `Phase 2`, `Public Phase`, and `Airdrop to Research` stay disabled
  until the claim is initialized.
- Completion toggles appear only for claims-admin wallets, and only when the
  action-tracking API returns supported action names for that claim.
- Public phase does not show merkle-root fields.
- Media preview can render image-only, animation-only, both tabs, or a missing
  state when neither asset exists.
- Airdrop sections can be visible but disabled when counts are zero or a write
  is already pending.
- Airdrop buttons also stay disabled when the matching tracked action is marked
  complete.
- The detail page can show `Loading…`, `Claim not found`, root-loading errors,
  or phase-airdrop fetch errors inline.

## Failure and Recovery

- Queue or claim-detail fetch failures show inline errors and keep the user on
  the current launch route.
- If tracked-action toggles fail to load or update, the page stays usable; retry
  once claims-admin auth and API access are available again.
- If on-chain roots or phase-airdrop data fail to load, their error messages stay
  visible above the rest of the launch content.
- Failed write operations leave the claim open so the user can adjust values and
  retry the same action.
- If metadata is missing or unpublished, return to the craft route, publish to
  Arweave, then reopen the launch claim.
- If access is denied, the route falls back to the shared Drop Forge permission
  screen and eventual home redirect.

## Limitations / Notes

- Launch access is limited to claims-admin and Drop Forge admin wallets.
- Launch uses the craft claim as its content source; unpublished craft metadata
  blocks launch initialization.
- Tracked completion toggles are claims-admin workflow metadata; they do not
  replace on-chain claim or airdrop state.
- Claim cards and launch detail use the connected chain to choose mainnet or
  Sepolia minting configuration.
- Launch actions are operational tooling; they are not public mint surfaces.

## Related Pages

- [Drop Forge Index](README.md)
- [Drop Forge Hub and Section Navigation](feature-drop-forge-hub-and-navigation.md)
- [Craft Claims List and Detail](feature-craft-claims-list-and-detail.md)
- [Drop Forge Craft-to-Launch Flow](flow-drop-forge-craft-to-launch.md)
- [Drop Forge Access and Claim Operations](troubleshooting-drop-forge-access-and-claims.md)
- [Docs Home](../README.md)
