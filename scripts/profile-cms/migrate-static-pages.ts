#!/usr/bin/env node
/**
 * Converts legacy static WordPress-export TSX pages (e.g. app/capital/**,
 * app/museum/**) into a draft CmsPackageV1 JSON document.
 *
 * The converter is deterministic: given the same source manifest and page
 * files, it always produces byte-identical output (ids are derived from
 * slugs/indices, never randomness or wall-clock time inside content ids).
 * The only non-deterministic input is the `now` timestamp used for
 * `provenance.created_at` / `signed_at` / `recorded_at`, which callers can
 * pin via `--now` for reproducible fixtures.
 *
 * Usage:
 *   node -r tsx/cjs scripts/profile-cms/migrate-static-pages.ts \
 *     --manifest scripts/profile-cms/manifests/capital.manifest.json \
 *     --out-dir ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid \
 *     --report scripts/profile-cms/reports/capital-migration.json
 *
 * See scripts/profile-cms/manifests/*.json for manifest shape and
 * __tests__/scripts/profile-cms/migrate-static-pages.test.ts for the
 * converter contract this file must uphold.
 */
import fs from "node:fs";
import path from "node:path";

import {
  withComputedCmsHashes,
  type CmsBlockV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

const FIXTURE_ZERO_HASH =
  "sha256:0000000000000000000000000000000000000000000000000000000000000000";

type CmsSourcePacketV1 = NonNullable<
  CmsPackageV1["payload"]["source_packets"]
>[number];

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** One source page to migrate into the generated package. */
export type MigrationSourcePage = {
  /** Directory-relative slug used to build the destination CMS path, e.g. "" for the site root, "fund" or "genesis/autoglyphs". */
  readonly slug: string;
  /** Path (relative to the repo root) of the legacy page.tsx file to convert. */
  readonly sourceFile: string;
  /** Navigation label override. Defaults to the extracted page title. */
  readonly navigationLabel?: string;
};

/** Input manifest describing one target CMS site made from static pages. */
export type MigrationManifest = {
  /** Profile handle the package will publish under. Must not collide with CMS_RESERVED_APP_ROUTE_ROOTS. */
  readonly handle: string;
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly themeAccent?: string;
  /** The legacy app route root this manifest migrates, purely for reporting (e.g. "/capital"). */
  readonly legacyRouteRoot: string;
  readonly pages: readonly MigrationSourcePage[];
};

type ConversionWarning = {
  readonly sourceFile: string;
  readonly pageId: string;
  readonly code: string;
  readonly message: string;
};

type AssetHostSummary = {
  readonly host: string;
  readonly count: number;
  readonly sampleUri: string;
};

type PageConversionSummary = {
  readonly pageId: string;
  readonly sourceFile: string;
  readonly path: string;
  readonly blockCount: number;
  readonly blockTypeCounts: Readonly<Record<string, number>>;
};

type MigrationResult = {
  readonly cmsPackage: CmsPackageV1;
  readonly warnings: readonly ConversionWarning[];
  readonly pageSummaries: readonly PageConversionSummary[];
  readonly assetHosts: readonly AssetHostSummary[];
};

// ---------------------------------------------------------------------------
// HTML/JSX text-extraction helpers
// ---------------------------------------------------------------------------

const ID_SAFE_CHARS = /[^a-zA-Z0-9._:-]/g;
const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
};

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replaceAll(/&([a-zA-Z#0-9]+);/g, (match, name: string) => {
      const decoded = HTML_ENTITY_MAP[name];
      return decoded ?? match;
    });
}

/**
 * Strips JSX tags and inline JSX string-literal expressions (e.g. `{" "}`,
 * `{"."}`) from a text fragment, decodes HTML entities, and collapses
 * whitespace. The JSX source often splits punctuation/whitespace around
 * links into standalone `{"..."}` expression containers; those literal
 * braces/quotes are not part of the rendered text and must not leak into
 * migrated copy.
 */
