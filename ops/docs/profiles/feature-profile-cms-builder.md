# Profile Website Studio

## Overview

Build a website for your 6529 profile with a visual editor. Choose a complete
example, edit every page, add your own images or a wallet gallery, and publish
when the site is ready. Templates and ordinary editing work without an AI agent.

The library contains 39 templates: 23 original compositions and 16 inspired by
credited CC0 cards from The Memes. Browse **People & ideas**, **Collections**,
**Artists**, **Organizations**, **Funds & collecting groups**, or **The Memes**.
Examples include personal and career sites, collector cabinets, artist studios,
exhibitions, portfolios, process journals, editions, retrospectives, companies,
foundations, crypto projects, funds, and collecting DAOs.

## Location in the Site

Open `/{user}/cms/builder`, replacing `{user}` with your profile handle. Published
pages have readable addresses such as `/{user}/studio` and `/{user}/about`.
Your normal profile remains at `/{user}`.

## Entry Points

- Open the builder URL directly to create or edit a website.
- A profile with an available published website shows **Website** in its header.
  This opens the published site. The website also links back to its 6529 profile.
- Connect the non-proxy owner profile to save, upload images, validate on the
  server, or publish. A signed-in viewer can request a snapshot of another
  wallet's indexed holdings.

## User Journey

1. Browse the template library. Open a preview, try its pages, and switch between
   **Desktop** and **Phone**. Choose **Use this template** when ready.
2. Replace sample names, writing, and artwork. Each example contains populated
   pages to show its structure. The sample notice stays visible until you review
   the content for publication.
3. Use **Pages** to select, add, duplicate, or remove a page. Edit its title,
   description, menu label, and address, then choose **Apply changes**. Choose
   **Make home page** to change the website's starting page.
4. Click a section in the page or select it in **Content**. Edit its text, image,
   caption, credit, link, width, or treatment. Add, duplicate, remove, or move
   sections with the available controls.
5. Use **Design** for the site name, description, layout, palette, typography,
   spacing, and accent color. Use **Add your art** for image uploads and wallet
   gallery imports.
6. Check every page in **Preview**, including the phone view and internal links.
   Save the draft and review validation findings. Saving does not publish it.
7. Open **Publish**, confirm that you have reviewed and replaced sample content,
   and continue through publication. The builder saves and validates the package,
   uploads its content, and asks the connected wallet to sign the publication.
8. The website becomes active after the server verifies the signature and stored
   content. Keep the signed publication manifest and recovery receipt.

## Common Scenarios

### Pages and navigation

Page titles, menu labels, and page addresses are separate fields. A short menu
label can sit beside a longer headline. **Show in site menu** controls whether the
page appears in the menu; hiding it does not make its published address private.
Use the menu arrows to change its position.

New addresses use lowercase letters, numbers, and hyphen-separated words, up to
80 characters. Choose a distinct address for each page. Existing profile areas
such as `brain`, `cms`, `collected`, `identity`, and `subscriptions` are reserved.
The address preview shows the link that readers can use after publication.

### Sharing images and search visibility

In **Page settings**, choose a **Sharing image** from the image library for that
page's link preview. Select **Automatic image** to clear the explicit choice and
use an available image displayed on that page. Choose **Apply changes**, then save
and publish the revision for the change to reach the public website. A sharing
service may continue showing its cached preview for a while.

**Allow search engines to index this page** controls the page's indexing request.
Clearing it adds a `noindex` instruction after publication. The page remains
public at its address, and its media remains accessible. Search engines may take
time to revisit it.

### Images and artwork

In **Add your art**, select an image file, enter an image description, and add
credit or attribution where appropriate. The uploader accepts JPEG, PNG, WebP,
and GIF files up to 20 MiB. It shows uploading, processing, and verification
states before adding the image to the draft. Select it in an image section or
image gallery afterward.

**Uploaded images become publicly accessible before the website is published.**
Saving a draft does not make those files private. Upload only material you intend
to make public and have permission to use. Removing a placement, replacing a
draft, or unpublishing the website does not delete the uploaded file.

The Memes templates display credited CC0 artwork with compact static previews,
including still previews for animated cards. Their source artwork remains
available through the artwork reference. Using a template does not claim token
ownership, authorship, or endorsement by the artist.

### Wallet galleries

