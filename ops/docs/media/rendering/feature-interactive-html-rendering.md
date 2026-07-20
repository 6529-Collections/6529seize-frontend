# Interactive HTML Media Rendering

## Overview

- Interactive `text/html` media uses two renderer families:
  - Sandboxed renderer on shared drop/card surfaces and in Memes submission
    preview.
  - NFT animation renderer on home `Latest Drop` artwork.
- Shared card surfaces that already have preview artwork can show that static
  preview image instead of mounting the live HTML iframe immediately.
- Some touch-device home surfaces require `Tap to load` before HTML starts.

## Location in the Site

- Shared drop/card media surfaces that use common media renderers (including
  home card panels and wave/drop card views).
- `Submit Work to The Memes` modal (`/waves/{waveId}`), Artwork step,
  `Interactive HTML` tab preview.
- Home `Latest Drop` artwork (`/`) when the NFT animation format is HTML.

## Entry Points

- Open a drop/card whose media MIME type is `text/html`.
- On `/`, open `Next Drop`, `Coming up`, or `Latest Drop` when media is HTML.
- In The Memes submission flow:
  - choose `Interactive HTML`
  - choose `IPFS` or `Arweave`
  - enter a root CID/transaction ID (or paste an approved gateway URL), then
    wait for validation.

## User Journey

1. HTML media is detected for the current surface.
2. Shared renderer path:
   - `ipfs://` values are normalized to `https://ipfs.io/ipfs/...`.
   - URL is canonicalized and checked against allowed HTTPS host/path rules.
3. If the shared surface already has preview artwork and does not require
   interaction, it renders that static preview image instead of mounting the
   live iframe.
4. Otherwise, if accepted, the surface renders:
   - host banner (`Untrusted interactive content` + host link)
   - iframe with `sandbox="allow-scripts"`, empty `allow`,
     `referrerPolicy="no-referrer"`, and `credentialless`.
   - a centered responsive viewport in wave chat/drop cards: portrait on small
     screens and square on wider layouts, capped by the device viewport height
     so interactive artwork stays usable without making the feed unbounded.
5. Shared renderer iframes mount only after the surface enters the viewport.
6. Touch-gated home contexts require `Tap to load`; when preview artwork
   exists, that image stays visible behind the gate until activation.
7. Submission preview:
   - accepts only root CID/transaction IDs (no subpaths, query strings, or
     fragments)
   - normalizes approved gateway URLs back to the root CID/transaction ID
     before validation
   - validates gateway responses with `HEAD`, then `GET` fallback on `405`,
     `403`, or `501`
   - keeps `Continue` blocked until status is `valid`.
8. Home `Latest Drop` HTML uses the NFT animation iframe path (no sandbox
   banner/canonicalization gate). If an approved Arweave HTML URL errors or
   does not finish loading, the renderer retries the same asset across the
   remaining approved gateways before giving up. Touch devices can still
   require `Tap to load`.

## Common Scenarios

- Shared wave/drop cards without a preview-image override render the host
  banner plus sandboxed iframe.
- Live HTML in wave chat/drop cards uses a responsive portrait-to-square
  viewport; ordinary image and video sizing is unchanged.
- Gallery, leaderboard, and other card surfaces that already have preview
  artwork can show a static preview image for HTML media instead of a live
  iframe.
- Touch devices on home `Next Drop`, `Coming up`, and `Latest Drop` show
  `Tap to load` for HTML media.
- Submission preview shows:
  - `Validating preview...` while checks run
  - sandboxed preview when valid
  - inline error guidance when invalid.
- Editing or clearing the submission hash resets preview state and triggers a
  fresh validation cycle.
- Home `Latest Drop` HTML on an approved Arweave URL can recover automatically
  by retrying the same asset on the remaining approved gateways.

## Edge Cases

- Canonicalization rejects non-HTTPS URLs, credentialed URLs, unsupported ports,
  query/fragment values, unapproved hosts, and invalid provider path formats.
- Allowed hosts include `ipfs.io`/`www.ipfs.io` plus approved Arweave gateways
  such as `arweave.net`, `ardrive.net`, `gateway.arweave.net`, and
  `gateway.ar.io`; valid `*.arweave.net` transaction subdomains also remain
  accepted.
- Submission validation only accepts root CID/transaction IDs (no subpaths).
- Submission validation rejects redirects that resolve to unapproved hosts.
- Submission validation fails unless gateway `content-type` resolves to
  `text/html` or `application/xhtml+xml`.
- If a touch-gated HTML surface also has preview artwork, that image remains
  visible until `Tap to load` activates the iframe.
- Shared renderer drops invalid canonical URLs without an inline card-level
  error.
- `Latest Drop` NFT animation path does not use the same canonicalization and
  host-banner flow as shared sandboxed renderers.

## Failure and Recovery

- If canonicalization fails, no iframe is rendered on that surface.
- If gateway validation fails in submission flow, preview stays in an invalid
  state with an inline reason.
- If gateway requests fail, users see an `Unable to reach/verify` style error;
  editing the hash and retrying re-runs validation.
- If `Latest Drop` HTML animation fails on an approved Arweave gateway, the
  renderer automatically tries the remaining approved gateways; after those
  retries are exhausted, reload `/` to retry rendering.

## Limitations / Notes

- Interactive iframe handling applies only to `text/html` media.
- Some shared card surfaces intentionally prefer a static preview image over
  live HTML when preview artwork is available.
- The sandbox allows scripts but intentionally does not grant same-origin,
  popup, or broader permission-policy capabilities.
- Submission interactive mode currently keeps media type fixed to
  `text/html`.
- Home `Latest Drop` HTML uses a different renderer path and does not show
  `Untrusted interactive content` host banners.
- That home retry path applies only when the resolved HTML URL is already on an
  approved Arweave gateway.

## Related Pages

- [Media Rendering Index](README.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Now Minting Countdown](../memes/feature-now-minting-countdown.md)
- [Memes Submission Workflows](../../waves/memes/feature-memes-submission.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