function stripTags(value: string): string {
  const withoutTags = value.replaceAll(/<[^>]*>/g, " ");
  const withoutJsxExpressions = withoutTags.replaceAll(
    /\{"((?:[^"\\]|\\.)*)"\}/g,
    (_match, inner: string) => inner
  );
  return decodeHtmlEntities(withoutJsxExpressions)
    .replaceAll(/\s+/g, " ")
    .replaceAll(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function slugify(value: string, fallback = "item"): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

function toId(value: string, fallback: string): string {
  const normalized = value.replaceAll(ID_SAFE_CHARS, "-").slice(0, 128);
  return normalized.length >= 2 ? normalized : fallback;
}

function extractFirst(source: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(source);
  return match?.[1];
}

/** Extracts the raw <title> tag text, stripping the trailing " - 6529.io" suffix WordPress exports append. */
function extractTitle(source: string): string | undefined {
  const raw = extractFirst(source, /<title>([\s\S]*?)<\/title>/);
  if (!raw) {
    return undefined;
  }
  const decoded = stripTags(raw);
  return decoded.replace(/\s*-\s*6529\.io\s*$/i, "").trim() || undefined;
}

/** Extracts the raw Yoast <meta name="description" content="..."/> value (the real per-page copy). */
function extractDescription(source: string): string | undefined {
  const raw = extractFirst(
    source,
    /name="description"\s*\n?\s*content="([\s\S]*?)"\s*\/?>/
  );
  if (!raw) {
    return undefined;
  }
  const collapsed = decodeHtmlEntities(raw)
    .replaceAll(/\s*\n\s*/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return collapsed || undefined;
}

/** Extracts the canonical og:image URL, if present. */
function extractSocialImage(source: string): string | undefined {
  return extractFirst(source, /property="og:image"\s*\n?\s*content="([^"]+)"/);
}

/** Extracts the content of the WordPress `.post-content` container, which holds the actual page body. */
function extractPostContent(source: string): string | undefined {
  const startMarker = /className="post-content">/;
  const startMatch = startMarker.exec(source);
  if (!startMatch) {
    return undefined;
  }
  const bodyStart = startMatch.index + startMatch[0].length;
  return sliceBalancedDiv(source, bodyStart);
}

/**
 * Given an index just after an opening `<div ...>`'s `>`, returns the inner
 * HTML up to (but excluding) the matching closing `</div>` by tracking
 * div-tag depth. This tolerates nested nameless `<div>` wrappers without
 * needing a full JSX parser.
 */
function sliceBalancedDiv(source: string, bodyStart: number): string {
  const tagPattern = /<div\b[^>]*>|<\/div>/g;
  tagPattern.lastIndex = bodyStart;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(source))) {
    if (match[0] === "</div>") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(bodyStart, match.index);
      }
    } else {
      depth += 1;
    }
  }
  return source.slice(bodyStart);
}

type ExtractedImage = {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly caption?: string;
  readonly linkHref?: string;
};

/** Finds every <img .../> tag inside a fragment, plus caption text from an adjacent fusion-text sibling and any wrapping external <a href>. */
function extractImages(fragment: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const imgPattern = /<img\b([^>]*)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = imgPattern.exec(fragment))) {
    const attrs = match[1] ?? "";
    const src = extractFirst(attrs, /\bsrc="([^"]+)"/);
    if (!src) {
      continue;
    }
    const alt = extractFirst(attrs, /\balt="([^"]*)"/) ?? "";
    const widthRaw = extractFirst(attrs, /\bwidth=\{?"?(\d+)"?\}?/);
    const heightRaw = extractFirst(attrs, /\bheight=\{?"?(\d+)"?\}?/);
    const precedingHref = findPrecedingAnchorHref(fragment, match.index);
    const caption = findAdjacentCaption(fragment, imgPattern.lastIndex);
    images.push({
      src,
      alt: decodeHtmlEntities(alt),
      ...(widthRaw ? { width: Number.parseInt(widthRaw, 10) } : {}),
      ...(heightRaw ? { height: Number.parseInt(heightRaw, 10) } : {}),
      ...(caption ? { caption } : {}),
      ...(precedingHref ? { linkHref: precedingHref } : {}),
    });
  }
  return images;
}

/** Looks backward from an <img> for the nearest enclosing <a href="..."> within a short window (handles fusion-lightbox / external-link wrapping anchors). */
function findPrecedingAnchorHref(
  fragment: string,
  imgIndex: number
): string | undefined {
  const windowStart = Math.max(0, imgIndex - 600);
  const preceding = fragment.slice(windowStart, imgIndex);
  const anchorMatches = [...preceding.matchAll(/<a\b([^>]*)>/g)];
  const lastAnchor = anchorMatches.at(-1);
  if (!lastAnchor) {
    return undefined;
  }
  // Make sure this anchor hasn't already been closed before the image.
  const closingAfterAnchor = preceding
    .slice(lastAnchor.index + lastAnchor[0].length)
    .includes("</a>");
  if (closingAfterAnchor) {
    return undefined;
  }
  return extractFirst(lastAnchor[1] ?? "", /\bhref="([^"]+)"/);
}

