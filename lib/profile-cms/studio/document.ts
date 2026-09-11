import { z } from "zod";

import {
  CanonicalJsonError,
  assetSchema,
  cmsPackageSchema,
  hashCanonicalJson,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsBlockV1,
  type CmsAssetV1,
  type CmsNavigationItemV1,
  type CmsPackageV1,
  type CmsPageV1,
  type CmsValidationIssueV1,
} from "@/lib/profile-cms/protocol/v1";
import { isValidCmsPageSlug } from "@/lib/profile-cms/runtime/page-slugs";
import { getCmsPublicPagePath } from "@/lib/profile-cms/runtime/routes";
import { cmsStudioThemeTokenPatchSchema } from "./presentation";
import {
  containsReference,
  pageReferencePaths,
  rewriteDocumentUrls,
  type RemovedReference,
} from "./document-references";

const NAVIGATION_MISSING = "document.navigation_missing";

const sitePatchSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(300).optional(),
    theme: z
      .object({
        mode: z.enum(["light", "dark", "system"]).optional(),
        accent: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        tokens: cmsStudioThemeTokenPatchSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type CmsDocumentOperation =
  | { readonly type: "set_home_page"; readonly pageId: string }
  | {
      readonly type: "rename_page_route";
      readonly pageId: string;
      readonly slug: string;
    }
  | {
      readonly type: "add_navigation_item";
      readonly navigationId: string;
      readonly item: CmsNavigationItemV1;
      readonly parentPath?: readonly number[];
      readonly index?: number;
    }
  | { readonly type: "add_asset"; readonly asset: CmsAssetV1 }
  | {
      readonly type: "update_asset";
      readonly assetId: string;
      readonly patch: Partial<Omit<CmsAssetV1, "id">>;
    }
  | { readonly type: "remove_asset"; readonly assetId: string }
  | {
      readonly type: "batch";
      readonly operations: readonly CmsDocumentOperation[];
    }
  | {
      readonly type: "update_page_metadata";
      readonly pageId: string;
      readonly patch: Partial<CmsPageV1["metadata"]>;
      readonly removeFields?: readonly (
        | "social_image_asset_id"
        | "square_social_image_asset_id"
      )[];
    }
  | { readonly type: "create_page"; readonly page: CmsPageV1 }
  | {
      readonly type: "duplicate_page";
      readonly pageId: string;
      readonly newPageId: string;
      readonly path: string;
      readonly canonicalUrl: string;
    }
  | { readonly type: "reorder_pages"; readonly pageIds: readonly string[] }
  | { readonly type: "delete_page"; readonly pageId: string }
  | {
      readonly type: "update_block";
      readonly pageId: string;
      readonly blockId: string;
      readonly patch: Partial<CmsBlockV1> & Readonly<Record<string, unknown>>;
      readonly removeFields?: readonly string[];
    }
  | {
      readonly type: "add_block";
      readonly pageId: string;
      readonly block: CmsBlockV1 & Readonly<Record<string, unknown>>;
      readonly index?: number;
    }
  | {
      readonly type: "duplicate_block";
      readonly pageId: string;
      readonly blockId: string;
      readonly newBlockId: string;
      readonly index?: number;
    }
  | {
      readonly type: "move_block";
      readonly pageId: string;
      readonly blockId: string;
      readonly targetPageId: string;
      readonly index: number;
    }
  | {
      readonly type: "remove_block";
      readonly pageId: string;
      readonly blockId: string;
    }
  | {
      readonly type: "update_site";
      readonly patch: z.infer<typeof sitePatchSchema>;
    }
  | {
      readonly type: "update_navigation_label";
      readonly navigationId: string;
      readonly itemPath: readonly number[];
      readonly label: string;
    }
  | {
      readonly type: "remove_navigation_item";
      readonly navigationId: string;
      readonly itemPath: readonly number[];
    }
  | {
      readonly type: "reorder_navigation";
      readonly navigationId: string;
      readonly parentPath: readonly number[];
      readonly indices: readonly number[];
    };

export type CmsDocumentOperationResult =
  | { readonly ok: true; readonly document: CmsPackageV1 }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: string;
        readonly issues?: readonly CmsValidationIssueV1[];
      };
    };

