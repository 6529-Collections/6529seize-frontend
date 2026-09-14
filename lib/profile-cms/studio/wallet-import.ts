import {
  buildWalletGalleryCmsPackage,
  type WalletGallerySnapshot,
} from "@/lib/profile-cms/builder/gallery";
import {
  cmsPackageSchema,
  hashCanonicalJson,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import type { CmsDocumentOperationResult } from "./document";

export const CMS_STUDIO_WALLET_IMPORT_LIMIT = 50;

interface WalletImportOptions {
  readonly expectedBaseHash: string;
  readonly snapshot: WalletGallerySnapshot;
  readonly selectedAssetIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly collectionsTitle: string;
  readonly noPreviewText: string;
  readonly locale?: string;
  readonly now?: Date;
}

/** Add a reviewed fragment to a complete local draft; never replace its identity or design. */
export function addCmsStudioWalletGallery(
  document: CmsPackageV1,
  options: WalletImportOptions
): CmsDocumentOperationResult {
  const parsed = cmsPackageSchema.safeParse(document);
  if (!parsed.success) return failure("wallet.invalid_document");
  const current = parsed.data;
  if (
    options.expectedBaseHash !== document.integrity.package_hash ||
    options.expectedBaseHash !==
      withComputedCmsHashes(current).integrity.package_hash
  )
    return failure("wallet.stale_document");
  if (!options.title.trim() || options.title.length > 80)
    return failure("wallet.invalid_title");
  const snapshot = selectSnapshot(options.snapshot, options.selectedAssetIds);
  if (!snapshot) return failure("wallet.invalid_selection");
  const namespace = getImportNamespace(current);
  const fragment = buildWalletGalleryCmsPackage({
    handle: current.profile.handle,
    siteTitle: options.title,
    siteDescription: options.description,
    themeAccent: current.site.theme.accent,
    walletInput: snapshot.wallets.map((wallet) => wallet.normalized).join("\n"),
    snapshot,
    hiddenAssetIds: [],
    featuredAssetIds: [],
    featuredCollectionIds: [],
    orderedAssetIds: snapshot.assets.map((asset) => asset.id),
    ...(options.now ? { now: options.now } : {}),
  });
  const imported = remapFragment(fragment, current.profile.handle, namespace);
  if (!imported) return failure("wallet.invalid_result");
  localizeFragment(
    imported,
    options,
    options.locale ?? current.site.default_locale
  );
  const home = imported.pages[0];
  if (!home) return failure("wallet.invalid_result");
  home.metadata.navigation_label = options.title.trim();
  home.metadata.title = options.title.trim();
  // The generated holding list already owns each selected work and its detail link.
  // Omit its known duplicate image projection while constructing the new fragment;
  // authored gallery blocks remain part of the document and always render.
  home.blocks = home.blocks.filter((block) => block.block_type !== "gallery");
  home.blocks = home.blocks.map((block) =>
    block.block_type === "heading"
      ? {
          ...block,
          text: options.title.trim(),
          presentation: { span: "full", role: "hero" },
        }
      : block
  );
  const collectionsPage = imported.pages[1];
  if (collectionsPage) {
    home.blocks.push({
      id: `${namespace}-collections-link`,
      block_type: "button_link",
      label: options.collectionsTitle,
      page_id: collectionsPage.id,
      url: collectionsPage.path,
    } as CmsPackageV1["payload"]["pages"][number]["blocks"][number]);
  }
  current.payload.pages.push(...imported.pages);
  current.payload.routes.push(...imported.routes);
  current.payload.assets.push(...imported.assets);
  current.payload.nft_media_profiles = [
    ...(current.payload.nft_media_profiles ?? []),
    ...(imported.nft_media_profiles ?? []),
  ];
  current.payload.source_packets = [
    ...(current.payload.source_packets ?? []),
    ...(imported.source_packets ?? []),
  ];
  const navigation = current.payload.navigation.find(
    (item) => item.id === current.site.navigation_id
  );
  if (!navigation) return failure("wallet.invalid_document");
  navigation.items.push({ label: options.title.trim(), page_id: home.id });
  if (current.payload.build_manifest) {
    current.payload.build_manifest.route_count = current.payload.routes.length;
    current.payload.build_manifest.asset_count = current.payload.assets.length;
  }
  const updated = withComputedCmsHashes(current);
  const validation = validateCmsPackageV1(updated, {
    allowFixtureSignatures: true,
    allowFixtureStorage: true,
    enforceHashes: true,
  });
  const issues = validation.issues.filter(
    (issue) => issue.severity === "error"
  );
  return issues.length > 0
    ? { ok: false, error: { code: "wallet.invalid_result", issues } }
    : { ok: true, document: updated };
}

function failure(code: string): CmsDocumentOperationResult {
  return { ok: false, error: { code } };
}

function localizeFragment(
  payload: CmsPackageV1["payload"],
  options: WalletImportOptions,
  locale: string
): void {
  payload.pages.forEach((page, index) => {
    page.metadata.description = options.description;
    page.metadata.locale = locale;
    if (index === 1) {
      page.metadata.title = options.collectionsTitle;
      page.metadata.navigation_label = options.collectionsTitle;
    }
    page.blocks = page.blocks.map((block) => {
      if (index === 1 && block.block_type === "heading")
        return {
          ...block,
          text: options.collectionsTitle,
          presentation: { span: "full", role: "hero" },
        };
      if (block.block_type === "callout")
        return {
          id: block.id,
          block_type: "rich_text",
          content: options.noPreviewText,
        };
      return block;
    });
  });
}

/** Strip unselected holdings, source aliases and unrelated wallets before serialization. */
function selectSnapshot(
  snapshot: WalletGallerySnapshot,
  selectedIds: readonly string[]
): WalletGallerySnapshot | null {
  const ids = new Set(selectedIds);
  if (
    ids.size === 0 ||
    ids.size > CMS_STUDIO_WALLET_IMPORT_LIMIT ||
    ids.size !== selectedIds.length
  )
    return null;
  const assets = selectedIds.flatMap((id) =>
    snapshot.assets.filter((asset) => asset.id === id)
  );
  if (
    assets.length !== ids.size ||
    assets.some((asset) => asset.flags.excluded || asset.flags.spam)
  )
    return null;
  const owners = [...new Set(assets.map((asset) => asset.owner.toLowerCase()))];
  const collections = snapshot.collections.flatMap((collection) => {
    const assetIds = assets
      .filter((asset) => asset.collectionId === collection.id)
      .map((asset) => asset.id);
    return assetIds.length > 0 ? [{ ...collection, assetIds }] : [];
  });
  return {
    snapshotId: `selection-${hashCanonicalJson({ capturedAt: snapshot.capturedAt, ids: selectedIds }).slice(7, 23)}`,
    source: snapshot.source,
    capturedAt: snapshot.capturedAt,
    ...(snapshot.blockNumber === undefined
      ? {}
      : { blockNumber: snapshot.blockNumber }),
    wallets: owners.map((owner) => ({
      kind: "address",
      input: owner,
      normalized: owner,
    })),
    assets,
    collections,
    excludedAssets: [],
    warnings: [],
  };
}

function getImportNamespace(document: CmsPackageV1): string {
  const ids = new Set<string>();
  collectIds(document.payload, ids);
  for (let index = 1; ; index += 1) {
    const namespace =
      index === 1 ? "wallet-gallery" : `wallet-gallery-${index}`;
    const prefix = `/${document.profile.handle.toLowerCase()}/${namespace}/`;
    const routeUsed = document.payload.routes.some((route) =>
      route.path.toLowerCase().startsWith(prefix)
    );
    const idUsed = [...ids].some((id) => id.startsWith(`${namespace}-`));
    if (!routeUsed && !idUsed) return namespace;
  }
}

function collectIds(value: unknown, ids: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((entry: unknown) => collectIds(entry, ids));
  } else if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record["id"] === "string") ids.add(record["id"]);
    Object.values(record).forEach((entry) => collectIds(entry, ids));
  }
}

