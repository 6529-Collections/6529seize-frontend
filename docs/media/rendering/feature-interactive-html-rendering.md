# Interactive HTML Media Rendering

## Overview

Some artwork entries can be interactive HTML (`text/html`). These renders are kept
inside a sandboxed iframe so external HTML can display without getting full access
to the host page.

## Location in the Site

- Drop list and card surfaces that render media where MIME type is `text/html`.
- Submission preview when interactive URL mode is used in Memes workflows.
- Shared media surfaces that render third-party media URLs in a non-editable view.

## Entry Points

- Open a supported media card/list item with an interactive entry.
- Select interactive media in the Memes submission flow and move to preview.

## User Journey

1. A media URL arrives for a drop/preview context.
2. The renderer normalizes known protocol shortcuts (for example `ipfs://`) to an
   HTTPS gateway URL and applies canonicalization checks.
3. If canonicalization succeeds, the component renders an iframe with:
   - `sandbox="allow-scripts"`
   - `allow=""`
   - `referrerPolicy="no-referrer"`
   - `credentialless`
4. A host banner is shown above the frame with the safe resolved origin.
5. In list/card contexts where autoplay is disabled (including several touch-first
   home surfaces), interactive cards show `Tap to load` first; loading starts
   only after interaction.

## Common Scenarios

- Standard HTML card:
  - `media_mime_type === "text/html"` switches from normal image/video behavior to
    iframe rendering.
- Home and latest-drop surfaces:
  - On touch devices, leading cards and latest-drop hero cards keep interactive
    HTML paused until users tap the overlay control.
- Lazy loading:
  - The frame waits for viewport visibility before loading.
- Safe interaction:
  - The sandbox keeps the embedded document isolated and strips referrer
    context.
- Trusted host checks:
  - The renderer keeps interactive URLs to trusted gateway hosts only (`ipfs.io`,
    `www.ipfs.io`, `arweave.net`, `www.arweave.net`, and valid Arweave
    subdomains).

## Edge Cases

- Canonicalization rejects:
  - non-HTTPS URLs
  - user credentials in the URL
  - port values other than default HTTPS (443)
  - queries, fragments, and unsupported host/path shapes
  - credentials or malformed hostnames
- IPFS paths must be `https://ipfs.io/ipfs/<CID>`-style after normalization.
- Arweave paths must use `https://arweave.net/<TX>` or a matching Arweave
  subdomain form.
- The URL is rejected if the response redirects to an unapproved host.

## Failure and Recovery

- If canonicalization fails, no frame is rendered; callers usually show no media
  preview in that state.
- If the content request does not return an HTML response type, the submission
  flow reports validation failure before allowing submission.
- If network checks fail, validation remains in an error state and users can edit
  the hash and retry.

## Limitations / Notes

- The sandbox does not grant same-origin or popup/advanced pointer capabilities.
- The frame is intentionally minimal for safety; interactive behavior depends on
  what HTML can run under the enforced sandbox and allowlist constraints.
- `interactive URL` mode in submission still requires a separately validated path and
  then re-validates resulting gateway URLs on server before submission is accepted.

## Related Pages

- [Media Index](../README.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Memes Submission Workflows](../../waves/memes/feature-memes-submission.md)
- [Docs Home](../../README.md)