class DocumentOperationError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "DocumentOperationError";
  }
}

interface OperationContext {
  readonly document: CmsPackageV1;
  readonly removed: RemovedReference[];
  count: number;
}

/** Local draft edits only. Existing publication envelopes are preserved, not re-signed. */
export function applyCmsDocumentOperation(
  document: CmsPackageV1,
  expectedBaseHash: string,
  operation: CmsDocumentOperation
): CmsDocumentOperationResult {
  const parsed = cmsPackageSchema.safeParse(document);
  if (!parsed.success) return failure("document.invalid_input");

  // Zod returns an independent copy, including catchall JSON fields on blocks/sources.
  const context: OperationContext = {
    document: parsed.data,
    removed: [],
    count: 0,
  };
  try {
    const actualHash = withComputedCmsHashes(parsed.data).integrity
      .package_hash;
    if (
      expectedBaseHash !== actualHash ||
      expectedBaseHash !== document.integrity.package_hash
    )
      return failure("document.stale_base");
    applyOperation(context, operation, 0);
    assertNoRemovedReferences(context);
    const updated = withComputedCmsHashes(context.document);
    const validation = validateCmsPackageV1(updated, {
      allowFixtureSignatures: true,
      allowFixtureStorage: true,
      enforceHashes: true,
      checkedAt: updated.provenance.created_at,
    });
    const issues = validation.issues.filter(
      (issue) => issue.severity === "error"
    );
    if (issues.length)
      return { ok: false, error: { code: "document.invalid_result", issues } };
    return { ok: true, document: updated };
  } catch (error) {
    if (error instanceof DocumentOperationError) return failure(error.code);
    if (error instanceof CanonicalJsonError)
      return failure("document.invalid_json");
    throw error;
  }
}

function failure(code: string): CmsDocumentOperationResult {
  return { ok: false, error: { code } };
}

function reject(code: string): never {
  throw new DocumentOperationError(code);
}

function applyOperation(
  context: OperationContext,
  operation: CmsDocumentOperation,
  depth: number
): void {
  context.count += 1;
  if (context.count > 100 || depth > 8) reject("document.batch_limit");
  const { document } = context;
  switch (operation.type) {
    case "set_home_page":
      setHomePage(document, operation.pageId);
      return;
    case "rename_page_route":
      renamePageRoute(context, operation.pageId, operation.slug);
      return;
    case "add_navigation_item": {
      const items = getNavigationItems(
        document,
        operation.navigationId,
        operation.parentPath ?? []
      );
      items.splice(
        insertionIndex(operation.index, items.length),
        0,
        cloneJson(operation.item)
      );
      return;
    }
    case "add_asset":
      if (
        document.payload.assets.some((asset) => asset.id === operation.asset.id)
      )
        reject("document.duplicate_asset_id");
      document.payload.assets.push(cloneJson(operation.asset));
      updateAssetCount(document);
      return;
    case "update_asset":
      updateAsset(document, operation.assetId, operation.patch);
      return;
    case "remove_asset":
      removeAsset(context, operation.assetId);
      return;
    case "batch":
      operation.operations.forEach((entry) =>
        applyOperation(context, entry, depth + 1)
      );
      return;
    case "update_page_metadata": {
      const page = getPage(document, operation.pageId);
      page.metadata = { ...page.metadata, ...operation.patch };
      for (const key of operation.removeFields ?? []) delete page.metadata[key];
      return;
    }
    case "create_page":
      createPage(document, operation.page);
      return;
    case "duplicate_page":
      duplicatePage(document, operation);
      return;
    case "reorder_pages":
      document.payload.pages = reorderByKeys(
        document.payload.pages,
        operation.pageIds,
        (page) => page.id
      );
      return;
    case "delete_page":
      deletePage(context, operation.pageId);
      return;
    case "update_block": {
      updateBlock(document, operation);
      return;
    }
    case "add_block":
      addBlock(
        getPage(document, operation.pageId),
        operation.block,
        operation.index
      );
      return;
    case "duplicate_block":
      duplicateBlock(document, operation);
      return;
    case "move_block":
      moveBlock(context, operation);
      return;
    case "remove_block":
      removeBlock(context, operation.pageId, operation.blockId);
      return;
    case "update_site":
      updateSite(document, operation.patch);
      return;
    case "update_navigation_label": {
      if (!operation.label.trim() || operation.label.length > 80)
        reject("document.navigation_label");
      const { items, index } = getNavigationPosition(
        document,
        operation.navigationId,
        operation.itemPath
      );
      const item = items[index];
      if (!item) reject(NAVIGATION_MISSING);
      item.label = operation.label;
      return;
    }
    case "remove_navigation_item": {
      const { items, index } = getNavigationPosition(
        document,
        operation.navigationId,
        operation.itemPath
      );
      items.splice(index, 1);
      return;
    }
    case "reorder_navigation": {
      const items = getNavigationItems(
        document,
        operation.navigationId,
        operation.parentPath
      );
      const reordered = reorderByKeys(
        items,
        operation.indices,
        (_, index) => index
      );
      items.splice(0, items.length, ...reordered);
      return;
    }
    default:
      reject("document.operation_unsupported");
  }
}