function remapFragment(
  fragment: CmsPackageV1,
  handle: string,
  namespace: string
): CmsPackageV1["payload"] | null {
  const ids = new Set<string>();
  collectIds(fragment.payload.pages, ids);
  collectIds(fragment.payload.assets, ids);
  collectIds(fragment.payload.nft_media_profiles, ids);
  // Source packet contents are provenance, not document identifiers.
  fragment.payload.source_packets?.forEach((packet) => ids.add(packet.id));
  const identifiers = new Map(
    [...ids].map((id, index) => [id, `${namespace}-${index + 1}`])
  );
  const paths = new Map<string, string>();
  const oldRoot = `/${fragment.profile.handle}`;
  fragment.payload.routes.forEach((route) => {
    const path = `/${handle}/${namespace}${route.path.slice(oldRoot.length)}`;
    paths.set(route.path, path);
    paths.set(
      `https://6529.io${route.path}`,
      `https://6529.io${path.slice(0, -"/index.html".length)}`
    );
  });
  const payload = rewriteFragmentValue(
    fragment.payload,
    "",
    identifiers,
    paths
  );
  const parsed = cmsPackageSchema.safeParse({ ...fragment, payload });
  return parsed.success ? parsed.data.payload : null;
}

function rewriteFragmentValue(
  value: unknown,
  key: string,
  ids: ReadonlyMap<string, string>,
  paths: ReadonlyMap<string, string>
): unknown {
  if (typeof value === "string") {
    if (key === "id" || key.endsWith("_id") || key.endsWith("_ids"))
      return ids.get(value) ?? value;
    if (key === "path" || key === "url" || key === "canonical_url")
      return paths.get(value) ?? value;
    return value;
  }
  if (Array.isArray(value))
    return value.map((entry: unknown) =>
      rewriteFragmentValue(entry, key, ids, paths)
    );
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([field, entry]) => [
      field,
      rewriteFragmentValue(entry, field, ids, paths),
    ])
  );
}