/** Looks forward from just after an <img> tag for the next fusion-text/caption paragraph within a short window. */
function findAdjacentCaption(
  fragment: string,
  afterImgIndex: number
): string | undefined {
  const windowEnd = Math.min(fragment.length, afterImgIndex + 400);
  const following = fragment.slice(afterImgIndex, windowEnd);
  const paragraphMatch = /<p[^>]*>([\s\S]*?)<\/p>/.exec(following);
  if (!paragraphMatch) {
    return undefined;
  }
  const text = stripTags(paragraphMatch[1] ?? "");
  return text || undefined;
}

type ExtractedHeading = { readonly level: number; readonly text: string };

function extractHeadings(fragment: string): ExtractedHeading[] {
  const headings: ExtractedHeading[] = [];
  const headingPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g;
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(fragment))) {
    const text = stripTags(match[2] ?? "");
    if (text) {
      headings.push({ level: Number.parseInt(match[1] ?? "2", 10), text });
    }
  }
  return headings;
}

type ExtractedParagraph = { readonly text: string };

/** Extracts top-level <p> paragraphs that are not themselves inside an <img>'s caption window (best-effort; duplicates are pruned by the caller). */
function extractParagraphs(fragment: string): ExtractedParagraph[] {
  const paragraphs: ExtractedParagraph[] = [];
  const paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;
  while ((match = paragraphPattern.exec(fragment))) {
    const text = stripTags(match[1] ?? "");
    if (text) {
      paragraphs.push({ text });
    }
  }
  return paragraphs;
}

type ExtractedButton = { readonly label: string; readonly href: string };

/** Finds fusion-button style CTAs: an <a> whose className contains "fusion-button" and an inner fusion-button-text span. */
function extractButtons(fragment: string): ExtractedButton[] {
  const buttons: ExtractedButton[] = [];
  const anchorPattern = /<a\b([^>]*fusion-button[^>]*)>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(fragment))) {
    const attrs = match[1] ?? "";
    const href = extractFirst(attrs, /\bhref="([^"]+)"/);
    const inner = match[2] ?? "";
    const label =
      stripTags(extractFirst(inner, /fusion-button-text">([\s\S]*?)<\/span>/) ?? "") ||
      stripTags(inner);
    if (href && label) {
      buttons.push({ label, href });
    }
  }
  return buttons;
}

type ExtractedEmbeddedMedia = {
  readonly kind: "video" | "iframe";
  readonly src: string;
};

/**
 * Finds `<video><source src=.../></video>` and `<iframe src=.../>` embeds
 * (e.g. self-hosted museum videos, Art Blocks generator embeds). V1's
 * `video`/`html_embed` block types require a poster/fallback asset the raw
 * source markup does not reliably provide, so the converter does not turn
 * these into best-effort blocks that would validate poorly; instead it
 * records them so the caller can warn rather than silently drop them.
 */
function extractEmbeddedMedia(fragment: string): ExtractedEmbeddedMedia[] {
  const media: ExtractedEmbeddedMedia[] = [];
  const videoPattern = /<video\b[\s\S]*?<source\b([^>]*)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = videoPattern.exec(fragment))) {
    const src = extractFirst(match[1] ?? "", /\bsrc="([^"]+)"/);
    if (src) {
      media.push({ kind: "video", src: src.trim() });
    }
  }
  const iframePattern = /<iframe\b([^>]*)>/g;
  while ((match = iframePattern.exec(fragment))) {
    const src = extractFirst(match[1] ?? "", /\bsrc="([^"]+)"/);
    if (src) {
      media.push({ kind: "iframe", src: src.trim() });
    }
  }
  return media;
}

/** Extracts every https:// URL referenced anywhere in the fragment (href/src/content attributes), for asset-host auditing. */
function extractAllUris(fragment: string): string[] {
  const uris: string[] = [];
  const uriPattern = /(?:href|src|content)="(https?:\/\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = uriPattern.exec(fragment))) {
    const uri = match[1];
    if (uri) {
      uris.push(uri);
    }
  }
  return uris;
}

