# Wave Curation URL Submissions

## Overview

Curation-wave drop submission uses a URL-first composer. Users submit one
supported NFT marketplace URL as the drop content instead of composing mixed
text and file content.

In curation leaderboard layouts, eligible users can get an inline URL composer
row with direct submit controls and a supported-format reference.

## Location in the Site

- My Stream curation leaderboard surfaces: `/waves` (with an active curation
  wave selected)
- Wave and DM composer surfaces that post to curation waves:
  `/waves/{waveId}`, `/messages?wave={waveId}`
- Participatory drop mode for curation waves

## Entry Points

- Open a curation wave and focus the drop composer.
- In curation leaderboard layouts, use the inline URL field above leaderboard
  results.
- Paste one supported marketplace URL and submit with `Enter` or `Drop`.

## User Journey

1. Focus the curation URL input (`Enter supported curation URL`).
2. Paste or type a single marketplace URL.
3. The composer validates URL-only requirements and supported URL families.
4. If the value can be normalized (for example missing scheme), the composer
   shows the canonical URL it will submit.
5. Submit with `Enter` or `Drop`.
6. The drop is posted and the URL input clears.

## Common Scenarios

- Scheme-less supported input such as `opensea.io/item/...` is accepted and
  submitted as `https://...`.
- `www.` host variants for supported marketplaces are accepted.
- In leaderboard variant, users can open `Supported URLs` to see accepted URL
  formats before posting.
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

## Failure and Recovery

- If authentication or required signature is canceled, submission stops and the
  typed URL remains available to retry.
- If submission fails, users receive an error and can retry from the same
  composer state.
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
- [Wave Drop NFT Marketplace Link Previews](../link-previews/feature-nft-marketplace-link-previews.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Docs Home](../../README.md)
