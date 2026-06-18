# Delegation Source Of Truth Spec

Status: active
Last updated: 2026-06-16

This spec is the durable source of truth for delegation copy, help-article
ownership, content delivery, and future agent work. It adopts the 5.5 Pro
review where it matches the product direction, and it incorporates the
repo-reviewed IPFS delivery decision.

## Precedence

When sources conflict, use this order:

1. NFTDelegation contract behavior and deployed API semantics.
2. This source-of-truth spec.
3. Checked-in content manifest and article package.
4. Route/feature docs in `ops/docs/delegation`.
5. The 5.5 Pro review attachment as background input.

The 5.5 Pro review is not itself the source of truth. It is an adopted review
input. Future agents should implement the decisions below, not re-litigate the
old audit notes unless product requirements change.

## Canonical Product Model

Use these definitions consistently in UI copy, article copy, metadata, alt
text, docs, and tests.

- Delegation: an onchain registry record that lets another wallet use selected
  NFT utility in supported 6529 experiences. It does not transfer the NFT,
  transfer ownership, grant custody, or give the delegate wallet control over
  assets in the delegator wallet.
- Consolidation: use case `#999`. An onchain relationship record used by 6529
  systems to understand that wallets you control belong to one collector setup.
  It supports metrics such as TDH, total cards, and unique cards. It is not a
  delegation and does not grant rights. It should be reciprocal when two
  wallets are intended to be treated together.
- Delegation Manager: use case `#998`, also known as Sub-Delegation or
  Delegation Management. A manager wallet can maintain delegation and
  consolidation records for the managed wallet within the selected scope. This
  is more powerful than a normal delegation. It still does not move NFTs or
  grant asset custody.
- Primary Address: the address that represents a consolidated wallet set in
  supported 6529 displays and identity views.
- Lock: an opt-out record that blocks incoming delegations for a wallet at a
  scope. Locks do not revoke outgoing delegations and do not remove existing
  records by themselves.
- Outgoing: records created by or on behalf of the current wallet.
- Incoming: records where the current wallet is the target or beneficiary.

## Content Ownership

Delegation has two content classes.

Repo-local UI copy lives in React components, route metadata, tests, and
feature docs. This includes:

- Left-menu labels.
- Page titles and metadata.
- Form intros, labels, helper text, validation text, and submit labels.
- Disconnected-wallet panels.
- Wallet Checker states.
- Collection page intros, accordion labels, and empty/loading/error states.
- Article wrapper navigation such as breadcrumbs, back links, and previous/next.

Article body copy lives in the delegation content package. This includes:

- Wallet Architecture.
- Delegation FAQ landing.
- Consolidation Use Cases.
- All FAQ child article bodies.
- Article screenshots, diagrams, captions, tables, and long-form explanations.

Agents must not hard-code full article bodies into React components. Use React
only for the shell and wrapper behavior. Article-body changes must be made in
the versioned public bundle under `public/delegation-content/{version}/html`.
Article assets must stay in `content/delegation/assets` and be mirrored into
the same versioned public bundle. Do not point reviewed articles at mutable S3
screenshots, diagrams, ABI files, or other instructional assets.

## Delivery Architecture

Delegation help articles use this source-to-runtime chain:

1. Reviewed article HTML:
   `public/delegation-content/{manifest.version}/html/*.html`.
2. Reviewed article assets: `content/delegation/assets`.
3. Manifest: `content/delegation/manifest.json`.
4. Versioned public bundle:
   `public/delegation-content/{manifest.version}`.
5. IPFS root CID after publish and pin.
6. Optional S3/CloudFront acceleration as a CID or version-addressed mirror.

Runtime loading is implemented by
`components/delegation/html/delegationContent.ts`.

Runtime rules:

- If a root CID and CloudFront base URL are configured, try CloudFront first.
- If a root CID is configured, try configured IPFS gateways next.
- Always keep the checked-in same-origin versioned bundle as the final fallback.
- Verify each fetched article body against the manifest SHA-256 before
  rendering.
- Resolve packaged article asset URLs from the same verified bundle URL that
  loaded the article, so IPFS and accelerated mirrors serve article assets from
  the same package.
- Reject a mismatched or failed source and try the next candidate URL.
- If all sources fail or hash verification fails, show the article error state.
- Do not fetch mutable S3 paths by slug at runtime.
- Do not render article screenshots, diagrams, or ABI links from mutable S3
  paths at runtime.