function getPage(document: CmsPackageV1, pageId: string): CmsPageV1 {
  const page = document.payload.pages.find((entry) => entry.id === pageId);
  if (!page) reject("document.page_missing");
  return page;
}

function setHomePage(document: CmsPackageV1, pageId: string): void {
  const page = getPage(document, pageId);
  const rootPath = `/${document.profile.handle}/index.html`;
  const root = document.payload.routes.find((route) => route.path === rootPath);
  if (
    !root ||
    !document.payload.routes.some(
      (route) =>
        route.kind === "page" &&
        route.page_id === pageId &&
        route.path === page.path
    )
  )
    reject("document.page_route_missing");
  if (root.kind === "page" && root.page_id !== pageId)
    reject("document.required_page");
  if (root.kind !== "page") {
    root.kind = "alias";
    root.target = page.path;
  }
  document.site.base_path = rootPath;
  document.payload.pages = [
    page,
    ...document.payload.pages.filter((entry) => entry.id !== pageId),
  ];
}

function getBlockIndex(page: CmsPageV1, blockId: string): number {
  const index = page.blocks.findIndex((entry) => entry.id === blockId);
  if (index < 0) reject("document.block_missing");
  return index;
}

function getBlock(page: CmsPageV1, blockId: string): CmsBlockV1 {
  const block = page.blocks[getBlockIndex(page, blockId)];
  if (!block) reject("document.block_missing");
  return block;
}

function insertionIndex(index: number | undefined, length: number): number {
  const resolved = index ?? length;
  if (!Number.isInteger(resolved) || resolved < 0 || resolved > length)
    reject("document.invalid_index");
  return resolved;
}

function cloneJson<T>(value: T): T {
  if (Array.isArray(value)) {
    const entries: readonly unknown[] = value;
    return entries.map((entry) => cloneJson(entry)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        cloneJson(entry),
      ])
    ) as T;
  }
  return value;
}

function reorderByKeys<T, K>(
  items: readonly T[],
  keys: readonly K[],
  keyOf: (item: T, index: number) => K
): T[] {
  const lookup = new Map(
    items.map((item, index) => [keyOf(item, index), item])
  );
  if (
    keys.length !== items.length ||
    new Set(keys).size !== keys.length ||
    keys.some((key) => !lookup.has(key))
  ) {
    reject("document.invalid_order");
  }
  return keys.map((key) => {
    const value = lookup.get(key);
    if (value === undefined) reject("document.invalid_order");
    return value;
  });
}

