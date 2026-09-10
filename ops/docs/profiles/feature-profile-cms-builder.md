# Profile CMS Builder

## Overview

Build and publish a custom website owned by your 6529 profile. The builder supports
local editing, saved drafts, gallery snapshots, JSON imports, and signed
decentralized publications.

## Location in the Site

Open `/{user}/cms/builder`, replacing `{user}` with your profile handle. Your
published website uses `/{user}/index.html` and the additional paths in its package.

## Entry Points

Open the builder URL directly. There is no public profile navigation link.
Connect the wallet for the profile you want to edit. Server actions require the
owner profile; a proxy session cannot save or publish.

## User Journey

1. Start a draft, import a package in **JSON**, or open a saved version.
2. Edit the site and preview it. The visual editor covers its supported page and
   gallery templates. Richer packages retain all their data and use **JSON** or
   **Agent** for editing.
3. Save the draft and run server validation. Review errors and warnings before
   publishing.
4. Publish when ready. The builder saves and validates the package, uploads its
   content, and asks the connected wallet to sign the publication details.
5. The website becomes active after the server verifies the signature and durable
   content. Keep the publication receipt and signed manifest for recovery.

## Common Scenarios

- **Continue editing:** load a draft or published version from version history.
  Editing a published version creates a new draft when saved; the active website
  stays available until another publication replaces it.
- **Recover local work:** the builder keeps a browser recovery copy scoped to the
  profile. Use the recovery prompt to restore or discard it. Save to the server
  for access from another browser or device.
- **Create a gallery:** request a wallet snapshot, choose supported collection
  filters, then select and order artworks. A snapshot records the returned set;
  request another snapshot to update it. Saving or publishing a gallery requires
  a real snapshot; offline example holdings are for preview.
- **Restore a previous publication:** choose the version in history and confirm
  the restore. If another session changed the active version, refresh history
  before trying again.
- **Remove the active website:** choose **Unpublish** on the current version and
  confirm. This removes its active profile pointer. Previously uploaded
  decentralized data and version history remain available.

## Edge Cases

- Importing a multipage or advanced package preserves pages, navigation, galleries,
  assets, and blocks. The visual editor is unavailable when projecting the package
  into that editor would lose information.
- Unapplied JSON edits survive workspace switches. Apply or discard them before
  saving or publishing; the builder does not silently publish the earlier editor
  contents.
- Changing the connected profile or wallet changes which server actions are
  available. Recheck the profile and signing wallet before retrying publication.
- Draft recovery belongs to this browser. Private browsing, storage limits, or
  clearing site data can make it unavailable.
- Gallery snapshots depend on the collections and artwork media supported by the
  backend. A successful snapshot is not a complete index of every NFT a wallet owns.
- If an image's dimensions cannot be verified, the publication retains that
  artwork's NFT details without the image. The builder warns about this; refresh
  the snapshot to try again.

## Failure and Recovery

Validation findings identify issues in the package. Fix them, save, and validate
again. A rejected wallet signature does not publish the draft; retry signing when
ready. The server verifies stored content and the signature before replacing the
active website. If a request times out, refresh version history: the server may
have completed publication even though the browser did not receive its response.

The builder warns before replacing unsaved work or leaving the page. Download the
package JSON if browser recovery reports a storage failure. If version history is
stale or a change conflicts with another session, refresh it and review the active
version before restoring or unpublishing.

For independent verification and an archival HTML copy, use
[Recover a Signed Profile CMS Website](../developer/profile-cms-recovery.md).

## Limitations / Notes

- Decentralized upload and signing are separate from an on-chain transaction.
- Unpublishing does not delete immutable storage, other people's copies, or
  external media.
- External artwork media still needs its storage provider. A package receipt
  alone is not an offline backup of every referenced media file.
- Operator feature flags can disable the route or server controls.

## Related Pages

- [Profiles](README.md)
- [AI-Agent Affordances](feature-profile-cms-builder-ai-agent-affordances.md)
- [Independent Website Recovery](../developer/profile-cms-recovery.md)