// ---------------------------------------------------------------------------
// Block conversion
// ---------------------------------------------------------------------------

type BlockBuildContext = {
  readonly pageId: string;
  readonly handle: string;
  readonly blocks: CmsBlockV1[];
  readonly assets: CmsPackageV1["payload"]["assets"];
  readonly seenImageSrcs: Map<string, string>;
  readonly warnings: ConversionWarning[];
  readonly sourceFile: string;
  blockIndex: number;
  assetIndex: number;
};

function nextBlockId(context: BlockBuildContext, kind: string): string {
  context.blockIndex += 1;
  return toId(
    `block-${context.pageId}-${kind}-${context.blockIndex}`,
    `block-${context.pageId}-${context.blockIndex}`
  );
}

function getOrCreateImageAsset(
  context: BlockBuildContext,
  image: ExtractedImage
): string | undefined {
  const existing = context.seenImageSrcs.get(image.src);
  if (existing) {
    return existing;
  }

  if (!/^https:\/\//i.test(image.src)) {
    context.warnings.push({
      sourceFile: context.sourceFile,
      pageId: context.pageId,
      code: "asset.unsafe_source_uri",
      message: `Image source '${image.src}' is not an https URL and was skipped.`,
    });
    return undefined;
  }

  context.assetIndex += 1;
  const assetId = toId(
    `asset-${context.pageId}-${context.assetIndex}`,
    `asset-${context.pageId}-${context.assetIndex}`
  );
  const width = image.width ?? 1200;
  const height = image.height ?? 1200;
  context.assets.push({
    id: assetId,
    kind: "image",
    uri: image.src,
    content_hash: FIXTURE_ZERO_HASH,
    mime_type: guessMimeType(image.src),
    width,
    height,
    roles: ["detail"],
    alt_text: image.alt || image.caption || "Migrated museum artwork image",
  });
  context.seenImageSrcs.set(image.src, assetId);
  return assetId;
}

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

function pushHeadingBlock(
  context: BlockBuildContext,
  heading: ExtractedHeading
): void {
  context.blocks.push({
    id: nextBlockId(context, "heading"),
    block_type: "heading",
    level: Math.min(Math.max(heading.level, 1), 6),
    text: heading.text,
  } as CmsBlockV1);
}

function pushRichTextBlock(context: BlockBuildContext, content: string): void {
  const trimmed = content.trim();
  if (!trimmed) {
    return;
  }
  context.blocks.push({
    id: nextBlockId(context, "rich-text"),
    block_type: "rich_text",
    content: trimmed,
  } as CmsBlockV1);
}

function pushImageBlock(
  context: BlockBuildContext,
  image: ExtractedImage
): void {
  const assetId = getOrCreateImageAsset(context, image);
  if (!assetId) {
    return;
  }
  context.blocks.push({
    id: nextBlockId(context, "image"),
    block_type: "image",
    asset_id: assetId,
    ...(image.caption ? { caption: image.caption } : {}),
  } as CmsBlockV1);
}

function pushGalleryBlock(
  context: BlockBuildContext,
  images: readonly ExtractedImage[],
  title?: string
): void {
  const assetIds = images
    .map((image) => getOrCreateImageAsset(context, image))
    .filter((id): id is string => !!id);
  if (!assetIds.length) {
    return;
  }
  context.blocks.push({
    id: nextBlockId(context, "gallery"),
    block_type: "gallery",
    asset_ids: assetIds,
    ...(title ? { title } : {}),
  } as CmsBlockV1);
}

function pushButtonLinkBlock(
  context: BlockBuildContext,
  button: ExtractedButton
): void {
  if (!/^https:\/\//i.test(button.href) && !button.href.startsWith("/")) {
    context.warnings.push({
      sourceFile: context.sourceFile,
      pageId: context.pageId,
      code: "block.unsafe_button_href",
      message: `Button link href '${button.href}' is not https/relative and was skipped.`,
    });
    return;
  }
  context.blocks.push({
    id: nextBlockId(context, "button-link"),
    block_type: "button_link",
    label: button.label,
    url: button.href,
  } as CmsBlockV1);
}

/**
 * Converts one legacy static page source file into CMS blocks. Falls back to
 * a single rich_text block (recording a warning) when the page body cannot
 * be decomposed into recognizable structural fragments - content is never
 * silently dropped.
 */