function updateRouteCount(document: CmsPackageV1): void {
  const manifest = document.payload.build_manifest;
  if (manifest?.route_count !== undefined)
    manifest.route_count = document.payload.routes.length;
}

function updateAssetCount(document: CmsPackageV1): void {
  const manifest = document.payload.build_manifest;
  if (manifest?.asset_count !== undefined)
    manifest.asset_count = document.payload.assets.length;
}

const assetPatchSchema = assetSchema.omit({ id: true }).partial();

function updateAsset(
  document: CmsPackageV1,
  assetId: string,
  patch: Partial<Omit<CmsAssetV1, "id">>
): void {
  const index = document.payload.assets.findIndex(
    (asset) => asset.id === assetId
  );
  const asset = document.payload.assets[index];
  if (!asset) reject("document.asset_missing");
  const parsed = assetPatchSchema.safeParse(patch);
  if (!parsed.success) reject("document.invalid_asset_patch");
  const merged = assetSchema.safeParse({ ...asset, ...parsed.data });
  if (!merged.success) reject("document.invalid_asset_patch");
  document.payload.assets[index] = merged.data;
}

function removeAsset(context: OperationContext, assetId: string): void {
  const index = context.document.payload.assets.findIndex(
    (asset) => asset.id === assetId
  );
  if (index < 0) reject("document.asset_missing");
  context.document.payload.assets.splice(index, 1);
  context.removed.push({ ids: new Set([assetId]), paths: new Set() });
  updateAssetCount(context.document);
}

function createPage(document: CmsPackageV1, page: CmsPageV1): void {
  const prefix = `/${document.profile.handle}/`;
  const suffix = "/index.html";
  const slug = page.path.slice(prefix.length, -suffix.length);
  if (
    !page.path.startsWith(prefix) ||
    !page.path.endsWith(suffix) ||
    !isValidCmsPageSlug(slug)
  )
    reject("document.invalid_page_path");
  if (document.payload.pages.some((entry) => entry.id === page.id))
    reject("document.duplicate_page_id");
  if (hasRoutePath(document, page.path)) reject("document.duplicate_path");
  document.payload.pages.push(cloneJson(page));
  document.payload.routes.push({
    kind: "page",
    path: page.path,
    page_id: page.id,
  });
  updateRouteCount(document);
}

function hasRoutePath(document: CmsPackageV1, path: string): boolean {
  const key = (value: string) =>
    value.replace(/^\/[^/]+/, (handle) => handle.toLowerCase());
  return document.payload.routes.some((route) => key(route.path) === key(path));
}

function renamePageRoute(
  context: OperationContext,
  pageId: string,
  slug: string
): void {
  const { document } = context;
  const page = getPage(document, pageId);
  if (!isValidCmsPageSlug(slug)) reject("document.invalid_page_path");
  const oldPath = page.path;
  const newPath = `/${document.profile.handle}/${slug}/index.html`;
  if (oldPath === newPath) return;
  if (oldPath === `/${document.profile.handle}/index.html`)
    reject("document.required_page");
  if (hasRoutePath(document, newPath)) reject("document.duplicate_path");
  const ownRoute = document.payload.routes.find(
    (route) =>
      route.kind === "page" &&
      route.page_id === pageId &&
      route.path === oldPath
  );
  if (!ownRoute) reject("document.page_route_missing");
  const oldPublicPath = getCmsPublicPagePath(document, pageId) ?? oldPath;
  const canonical = parseCanonicalUrl(page.metadata.canonical_url);
  if (canonical.protocol !== "https:") reject("document.unsupported_canonical");
  const oldCanonical = `${canonical.origin}${canonical.pathname}`;
  ownRoute.path = newPath;
  page.path = newPath;
  const newPublicPath = getCmsPublicPagePath(document, pageId) ?? newPath;
  canonical.pathname = newPublicPath;
  page.metadata.canonical_url = canonical.toString();
  if (document.site.base_path === oldPath) document.site.base_path = newPath;
  const replacements = new Map([
    [oldPath, newPath],
    [oldPublicPath, newPublicPath],
    [`${canonical.origin}${oldPath}`, `${canonical.origin}${newPath}`],
    [
      `${canonical.origin}${oldPublicPath}`,
      `${canonical.origin}${newPublicPath}`,
    ],
    [oldCanonical, `${canonical.origin}${canonical.pathname}`],
  ]);
  rewriteDocumentUrls(document, replacements);
  context.removed.push({
    ids: new Set(),
    paths: new Set(
      [...replacements]
        .filter(([from, to]) => from !== to)
        .map(([from]) => from)
    ),
  });
}

function parseCanonicalUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return reject("document.unsupported_canonical");
  }
}

function duplicatePage(
  document: CmsPackageV1,
  operation: Extract<CmsDocumentOperation, { type: "duplicate_page" }>
): void {
  const source = getPage(document, operation.pageId);
  const originalIds = new Set([
    source.id,
    ...source.blocks.map((block) => block.id),
  ]);
  const reference: RemovedReference = {
    ids: originalIds,
    paths: new Set([
      source.path,
      source.metadata.canonical_url,
      ...source.blocks.map((block) => `#${block.id}`),
    ]),
  };
  source.blocks.forEach(({ id: _id, ...fields }) => {
    if (containsReference(fields, reference))
      reject("document.duplicate_references");
  });
  const usedIds = new Set(
    document.payload.pages.flatMap((page) =>
      page.blocks.map((block) => block.id)
    )
  );
  const blocks = source.blocks.map((block) => {
    const suffix = hashCanonicalJson([operation.newPageId, block.id]).slice(
      -12
    );
    const id = `${operation.newPageId.slice(0, 80)}-${block.id.slice(0, 20)}-${suffix}`;
    if (usedIds.has(id)) reject("document.duplicate_block_id");
    usedIds.add(id);
    return { ...cloneJson(block), id };
  });
  createPage(document, {
    ...cloneJson(source),
    id: operation.newPageId,
    path: operation.path,
    metadata: { ...source.metadata, canonical_url: operation.canonicalUrl },
    blocks,
  });
}

function deletePage(context: OperationContext, pageId: string): void {
  const { document, removed } = context;
  const page = getPage(document, pageId);
  const paths = pageReferencePaths(document, page);
  if (
    page.path === document.site.base_path ||
    page.path === `/${document.profile.handle}/index.html`
  )
    reject("document.required_page");
  document.payload.pages = document.payload.pages.filter(
    (entry) => entry.id !== pageId
  );
  document.payload.routes = document.payload.routes.filter(
    (route) =>
      !(
        route.kind === "page" &&
        route.path === page.path &&
        route.page_id === page.id
      )
  );
  removed.push({
    ids: new Set([pageId, ...page.blocks.map((block) => block.id)]),
    paths,
  });
  updateRouteCount(document);
}

function addBlock(page: CmsPageV1, block: CmsBlockV1, index?: number): void {
  if (page.blocks.some((entry) => entry.id === block.id))
    reject("document.duplicate_block_id");
  page.blocks.splice(
    insertionIndex(index, page.blocks.length),
    0,
    cloneJson(block)
  );
}

function updateBlock(
  document: CmsPackageV1,
  operation: Extract<CmsDocumentOperation, { type: "update_block" }>
): void {
  const page = getPage(document, operation.pageId);
  const index = getBlockIndex(page, operation.blockId);
  const removals = operation.removeFields ?? [];
  const keys = [...Object.keys(operation.patch), ...removals];
  if (keys.some((key) => key === "id" || key === "block_type"))
    reject("document.block_identity");
  const block: CmsBlockV1 & Record<string, unknown> = {
    ...getBlock(page, operation.blockId),
    ...cloneJson(operation.patch),
  };
  for (const key of removals) delete block[key];
  page.blocks[index] = block;
}

