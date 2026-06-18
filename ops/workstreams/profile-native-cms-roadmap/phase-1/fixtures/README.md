# Phase 1 Fixture Corpus

Last updated: 2026-06-17.

## Purpose

Provide a shared package corpus that future frontend and backend agents can use
to validate schema, renderer, route, storage, signing, pointer, and AI-agent
patch behavior.

## Valid Fixtures

- `valid/minimal-profile-homepage.package.json`
  - Minimal primary site at `/punk6529/index.html`.
  - Exercises page metadata, navigation, social image, fixture signature, and
    fixture storage receipt.
- `valid/wallet-gallery.package.json`
  - Generated gallery with wallet source packet, collection route, NFT route,
    generated wallet gallery block, and NFT media profile.
- `valid/collection-page.package.json`
  - Collection page with taxonomy term, knowledge/source packet, and collection
    reference.
- `valid/nft-detail.package.json`
  - NFT detail page with original asset, display variants, poster, provenance,
    and source metadata.
- `valid/art-media.package.json`
  - Image, video, audio, HTML, and model media with posters/fallbacks and
    interactive policy coverage.
- `valid/exhibition-room.package.json`
  - 3D room with faithful artwork placement and 2D fallback detail page.
- `valid/legacy-migration.package.json`
  - Institutional migration-style package for a `6529museum` profile.

## Invalid Fixtures

- `invalid/missing-signature.package.json`
  - Fails because `signatures` is empty.
- `invalid/route-collision.package.json`
  - Fails semantic validation because two routes emit the same path.
- `invalid/unknown-block.package.json`
  - Fails schema validation because V1 does not accept unknown block types.

## Future Invalid Fixtures

Implementation should add:

- Bad signature envelope.
- Wrong signer.
- Wrong domain/chain.
- Stale pointer.
- CDN-only storage.
- Mismatched storage receipt hash.
- Unsafe URL.
- Unsafe HTML block.
- Media missing dimensions.
- Heavy model without poster.
- Unsupported schema version.

## Notes

The JSON fixtures use deterministic placeholder hashes. Phase 2 implementation
must replace or confirm them with actual RFC 8785 + SHA-256 test vectors.