function convertPageBody(
  fragment: string,
  context: BlockBuildContext
): void {
  if (!fragment.trim()) {
    context.warnings.push({
      sourceFile: context.sourceFile,
      pageId: context.pageId,
      code: "page.empty_content",
      message: "Source page has an empty .post-content body (stub page).",
    });
    return;
  }

  const headings = extractHeadings(fragment);
  const paragraphs = extractParagraphs(fragment);
  const images = extractImages(fragment);
  const buttons = extractButtons(fragment);

  if (!headings.length && !paragraphs.length && !images.length && !buttons.length) {
    const fallbackText = stripTags(fragment);
    if (fallbackText) {
      context.warnings.push({
        sourceFile: context.sourceFile,
        pageId: context.pageId,
        code: "page.unrecognized_structure",
        message:
          "No recognizable heading/paragraph/image/button structure found; emitted a single rich_text fallback block with the extracted text.",
      });
      pushRichTextBlock(context, fallbackText);
    }
    return;
  }

  headings.forEach((heading) => pushHeadingBlock(context, heading));

  // Paragraphs that were already consumed as an image's caption should not
  // also be emitted as standalone rich_text blocks.
  const captionTexts = new Set(
    images.map((image) => image.caption).filter((value): value is string => !!value)
  );
  const remainingParagraphs = paragraphs.filter(
    (paragraph) => !captionTexts.has(paragraph.text)
  );
  const combinedText = remainingParagraphs.map((p) => p.text).join("\n\n");
  if (combinedText) {
    pushRichTextBlock(context, combinedText);
  }

  if (images.length > 3) {
    pushGalleryBlock(context, images);
  } else {
    images.forEach((image) => pushImageBlock(context, image));
  }

  buttons.forEach((button) => pushButtonLinkBlock(context, button));

  extractEmbeddedMedia(fragment).forEach((embed) => {
    context.warnings.push({
      sourceFile: context.sourceFile,
      pageId: context.pageId,
      code:
        embed.kind === "video"
          ? "block.unconverted_video_embed"
          : "block.unconverted_iframe_embed",
      message: `Found a ${embed.kind} embed (${embed.src}) that the converter does not yet map to a video/html_embed block (needs a poster/fallback asset); recorded here so content is not silently dropped.`,
    });
  });
}

// ---------------------------------------------------------------------------
// Page-level conversion
// ---------------------------------------------------------------------------

function toCmsPath(handle: string, slug: string): string {
  const normalizedSlug = slug
    .split("/")
    .filter(Boolean)
    .map((segment) => slugify(segment))
    .join("/");
  return normalizedSlug
    ? `/${handle}/${normalizedSlug}/index.html`
    : `/${handle}/index.html`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1).trimEnd() : value;
}

export function convertSourcePage(
  manifest: MigrationManifest,
  sourcePage: MigrationSourcePage,
  repoRoot: string
): {
  readonly page: CmsPackageV1["payload"]["pages"][number];
  readonly assets: CmsPackageV1["payload"]["assets"];
  readonly warnings: ConversionWarning[];
  readonly assetUris: string[];
  readonly blockTypeCounts: Record<string, number>;
} {
  const absolutePath = path.join(repoRoot, sourcePage.sourceFile);
  const source = fs.readFileSync(absolutePath, "utf8");
  const pagePath = toCmsPath(manifest.handle, sourcePage.slug);
  const pageId = toId(
    `page-${slugify(sourcePage.slug || "home")}`,
    `page-${slugify(sourcePage.slug || "home", "home")}`
  );

  const title =
    extractTitle(source) ?? sourcePage.navigationLabel ?? manifest.siteTitle;
  const description = truncate(
    extractDescription(source) ?? manifest.siteDescription,
    300
  );
  const socialImage = extractSocialImage(source);

  const context: BlockBuildContext = {
    pageId,
    handle: manifest.handle,
    blocks: [],
    assets: [],
    seenImageSrcs: new Map(),
    warnings: [],
    sourceFile: sourcePage.sourceFile,
    blockIndex: 0,
    assetIndex: 0,
  };

  const postContent = extractPostContent(source);
  if (postContent === undefined) {
    context.warnings.push({
      sourceFile: sourcePage.sourceFile,
      pageId,
      code: "page.post_content_not_found",
      message:
        "Could not locate a .post-content container; emitted a rich_text fallback from the full document text.",
    });
    pushRichTextBlock(context, stripTags(source));
  } else {
    convertPageBody(postContent, context);
  }

  const assetUris = extractAllUris(source);

  let socialImageAssetId: string | undefined;
  if (socialImage) {
    socialImageAssetId = getOrCreateImageAsset(context, {
      src: socialImage,
      alt: `${title} social preview`,
    });
  }

  const blockTypeCounts: Record<string, number> = {};
  for (const block of context.blocks) {
    blockTypeCounts[block.block_type] =
      (blockTypeCounts[block.block_type] ?? 0) + 1;
  }

  const page: CmsPackageV1["payload"]["pages"][number] = {
    id: pageId,
    type: "page",
    path: pagePath,
    metadata: {
      title: truncate(title, 160),
      description,
      locale: "en",
      canonical_url: `https://6529.io${pagePath}`,
      navigation_label: truncate(
        sourcePage.navigationLabel ?? title,
        80
      ),
      search: "include",
      robots: "index",
      ...(socialImageAssetId
        ? { social_image_asset_id: socialImageAssetId }
        : {}),
    },
    source: {
      field_sources: {
        content: sourcePage.sourceFile,
      },
    },
    blocks: context.blocks,
  };

  return {
    page,
    assets: context.assets,
    warnings: context.warnings,
    assetUris,
    blockTypeCounts,
  };
}

