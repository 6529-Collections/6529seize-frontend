# Wave Curation URL Submissions

## Overview

Curation submissions use a URL-only composer. Users submit one supported NFT
marketplace URL as drop content.

In curation leaderboard layouts, eligible users get an inline URL composer row
with direct submit controls and a `Supported URLs` reference.

## Location in the Site

- Curation wave threads: `/waves/{waveId}`
- Direct-message thread context with an active wave:
  `/messages?wave={waveId}` (no `/messages/{waveId}` route)
- Curation participation (`Drop`) mode in the shared composer

## Entry Points

- Open a curation wave and switch to `Drop` mode when chat/drop mode is shown.
- In curation leaderboards, use the inline URL field above leaderboard results.
- Paste one supported marketplace URL and submit with `Enter` or `Drop`.

## User Journey

1. Focus the curation URL input (`Enter supported curation URL`).
2. Paste or type one marketplace URL.
3. The composer validates URL-only input and supported URL families.
4. If the value can be normalized (for example missing scheme), the composer
   shows the canonical URL it will submit.
5. Submit with `Enter` or `Drop`.
6. The composer queues the drop request and clears the URL input.
7. In leaderboard layouts, a success toast confirms server submission.

## Common Scenarios

- Scheme-less supported input such as `opensea.io/item/...` is accepted and
  submitted as `https://...`.
- `www.` host variants for supported marketplaces are accepted.
- In leaderboard variant, users can open `Supported URLs` to review accepted
  URL formats before posting.
- In leaderboard variant, successful submissions show
  `Drop submitted successfully`.
- Reply and quote context can be preserved while posting a curation URL drop.

## Edge Cases

- Extra text, whitespace-separated values, or multiple URLs in one input are
  rejected.
- Non-HTTPS URLs are rejected.
- URLs with unsupported hosts or unsupported path formats are rejected.
- URL values with query strings, hash fragments, custom ports, or credentials
  are rejected.
- In leaderboard variant, invalid non-empty input can trigger an attention
  prompt that points users to `Supported URLs`.
- Non-leaderboard curation composer layouts post successfully without the
  leaderboard success toast.

## Failure and Recovery

- If authentication or required signature is canceled, submission stops and the
  typed URL remains available to retry.
- If submission fails after the request is sent, users receive an error and can
  retry by entering the URL again.
- If validation fails, users can correct the URL and resubmit immediately.

## Limitations / Notes

- This flow submits one URL as drop content; it does not include additional
  inline text or file attachments in the same curation submission.
- Supported URL families currently cover Manifold listing, SuperRare artwork,
  Foundation mint, OpenSea item/asset, and Transient NFT/mint formats.
- Validation is path-specific for each marketplace family, not host-only.

## Related Pages

- [Wave Composer Index](README.md)
- [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Wave Drop Web3 Preview Cards](../link-previews/feature-web3-preview-cards.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Docs Home](../../README.md)
