# Wave Curation URL Submissions

## Overview

Curation waves use a URL-only drop composer. Each submission accepts one
supported NFT marketplace URL.

This flow appears in two places:

- Curation `Drop` mode in the thread composer.
- Curation leaderboard inline composer row with a `Supported URLs` helper.

## Location in the Site

- Curation wave threads: `/waves/{waveId}`
- Direct-message thread context with an active wave:
  `/messages?wave={waveId}` (no `/messages/{waveId}` route)
- Leaderboard view inside those same thread routes

## Entry Points

1. Open a curation wave thread.
2. In thread composer, switch to `Drop` mode when chat/drop toggles are shown.
3. In `Leaderboard`, use the inline URL composer row when eligible.
4. Paste one supported URL and submit with `Enter` or `Drop`.

## Composer Variants

- Both variants use input placeholder `Enter supported curation URL`.
- Default thread composer shows helper text:
  `Use one supported HTTPS URL only, without extra text.`
- Leaderboard variant shows a `Supported URLs` button that opens a modal with
  accepted URL examples.
- If the value can be normalized, both variants show:
  `Will submit as: {canonicalUrl}`.
- In thread composer, active reply/quote context is preserved, but drop content
  still submits as URL-only.

## Submission Flow

1. Enter one URL token (no extra text).
2. Validation appears after blur or submit attempt.
3. Submit with `Enter` or `Drop` (button stays disabled until valid).
4. If auth/signature/terms are required, complete that step.
5. If auth/signature/terms is canceled, the typed URL remains in the input.
6. When submission is queued, the input clears.
7. In leaderboard variant only, success toast appears after server success:
   `Drop submitted successfully`.

## Supported URL Formats

Accepted host forms are root domain or `www.` only. Other subdomains are
rejected.

- SuperRare artwork:
  `https://superrare.com/artwork/eth/{contractAddress}/{tokenId}`
- Transient NFT:
  `https://transient.xyz/nfts/ethereum/{contractAddress}/{tokenId}`
- Transient mint:
  `https://transient.xyz/mint/{slug}`
- Manifold listing:
  `https://manifold.xyz/@{creator}/id/{id}`
- Foundation mint:
  `https://foundation.app/mint/eth/{contractAddress}/{tokenId}`
- OpenSea item:
  `https://opensea.io/item/ethereum/{contractAddress}/{tokenId}`
- OpenSea asset:
  `https://opensea.io/assets/ethereum/{contractAddress}/{tokenId}`

## Validation Feedback

- Scheme-less supported input (for example `opensea.io/item/...`) is accepted
  and submitted as `https://...`.
- `www.` host variants are accepted.
- Optional trailing slash is accepted on supported paths.
- Transient mint URLs accept slug-style IDs.

## Validation Errors

- Extra text or whitespace is rejected with:
  `Enter URL only (no extra text).`
- Explicit non-HTTPS schemes (for example `http://...`) or malformed HTTPS
  values are rejected with:
  `Enter a valid HTTPS URL.`
- Unsupported host/path patterns are rejected with:
  `URL must match a supported curation link format.`
- This includes invalid contract or token segments, query/hash fragments,
  custom ports, credentials, extra path segments, and unsupported non-`www`
  subdomains.
- In leaderboard variant, invalid non-empty input also shows:
  `Unsupported URL format. Open Supported URLs.`

## Failure and Recovery

- If authentication/signature is canceled, submission stops and the typed URL
  stays available to retry.
- If server submission fails after queueing, users get an error toast and can
  retry by re-entering the URL.
- If validation fails, users can correct the URL and resubmit immediately.

## Limitations / Notes

- This flow submits one URL as drop content only.
- Inline text, file attachments, and metadata are not included in the same
  curation submission.
- Validation is host-plus-path specific, not host-only.

## Related Pages

- [Wave Composer Index](README.md)
- [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Wave Drop Web3 Preview Cards](../link-previews/feature-web3-preview-cards.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Docs Home](../../README.md)