// ---------------------------------------------------------------------------
// Package assembly
// ---------------------------------------------------------------------------

export function buildMigratedCmsPackage(
  manifest: MigrationManifest,
  repoRoot: string,
  now: Date = new Date()
): MigrationResult {
  const createdAt = now.toISOString();
  const warnings: ConversionWarning[] = [];
  const pageSummaries: PageConversionSummary[] = [];
  const hostCounts = new Map<string, { count: number; sampleUri: string }>();

  const allAssets: CmsPackageV1["payload"]["assets"] = [];
  const pages: CmsPackageV1["payload"]["pages"] = [];
  const routes: CmsPackageV1["payload"]["routes"] = [];
  const navigationItems: Array<{ label: string; page_id: string }> = [];

  manifest.pages.forEach((sourcePage) => {
    const converted = convertSourcePage(manifest, sourcePage, repoRoot);
    pages.push(converted.page);
    allAssets.push(...converted.assets);
    warnings.push(...converted.warnings);
    routes.push({
      path: converted.page.path,
      kind: "page",
      page_id: converted.page.id,
    });
    navigationItems.push({
      label:
        converted.page.metadata.navigation_label ?? converted.page.metadata.title,
      page_id: converted.page.id,
    });
    pageSummaries.push({
      pageId: converted.page.id,
      sourceFile: sourcePage.sourceFile,
      path: converted.page.path,
      blockCount: converted.page.blocks.length,
      blockTypeCounts: converted.blockTypeCounts,
    });

    for (const uri of converted.assetUris) {
      recordHost(hostCounts, uri);
    }
  });

  const packageWithoutHashes: CmsPackageV1 = {
    schema: "6529.cms.package.v1",
    package_id: toId(`pkg-${manifest.handle}-static-migration`, "pkg-migration"),
    profile: {
      handle: manifest.handle,
    },
    site: {
      title: manifest.siteTitle,
      description: manifest.siteDescription,
      base_path: `/${manifest.handle}/index.html`,
      default_locale: "en",
      direction: "ltr",
      theme: {
        mode: "system",
        accent: manifest.themeAccent ?? "#2f7df6",
      },
      navigation_id: "nav-main",
      required_renderer_capabilities: ["static_blocks", "profile_cms_v1"],
    },
    payload: {
      schema: "6529.cms.payload.v1",
      routes,
      pages,
      assets: allAssets,
      navigation: [
        {
          id: "nav-main",
          items: navigationItems,
        },
      ],
      source_packets: [
        {
          id: "source-static-migration",
          source_type: "import",
          captured_at: createdAt,
          legacy_route_root: manifest.legacyRouteRoot,
          legacy_page_count: manifest.pages.length,
        } as CmsSourcePacketV1,
      ],
      build_manifest: {
        renderer: "6529-cms-static-migration-tool",
        renderer_version: "0.1.0",
        route_count: routes.length,
        asset_count: allAssets.length,
        warnings: warnings.map((warning) => `${warning.pageId}: ${warning.message}`),
      },
    },
    integrity: {
      canonicalization: "jcs-rfc8785",
      hash_algorithm: "sha256",
      payload_hash: FIXTURE_ZERO_HASH,
      package_hash: FIXTURE_ZERO_HASH,
      note: "Draft migration candidate; final publish must be signed and stored by backend.",
    },
    signatures: [
      {
        type: "fixture",
        signer: `fixture:${manifest.handle}`,
        signature: "static-migration-draft-signature-placeholder",
        signed_at: createdAt,
      },
    ],
    storage: [
      {
        provider: "fixture",
        uri: `ipfs://static-migration-${manifest.handle}`,
        content_hash: FIXTURE_ZERO_HASH,
        provider_content_id: `static-migration-${manifest.handle}`,
        pinned: false,
        canonical: false,
        recorded_at: createdAt,
      },
    ],
    provenance: {
      builder: "6529-cms-static-migration-tool",
      builder_version: "0.1.0",
      created_at: createdAt,
      notes: `Generated from ${manifest.pages.length} legacy page(s) under ${manifest.legacyRouteRoot}.`,
    },
  };

  const cmsPackage = withComputedCmsHashes(packageWithoutHashes);
  const assetHosts: AssetHostSummary[] = [...hostCounts.entries()]
    .map(([host, info]) => ({ host, count: info.count, sampleUri: info.sampleUri }))
    .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host));

  return { cmsPackage, warnings, pageSummaries, assetHosts };
}

