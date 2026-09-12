import { posix } from "node:path";
import { sha256 } from "js-sha256";
import { CmsRecoveryError } from "./errors";
import { getCmsPublicPath } from "../runtime/routes";
import {
  recoveredBlockPresentation,
  recoveredNativeDesign,
  RECOVERED_NATIVE_CSS,
} from "./native-presentation";

import type {
  CmsAssetV1,
  CmsBlockV1,
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "../protocol/v1";

type RenderContext = {
  cmsPackage: CmsPackageV1;
  pagePath: string;
  assets: Map<string, CmsAssetV1>;
  pages: Map<string, CmsPageV1>;
  routes: Map<string, CmsPackageV1["payload"]["routes"][number]>;
  routeAliases: Map<string, string>;
};

/** An archival 2D rendering: no application bundle, wallet, API, iframe or executable author HTML. */
export function renderRecoveredCmsSite(
  cmsPackage: CmsPackageV1
): Map<string, string> {
  const files = new Map<string, string>();
  const assets = new Map(
    cmsPackage.payload.assets.map((asset) => [asset.id, asset])
  );
  const pages = new Map(
    cmsPackage.payload.pages.map((page) => [page.id, page])
  );
  const routes = new Map(
    cmsPackage.payload.routes.map((route) => [route.path, route])
  );
  const routeAliases = new Map<string, string>();
  for (const route of cmsPackage.payload.routes) {
    routeAliases.set(route.path, route.path);
    routeAliases.set(getCmsPublicPath(cmsPackage, route.path), route.path);
  }
  for (const page of cmsPackage.payload.pages) {
    routeAliases.set(page.metadata.canonical_url, page.path);
  }
  for (const route of cmsPackage.payload.routes) {
    const outputPath = cmsRecoveryFilePath(route.path);
    const context = {
      cmsPackage,
      pagePath: outputPath,
      assets,
      pages,
      routes,
      routeAliases,
    };
    const destination = resolveRoute(route.path, context);
    if (files.has(outputPath))
      throw new CmsRecoveryError("Recovered route output collision");
    files.set(
      outputPath,
      typeof destination === "string"
        ? renderExternalRoute(destination, context)
        : renderDocument(destination, context)
    );
  }
  if (!files.has(cmsRecoveryFilePath(cmsPackage.site.base_path))) {
    throw new CmsRecoveryError(
      "Recovered publication has no renderable primary page"
    );
  }
  return files;
}

export function cmsRecoveryFilePath(routePath: string): string {
  const segments = routePath.split("/").slice(1);
  if (
    !routePath.startsWith("/") ||
    segments.at(-1) !== "index.html" ||
    segments.some((part) => !part || part === "." || part === "..")
  ) {
    throw new CmsRecoveryError("Unsafe recovered CMS route path");
  }
  const path = [
    ...segments.slice(0, -1).map(portableSegment),
    "index.html",
  ].join("/");
  // Bound the whole relative path as well as individual directory names. The
  // fallback namespace cannot be produced by portableSegment.
  return path.length > 200
    ? `long-routes/${sha256(routePath)}/index.html`
    : path;
}

function portableSegment(segment: string): string {
  // Only lowercase ASCII is emitted literally. A and a therefore remain
  // distinct on case-insensitive filesystems; dots, devices and separators
  // cannot become filesystem aliases. Only the final index.html is a file.
  const encoded = Array.from(new TextEncoder().encode(segment), (byte) =>
    (byte >= 97 && byte <= 122) ||
    (byte >= 48 && byte <= 57) ||
    byte === 45 ||
    byte === 95
      ? String.fromCharCode(byte)
      : `%${byte.toString(16).padStart(2, "0")}`
  ).join("");
  return encoded.length > 160 ? `long-${sha256(segment)}` : `cms-${encoded}`;
}

export function independentCmsUri(uri: string): string | null {
  if (/[\\\u0000-\u001f\u007f]/.test(uri)) return null;
  const schemeEnd = uri.indexOf("://");
  const protocol = uri.slice(0, schemeEnd).toLowerCase();
  if (schemeEnd > 0 && ["ipfs", "ar", "arweave"].includes(protocol))
    return decentralizedGatewayUri(protocol, uri.slice(schemeEnd + 3));
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function decentralizedGatewayUri(
  protocol: string,
  value: string
): string | null {
  const ipfs = protocol === "ipfs";
  const suffixAt = value.search(/[?#]/);
  const suffix = suffixAt < 0 ? "" : value.slice(suffixAt);
  const rawPath = suffixAt < 0 ? value : value.slice(0, suffixAt);
  const [id = "", ...rawSegments] = rawPath.split("/");
  if (!(ipfs ? /^[A-Za-z0-9]+$/ : /^[A-Za-z0-9_-]{43}$/).test(id)) return null;
  try {
    const segments = rawSegments.map(decodeURIComponent);
    if (
      segments.some(
        (part) =>
          part === "." || part === ".." || /[/\\\u0000-\u001f\u007f]/.test(part)
      )
    )
      return null;
    const path = [id, ...segments].map(encodeURIComponent).join("/");
    const gateway = ipfs ? "https://ipfs.io/ipfs/" : "https://arweave.net/";
    return new URL(`${gateway}${path}${suffix}`).href;
  } catch {
    return null;
  }
}

function resolveRoute(
  path: string,
  context: RenderContext
): CmsPageV1 | string {
  const seen = new Set<string>();
  let target = path;
  while (!seen.has(target)) {
    seen.add(target);
    const route = context.routes.get(target);
    if (!route) {
      const external = independentCmsUri(target);
      if (external) return external;
      break;
    }
    const page = route.page_id ? context.pages.get(route.page_id) : undefined;
    if (page) return page;
    if (!route.target) break;
    target = route.target;
  }
  throw new CmsRecoveryError(
    "CMS recovery encountered an unresolved or cyclic route"
  );
}

function renderDocument(page: CmsPageV1, context: RenderContext): string {
  const native = recoveredNativeDesign(context.cmsPackage);
  const sections = native
    ? renderNativeSections(page.blocks, context)
    : page.blocks
        .map(
          (block) =>
            `<section id="${escapeHtml(block.id)}">${renderBlock(block, context)}</section>`
        )
        .join("\n");
  return renderShell(page.metadata, sections, context);
}

function renderNativeSections(
  blocks: CmsBlockV1[],
  context: RenderContext
): string {
  const groups: Array<{ name: string; blocks: CmsBlockV1[] }> = [];
  for (const block of blocks) {
    const { group } = recoveredBlockPresentation(block);
    const previous = groups.at(-1);
    if (group && previous?.name === group) previous.blocks.push(block);
    else groups.push({ name: group, blocks: [block] });
  }
  return groups
    .map(
      (group) =>
        `<div class="cms-group">${group.blocks
          .map((block) => {
            const presentation = recoveredBlockPresentation(block);
            return `<section id="${escapeHtml(block.id)}" class="cms-block cms-span-${presentation.span} cms-variant-${presentation.variant}">${renderBlock(block, context)}</section>`;
          })
          .join("\n")}</div>`
    )
    .join("\n");
}

function renderExternalRoute(
  destination: string,
  context: RenderContext
): string {
  return renderShell(
    {
      title: destination,
      description: context.cmsPackage.site.description ?? "",
      locale: context.cmsPackage.site.default_locale,
      robots: "noindex",
    },
    `<p>${renderHref(destination, destination, context)}</p>`,
    context
  );
}

function renderShell(
  metadata: Pick<
    CmsPageV1["metadata"],
    "title" | "description" | "locale" | "robots"
  >,
  sections: string,
  context: RenderContext
): string {
  const { cmsPackage } = context;
  const navigation = cmsPackage.payload.navigation.find(
    (entry) => entry.id === cmsPackage.site.navigation_id
  );
  const links = renderNavigation(navigation?.items ?? [], context);
  const title = escapeHtml(metadata.title);
  const mode = cmsPackage.site.theme.mode === "light" ? "light" : "dark";
  const design = recoveredNativeDesign(cmsPackage);
  const nativeStyles = design ? `<style>${RECOVERED_NATIVE_CSS}</style>` : "";
  const bodyAttributes = design
    ? ` class="cms-native" data-design="${design}"`
    : "";
  const profileLink = design
    ? `<a class="cms-profile" href="https://6529.io/${encodeURIComponent(cmsPackage.profile.handle)}" rel="noreferrer">${escapeHtml(cmsPackage.profile.handle)} · 6529 profile ↗</a>`
    : "";
  return `<!doctype html>
<html lang="${escapeHtml(metadata.locale)}" dir="${cmsPackage.site.direction ?? "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; media-src https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer"><meta name="description" content="${escapeHtml(metadata.description)}">
<meta name="robots" content="${metadata.robots === "noindex" ? "noindex" : "index"}"><title>${title}</title>
<style>:root{color-scheme:${mode};font:18px/1.65 system-ui,sans-serif;background:${mode === "dark" ? "#101014" : "#fff"};color:${mode === "dark" ? "#eee" : "#161616"}}body{max-width:1080px;margin:0 auto;padding:24px;overflow-wrap:anywhere}a{color:${mode === "dark" ? "#9ecaff" : "#124fb0"};overflow-wrap:anywhere}a:focus-visible{outline:3px solid currentColor;outline-offset:4px}nav ul{display:flex;gap:8px 24px;flex-wrap:wrap;padding-inline-start:20px}main{border-top:3px solid ${cmsPackage.site.theme.accent}}section{margin-block:32px}img,video{display:block;max-width:100%;max-height:85vh;object-fit:contain}audio{max-width:100%}figure{margin:20px 0}figcaption{font-size:.9rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:24px}h1,h2,h3,h4,h5,h6{line-height:1.2;overflow-wrap:anywhere}footer{margin-top:48px;border-top:1px solid #777;padding-top:16px;font-size:.8rem}</style>${nativeStyles}</head>
<body${bodyAttributes}><header><p class="cms-brand">${escapeHtml(cmsPackage.site.title)}</p><nav><ul>${links}</ul></nav>${profileLink}</header>
<main><h1>${title}</h1>${sections}</main><footer><code>${escapeHtml(cmsPackage.integrity.package_hash)}</code></footer></body></html>`;
}

function renderNavigation(
  items: CmsNavigationItemV1[],
  context: RenderContext
): string {
  return items
    .map((item) => {
      const link = item.page_id
        ? linkToPage(item.page_id, item.label, context)
        : renderHref(item.url ?? "", item.label, context);
      const children =
        (item.children?.length ?? 0) > 0
          ? `<ul>${renderNavigation(item.children ?? [], context)}</ul>`
          : "";
      return `<li>${link}${children}</li>`;
    })
    .join("");
}

function renderBlock(block: CmsBlockV1, context: RenderContext): string {
  switch (block.block_type) {
    case "heading": {
      const rawLevel = blockValue(block, "level");
      const level =
        typeof rawLevel === "number" && Number.isInteger(rawLevel)
          ? Math.max(2, Math.min(6, rawLevel))
          : 2;
      return `<h${level}>${escapeHtml(text(block, "text"))}</h${level}>`;
    }
    case "rich_text":
      return paragraphs(text(block, "content"));
    case "quote":
      return `<blockquote>${paragraphs(text(block, "quote") || text(block, "content") || text(block, "text"))}<cite>${escapeHtml(text(block, "citation") || text(block, "attribution"))}</cite></blockquote>`;
    case "callout":
      return renderCallout(block, context);
    case "button_link":
      return renderLink(block, context);
    case "image":
      return `${renderTitle(block)}${renderAsset(text(block, "asset_id"), context, text(block, "caption") || undefined, text(block, "page_id"))}`;
    case "video":
    case "audio":
      return `${renderAsset(text(block, "poster_asset_id"), context)}${renderAsset(
        text(block, "asset_id"),
        context,
        text(block, "caption") || undefined
      )}`;
    case "gallery":
    case "lightbox_gallery":
      return renderGallery(block, context);
    case "generated_wallet_gallery":
      return renderGeneratedGallery(block, context);
    case "nft_reference":
      return renderNft(block, context);
    case "room_viewer":
      return renderRoom(block, context);
    case "deep_zoom": {
      const manifest = context.cmsPackage.payload.deep_zoom_manifests?.find(
        (item) =>
          item.id ===
          (text(block, "deep_zoom_id") || text(block, "deep_zoom_manifest_id"))
      );
      return manifest
        ? renderAsset(manifest.source_asset_id, context)
        : renderStructuredBlock(block);
    }
    case "object_viewer":
    case "html_embed":
      return renderInteractiveFallback(block, context);
    case "collection_reference":
    case "transaction_reference":
      return renderStructuredBlock(block);
  }
}

function renderTitle(block: CmsBlockV1): string {
  const title = text(block, "title");
  return title ? `<h2>${escapeHtml(title)}</h2>` : "";
}

function renderInteractiveFallback(
  block: CmsBlockV1,
  context: RenderContext
): string {
  const ids = new Set([
    text(block, "poster_asset_id"),
    block.interactive_policy?.fallback_asset_id ?? "",
    text(block, "asset_id"),
  ]);
  return `${renderTitle(block)}${[...ids].map((id) => renderAsset(id, context)).join("")}${renderStructuredBlock(block)}`;
}

function renderGeneratedGallery(
  block: CmsBlockV1,
  context: RenderContext
): string {
  const ids = [
    ...stringArray(blockValue(block, "page_ids")),
    ...stringArray(blockValue(block, "featured_page_ids")),
  ];
  const items = ids
    .map(
      (id) =>
        `<li>${linkToPage(id, context.pages.get(id)?.metadata.title ?? id, context)}</li>`
    )
    .join("");
  return `<ul>${items}</ul>${renderGallery(block, context)}${renderStructuredBlock(block)}`;
}

function renderGallery(block: CmsBlockV1, context: RenderContext): string {
  const ids = [
    ...stringArray(blockValue(block, "asset_ids")),
    ...stringArray(blockValue(block, "featured_asset_ids")),
  ];
  const items = recordArray(blockValue(block, "items"));
  const artwork = ids
    .map((id) => {
      const index = items.findIndex((entry) => entry["asset_id"] === id);
      const item = index < 0 ? undefined : items.splice(index, 1)[0];
      if (!item) return renderAsset(id, context);
      const title =
        [text(item, "title"), context.assets.get(id)?.alt_text].find(
          (value) => typeof value === "string" && value.length > 0
        ) ?? id;
      const pageId = text(item, "page_id");
      const titleLink = pageId
        ? linkToPage(pageId, title, context)
        : escapeHtml(title);
      return `<article class="cms-gallery-item">${renderAsset(id, context, undefined, pageId, false)}<h3>${titleLink}</h3>${paragraphs(text(item, "subtitle"))}<small>${escapeHtml(text(item, "category"))}</small></article>`;
    })
    .join("");
  return `${renderTitle(block)}${paragraphs(text(block, "description"))}<div class="gallery">${artwork}</div>`;
}

function renderCallout(block: CmsBlockV1, context: RenderContext): string {
  const rows = recordArray(blockValue(block, "rows"))
    .map((row) => {
      const value = text(row, "value");
      const pageId = text(row, "page_id");
      return `<div><dt>${escapeHtml(text(row, "label"))}</dt><dd>${pageId ? linkToPage(pageId, value, context) : escapeHtml(value)}</dd></div>`;
    })
    .join("");
  const rowsMarkup = rows ? `<dl>${rows}</dl>` : "";
  const style = text(block, "mockup_style");
  const presentation = recoveredBlockPresentation(block);
  if (
    recoveredNativeDesign(context.cmsPackage) &&
    presentation.variant === "project" &&
    presentation.role === "card" &&
    (style === "planner" || style === "catalogue")
  ) {
    const heading = text(block, "mockup_heading");
    const headingMarkup = heading ? `<h3>${escapeHtml(heading)}</h3>` : "";
    return `<aside>${paragraphs(text(block, "mockup_kicker"))}${renderTitle(block)}${headingMarkup}${paragraphs(text(block, "mockup_period"))}${paragraphs(text(block, "mockup_description"))}${rowsMarkup}<footer>${paragraphs(text(block, "mockup_footer"))}</footer></aside>`;
  }
  return `<aside>${renderAsset(text(block, "asset_id"), context)}${paragraphs(text(block, "tone"))}${renderTitle(block)}${paragraphs(text(block, "content") || text(block, "text"))}${rowsMarkup}${renderContact(block)}</aside>`;
}

function renderContact(block: CmsBlockV1): string {
  if (recoveredBlockPresentation(block).variant !== "contact") return "";
  const email = text(block, "email");
  const href = contactHref(email, text(block, "subject"));
  return href
    ? `<p><a href="${escapeHtml(href)}">${escapeHtml(email)}</a></p>`
    : "";
}

function contactHref(email: string, rawSubject: string): string | null {
  if (email.length > 254 || !/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(email))
    return null;
  const address = email.split("@").map(encodeURIComponent).join("@");
  const subject = rawSubject.slice(0, 300).replace(/[\r\n]/g, " ");
  const subjectQuery = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${address}${subjectQuery}`;
}

function renderNft(block: CmsBlockV1, context: RenderContext): string {
  const profile = context.cmsPackage.payload.nft_media_profiles?.find(
    (item) => item.id === text(block, "nft_media_profile_id")
  );
  const assetId =
    profile?.display_variants.find((item) => item.role === "detail")
      ?.asset_id ?? profile?.display_variants[0]?.asset_id;
  const asset = assetId ? renderAsset(assetId, context) : "";
  return `${asset}${renderStructuredBlock(block)}${profile ? renderStructuredData(profile.id, profile) : ""}`;
}

function renderRoom(block: CmsBlockV1, context: RenderContext): string {
  const room = context.cmsPackage.payload.exhibition_rooms?.find(
    (item) =>
      item.id === (text(block, "room_id") || text(block, "exhibition_room_id"))
  );
  if (!room) return renderStructuredBlock(block);
  return `<h2>${escapeHtml(room.title)}</h2>${renderAsset(room.poster_asset_id ?? "", context)}${linkToPage(room.fallback_page_id, context.pages.get(room.fallback_page_id)?.metadata.title ?? room.fallback_page_id, context)}<div class="gallery">${room.placements
    .map(
      (placement) =>
        `<div>${renderAsset(placement.asset_id, context, placement.label)}${linkToPage(placement.detail_page_id, placement.label ?? placement.detail_page_id, context)}</div>`
    )
    .join("")}</div>`;
}

function renderAsset(
  id: string,
  context: RenderContext,
  caption?: string,
  pageId?: string,
  includeCaption = true
): string {
  const asset = context.assets.get(id);
  const uri = asset ? independentCmsUri(asset.uri) : null;
  if (!asset || !uri) return "";
  const href = escapeHtml(uri);
  const label = escapeHtml(caption ?? asset.alt_text ?? id);
  let media: string;
  if (asset.kind === "image" || asset.kind === "social_image") {
    const imageClass = id.startsWith("blitmap-")
      ? ' class="cms-pixel-art"'
      : "";
    media = `<img${imageClass} src="${href}" alt="${escapeHtml(asset.alt_text ?? "")}" loading="lazy">`;
    const page = pageId ? context.pages.get(pageId) : undefined;
    if (page)
      media = `<a href="${escapeHtml(relativeRouteHref(page.path, context))}">${media}</a>`;
  } else if (asset.kind === "audio" || asset.kind === "video") {
    media = `<${asset.kind} controls preload="none" src="${href}"></${asset.kind}>`;
  } else {
    media = `<a href="${href}" rel="noreferrer">${label}</a>`;
  }
  const captionMarkup = includeCaption
    ? `<figcaption>${label}</figcaption>`
    : "";
  return `<figure>${media}${captionMarkup}</figure>`;
}

function renderLink(block: CmsBlockV1, context: RenderContext): string {
  const pageId = text(block, "page_id");
  const label = text(block, "label") || text(block, "text");
  if (pageId) {
    const inquiry = recoveredInquiryHref(block, context);
    if (inquiry)
      return `<a href="${escapeHtml(inquiry)}">${escapeHtml(label)}</a>`;
    return linkToPage(pageId, label, context, text(block, "block_id"));
  }
  const raw = text(block, "url") || text(block, "href");
  return renderHref(raw, label, context);
}

function recoveredInquiryHref(
  block: CmsBlockV1,
  context: RenderContext
): string | null {
  const subject = text(block, "subject");
  if (!subject) return null;
  const page = context.pages.get(text(block, "page_id"));
  for (const candidate of page?.blocks ?? []) {
    if (
      candidate.block_type !== "callout" ||
      recoveredBlockPresentation(candidate).variant !== "contact"
    )
      continue;
    const href = contactHref(text(candidate, "email"), subject);
    if (href) return href;
  }
  return null;
}

function renderHref(
  raw: string,
  label: string,
  context: RenderContext
): string {
  const local = localRouteHref(raw, context);
  if (local) return `<a href="${escapeHtml(local)}">${escapeHtml(label)}</a>`;
  const uri = independentCmsUri(raw);
  return uri
    ? `<a href="${escapeHtml(uri)}" rel="noreferrer">${escapeHtml(label)}</a>`
    : escapeHtml(label);
}

function localRouteHref(raw: string, context: RenderContext): string | null {
  if (raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  const suffixAt = raw.search(/[?#]/);
  const path = suffixAt < 0 ? raw : raw.slice(0, suffixAt);
  const route = context.routeAliases.get(path);
  if (!route) return null;
  return `${relativeRouteHref(route, context)}${suffixAt < 0 ? "" : raw.slice(suffixAt)}`;
}

function linkToPage(
  id: string,
  label: string,
  context: RenderContext,
  blockId?: string
): string {
  const page = context.pages.get(id);
  if (!page) return escapeHtml(label);
  const fragment =
    blockId && page.blocks.some((block) => block.id === blockId)
      ? `#${encodeURIComponent(blockId)}`
      : "";
  return `<a href="${escapeHtml(relativeRouteHref(page.path, context) + fragment)}">${escapeHtml(label)}</a>`;
}

function relativeRouteHref(path: string, context: RenderContext): string {
  const relative = posix.relative(
    posix.dirname(context.pagePath),
    cmsRecoveryFilePath(path)
  );
  return relative.split("/").map(encodeURIComponent).join("/");
}

function renderStructuredBlock(block: CmsBlockV1): string {
  return renderStructuredData(block.block_type, block);
}

function renderStructuredData(label: string, value: unknown): string {
  return `<details><summary>${escapeHtml(label)}</summary><pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre></details>`;
}

function text(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === "string" ? record[key] : "";
}

function blockValue(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> =>
          entry !== null && typeof entry === "object" && !Array.isArray(entry)
      )
    : [];
}

function paragraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(
    /[&<>"']/g,
    (character) => replacements[character] ?? character
  );
}
