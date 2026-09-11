# Museum migration feasibility — 2026-09-10

This report was regenerated from current `app/museum/**/content.tsx` exports of
`MigratedWordPressStaticPageContent`. It covers the legacy Museum content family;
it does not migrate the newer Network Museum application or its institutional
records. The [machine-readable report](museum-migration.json) contains every
source file, generated page, diagnostic URI and the aggregate source fingerprint.
July's 451-asset/788-block inventory is not used as evidence for this run.

| Measure                                    |  Current result |
| ------------------------------------------ | --------------: |
| Source files discovered and parsed         |             143 |
| Proposed CMS pages/routes                  |             143 |
| Source parse/read errors                   |               0 |
| Generated heading blocks                   |             299 |
| Generated rich-text blocks                 |           1,937 |
| Generated button-link blocks               |             423 |
| Generated image blocks                     |             297 |
| Distinct image assets/URLs                 |             293 |
| Video blocks awaiting poster/policy review | 161 on 34 pages |
| Iframes awaiting fallback/policy review    |   11 on 3 pages |
| Pages with no source blocks                |               6 |
| Images missing source dimensions           |               1 |

The output includes the current section labels and titles, retains each typed
block's order, and extracts accessible destinations from literal HTML links.
Identical image records are shared across pages. These rules differ from the
older legacy-markup parser, so the block and asset counts are not comparable as a
percentage of work completed.

## Explicit gaps

Fixture validation currently fails with one `asset.dimensions_required` error.
The source is block 5 of `app/museum/6529-fund-szn1/xcopy/content.tsx`, whose
`SPECIAL-OPERATION.gif` image has no width/height in the typed record. The tool
retains that absence and records `asset.dimensions_unverified`; it does not assign
made-up dimensions. Consequently the CLI writes the report and exits `1` without
emitting a Museum package.

The 161 videos and 11 iframes have no newly invented posters, fallbacks or embed
permissions. Their exact URIs remain in source packets and diagnostics, and the
surrounding prose is retained. Six source pages have empty block arrays and need
an editorial decision. Even after fixing the dimension issue, a structurally valid
fixture would still be incomplete until those media/content decisions are made.

Every converted image URL in this run is hosted at
`dnclu2fna0b2b.cloudfront.net`. The CMS asset proxy does not rewrite that host, but
passes its URLs through unchanged. Proxy allowlisting is not itself a rendering
blocker: verify direct loading, CSP, dimensions and image rights, then decide
whether direct hosting, explicit proxy support or permanent rehosting is desired.
No asset bytes, availability, MIME response headers or content hashes were fetched
or verified in this run.

## Suggested next pilot

1. Resolve the single known dimension gap from verified media metadata and choose
   a small representative wing with prose, images, external links and heavy media.
2. Supply reviewed poster/fallback/caption assets for that wing, and verify the
   output has no unresolved content diagnostics.
3. Review its rendering against the intended site at desktop and mobile sizes.
   The current Museum renderer has specialized directories, collection lists and
   detail layouts; plain CMS blocks do not reproduce those layouts automatically.
4. Only then acquire permanent asset receipts and use normal signed publishing
   for the approved profile/package. Keep rollback and existing-route continuity
   explicit.

This report establishes the current source inventory and conversion gaps. It does
not assert a deployed Museum migration, a replacement of existing routes, or a
production-ready package.
