#!/usr/bin/env node

/* eslint-disable security/detect-non-literal-fs-filename -- all write targets are constrained to this repo before use */

import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const VERSION = process.env.DELEGATION_DOCS_VERSION ?? "delegation-docs-2026-06-16";
const GENERATED_AT =
  process.env.DELEGATION_DOCS_GENERATED_AT ?? "2026-06-16T00:00:00.000Z";
const LEGACY_CONTENT_BASE_URL =
  "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started";
const LEGACY_S3_BASE_URL =
  `${LEGACY_CONTENT_BASE_URL}/html`;
const IMPORT_LEGACY_S3 = process.env.DELEGATION_DOCS_IMPORT_LEGACY_S3 === "1";
const IPFS_ROOT_CID = process.env.DELEGATION_DOCS_IPFS_ROOT_CID ?? null;
const CDN_BASE_URL = process.env.DELEGATION_DOCS_CDN_BASE_URL ?? null;
const PRIMARY_GATEWAY_BASE_URL =
  process.env.DELEGATION_DOCS_PRIMARY_GATEWAY_BASE_URL ??
  "https://ipfs.6529.io/ipfs";
const FALLBACK_GATEWAY_BASE_URLS = (
  process.env.DELEGATION_DOCS_FALLBACK_GATEWAY_BASE_URLS ??
  "https://ipfs.io/ipfs"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const BLOCKED_HTML_URL_SCHEMES = new Set([
  "data:",
  "javascript:",
  "vbscript:",
]);
const BLOCKED_HTML_URL_SCHEME_PATTERN = /\b(?:data|javascript|vbscript)\s*:/i;

function getArticleDefinitions(manifest) {
  const articles = manifest?.articles;

  if (!articles || typeof articles !== "object") {
    throw new Error(
      "content/delegation/manifest.json must define articles before building delegation docs"
    );
  }

  return Object.entries(articles).map(([slug, article]) => ({
    slug,
    title: article.title,
    group: article.group,
    summary: article.summary,
  }));
}

function buildRouteByArticleSlug(articleDefinitions) {
  return Object.fromEntries(
    articleDefinitions.map(({ slug }) => [
      slug,
      slug === "reference-overview-wallet-architecture"
        ? "/delegation/wallet-architecture"
        : slug === "delegation-faq"
          ? "/delegation/delegation-faq"
          : slug === "consolidation-use-cases"
            ? "/delegation/consolidation-use-cases"
            : `/delegation/delegation-faq/${slug}`,
    ])
  );
}

const ROUTE_ALIASES = {
  "wallet-architecture": "/delegation/wallet-architecture",
  "delegation-faq": "/delegation/delegation-faq",
  "consolidation-use-cases": "/delegation/consolidation-use-cases",
};

function assertInsideRepo(targetPath) {
  const resolved = path.resolve(REPO_ROOT, targetPath);
  const relative = path.relative(REPO_ROOT, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside repo: ${resolved}`);
  }

  return resolved;
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeGeneratedHtml(html) {
  return html
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "" : line.trimEnd()))
    .join("\n");
}

function hasBlockedHtmlUrlScheme(value) {
  try {
    const parsed = new URL(value.trim(), "https://delegation-content.invalid/");
    return BLOCKED_HTML_URL_SCHEMES.has(parsed.protocol.toLowerCase());
  } catch {
    return true;
  }
}

function isCssWhitespace(character) {
  return (
    character === " " ||
    character === "\n" ||
    character === "\r" ||
    character === "\t" ||
    character === "\f"
  );
}

function skipCssWhitespace(value, startIndex) {
  let index = startIndex;
  while (index < value.length && isCssWhitespace(value[index])) {
    index += 1;
  }
  return index;
}

function compactCssWhitespace(value) {
  let compacted = "";
  for (const character of value) {
    if (!isCssWhitespace(character)) {
      compacted += character;
    }
  }
  return compacted;
}

function hasBlockedStyleUrl(value) {
  const lowerValue = value.toLowerCase();

  if (compactCssWhitespace(lowerValue).includes("expression(")) {
    return true;
  }

  let searchStart = 0;
  while (searchStart < lowerValue.length) {
    const urlIndex = lowerValue.indexOf("url", searchStart);
    if (urlIndex === -1) {
      return false;
    }

    let valueStart = skipCssWhitespace(lowerValue, urlIndex + 3);
    if (lowerValue[valueStart] !== "(") {
      searchStart = urlIndex + 3;
      continue;
    }

    valueStart = skipCssWhitespace(lowerValue, valueStart + 1);
    if (lowerValue[valueStart] === '"' || lowerValue[valueStart] === "'") {
      valueStart = skipCssWhitespace(lowerValue, valueStart + 1);
    }

    for (const scheme of BLOCKED_HTML_URL_SCHEMES) {
      if (lowerValue.startsWith(scheme, valueStart)) {
        return true;
      }
    }

    searchStart = valueStart + 1;
  }

  return false;
}

function normalizePackageAssetPath(sourceUrl) {
  const source = new URL(sourceUrl);
  const base = new URL(`${LEGACY_CONTENT_BASE_URL}/`);

  if (source.origin !== base.origin || !source.pathname.startsWith(base.pathname)) {
    return undefined;
  }

  const relativePath = source.pathname.slice(base.pathname.length);
  if (!relativePath || relativePath.endsWith(".html")) {
    return undefined;
  }

  const normalized = path.posix.normalize(decodeURIComponent(relativePath));
  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`Refusing unsafe asset path: ${sourceUrl}`);
  }

  return normalized;
}

function normalizeRelativeAssetPath(reference) {
  if (
    !reference.startsWith("../assets/") &&
    !reference.startsWith("./assets/") &&
    !reference.startsWith("assets/")
  ) {
    return undefined;
  }

  const assetPath = reference
    .replace(/^(\.\/)?assets\//, "")
    .replace(/^\.\.\/assets\//, "");
  const normalized = path.posix.normalize(decodeURIComponent(assetPath));

  if (
    !normalized ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`Refusing unsafe relative asset path: ${reference}`);
  }

  return normalized;
}

function toPackageRelativeAssetPath(assetPath) {
  return `../assets/${assetPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function rewriteDelegationRoute(rawHref, routeByArticleSlug) {
  if (
    !rawHref ||
    rawHref.startsWith("#") ||
    rawHref.startsWith("/") ||
    /^[a-z][a-z0-9+.-]*:/i.test(rawHref)
  ) {
    return rawHref;
  }

  const [withoutHash, hash = ""] = rawHref.split("#", 2);
  const [withoutQuery, query = ""] = withoutHash.split("?", 2);
  const normalizedPath = path.posix
    .normalize(withoutQuery)
    .replace(/^(\.\/)+/g, "")
    .replace(/^(\.\.\/)+/g, "");
  const cleanedPath = normalizedPath.replace(/^delegation\//, "");
  const pathParts = cleanedPath.split("/").filter(Boolean);
  let route;

  if (pathParts[0] === "delegation-faq" && pathParts[1]) {
    route = routeByArticleSlug[pathParts[1]];
  } else {
    route = routeByArticleSlug[pathParts[0]] ?? ROUTE_ALIASES[pathParts[0]];
  }

  if (!route) {
    return rawHref;
  }

  const queryPart = query ? `?${query}` : "";
  const hashPart = hash ? `#${hash}` : "";
  return `${route}${queryPart}${hashPart}`;
}

function rewriteContentReferences(rawHtml, assetSources, routeByArticleSlug) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false }, false);

  $("[src], [href]").each((_, element) => {
    const $element = $(element);

    for (const attribute of ["src", "href"]) {
      const rawValue = $element.attr(attribute);
      if (!rawValue) {
        continue;
      }

      let sourceUrl;
      try {
        sourceUrl = new URL(rawValue);
      } catch {
        const assetPath = normalizeRelativeAssetPath(rawValue);
        if (assetPath) {
          const existing = assetSources.get(assetPath);
          assetSources.set(assetPath, existing ?? {});
          $element.attr(attribute, toPackageRelativeAssetPath(assetPath));
          continue;
        }

        if (attribute === "href") {
          $element.attr(
            attribute,
            rewriteDelegationRoute(rawValue, routeByArticleSlug)
          );
        }
        continue;
      }

      const assetPath = normalizePackageAssetPath(sourceUrl);
      if (!assetPath) {
        continue;
      }

      assetSources.set(assetPath, { sourceUrl: sourceUrl.toString() });
      $element.attr(attribute, toPackageRelativeAssetPath(assetPath));
    }
  });

  return `${normalizeGeneratedHtml($.root().html()?.trim() ?? "")}\n`;
}

function humanizeAssetName(reference) {
  const cleanReference = reference.split(/[?#]/, 1)[0] ?? "";
  const fileName = decodeURIComponent(path.posix.basename(cleanReference));
  const stem = fileName.replace(/\.[^.]+$/, "");
  const words = stem
    .replace(/__+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return words || "delegation article image";
}

function inferImageKind(reference) {
  if (reference.includes("/diagrams/")) {
    return "diagram";
  }

  if (
    reference.includes("/screenshots/") ||
    reference.includes("/assets/html/")
  ) {
    return "screenshot";
  }

  return "image";
}

function addMissingImageAltText($) {
  $("img").each((_, element) => {
    const $element = $(element);

    if ($element.attr("alt") !== undefined) {
      return;
    }

    const reference = $element.attr("src") ?? "";
    const label = humanizeAssetName(reference);
    const kind = inferImageKind(reference);
    $element.attr("alt", `${label} ${kind}`);
  });
}

function sanitizeHtmlFragment(rawHtml) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false }, false);

  $("script, style, iframe, object, embed, template").remove();

  $("*").each((_, element) => {
    const attributes = element.attribs ?? {};
    for (const [name, value] of Object.entries(attributes)) {
      const lowerName = name.toLowerCase();
      const rawValue = String(value ?? "");

      if (lowerName.startsWith("on")) {
        $(element).removeAttr(name);
        continue;
      }

      if (
        ["href", "src", "xlink:href"].includes(lowerName) &&
        hasBlockedHtmlUrlScheme(rawValue)
      ) {
        $(element).removeAttr(name);
        continue;
      }

      if (
        lowerName === "style" &&
        hasBlockedStyleUrl(rawValue)
      ) {
        $(element).removeAttr(name);
      }
    }
  });

  $('a[target="_blank"]').each((_, element) => {
    const $element = $(element);
    const relTokens = new Set(
      ($element.attr("rel") ?? "")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
    );

    relTokens.add("noopener");
    relTokens.add("noreferrer");
    $element.attr("rel", [...relTokens].join(" "));
  });

  addMissingImageAltText($);

  const sanitized = $.root().html()?.trim() ?? "";

  if (
    /<script\b|<iframe\b|<object\b|<embed\b/i.test(sanitized) ||
    BLOCKED_HTML_URL_SCHEME_PATTERN.test(sanitized)
  ) {
    throw new Error("Sanitized HTML still contains blocked active content.");
  }

  return `${normalizeGeneratedHtml(sanitized)}\n`;
}

function collapseWhitespace(text) {
  let collapsed = "";
  let previousWasWhitespace = false;

  for (const character of text) {
    if (character.trim().length === 0) {
      if (!previousWasWhitespace) {
        collapsed += " ";
      }
      previousWasWhitespace = true;
      continue;
    }

    collapsed += character;
    previousWasWhitespace = false;
  }

  return collapsed;
}

function stripTrailingSentencePunctuation(text) {
  let end = text.length;

  while (
    end > 0 &&
    (text[end - 1] === "?" || text[end - 1] === "!" || text[end - 1] === ".")
  ) {
    end--;
  }

  return text.slice(0, end);
}

function normalizeHeadingText(text) {
  return stripTrailingSentencePunctuation(collapseWhitespace(text))
    .trim()
    .toLowerCase();
}

function removeLeadingEmptyNodes($, $container) {
  for (const node of $container.contents().toArray()) {
    if (node.type === "text" && $(node).text().trim().length === 0) {
      $(node).remove();
      continue;
    }

    if (node.type === "tag" && $(node).is("br")) {
      $(node).remove();
      continue;
    }

    break;
  }
}

function stripLeadingDuplicateTitle(rawHtml, title) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false }, false);
  const normalizedTitle = normalizeHeadingText(title);
  const nodes = $.root().contents().toArray();
  const firstMeaningfulNode = nodes.find((node) => {
    if (node.type === "text") {
      return $(node).text().trim().length > 0;
    }

    return node.type === "tag";
  });

  if (!firstMeaningfulNode) {
    return rawHtml;
  }

  const $node = $(firstMeaningfulNode);
  const heading = $node.is("h1,h2,h3,h4,h5,h6")
    ? $node
    : $node.children("h1,h2,h3,h4,h5,h6").first();

  if (
    heading.length === 0 ||
    normalizeHeadingText(heading.text()) !== normalizedTitle
  ) {
    return rawHtml;
  }

  if ($node.is("h1,h2,h3,h4,h5,h6")) {
    const $parent = $node.parent();
    $node.remove();
    removeLeadingEmptyNodes($, $parent);
  } else {
    const $parent = heading.parent();
    heading.remove();
    removeLeadingEmptyNodes($, $parent);
    removeLeadingEmptyNodes($, $node);
    if ($node.text().trim().length === 0 && $node.children().length === 0) {
      $node.remove();
    }
  }

  removeLeadingEmptyNodes($, $.root());

  return `${normalizeGeneratedHtml($.root().html()?.trim() ?? "")}\n`;
}

