# Retained Museum browser-test media

The local Network IA and release-acceptance tests intercept only the same-origin
`/api/museum/media` endpoint, serving the exact CDN bytes listed in `manifest.json`.
This isolates rendering, hydration, responsive image selection, and geometry from
upstream availability. It does not certify live media delivery. Staging and
production runs do not install this fixture; proxy behavior also has focused
coverage in `__tests__/app/api/museum.media.route.test.ts`.

The manifest pins the six accession works (five Magnum works and Vera Molnár)
and all three responsive sizes, 640/1280/2400. Ten existing Research display
files are reused after byte-for-byte comparison with their upstream URLs; the
other eight are retained here. Each file is SHA-256 checked before use. Unknown
proxy requests and corrupted files fail closed instead of falling back to the
network. Publication URLs, image selection, alt text and assertions are unchanged.
Other image sources remain live; this fixture covers the accession proxy only.

When the pinned publication changes, review its media URLs, retain the exact
approved bytes, and update hashes together. Do not substitute blank images or
accept arbitrary URLs. The source URLs remain in the manifest for provenance;
existing artwork rights and display restrictions still apply.
