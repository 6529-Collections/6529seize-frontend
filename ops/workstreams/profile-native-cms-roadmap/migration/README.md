# Typed static-content migration

This replaces the unmerged July 2026 migration pilot's WordPress/Avada regex
approach. Current Capital and legacy Museum routes import typed `content.tsx`
objects; their `page.tsx` files no longer contain the content being migrated.

The converter reads the TypeScript AST without executing source modules. It
accepts literal `MigratedWordPressStaticPageContent` exports and literal
`migratedWordPressTrustedHtml(...)` calls. Unsupported expressions or malformed
content produce a source error. It never uses route source code as a prose
fallback.

## Outputs

- [Capital package](6529capital.generated.package.json): three current Capital pages in a
  deterministic CMS V1 fixture, including full original content in source packets.
- [Capital report](capital-migration.json): source fingerprint, page inventory,
  validation and conversion diagnostics.
- [Museum feasibility](museum-feasibility.md) and [full report](museum-migration.json):
  a fresh inventory of the 143 legacy typed Museum pages. A Museum package is not
  committed or emitted while its fixture validation fails.

No existing route, profile, institutional content, deployment configuration, or
CMS primary pointer changes as part of this migration tooling. Generated profile
paths (`/6529capital/.../index.html`, `/6529museum/.../index.html`) describe proposed
fixture routes, not published pages.

## Regeneration

Run from the repository root through the repository wrapper. The timestamp is
required and must be an exact UTC ISO string, including milliseconds. Holding
source and timestamp constant gives identical output on Windows and Unix; source
fingerprints normalize CRLF to LF.

Generated package filenames contain `.generated.` so the existing repository
formatter ignore preserves the converter's canonical output formatting. Regenerate
them with this command instead of hand-formatting them.

```bash
6529 exec tsx ops/scripts/profile-cms/migrate-static-pages.ts --target capital --out-dir ops/workstreams/profile-native-cms-roadmap/migration --now 2026-09-10T00:00:00.000Z
6529 exec tsx ops/scripts/profile-cms/migrate-static-pages.ts --target museum --out-dir ops/workstreams/profile-native-cms-roadmap/migration --now 2026-09-10T00:00:00.000Z --report-only
6529 run test:no-coverage __tests__/ops/profile-cms/migration.test.ts --runInBand
```

The Museum command currently exits `1` after writing its report because a source
image lacks required dimensions. This is the expected feasibility result, not a
parser failure. A missing/malformed source is recorded independently so the report
can account for the other pages. Partial or invalid packages are not written;
previous package files in an output directory are not deleted or refreshed by a
failed run. Check the exit status and report fingerprint before using an output.

## Conversion contract

- Preserve source block order and text, explicit image captions, heading content,
  quotation citations, page titles and the visible section label. Capital's
  visible description is included in its page body; Museum descriptions remain
  metadata, matching the current static-page shell.
- Parse HTML fragments as a DOM. Paragraphs remain separate; text around embedded
  media is retained in order. Unknown text-bearing tags retain their text. No
  overlapping regex extraction or guessed image captions are used.
- CMS `rich_text` currently renders plain text. Inline emphasis is flattened;
  link labels remain in prose and safe destinations become `button_link` blocks
  after their containing paragraph. This preserves text and link access, not the
  legacy visual layout. Links into the same migrated route family are rewritten
  to corresponding fixture routes, preserving query and fragment suffixes.
- Reject protocol-relative, backslash-normalized, credential-bearing, non-HTTPS
  and control-character URLs. Unsupported protocols such as Capital's `mailto:`
  link are recorded explicitly; their label remains in the prose and their source
  remains in the original-content packet.
- Deduplicate identical image records across pages without merging different alt
  text or dimensions. Source dimensions are retained; missing dimensions and
  unknown MIME types are diagnostics, not guessed values.
- Do not invent posters or heavy-media policies. Video, iframe and other
  unsupported media remain in the original-content packets and are individually
  reported by source file, block index and URI. They are not silently represented
  as a complete migration.
- Bound metadata with a word-boundary ellipsis only when required by the CMS
  schema. Full source values remain intact in page content/source packets.

## Before publishing any migrated site

All outputs remain fixtures (`publish_ready: false`, fixture signatures/storage,
`noindex`). Package and payload hashes are computed from canonical JSON, while
external asset byte hashes are explicit zero placeholders. No assets are fetched,
uploaded, signed or pinned by this tool. The Capital fixture currently has no
image assets, reflecting its current source rather than the older pilot output.

Resolve the reported unsupported links/media and missing metadata, acquire real
asset bytes/hashes and any necessary rights or fallback assets, then visually
compare the generated site with the intended source at desktop and mobile sizes.
The specialized Museum directory/collection layouts need a separate design
decision; schema validation alone does not establish visual or content parity.
Use the normal validated storage/sign/publish workflow for an approved package.

The tests cover parsing without execution, invalid inputs, text/media ordering,
links, captions, shared assets, missing dimensions, metadata limits, deterministic
Capital regeneration and rejection under non-fixture signature/storage policy.
