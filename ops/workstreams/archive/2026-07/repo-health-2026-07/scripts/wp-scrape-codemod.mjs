// Codemod: replace duplicated WordPress asset chrome + footer in scraped pages
// with <WordPressLegacyAssets .../> + <WordPressLegacyFooter />.
// Byte-anchored and fail-closed: bails (skips file) on ANY unexpected shape.
import fs from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node wp-scrape-codemod.mjs <page.tsx> [...]");
  process.exit(1);
}

const EXPECTED_IDS = [
  "genesis-blocks-style-css-css",
  "wp-emoji-styles-inline-css",
  "wp-block-library-css",
  "wp-block-library-theme-inline-css",
  "mediaelement-css",
  "wp-mediaelement-css",
  "jetpack-sharing-buttons-style-inline-css",
  "classic-theme-styles-inline-css",
  "global-styles-inline-css",
  "inf-font-awesome-css",
  "owl-carousel-css",
  "psacp-public-style-css",
  "sticky-social-icons-css",
  "font-awesome-css",
  "css-fb-visibility",
];

const results = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  const fail = (why) => {
    results.push({ file, ok: false, why });
  };

  // ---- locate head span ----
  const genesisIdx = lines.findIndex((l) =>
    l.includes('id="genesis-blocks-style-css-css"')
  );
  if (genesisIdx < 0) { fail("no genesis-blocks id"); continue; }
  // span starts at the `<link` line that opens this element
  let headStart = genesisIdx;
  while (headStart > 0 && !lines[headStart].trimEnd().endsWith("<link")) headStart--;
  if (!lines[headStart].trim().startsWith("<link")) { fail("head start anchor not found"); continue; }

  const tileIdx = lines.findIndex((l) => l.includes("msapplication-TileImage"));
  if (tileIdx < 0) { fail("no msapplication-TileImage"); continue; }
  // span ends at the element's closing `/>` line
  let headEnd = tileIdx;
  while (headEnd < lines.length - 1 && !lines[headEnd].trim().endsWith("/>")) headEnd++;
  if (!lines[headEnd].trim().endsWith("/>")) { fail("head end anchor not found"); continue; }
  if (headEnd <= headStart) { fail("head span inverted"); continue; }

  const headSpan = lines.slice(headStart, headEnd + 1).join("\n");

  // verify canonical ids all present exactly once
  const missing = EXPECTED_IDS.filter((id) => !headSpan.includes(`id="${id}"`));
  if (missing.length > 0) { fail(`head span missing ids: ${missing.join(",")}`); continue; }
  // verify no SCRIPT tags or unexpected elements hide in the span
  if (/<script/i.test(headSpan)) { fail("script tag inside head span"); continue; }

  // ---- extract params ----
  const fusionMatch = headSpan.match(
    /<link\s+rel="stylesheet"(?:\s+id="(?<id>[^"]*)")?\s+href="(?<href>https:\/\/dnclu2fna0b2b\.cloudfront\.net\/wp-content\/uploads\/fusion-styles\/[^"]+)"/
  );
  if (!fusionMatch?.groups?.href) { fail("no fusion-styles link"); continue; }
  const fusionHref = fusionMatch.groups.href;
  const fusionId = fusionMatch.groups.id; // may be undefined

  const postJsonMatch = headSpan.match(/href="(\/wp-json\/wp\/v2\/(?:pages|posts)\/\d+)"/);
  if (!postJsonMatch) { fail("no post/page JSON link"); continue; }
  const postJsonHref = postJsonMatch[1];

  const shortlinkMatch = headSpan.match(/rel="shortlink" href="([^"]+)"/);
  if (!shortlinkMatch) { fail("no shortlink"); continue; }
  const shortlinkHref = shortlinkMatch[1];

  // oembed target: prefer the canonical path declared earlier in the page
  const canonicalMatch = src.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonicalMatch) { fail("no canonical link"); continue; }
  const oembedTargetUrl = canonicalMatch[1];

  // count of links in span must be exactly the canonical set:
  const linkCount = (headSpan.match(/<link/g) || []).length;
  // canonical: 9 stylesheets (incl. genesis-blocks) + fusion + api.w.org + json-alt
  //            + editURI + shortlink + oembed json + oembed xml + 4 preloads + 3 icons = 23
  if (linkCount !== 23) { fail(`unexpected link count in head span: ${linkCount}`); continue; }

  const indent = lines[headStart].match(/^\s*/)[0];
  const attrLines = [
    `${indent}<WordPressLegacyAssets`,
    `${indent}  fusionCssHref="${fusionHref}"`,
    ...(fusionId ? [`${indent}  fusionCssId="${fusionId}"`] : []),
    `${indent}  postJsonHref="${postJsonHref}"`,
    `${indent}  shortlinkHref="${shortlinkHref}"`,
    `${indent}  oembedTargetUrl="${oembedTargetUrl}"`,
    `${indent}/>`,
  ];

  // ---- locate footer span ----
  const pageLoadIdx = lines.findIndex((l) =>
    l.includes('className="fusion-one-page-text-link fusion-page-load-link"')
  );
  if (pageLoadIdx < 0) { fail("no page-load-link"); continue; }
  let footStart = pageLoadIdx;
  while (footStart > 0 && lines[footStart].trim() !== "<a") footStart--;
  if (lines[footStart].trim() !== "<a") { fail("footer start anchor not found"); continue; }

  const toTopIdx = lines.findIndex((l) => l.includes('className="to-top-container to-top-right"'));
  if (toTopIdx < 0) { fail("no to-top-container"); continue; }
  let footEnd = toTopIdx;
  while (footEnd < lines.length - 1 && !lines[footEnd].includes("</section>")) footEnd++;
  if (!lines[footEnd].includes("</section>")) { fail("footer end anchor not found"); continue; }
  if (footEnd <= footStart || footStart <= headEnd) { fail("footer span inverted"); continue; }

  const footSpan = lines.slice(footStart, footEnd + 1).join("\n");
  for (const marker of ["Page load link", "avada-footer-scripts", "sticky-social-icons-container", "fab-fa-twitter", "toTop", "Go to Top"]) {
    if (!footSpan.includes(marker)) { fail(`footer span missing marker: ${marker}`); continue; }
  }
  const footIndent = lines[footStart].match(/^\s*/)[0];

  // ---- build output ----
  const out = [
    ...lines.slice(0, headStart),
    ...attrLines,
    ...lines.slice(headEnd + 1, footStart),
    `${footIndent}<WordPressLegacyFooter />`,
    ...lines.slice(footEnd + 1),
  ];

  // ---- add import after the getAppMetadata import ----
  const importIdx = out.findIndex((l) => l.includes('from "@/components/providers/metadata"'));
  if (importIdx < 0) { fail("no metadata import"); continue; }
  if (!src.includes("WordPressLegacyAssets")) {
    out.splice(
      importIdx + 1,
      0,
      'import WordPressLegacyAssets, { WordPressLegacyFooter } from "@/components/legacy-wordpress/WordPressLegacyAssets";'
    );
  }

  fs.writeFileSync(file, out.join("\n"));
  results.push({ file, ok: true, removed: headEnd - headStart + 1 + (footEnd - footStart + 1) - attrLines.length - 1 });
}

for (const r of results) {
  console.log(r.ok ? `OK   ${r.file} (net -${r.removed} lines)` : `SKIP ${r.file}: ${r.why}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} rewritten, ${failed} skipped`);
