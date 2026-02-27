# Interactive HTML Media Rendering

## Overview

- `text/html` media uses two render paths:
  - Sandboxed iframe path on shared drop/card renderers and submission preview.
  - NFT animation iframe path on home `Latest Drop` (`Now Minting`) artwork.
- Touch-first contexts can require `Tap to load` before HTML starts.

## Location in the Site

- Shared drop/card media surfaces that use common media renderers, including
  home `Next Drop` and `Coming up` cards.
- `Submit Work to The Memes` modal (`/waves/{waveId}`), Artwork step,
  `Interactive HTML` tab preview.
- Home latest-drop artwork (`/`) when panel is in `Latest Drop`
  (`Now Minting`) and the NFT animation format is HTML.

## Entry Points

- Open a drop/card whose media MIME type is `text/html`.
- On `/`, open `Next Drop` or `Coming up` cards that contain HTML media.
- In The Memes submission flow:
  - choose `Interactive HTML`
  - choose `IPFS` or `Arweave`
  - enter a root CID/transaction ID and wait for validation.
- On `/`, open `Latest Drop` (`Now Minting`) when the current NFT animation is
  HTML.

## User Journey

1. HTML media is detected for the current surface.
2. Shared renderer path:
   - `ipfs://` values are converted to `https://ipfs.io/ipfs/...`
   - URL is canonicalized and checked against allowed host/path rules.
3. If accepted, the surface renders:
   - host banner (`Untrusted interactive content` + host link)
   - iframe with `sandbox="allow-scripts"`, empty `allow`,
     `referrerPolicy="no-referrer"`, and `credentialless`.
4. Shared renderer iframes mount only after the surface enters the viewport.
5. Touch-gated shared contexts require `Tap to load`.
6. Submission preview validates the gateway response and keeps `Continue`
   blocked until status is `valid`.
7. Latest-drop (`Now Minting`) HTML uses the NFT animation iframe path: touch
   devices still get `Tap to load`, then the raw animation URL is loaded.

## Common Scenarios

- Wave/drop cards with HTML media render the host banner plus sandboxed iframe.
- Touch devices on home `Next Drop` and `Coming up` cards show `Tap to load`.
- Submission preview shows:
  - `Validating preview...` while checks run
  - sandboxed preview when valid
  - inline error guidance when invalid.
- Home `Latest Drop` (`Now Minting`) HTML artwork can show `Tap to load` on
  touch devices, then load without the sandbox host banner.

## Edge Cases

- Canonicalization rejects non-HTTPS URLs, credentialed URLs, unsupported ports,
  query/fragment values, unapproved hosts, and invalid provider path formats.
- Allowed hosts include `ipfs.io`/`www.ipfs.io`, `arweave.net`/
  `www.arweave.net`, and valid `*.arweave.net` transaction subdomains.
- Submission validation only accepts root CID/transaction IDs (no subpaths).
- Submission validation uses `HEAD` first and falls back to `GET` for `405`,
  `403`, or `501` responses.
- Submission validation rejects redirects that resolve to unapproved hosts.
- Latest-drop NFT animation path does not use the same canonicalization and
  host-banner flow as shared sandboxed renderers.

## Failure and Recovery

- If canonicalization fails, no iframe is rendered on that surface.
- If gateway validation fails in submission flow, preview stays in an invalid
  state with an inline reason.
- If gateway requests fail, users see an `Unable to reach/verify` style error;
  editing the hash and retrying re-runs validation.
- If gateway content type is not HTML, submission validation fails and
  submission stays blocked.
- Latest-drop NFT animation failures have no interactive-specific inline retry
  message; reload or reopen the drop to retry loading.

## Limitations / Notes

- Interactive iframe handling applies only to `text/html` media.
- The sandbox allows scripts but intentionally does not grant same-origin,
  popup, or broader permission-policy capabilities.
- Submission interactive mode currently keeps media type fixed to
  `text/html`.
- Latest-drop NFT animation HTML uses a different renderer path and does not
  show `Untrusted interactive content` host banners.

## Related Pages

- [Media Rendering Index](README.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Now Minting Countdown](../memes/feature-now-minting-countdown.md)
- [Memes Submission Workflows](../../waves/memes/feature-memes-submission.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