1. Sign in and open **Add your art**.
2. Enter up to 25 Ethereum addresses or ENS names and request a snapshot.
3. Review the returned works, warnings, and source-wallet information. The request
   uses the service's default limit of 200 indexed assets.
4. Select up to 50 works, put them in the desired order, and enter a gallery title.
5. Add the selection to the draft. It creates gallery pages and a menu entry while
   keeping your existing pages, site identity, and design.

Snapshots cover the collections indexed by 6529; they are not a complete scan of
every NFT on every chain. The snapshot is a dated selection rather than a live
holdings feed. Request another snapshot to review updated holdings. Source-wallet
addresses are part of the imported record and become public when published.
A holdings import does not identify the works an artist created.

### Continue, change direction, or restore

- **Continue editing:** open a saved draft or publication in **Versions**. Saving
  edits to a published version creates a new draft; the active site stays
  available until you publish a replacement.
- **Change the design:** use **Design** to restyle the current document.
  **Start a new site** returns to the template library and replaces the draft
  when a template is chosen. Save or download your work first. It does not merge
  the new example's content into your old pages.
- **Undo a local edit:** **Undo** and **Redo** navigate recent changes in the open
  editor. They are separate from saved version history.
- **Recover local work:** use the browser recovery prompt to restore or discard
  its copy. Save to the server for access from another browser or device.
- **Restore a publication:** choose a previous publication in **Versions** and
  confirm. Refresh history first if another session changed the active version.
- **Remove the active website:** choose **Unpublish** on the current version and
  confirm. This removes the active website pointer. Version history and already
  uploaded decentralized content remain available.

## Edge Cases

- A page still referenced by a link or the homepage cannot be removed. Choose
  another home page and remove the remaining links before trying again.
- Importing a complete package preserves its pages, navigation, assets, and
  advanced sections. Visual controls edit supported fields without discarding
  other content. Details without a visual control remain available in **JSON**.
- Video and audio sections can use compatible assets already in the package;
  the studio file uploader currently accepts images.
- Choose **Apply changes** or **Discard form changes** for page, section, and
  design forms before saving, publishing, switching panels, or using Undo.
  Unapplied form fields are not autosaved; browser recovery keeps the applied
  document. Finish or cancel an image upload before leaving its panel.
- Unapplied **JSON** edits must also be applied or discarded before saving or
  publishing. A package for a different profile handle is rejected.
- If an NFT image's dimensions cannot be verified, its record can remain without
  an image. Review the partial-media warning instead of assuming the preview is
  complete.
- Older published `/index.html` links and archive paths remain readable. The
  website's own navigation uses the readable public addresses.

## Failure and Recovery

**Request snapshot** is disabled while signed out. If a session has expired, sign
in again and retry. Unresolved ENS names and incomplete snapshots appear in the
snapshot warnings; check the name or try its wallet address directly.

An image is added only after processing and verification succeed. If an upload
finishes but verification needs a retry, use the offered retry while the form is
open. Changing the file, profile, or draft clears that retry context.

Fix validation errors before publishing. Rejecting the wallet signature leaves
the draft unpublished. A storage-propagation retry retains the prepared content
and signing request where possible. After an uncertain response, refresh version
history to check whether publication completed before starting again.

The builder warns before replacing unsaved work or leaving the page. Browser
recovery is local to this browser and account context; private browsing, storage
limits, or clearing site data can remove it. Download the package JSON if local
recovery cannot be saved. Refresh stale history and review the current version
before restoring or unpublishing.

For independent verification and an archival HTML copy, use
[Recover a Signed Profile CMS Website](../developer/profile-cms-recovery.md).

## Limitations / Notes

- The **More tools** menu provides optional **JSON** and **Agent** workspaces.
  The file-based agent workflow is described separately; a connected MCP agent
  service is not available.
- Wallet signing for publication is separate from an on-chain transaction.
- Unpublishing does not delete immutable storage, other people's copies, or
  external media. A publication receipt alone is not an offline media backup.
- Template examples are starting content with English sample writing. Your site
  keeps the language you author. Review claims, people, links, credits, and images
  before confirming the sample-content review.
- Operator feature flags can disable the route or server controls.

## Related Pages

- [Profiles](README.md)
- [Profile Header Summary](navigation/feature-header-summary.md)
- [Use Your Own Agent with the Website Studio](feature-profile-cms-builder-ai-agent-affordances.md)
- [Independent Website Recovery](../developer/profile-cms-recovery.md)