- Browser code must not publish to IPFS or use write-capable IPFS APIs.

S3/CloudFront is allowed only as an acceleration layer. It is not the canonical
storage layer and must not become the editorial source of truth.

## Publish Workflow

Use this workflow for article edits.

1. Edit reviewed HTML in
   `public/delegation-content/{manifest.version}/html`.
2. Add or update source assets in `content/delegation/assets` when article
   images, diagrams, JSON, or downloads change.
3. Review content diffs as editorial changes.
4. Run `node ops/scripts/build-delegation-docs-content.mjs`.
5. Confirm `content/delegation/manifest.json` and the versioned public bundle
   were regenerated.
6. Publish the versioned public bundle to IPFS from a controlled ops/CI context
   using the 6529 internal IPFS node:

   ```bash
   DELEGATION_DOCS_IPFS_API_ENDPOINT=https://api-ipfs.6529.io \
     node ops/scripts/publish-delegation-docs-content.mjs
   ```

   The manual GitHub workflow `Publish Delegation Docs Content` runs the same
   script with repository secrets/vars.
7. Pin the root CID using 6529-controlled infrastructure. The publish script
   uses `pin=true` when calling the internal node.
8. Save the receipt from `tmp/delegation-docs-publish`. It records the root CID,
   the file hashes, the IPFS add response, and gateway/CDN verification results.
9. Set `DELEGATION_DOCS_IPFS_ROOT_CID` from the receipt and rerun the build
   script.
10. If using S3/CloudFront, set `DELEGATION_DOCS_CDN_BASE_URL` to a CID or
    version-addressed mirror path.
11. Commit the updated manifest/public bundle through normal review.
12. Verify representative article routes in a browser and confirm no hash
    errors.

Do not treat current imported S3 bodies as permanent editorial quality. They
are the seed content package that allowed the repo to become reviewable. Use
`DELEGATION_DOCS_IMPORT_LEGACY_S3=1` only when intentionally refreshing that
seed import; imported asset references must already map to reviewed local files,
and normal builds must package the checked-in versioned bundle.

## Route Copy Standards

Use the singular label `Delegation FAQ` everywhere. Do not use
`Delegation FAQs`.

Browser titles must follow:

```text
[Page Title] | 6529.io
```

Core route titles:

| Route | Title |
| --- | --- |
| `/delegation/delegation-center` | Delegation Center |
| `/delegation/wallet-architecture` | Wallet Architecture |
| `/delegation/delegation-faq` | Delegation FAQ |
| `/delegation/consolidation-use-cases` | Consolidation Use Cases |
| `/delegation/wallet-checker` | Wallet Checker |
| `/delegation/register-delegation` | Register Delegation |
| `/delegation/register-consolidation` | Register Consolidation |
| `/delegation/register-sub-delegation` | Register Delegation Manager |
| `/delegation/assign-primary-address` | Assign Primary Address |
| `/delegation/any-collection` | Any Collection Delegations |
| `/delegation/the-memes` | The Memes Delegations |
| `/delegation/meme-lab` | Meme Lab Delegations |
| `/delegation/6529-gradient` | 6529 Gradient Delegations |

Delegation Center must work as a decision page. The user should be able to
distinguish:

- Register Delegation: let another wallet use selected NFT utility without
  moving the NFT.
- Register Consolidation: connect wallets you control for supported 6529
  metrics.
- Register Delegation Manager: let a trusted wallet maintain delegation and
  consolidation records for another wallet.
- Manage by Collection: inspect and manage outgoing/incoming records, manager
  rights, and inbound locks by scope.

Direct write routes must never render a form with `undefined` wallet values.
Disconnected users see a route-specific connect panel and no submit path.

Wallet Checker must be framed as read-only. It accepts Ethereum addresses and
ENS names, shows invalid-input feedback, and has distinct empty, loading,
no-records, and request-error states.

Collection management routes must explain the selected collection scope and the
meaning of outgoing/incoming records. Locks must be described as inbound-only.

## Article Wrapper Standards

Every FAQ child article must be usable as a direct landing page.

Required wrapper behavior:

- Breadcrumb navigation with the current page marked as current text, not a
  link.
- Back link to Delegation FAQ.
- One-sentence summary.
- Previous/next navigation in FAQ order.
- Specific route metadata.
- No duplicate top-level heading if the article body already has one.