function duplicateBlock(
  document: CmsPackageV1,
  operation: Extract<CmsDocumentOperation, { type: "duplicate_block" }>
): void {
  const page = getPage(document, operation.pageId);
  const block = getBlock(page, operation.blockId);
  const { id: _id, ...fields } = block;
  if (
    containsReference(fields, {
      ids: new Set([block.id]),
      paths: pageReferencePaths(document, page, block.id),
    })
  )
    reject("document.duplicate_references");
  addBlock(
    page,
    { ...block, id: operation.newBlockId },
    operation.index ?? getBlockIndex(page, block.id) + 1
  );
}

function removeBlock(
  context: OperationContext,
  pageId: string,
  blockId: string
): void {
  const page = getPage(context.document, pageId);
  page.blocks.splice(getBlockIndex(page, blockId), 1);
  context.removed.push({
    ids: new Set([blockId]),
    paths: pageReferencePaths(context.document, page, blockId),
  });
}

function moveBlock(
  context: OperationContext,
  operation: Extract<CmsDocumentOperation, { type: "move_block" }>
): void {
  const page = getPage(context.document, operation.pageId);
  const target = getPage(context.document, operation.targetPageId);
  const block = getBlock(page, operation.blockId);
  page.blocks.splice(getBlockIndex(page, block.id), 1);
  addBlock(target, block, operation.index);
  if (page !== target)
    context.removed.push({
      ids: new Set(),
      paths: pageReferencePaths(context.document, page, block.id),
    });
}

function updateSite(
  document: CmsPackageV1,
  patch: z.infer<typeof sitePatchSchema>
): void {
  const parsed = sitePatchSchema.safeParse(patch);
  if (!parsed.success) reject("document.invalid_site_patch");
  const { theme, ...copy } = parsed.data;
  if (copy.title !== undefined) document.site.title = copy.title;
  if (copy.description !== undefined)
    document.site.description = copy.description;
  if (!theme) return;
  const { tokens, ...values } = theme;
  if (values.mode !== undefined) document.site.theme.mode = values.mode;
  if (values.accent !== undefined) document.site.theme.accent = values.accent;
  if (!tokens) return;
  const nextTokens = { ...document.site.theme.tokens };
  for (const [key, value] of Object.entries(tokens)) {
    if (value !== undefined) nextTokens[key] = value;
  }
  document.site.theme.tokens = nextTokens;
}

function getNavigationItems(
  document: CmsPackageV1,
  navigationId: string,
  path: readonly number[]
): CmsNavigationItemV1[] {
  const navigation = document.payload.navigation.find(
    (entry) => entry.id === navigationId
  );
  if (!navigation) reject(NAVIGATION_MISSING);
  let items = navigation.items;
  for (const index of path) {
    if (!Number.isInteger(index) || index < 0) reject("document.invalid_index");
    const item = items[index];
    if (!item?.children) reject(NAVIGATION_MISSING);
    items = item.children;
  }
  return items;
}

function getNavigationPosition(
  document: CmsPackageV1,
  navigationId: string,
  path: readonly number[]
): { items: CmsNavigationItemV1[]; index: number } {
  const index = path.at(-1);
  if (index === undefined || !Number.isInteger(index) || index < 0)
    reject("document.invalid_index");
  const items = getNavigationItems(document, navigationId, path.slice(0, -1));
  if (!items[index]) reject(NAVIGATION_MISSING);
  return { items, index };
}

function assertNoRemovedReferences(context: OperationContext): void {
  for (const reference of context.removed) {
    if (containsReference(context.document, reference))
      reject("document.inbound_reference");
  }
}