function recordHost(
  hostCounts: Map<string, { count: number; sampleUri: string }>,
  uri: string
): void {
  try {
    const host = new URL(uri).hostname.toLowerCase();
    const existing = hostCounts.get(host);
    if (existing) {
      existing.count += 1;
    } else {
      hostCounts.set(host, { count: 1, sampleUri: uri });
    }
  } catch {
    // Ignore unparsable URIs; they'll surface via validation instead.
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

type CliArgs = {
  readonly manifest: string;
  readonly outDir: string;
  readonly report?: string;
  readonly now?: string;
};

export function parseCliArgs(argv: readonly string[]): CliArgs {
  const getFlag = (name: string): string | undefined => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  const manifest = getFlag("manifest");
  const outDir = getFlag("out-dir");
  if (!manifest || !outDir) {
    throw new Error(
      "Usage: migrate-static-pages --manifest <file> --out-dir <dir> [--report <file>] [--now <iso-date>]"
    );
  }

  const report = getFlag("report");
  const now = getFlag("now");

  return {
    manifest,
    outDir,
    ...(report ? { report } : {}),
    ...(now ? { now } : {}),
  };
}

/** Joins `target` onto `repoRoot` unless `target` is already an absolute path. */
function resolveFromRepoRoot(repoRoot: string, target: string): string {
  return path.isAbsolute(target) ? target : path.join(repoRoot, target);
}

function runCli(argv: readonly string[], repoRoot: string): void {
  const args = parseCliArgs(argv);
  const manifest = JSON.parse(
    fs.readFileSync(resolveFromRepoRoot(repoRoot, args.manifest), "utf8")
  ) as MigrationManifest;
  const now = args.now ? new Date(args.now) : new Date();
  const result = buildMigratedCmsPackage(manifest, repoRoot, now);

  const outDir = resolveFromRepoRoot(repoRoot, args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${manifest.handle}.package.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(result.cmsPackage, null, 2)}\n`);
  console.log(`[migrate-static-pages] wrote ${outFile}`);
  console.log(
    `[migrate-static-pages] ${result.pageSummaries.length} page(s), ${result.warnings.length} warning(s)`
  );

  if (args.report) {
    const reportPath = resolveFromRepoRoot(repoRoot, args.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      `${JSON.stringify(
        {
          handle: manifest.handle,
          pageSummaries: result.pageSummaries,
          warnings: result.warnings,
          assetHosts: result.assetHosts,
        },
        null,
        2
      )}\n`
    );
    console.log(`[migrate-static-pages] wrote report ${reportPath}`);
  }

  for (const warning of result.warnings) {
    console.warn(`[migrate-static-pages] WARNING ${warning.pageId}: ${warning.message}`);
  }
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2), process.cwd());
  } catch (error) {
    console.error(
      `[migrate-static-pages] Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}
