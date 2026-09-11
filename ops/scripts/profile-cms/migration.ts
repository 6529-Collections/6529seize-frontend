import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  CMS_CANONICALIZATION,
  CMS_HASH_ALGORITHM,
  CMS_PACKAGE_SCHEMA,
  CMS_PAYLOAD_SCHEMA,
  hashCanonicalJson,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsAssetV1,
  type CmsBlockV1,
  type CmsPackageV1,
} from "../../../lib/profile-cms/protocol/v1";
import {
  boundedMetadata,
  extractHtmlParts,
  safeMigrationLink,
} from "./html-content";
import {
  MigrationInputError,
  parseStaticContent,
  type StaticContent,
  type StaticMedia,
} from "./typed-content";

export type MigrationTarget = "capital" | "museum";
export type MigrationSource = {
  readonly file: string;
  readonly content: StaticContent;
  readonly hash: string;
};
type MigrationDiagnostic = {
  readonly file: string;
  readonly block: number;
  readonly code: string;
  readonly uri?: string;
};

const FIXTURE_HASH = `sha256:${"0".repeat(64)}`;
const BUILDER = "6529-typed-content-migration";
const BUILDER_VERSION = "1.0.0";

function sourceFiles(directory: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Traversal starts at the fixed app/capital or app/museum root and follows real directory entries, never symlinks.
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(entryPath);
      return entry.isFile() && entry.name === "content.tsx" ? [entryPath] : [];
    })
    .sort();
}

export function readMigrationSources(
  repoRoot: string,
  target: MigrationTarget
) {
  const sources: MigrationSource[] = [];
  const errors: MigrationDiagnostic[] = [];
  const files = sourceFiles(path.join(repoRoot, "app", target));
  for (const file of files) {
    const relative = path.relative(repoRoot, file).split(path.sep).join("/");
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- This is a content.tsx file discovered under the fixed target root, not an arbitrary manifest path.
      const source = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
      sources.push({
        file: relative,
        content: parseStaticContent(source),
        hash: sha256(source),
      });
    } catch (error) {
      errors.push({
        file: relative,
        block: -1,
        code:
          error instanceof MigrationInputError
            ? error.code
            : "source.read_failed",
      });
    }
  }
  return { sources, errors, discoveredFiles: files.length };
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function shortId(prefix: string, value: string): string {
  return `${prefix}-${sha256(value).slice(7, 23)}`;
}

function pagePath(target: MigrationTarget, sourcePath: string): string {
  const suffix = sourcePath.slice(target.length + 1);
  return `/6529${target}${suffix}/index.html`;
}

function mapLink(value: string, paths: ReadonlyMap<string, string>): string {
  const parsed = new URL(value, "https://6529.io");
  const mapped =
    parsed.origin === "https://6529.io"
      ? paths.get(parsed.pathname.replace(/\/$/, ""))
      : undefined;
  return mapped ? `${mapped}${parsed.search}${parsed.hash}` : value;
}

function mimeType(uri: string): string {
  const extension = path.posix.extname(new URL(uri).pathname).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
  };
  return types[extension] ?? "application/octet-stream";
}

type ConversionContext = {
  readonly source: MigrationSource;
  readonly diagnostics: MigrationDiagnostic[];
  readonly assets: Map<string, CmsAssetV1>;
  readonly paths: ReadonlyMap<string, string>;
  readonly blocks: CmsBlockV1[];
  blockIndex: number;
};

function warn(context: ConversionContext, code: string, uri?: string) {
  context.diagnostics.push({
    file: context.source.file,
    block: context.blockIndex,
    code,
    ...(uri ? { uri } : {}),
  });
}

type MigrationBlock =
  | { readonly block_type: "rich_text"; readonly content: string }
  | {
      readonly block_type: "heading";
      readonly level: number;
      readonly text: string;
    }
  | {
      readonly block_type: "image";
      readonly asset_id: string;
      readonly caption?: string;
    }
  | {
      readonly block_type: "button_link";
      readonly url: string;
      readonly label: string;
    }
  | {
      readonly block_type: "quote";
      readonly quote: string;
      readonly citation?: string;
    };

function pushBlock(context: ConversionContext, block: MigrationBlock) {
  context.blocks.push({
    ...block,
    id: shortId(
      "block",
      `${context.source.content.path}:${context.blocks.length}`
    ),
  });
}

function pushText(context: ConversionContext, value: string) {
  if (value.trim())
    pushBlock(context, { block_type: "rich_text", content: value.trim() });
}

function pushLink(context: ConversionContext, href: string, label: string) {
  const safe = safeMigrationLink(href);
  if (!safe) {
    warn(context, "link.unsafe_url", href);
    return;
  }
  pushBlock(context, {
    block_type: "button_link",
    url: mapLink(safe, context.paths),
    label,
  });
}