Preferred article-body behavior:

- Descriptive `h2` and `h3` headings.
- Semantic tables for comparison content.
- Useful alt text for instructional images.
- Visible captions when an image teaches a process.
- Related links at the end of longer articles.

The wrapper can provide navigation and summaries. Article-specific teaching
copy, captions, and image alt text belong in the article body package unless an
interim accessibility override map is explicitly approved.

## Accessibility And Localization Gates

Accessibility and localization are gates on every delegation ticket, not a
cleanup phase.

Agents must check touched UI against:

- `ops/standards/frontend-accessibility-wcag-22-aa.md`
- `ops/standards/frontend-i18n-localization.md`

Minimum gate:

- Visible or programmatic labels for inputs and repeated controls.
- Helper/error text associated with controls where practical.
- Error text announced with an appropriate live region.
- Keyboard-usable buttons, links, accordions, and dialogs.
- Descriptive button/link names.
- No click handlers on non-interactive elements.
- No image-only instructions.
- No filename or contract-address alt text for failed decorative thumbnails.
- New strings follow the repo's localization direction. If the touched area is
  not fully localized yet, keep the touched UI compliant and record remaining
  debt.

## Article Rewrite Backlog

The article package currently contains 26 articles. Rewriting is editorial
content work, not normal frontend refactoring.

Priority order:

1. Wallet Architecture: add the TAP summary, three-wallet role table, and clear
   security rule before the long explanation.
2. Delegation FAQ: add orientation, group links by user goal, and keep labels
   singular and scannable.
3. Consolidation Use Cases: replace generic use-case headings with descriptive
   headings and add the "only consolidate wallets you control" warning.
4. Registration articles: Delegation, Delegation Manager, Consolidation.
5. Architecture setup articles: two-address, TAP, manager-assisted TAP, Safe.
6. View/manage articles: view, update, revoke.
7. Manager-rights articles: register/revoke using manager rights.
8. Lock/unlock articles: global, collection, and use-case variants.

Each article rewrite must preserve these invariants:

- Do not say delegation transfers NFTs or ownership.
- Do not imply consolidation grants rights.
- Do not imply delegation manager rights are low-risk.
- Do not imply locks revoke existing outgoing records.
- Keep contract use-case numbers accurate.
- Keep screenshots/diagrams aligned with current UI labels.

## Agent Workplan

Use this status table before starting new delegation work.

| Work item | Status | Source of truth |
| --- | --- | --- |
| No-wallet write-route panels | Built | React UI |
| Action-specific submit labels and intros | Built | React UI |
| Route-specific metadata | Built | React route metadata |
| Delegation Center decision copy | Built | React UI |
| Wallet Checker framing and states | Built | React UI |
| Collection page intros and disconnected state | Built | React UI |
| FAQ child wrapper navigation | Built | React wrapper |
| Repo-reviewed article package | Built | `content/delegation` |
| Hash-verified runtime loader | Built | `delegationContent.ts` |
| IPFS root CID publish | Built, pending credentials/config | `publish-delegation-docs-content.mjs` plus manual workflow |
| CloudFront/S3 acceleration mirror | Built optional path, pending config | CID/version-addressed mirror |
| Full article body rewrite package | Pending | `public/delegation-content/{version}/html` |
| Image caption/alt pass for article bodies | Pending | `public/delegation-content/{version}/html` |
| Similar S3 content migrations outside delegation | Future | Separate specs |

Recommended next agent tickets:

1. Rewrite Wallet Architecture in the versioned public bundle and regenerate
   the manifest.
2. Rewrite Delegation FAQ landing and Consolidation Use Cases.
3. Rewrite the three registration FAQ articles.
4. Add an article image alt/caption audit across all 26 article bodies.
5. Publish the reviewed bundle to IPFS and update the manifest root CID.
6. Configure optional CID/version-addressed CloudFront mirror and verify hash
   behavior.
7. Inventory other S3-rendered content areas and create separate migration
   specs.

## Out Of Scope

Do not fold these into the delegation pilot without a separate decision:

- Rewriting About-page HTML.
- Rewriting mapping-tool help HTML.
- Changing NFTDelegation contract semantics.
- Replacing the onchain API or wallet connection model.
- Publishing to IPFS from browser runtime code.
