# Interactive HTML Media Rendering

## Overview

- Interactive `text/html` media uses two renderer families:
  - Sandboxed renderer on shared drop/card surfaces and in Memes submission preview.
  - NFT animation renderer on home `Latest Drop` artwork.
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
  - enter a root CID/transaction ID (or paste a supported gateway URL), then
    wait for validation.

## User Journey

1. HTML media is detected for the current surface.
2. Shared renderer path:
   - `ipfs://` values are normalized to `https://ipfs.io/ipfs/...`.
   - URL is canonicalized and checked against allowed HTTPS host/path rules.
3. If accepted, the surface renders:
   - host banner (`Untrusted interactive content` + host link)
   - iframe with `sandbox="allow-scripts"`, empty `allow`,
     `referrerPolicy="no-referrer"`, and `credentialless`.
4. Shared renderer iframes mount only after the surface enters the viewport.
5. Touch-gated home contexts require `Tap to load`.
6. Submission preview:
   - accepts only root CID/transaction IDs (no subpaths, query strings, or
     fragments)
   - validates gateway responses with `HEAD`, then `GET` fallback on `405`,
     `403`, or `501`
   - keeps `Continue` blocked until status is `valid`.
7. Home `Latest Drop` HTML uses the NFT animation iframe path (no sandbox
   banner/canonicalization gate). Touch devices can still require `Tap to load`.

## Common Scenarios

- Wave/drop cards with HTML media render the host banner plus sandboxed iframe.
- Touch devices on home `Next Drop`, `Coming up`, and `Latest Drop` show
  `Tap to load` for HTML media.
- Submission preview shows:
  - `Validating preview...` while checks run
  - sandboxed preview when valid
  - inline error guidance when invalid.
- Editing or clearing the submission hash resets preview state and triggers a
  fresh validation cycle.

## Edge Cases

- Canonicalization rejects non-HTTPS URLs, credentialed URLs, unsupported ports,
  query/fragment values, unapproved hosts, and invalid provider path formats.
- Allowed hosts include `ipfs.io`/`www.ipfs.io`, `arweave.net`/
  `www.arweave.net`, and valid `*.arweave.net` transaction subdomains.
- Submission validation only accepts root CID/transaction IDs (no subpaths).
- Submission validation rejects redirects that resolve to unapproved hosts.
- Submission validation fails unless gateway `content-type` resolves to
  `text/html` or `application/xhtml+xml`.
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
- If `Latest Drop` HTML animation fails, there is no interactive-specific retry
  control; reload `/` to retry rendering.

## Limitations / Notes

- Interactive iframe handling applies only to `text/html` media.
- The sandbox allows scripts but intentionally does not grant same-origin,
  popup, or broader permission-policy capabilities.
- Submission interactive mode currently keeps media type fixed to
  `text/html`.
- Home `Latest Drop` HTML uses a different renderer path and does not show
  `Untrusted interactive content` host banners.

## Related Pages

- [Media Rendering Index](README.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Now Minting Countdown](../memes/feature-now-minting-countdown.md)
- [Memes Submission Workflows](../../waves/memes/feature-memes-submission.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