function pushImage(
  context: ConversionContext,
  media: StaticMedia
): string | undefined {
  const uri = safeMigrationLink(media.src);
  if (!uri?.startsWith("https://")) {
    warn(context, "asset.unsafe_uri", media.src);
    return undefined;
  }
  // Preserve distinct alt text/dimensions for the same URL. Identical media
  // records are shared across pages; no page-local duplicate asset inflation.
  const key = JSON.stringify([
    uri,
    media.alt,
    media.width ?? null,
    media.height ?? null,
  ]);
  const assetId = shortId("asset", key);
  if (!context.assets.has(key)) {
    const mime = mimeType(uri);
    context.assets.set(key, {
      id: assetId,
      kind: "image",
      uri,
      content_hash: FIXTURE_HASH,
      mime_type: mime,
      ...(media.width === undefined ? {} : { width: media.width }),
      ...(media.height === undefined ? {} : { height: media.height }),
      alt_text: media.alt,
      roles: ["detail"],
    });
    if (media.width === undefined || media.height === undefined)
      warn(context, "asset.dimensions_unverified", uri);
    if (mime === "application/octet-stream")
      warn(context, "asset.mime_unverified", uri);
  }
  pushBlock(context, {
    block_type: "image",
    asset_id: assetId,
    ...(media.caption ? { caption: media.caption } : {}),
  });
  if (media.href) pushLink(context, media.href, media.alt || media.href);
  return assetId;
}

function convertHtml(context: ConversionContext, html: string) {
  for (const part of extractHtmlParts(html)) {
    if (part.type === "text") {
      if (part.level !== undefined)
        pushBlock(context, {
          block_type: "heading",
          level: part.level,
          text: part.text,
        });
      else pushText(context, part.text);
    } else if (part.type === "link") {
      pushLink(context, part.href, part.label);
    } else {
      warn(context, `html.unsupported_${part.tag}`, part.uri);
    }
  }
}

function convertBlock(
  context: ConversionContext,
  block: StaticContent["blocks"][number]
) {
  switch (block.type) {
    case "heading":
      pushBlock(context, {
        block_type: "heading",
        level: 2,
        text: block.content,
      });
      break;
    case "paragraph":
      pushText(context, block.content);
      break;
    case "html":
      convertHtml(context, block.html);
      break;
    case "image":
      pushImage(context, block.media);
      break;
    case "quote":
      pushBlock(context, {
        block_type: "quote",
        quote: block.content,
        ...(block.cite ? { citation: block.cite } : {}),
      });
      break;
    case "video":
      warn(context, "media.video_requires_poster_and_review", block.video.src);
      if (block.video.caption) pushText(context, block.video.caption);
      break;
    case "divider":
      warn(context, "layout.divider_not_supported");
      break;
  }
}

function convertPage(
  context: ConversionContext,
  target: MigrationTarget,
  now: string
): CmsPackageV1["payload"]["pages"][number] {
  const { content } = context.source;
  const title = boundedMetadata(content.title, 160);
  const description = boundedMetadata(content.description, 300);
  if (title !== content.title || description !== content.description)
    warn(context, "metadata.shortened");
  pushText(context, content.section);
  pushBlock(context, { block_type: "heading", level: 1, text: content.title });
  // The Capital static-page shell displays its description; Museum layouts do not.
  if (target === "capital") pushText(context, content.description);
  const socialAsset = content.heroImage
    ? pushImage(context, content.heroImage)
    : undefined;
  if (!content.blocks.length) warn(context, "page.empty_source_blocks");
  content.blocks.forEach((block, index) => {
    context.blockIndex = index;
    convertBlock(context, block);
  });
  const cmsPath = pagePath(target, content.path);
  return {
    id: shortId("page", content.path),
    type: "page",
    path: cmsPath,
    metadata: {
      title,
      description,
      locale: "en",
      canonical_url: `https://6529.io${cmsPath}`,
      navigation_label: boundedMetadata(content.title, 80),
      search: "include",
      robots: "noindex",
      last_updated: now,
      ...(socialAsset ? { social_image_asset_id: socialAsset } : {}),
    },
    source: { source_packet_id: shortId("source", content.path) },
    blocks: context.blocks,
  };
}

