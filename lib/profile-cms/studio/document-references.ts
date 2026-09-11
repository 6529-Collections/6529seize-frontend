import type {
  CmsBlockV1,
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { getCmsPublicPagePath } from "@/lib/profile-cms/runtime/routes";

export function pageReferencePaths(
  document: CmsPackageV1,
  page: CmsPageV1,
  blockId?: string
): Set<string> {
  const paths = [
    page.path,
    page.metadata.canonical_url,
    getCmsPublicPagePath(document, page.id),
  ].filter((path): path is string => path !== null);
  if (!blockId) return new Set(paths);
  return new Set([...paths.map((path) => `${path}#${blockId}`), `#${blockId}`]);
}

export interface RemovedReference {
  readonly ids: ReadonlySet<string>;
  readonly paths: ReadonlySet<string>;
}

function rewriteKnownUrl(
  value: string,
  replacements: ReadonlyMap<string, string>
): string {
  const suffixAt = value.search(/[?#]/);
  const path = suffixAt < 0 ? value : value.slice(0, suffixAt);
  const replacement = replacements.get(path);
  if (replacement === undefined) return value;
  const suffix = suffixAt < 0 ? "" : value.slice(suffixAt);
  return `${replacement}${suffix}`;
}

export function rewriteDocumentUrls(
  document: CmsPackageV1,
  replacements: ReadonlyMap<string, string>
): void {
  for (const route of document.payload.routes) {
    if (route.target)
      route.target = rewriteKnownUrl(route.target, replacements);
  }
  document.payload.navigation.forEach((navigation) =>
    rewriteNavigationUrls(navigation.items, replacements)
  );
  for (const page of document.payload.pages) {
    for (const block of page.blocks) {
      rewriteButtonUrls(block, replacements);
    }
  }
}

function rewriteButtonUrls(
  block: CmsBlockV1,
  replacements: ReadonlyMap<string, string>
): void {
  if (block.block_type !== "button_link") return;
  const fields = block as CmsBlockV1 & Record<string, unknown>;
  for (const key of ["href", "url"]) {
    const value = fields[key];
    if (typeof value === "string")
      fields[key] = rewriteKnownUrl(value, replacements);
  }
}

function rewriteNavigationUrls(
  items: CmsNavigationItemV1[],
  replacements: ReadonlyMap<string, string>
): void {
  for (const item of items) {
    if (item.url) item.url = rewriteKnownUrl(item.url, replacements);
    if (item.children) rewriteNavigationUrls(item.children, replacements);
  }
}

// Catchall block/source fields can carry extensions unknown to the editor. Exact
// IDs and path mentions (including Markdown links) are conservatively references.
export function containsReference(
  value: unknown,
  reference: RemovedReference
): boolean {
  if (typeof value === "string") return matchesReference(value, reference);
  if (Array.isArray(value))
    return value.some((entry) => containsReference(entry, reference));
  if (value !== null && typeof value === "object")
    return Object.values(value).some((entry) =>
      containsReference(entry, reference)
    );
  return false;
}

function matchesReference(value: string, reference: RemovedReference): boolean {
  if (reference.ids.has(value) || reference.paths.has(value)) return true;
  for (const path of reference.paths) {
    let at = value.indexOf(path);
    while (at >= 0) {
      const after = value.charAt(at + path.length);
      if (!after || /[?#\s"'<>)]/.test(after)) return true;
      at = value.indexOf(path, at + path.length);
    }
  }
  return false;
}
