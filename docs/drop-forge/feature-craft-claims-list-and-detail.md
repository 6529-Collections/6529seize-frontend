# Craft Claims List and Detail

## Overview

Drop Forge craft routes are used to prepare claim assets and metadata before a
claim can be launched on-chain.

The craft surface combines:

- a paginated claim queue at `/drop-forge/craft`
- a claim-detail editor at `/drop-forge/craft/{id}`
- media upload and replacement controls
- traits and core-info editing
- Arweave publishing
- distribution-photo review

## Location in the Site

- Queue route: `/drop-forge/craft`
- Detail route: `/drop-forge/craft/{id}`
- Landing-card entry: `/drop-forge` -> `Craft Claims`
- Header search page result: `Craft Claims` when the current wallet can access
  that section

## Entry Points

- Open `/drop-forge/craft` directly.
- Open `Craft Claims` from the Drop Forge landing page.
- Select a craft claim row to open `/drop-forge/craft/{id}`.
- Open a claim-detail URL directly when you know the claim ID.

## User Journey

1. Open `/drop-forge/craft`.
2. The queue loads claim cards in pages of five.
3. Review each card:
   - claim number
   - name
   - media-type pill
   - primary status pill
   - `*image missing` warning when only animation media exists
4. Select a row to open `/drop-forge/craft/{id}`.
5. On the claim-detail page, review and edit these sections:
   - `Image`
   - `Animation`
   - `Core Information`
   - `Metadata`
   - `Arweave`
   - `Distribution`
6. Save claim changes section by section.
7. When the claim is in a publishable state and no draft edits are pending, use
   `Publish to Arweave`.
8. After publish starts, watch the status pill until published Arweave links are
   available.

## Common Scenarios

- Queue browsing:
  - Use pagination when more than five claims exist.
  - Open the newest or relevant claim directly from its row.
- Image editing:
  - Replace the claim image with a file upload.
  - Preview the pending image before saving.
- Animation editing:
  - Upload a video file.
  - Replace animation with an IPFS or Arweave URL.
  - Remove an existing animation and save that change.
- Metadata editing:
  - Update artwork title, description, external URL, and traits.
  - Save or revert pending metadata edits.
- Arweave publishing:
  - Publish image, animation, and metadata after saving draft changes.
  - Copy or open the resulting Arweave links once they exist.
- Distribution review:
  - Inspect distribution photos and grouped phase summaries while preparing the
    claim for launch.

## Edge Cases

- If any craft-queue claim has `media_uploading=true`, the queue auto-refreshes
  every 10 seconds until uploads settle.
- Image and animation preview sections can show pending local files before the
  claim has been saved.
- Animation links are restricted to supported IPFS or Arweave URLs for GLB/HTML
  style media.
- `Publish to Arweave` stays disabled while any pending draft change has not
  been saved yet.
- A claim can show `Claim not found`, `Loading…`, or another inline error state
  before the editor renders.
- Distribution can be empty and show `No Distribution photos found`.

## Failure and Recovery

- Queue load failure shows an inline error message and keeps the user on the
  craft route.
- Claim-detail load failure shows an inline error message under the page title.
- If media upload or patching fails, the page shows the returned error and keeps
  the unsaved state so the user can retry or adjust the input.
- If publish fails, the page shows an inline Arweave error. Save or revert any
  remaining pending changes, then retry.
- If access is denied, the route falls back to the shared Drop Forge permission
  screen and eventual home redirect.

## Limitations / Notes

- Craft access is limited to distribution-admin wallets.
- Arweave publishing is a separate step after editing; saving metadata alone
  does not publish the claim.
- The craft editor is section-based. Different sections can have independent
  dirty state and save actions.
- Published links are informational only; launch initialization happens from the
  separate launch route family.

## Related Pages

- [Drop Forge Index](README.md)
- [Drop Forge Hub and Section Navigation](feature-drop-forge-hub-and-navigation.md)
- [Launch Claims List and Detail](feature-launch-claims-list-and-detail.md)
- [Drop Forge Craft-to-Launch Flow](flow-drop-forge-craft-to-launch.md)
- [Drop Forge Access and Claim Operations](troubleshooting-drop-forge-access-and-claims.md)
- [Docs Home](../README.md)