export function buildMigration(
  target: MigrationTarget,
  sources: readonly MigrationSource[],
  now: Date
) {
  if (!Number.isFinite(now.getTime()))
    throw new MigrationInputError("cli.invalid_now");
  const timestamp = now.toISOString();
  const sorted = [...sources].sort((a, b) =>
    a.content.path < b.content.path
      ? -1
      : Number(a.content.path > b.content.path)
  );
  const sourcePaths = sorted.map((source) => source.content.path);
  if (new Set(sourcePaths).size !== sourcePaths.length)
    throw new MigrationInputError("source.duplicate_route");
  if (
    !sourcePaths.includes(`/${target}`) ||
    sourcePaths.some(
      (value) => value !== `/${target}` && !value.startsWith(`/${target}/`)
    )
  ) {
    throw new MigrationInputError("source.target_route_mismatch");
  }
  const paths = new Map(
    sourcePaths.map((value) => [value, pagePath(target, value)])
  );
  const diagnostics: MigrationDiagnostic[] = [];
  const assets = new Map<string, CmsAssetV1>();
  const pages = sorted.map((source) =>
    convertPage(
      { source, paths, diagnostics, assets, blocks: [], blockIndex: -1 },
      target,
      timestamp
    )
  );
  const root = sorted.find((source) => source.content.path === `/${target}`)!;
  const sourceFingerprint = hashCanonicalJson(
    sorted.map((source) => ({ file: source.file, hash: source.hash }))
  );
  const cmsPackage = withComputedCmsHashes({
    schema: CMS_PACKAGE_SCHEMA,
    package_id: `pkg-6529${target}-migration`,
    profile: { handle: `6529${target}` },
    site: {
      title: boundedMetadata(root.content.title, 160),
      description: boundedMetadata(root.content.description, 300),
      base_path: `/6529${target}/index.html`,
      default_locale: "en",
      direction: "ltr",
      theme: { mode: "dark", accent: "#2f7df6" },
      navigation_id: "nav-main",
      required_renderer_capabilities: ["static_blocks", "profile_cms_v1"],
    },
    payload: {
      schema: CMS_PAYLOAD_SCHEMA,
      pages,
      routes: pages.map((page) => ({
        path: page.path,
        kind: "page" as const,
        page_id: page.id,
      })),
      assets: [...assets.values()],
      navigation: [
        {
          id: "nav-main",
          items: pages.map((page) => ({
            label: page.metadata.navigation_label ?? page.metadata.title,
            page_id: page.id,
          })),
        },
      ],
      source_packets: sorted.map((source) => ({
        id: shortId("source", source.content.path),
        source_type: "import" as const,
        captured_at: timestamp,
        content_hash: source.hash,
        source_file: source.file,
        source_path: source.content.path,
        original_content: JSON.parse(JSON.stringify(source.content)) as Record<
          string,
          unknown
        >,
      })),
      build_manifest: {
        renderer: BUILDER,
        renderer_version: BUILDER_VERSION,
        route_count: pages.length,
        asset_count: assets.size,
        warnings: [
          ...new Set(diagnostics.map((issue) => issue.code)),
          "fixture.asset_byte_hashes_unverified",
          "fixture.visual_parity_unverified",
        ],
      },
    },
    integrity: {
      canonicalization: CMS_CANONICALIZATION,
      hash_algorithm: CMS_HASH_ALGORITHM,
      payload_hash: FIXTURE_HASH,
      package_hash: FIXTURE_HASH,
      note: "Migration fixture only. Asset content hashes are zero placeholders, not verified byte hashes. Source hashes fingerprint LF-normalized source files.",
    },
    signatures: [
      {
        type: "fixture",
        signer: `fixture:6529${target}`,
        signature: "migration-fixture-not-a-wallet-signature",
        signed_at: timestamp,
      },
    ],
    storage: [
      {
        provider: "fixture",
        uri: `ipfs://fixture-6529${target}-migration`,
        content_hash: FIXTURE_HASH,
        canonical: false,
        pinned: false,
        recorded_at: timestamp,
      },
    ],
    provenance: {
      builder: BUILDER,
      builder_version: BUILDER_VERSION,
      created_at: timestamp,
      notes:
        "Converted from repository typed content. Original content is retained in source packets. No publication, asset fetch, route replacement, or visual-equivalence claim.",
    },
  });
  const validation = validateCmsPackageV1(cmsPackage, {
    allowFixtureSignatures: true,
    allowFixtureStorage: true,
    enforceHashes: true,
  });
  return {
    cmsPackage,
    diagnostics,
    validation,
    sourceFingerprint,
    sources: sorted,
  };
}

export function migrationReport(
  target: MigrationTarget,
  result: ReturnType<typeof buildMigration>,
  errors: readonly MigrationDiagnostic[],
  discoveredFiles: number
) {
  const { cmsPackage, diagnostics, validation } = result;
  const counts: Record<string, number> = {};
  const hosts: Record<string, number> = {};
  for (const page of cmsPackage.payload.pages) {
    for (const block of page.blocks)
      counts[block.block_type] = (counts[block.block_type] ?? 0) + 1;
  }
  for (const asset of cmsPackage.payload.assets) {
    const host = new URL(asset.uri).hostname;
    hosts[host] = (hosts[host] ?? 0) + 1;
  }
  return {
    target,
    generated_at: cmsPackage.provenance.created_at,
    source_fingerprint: result.sourceFingerprint,
    scope: `app/${target}/**/content.tsx exports of MigratedWordPressStaticPageContent`,
    publish_ready: false,
    discovered_files: discoveredFiles,
    converted_pages: cmsPackage.payload.pages.length,
    blocks: counts,
    asset_records: cmsPackage.payload.assets.length,
    distinct_asset_urls: new Set(
      cmsPackage.payload.assets.map((asset) => asset.uri)
    ).size,
    asset_hosts: hosts,
    asset_byte_hashes_verified: false,
    visual_parity_verified: false,
    fixture_validation: { valid: validation.valid, issues: validation.issues },
    errors,
    diagnostics,
    pages: cmsPackage.payload.pages.map((page) => ({
      path: page.path,
      blocks: page.blocks.length,
      source: result.sources.find(
        (source) =>
          shortId("source", source.content.path) ===
          page.source?.source_packet_id
      )?.file,
    })),
  };
}