async function fetchArticleHtml(slug) {
  const sourceUrl = `${LEGACY_S3_BASE_URL}/${slug}.html`;
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to import ${sourceUrl}: ${response.status}`);
  }

  return response.text();
}

async function readArticleHtml(sourceHtmlDir, slug) {
  if (IMPORT_LEGACY_S3) {
    return fetchArticleHtml(slug);
  }

  return readFile(path.join(sourceHtmlDir, `${slug}.html`), "utf8");
}

async function readJsonOrNull(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readReviewedAssetBytes(sourceAssetPath, assetPath, sourceUrl) {
  try {
    return await readFile(sourceAssetPath);
  } catch (error) {
    const sourceNote = sourceUrl ? ` referenced by ${sourceUrl}` : "";
    throw new Error(
      `Missing reviewed delegation asset ${assetPath}${sourceNote}. Add it under content/delegation/assets before rebuilding.`,
      { cause: error }
    );
  }
}

async function main() {
  const sourceManifestPath = assertInsideRepo("content/delegation/manifest.json");
  const publicBundleDir = assertInsideRepo(
    `public/delegation-content/${VERSION}`
  );
  const publicHtmlDir = path.join(publicBundleDir, "html");
  const sourceAssetsDir = assertInsideRepo("content/delegation/assets");
  const publicAssetsDir = path.join(publicBundleDir, "assets");
  const publicManifestPath = path.join(publicBundleDir, "manifest.json");
  const previousManifest = await readJsonOrNull(sourceManifestPath);
  const articleDefinitions = getArticleDefinitions(previousManifest);
  const routeByArticleSlug = buildRouteByArticleSlug(articleDefinitions);
  const reviewedArticleHtml = new Map();

  if (!IMPORT_LEGACY_S3) {
    for (const definition of articleDefinitions) {
      reviewedArticleHtml.set(
        definition.slug,
        await readArticleHtml(publicHtmlDir, definition.slug)
      );
    }
  }

  await rm(publicBundleDir, { recursive: true, force: true });
  await mkdir(sourceAssetsDir, { recursive: true });
  await mkdir(publicHtmlDir, { recursive: true });
  await mkdir(publicAssetsDir, { recursive: true });

  const articles = {};
  const assetSources = new Map();

  for (const definition of articleDefinitions) {
    const rawHtml = IMPORT_LEGACY_S3
      ? await fetchArticleHtml(definition.slug)
      : reviewedArticleHtml.get(definition.slug);

    if (typeof rawHtml !== "string") {
      throw new Error(`Missing reviewed article HTML for ${definition.slug}`);
    }

    const html = rewriteContentReferences(
      stripLeadingDuplicateTitle(
        sanitizeHtmlFragment(rawHtml),
        definition.title
      ),
      assetSources,
      routeByArticleSlug
    );
    const articlePath = `html/${definition.slug}.html`;
    const digest = sha256(html);
    const sourceUrl = `${LEGACY_S3_BASE_URL}/${definition.slug}.html`;

    await writeFile(path.join(publicHtmlDir, `${definition.slug}.html`), html);

    articles[definition.slug] = {
      title: definition.title,
      summary: definition.summary,
      group: definition.group,
      path: articlePath,
      sourceUrl,
      sourceUri: IPFS_ROOT_CID
        ? `ipfs://${IPFS_ROOT_CID}/${articlePath}`
        : null,
      sha256: digest,
    };
  }

  const assets = {};

  for (const [assetPath, assetInfo] of [...assetSources.entries()].sort(
    ([left], [right]) => left.localeCompare(right)
  )) {
    const previousAsset =
      previousManifest?.assets?.[`assets/${assetPath}`] ?? {};
    const assetSourceUrl = assetInfo.sourceUrl ?? previousAsset.sourceUrl;
    const sourceAssetPath = path.join(sourceAssetsDir, assetPath);
    const publicAssetPath = path.join(publicAssetsDir, assetPath);
    const bytes = await readReviewedAssetBytes(
      sourceAssetPath,
      assetPath,
      assetInfo.sourceUrl
    );

    await mkdir(path.dirname(publicAssetPath), { recursive: true });
    await copyFile(sourceAssetPath, publicAssetPath);

    assets[`assets/${assetPath}`] = {
      path: `assets/${assetPath}`,
      sourceUrl: assetSourceUrl ?? null,
      sha256: sha256Bytes(bytes),
      bytes: bytes.length,
    };
  }

  const manifest = {
    version: VERSION,
    generatedAt: GENERATED_AT,
    source: {
      type: IMPORT_LEGACY_S3 ? "reviewed-import" : "reviewed-package",
      importedFrom: LEGACY_S3_BASE_URL,
      note:
        "Runtime code must not fetch this mutable S3 source. Use DELEGATION_DOCS_IMPORT_LEGACY_S3=1 only to refresh seed content, then review the versioned repo package and publish that package by CID.",
    },
    canonicalStorage: {
      type: "ipfs",
      rootCid: IPFS_ROOT_CID,
      note: IPFS_ROOT_CID
        ? "Reviewed delegation docs bundle is published and pinned by immutable IPFS CID."
        : "Set DELEGATION_DOCS_IPFS_ROOT_CID after the reviewed bundle is published and pinned.",
    },
    acceleration: {
      primaryGatewayBaseUrl: PRIMARY_GATEWAY_BASE_URL,
      fallbackGatewayBaseUrls: FALLBACK_GATEWAY_BASE_URLS,
      cloudFrontBaseUrl: CDN_BASE_URL,
      note:
        "CloudFront/S3 may be used only as a CID/version-addressed mirror. Runtime verifies article hashes before rendering.",
    },
    localBasePath: `/delegation-content/${VERSION}`,
    assets,
    articles,
  };

  await writeJson(sourceManifestPath, manifest);
  await writeJson(publicManifestPath, manifest);

  console.warn(
    `Generated ${Object.keys(articles).length} delegation docs and ${
      Object.keys(assets).length
    } assets into ${path.relative(
      REPO_ROOT,
      publicBundleDir
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
