import { detectEnsTarget } from "@/lib/ens/detect";
import {
  CMS_CANONICALIZATION,
  CMS_HASH_ALGORITHM,
  CMS_PACKAGE_SCHEMA,
  CMS_PAYLOAD_SCHEMA,
  type CmsBlockV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { withComputedCmsHashes } from "@/lib/profile-cms/protocol/v1/hash";

export type WalletGallerySource =
  | {
      readonly kind: "address";
      readonly input: string;
      readonly normalized: string;
    }
  | {
      readonly kind: "ens";
      readonly input: string;
      readonly normalized: string;
    };

export type WalletGalleryInputResult =
  | {
      readonly ok: true;
      readonly sources: readonly WalletGallerySource[];
    }
  | {
      readonly ok: false;
      readonly sources: readonly WalletGallerySource[];
      readonly errors: readonly string[];
    };

export type WalletGallerySnapshotAsset = {
  readonly id: string;
  readonly title: string;
  readonly collectionId: string;
  readonly collectionName: string;
  readonly contract: string;
  readonly tokenId: string;
  readonly chainId: number;
  readonly owner: string;
  readonly imageUri?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly metadataUri?: string | undefined;
  readonly mediaState: "ready" | "partial" | "missing";
  readonly altText: string;
};

export type WalletGallerySnapshotCollection = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly contract: string;
  readonly chainId: number;
  readonly assetIds: readonly string[];
};

export type WalletGallerySnapshotSource = "backend" | "fixture";

export type WalletGallerySnapshot = {
  readonly snapshotId: string;
  readonly source: WalletGallerySnapshotSource;
  readonly wallets: readonly WalletGallerySource[];
  readonly capturedAt: string;
  readonly blockNumber?: number | undefined;
  readonly assets: readonly WalletGallerySnapshotAsset[];
  readonly collections: readonly WalletGallerySnapshotCollection[];
  readonly warnings: readonly string[];
};

export type WalletGalleryBuilderState = {
  readonly walletInput: string;
  readonly snapshot?: WalletGallerySnapshot | undefined;
  readonly hiddenAssetIds: readonly string[];
  readonly featuredAssetIds: readonly string[];
  readonly featuredCollectionIds: readonly string[];
  readonly orderedAssetIds: readonly string[];
};

export type WalletGalleryPackageOptions = {
  readonly handle: string;
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly themeAccent: string;
  readonly snapshot: WalletGallerySnapshot | undefined;
  readonly hiddenAssetIds: readonly string[];
  readonly featuredAssetIds: readonly string[];
  readonly featuredCollectionIds: readonly string[];
  readonly orderedAssetIds: readonly string[];
  readonly now?: Date | undefined;
};

export const WALLET_GALLERY_FIXTURE_WARNING_CODES = {
  backendDisabled: "fixture_snapshot_backend_disabled",
  partialMedia: "fixture_snapshot_partial_media",
} as const;

const FIXTURE_ZERO_HASH =
  "sha256:0000000000000000000000000000000000000000000000000000000000000000";
const DEFAULT_COLLECTION_CONTRACT =
  "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const DEFAULT_PRIMARY_OWNER = "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0";
const DEFAULT_SECONDARY_OWNER = "0xfDF8bcf56aF0584026f9DB963381db72C5cc8e3b";

export function createDefaultWalletGalleryBuilderState(
  handle: string
): WalletGalleryBuilderState {
  return {
    walletInput: `${handle}.eth`,
    hiddenAssetIds: [],
    featuredAssetIds: [],
    featuredCollectionIds: [],
    orderedAssetIds: [],
  };
}

export function parseWalletGallerySources(
  input: string
): WalletGalleryInputResult {
  const tokens = input
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const sources: WalletGallerySource[] = [];
  const errors: string[] = [];

  tokens.forEach((token) => {
    const detected = detectEnsTarget(token);
    if (!detected) {
      errors.push(token);
      return;
    }

    const normalized = detected.input.trim();
    const dedupeKey = `${detected.kind}:${normalized.toLowerCase()}`;
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);
    sources.push({
      kind: detected.kind === "name" ? "ens" : "address",
      input: token,
      normalized,
    });
  });

  if (!tokens.length) {
    errors.push("missing_wallet");
  }

  return errors.length ? { ok: false, sources, errors } : { ok: true, sources };
}

export function createMockWalletGallerySnapshot({
  handle,
  sources,
  now = new Date("2026-06-17T00:00:00.000Z"),
}: {
  readonly handle: string;
  readonly sources: readonly WalletGallerySource[];
  readonly now?: Date | undefined;
}): WalletGallerySnapshot {
  const fallbackSources =
    sources.length > 0
      ? sources
      : parseWalletGallerySources(`${handle}.eth`).sources;
  const primaryOwner =
    fallbackSources.find((source) => source.kind === "address")?.normalized ??
    DEFAULT_PRIMARY_OWNER;
  const secondaryOwner =
    fallbackSources.filter((source) => source.kind === "address")[1]
      ?.normalized ??
    fallbackSources.find((source) => source.kind === "address")?.normalized ??
    DEFAULT_SECONDARY_OWNER;
  const capturedAt = now.toISOString();
  const assets: WalletGallerySnapshotAsset[] = [
    {
      id: "work-memes-1",
      title: "The Memes #1",
      collectionId: "collection-the-memes",
      collectionName: "The Memes by 6529",
      contract: DEFAULT_COLLECTION_CONTRACT,
      tokenId: "1",
      chainId: 1,
      owner: primaryOwner,
      imageUri: "ipfs://bafyfixturegallery/memes-1.png",
      mimeType: "image/png",
      width: 2400,
      height: 2400,
      metadataUri: "ipfs://bafyfixturegallery/metadata/1.json",
      mediaState: "ready",
      altText: "The Memes by 6529 card number 1",
    },
    {
      id: "work-memes-2",
      title: "The Memes #2",
      collectionId: "collection-the-memes",
      collectionName: "The Memes by 6529",
      contract: DEFAULT_COLLECTION_CONTRACT,
      tokenId: "2",
      chainId: 1,
      owner: secondaryOwner,
      imageUri: "ipfs://bafyfixturegallery/memes-2.png",
      mimeType: "image/png",
      width: 1800,
      height: 2400,
      metadataUri: "ipfs://bafyfixturegallery/metadata/2.json",
      mediaState: "ready",
      altText: "The Memes by 6529 card number 2",
    },
    {
      id: "work-memes-partial",
      title: "Unresolved media work",
      collectionId: "collection-the-memes",
      collectionName: "The Memes by 6529",
      contract: DEFAULT_COLLECTION_CONTRACT,
      tokenId: "404",
      chainId: 1,
      owner: primaryOwner,
      metadataUri: "ipfs://bafyfixturegallery/metadata/404.json",
      mediaState: "partial",
      altText: "NFT metadata was found but preview media is pending",
    },
  ];

  return {
    snapshotId: `fixture-${slugify(handle)}-${slugify(
      fallbackSources.map((source) => source.normalized).join("-")
    )}`,
    source: "fixture",
    wallets: fallbackSources,
    capturedAt,
    blockNumber: 22000000,
    assets,
    collections: [
      {
        id: "collection-the-memes",
        name: "The Memes by 6529",
        slug: "the-memes",
        contract: DEFAULT_COLLECTION_CONTRACT,
        chainId: 1,
        assetIds: assets.map((asset) => asset.id),
      },
    ],
    warnings: [
      WALLET_GALLERY_FIXTURE_WARNING_CODES.backendDisabled,
      WALLET_GALLERY_FIXTURE_WARNING_CODES.partialMedia,
    ],
  };
}

// Temporary frontend preview fallback. The durable Phase 5 source of truth is
// the backend wallet-snapshot -> CMS V1 generator; keep this adapter aligned to
// the expected snapshot fields and replace it with BE package output when ready.
export function buildWalletGalleryCmsPackage({
  handle,
  siteTitle,
  siteDescription,
  themeAccent,
  snapshot,
  hiddenAssetIds,
  featuredAssetIds,
  featuredCollectionIds,
  orderedAssetIds,
  now = new Date(),
}: WalletGalleryPackageOptions): CmsPackageV1 {
  const normalizedHandle = normalizeHandle(handle);
  const resolvedSnapshot =
    snapshot ??
    createMockWalletGallerySnapshot({
      handle: normalizedHandle,
      sources: [],
      now,
    });
  const hidden = new Set(hiddenAssetIds);
  const orderedAssets = orderAssets(resolvedSnapshot.assets, orderedAssetIds);
  const visibleAssets = orderedAssets.filter((asset) => !hidden.has(asset.id));
  const pagePath = `/${normalizedHandle}/index.html`;
  const createdAt = now.toISOString();
  const mediaAssets = visibleAssets.filter((asset) => !!asset.imageUri);
  const galleryAssetIds = mediaAssets.map((asset) => getAssetId(asset));
  const collectionPages = resolvedSnapshot.collections
    .map((collection) =>
      buildCollectionPage({
        collection,
        handle: normalizedHandle,
        visibleAssets,
        now: createdAt,
      })
    )
    .filter((page): page is CmsPackageV1["payload"]["pages"][number] => !!page);
  const nftPages = visibleAssets.map((asset, index) =>
    buildNftPage({
      asset,
      handle: normalizedHandle,
      index,
      now: createdAt,
    })
  );
  const featuredPageIds = getFeaturedPageIds({
    collectionPages,
    featuredAssetIds,
    featuredCollectionIds,
    nftPages,
    visibleAssets,
  });
  const pages: CmsPackageV1["payload"]["pages"] = [
    {
      id: "page-gallery",
      type: "gallery",
      path: pagePath,
      metadata: {
        title: siteTitle.trim() || `${normalizedHandle} Gallery`,
        description:
          siteDescription.trim() ||
          "Generated gallery from reviewed wallet snapshot.",
        locale: "en",
        canonical_url: `https://6529.io${pagePath}`,
        ...(galleryAssetIds[0]
          ? { social_image_asset_id: galleryAssetIds[0] }
          : {}),
        navigation_label: "Gallery",
        search: "include",
        robots: "index",
        last_updated: createdAt,
      },
      source: {
        source_packet_id: "source-wallets",
      },
      blocks: buildGalleryHomeBlocks({
        galleryAssetIds,
        featuredPageIds,
        snapshot: resolvedSnapshot,
        visibleAssets,
      }),
    },
    ...collectionPages,
    ...nftPages,
  ];
  const routes = pages.map((page) => ({
    path: page.path,
    kind: "page" as const,
    page_id: page.id,
  }));
  const assets = mediaAssets.map((asset) => ({
    id: getAssetId(asset),
    kind: "image" as const,
    uri: asset.imageUri ?? "",
    content_hash: FIXTURE_ZERO_HASH,
    mime_type: asset.mimeType ?? "image/png",
    ...(asset.width ? { width: asset.width } : {}),
    ...(asset.height ? { height: asset.height } : {}),
    roles: ["grid" as const, "detail" as const, "poster" as const],
    alt_text: asset.altText,
  }));
  const nftMediaProfiles = visibleAssets.map((asset) => {
    const assetId = asset.imageUri ? getAssetId(asset) : undefined;
    return {
      id: getNftMediaProfileId(asset),
      chain_id: asset.chainId,
      contract: asset.contract,
      token_id: asset.tokenId,
      ...(asset.metadataUri ? { metadata_uri: asset.metadataUri } : {}),
      ...(assetId ? { original_asset_ids: [assetId] } : {}),
      display_variants: assetId
        ? [
            {
              asset_id: assetId,
              role: "detail" as const,
              crop_mode: "preserve" as const,
              source_asset_id: assetId,
            },
          ]
        : [],
      ...(assetId ? { poster_asset_id: assetId } : {}),
      snapshot: {
        owner: asset.owner,
        ...(resolvedSnapshot.blockNumber
          ? { block_number: resolvedSnapshot.blockNumber }
          : {}),
        captured_at: resolvedSnapshot.capturedAt,
      },
    };
  });
  const packageWithoutHashes: CmsPackageV1 = {
    schema: CMS_PACKAGE_SCHEMA,
    package_id: `pkg-${normalizedHandle}-wallet-gallery`,
    profile: {
      handle: normalizedHandle,
      ...(getPrimaryAddress(resolvedSnapshot.wallets)
        ? { primary_wallet: getPrimaryAddress(resolvedSnapshot.wallets) }
        : {}),
    },
    site: {
      title: siteTitle.trim() || `${normalizedHandle} Gallery`,
      description:
        siteDescription.trim() ||
        "Generated gallery from reviewed wallet snapshot.",
      base_path: pagePath,
      default_locale: "en",
      direction: "ltr",
      theme: {
        mode: "dark",
        accent: normalizeAccent(themeAccent),
      },
      navigation_id: "nav-main",
      required_renderer_capabilities: [
        "static_blocks",
        "profile_cms_v1",
        "nft_media_profile",
      ],
    },
    payload: {
      schema: CMS_PAYLOAD_SCHEMA,
      routes,
      pages,
      assets,
      nft_media_profiles: nftMediaProfiles,
      navigation: [
        {
          id: "nav-main",
          items: [
            { label: "Gallery", page_id: "page-gallery" },
            ...collectionPages.map((page) => ({
              label: page.metadata.navigation_label ?? page.metadata.title,
              page_id: page.id,
            })),
          ],
        },
      ],
      source_packets: [
        {
          id: "source-wallets",
          source_type: "wallet",
          captured_at: resolvedSnapshot.capturedAt,
          content_hash: FIXTURE_ZERO_HASH,
          wallets: resolvedSnapshot.wallets.map((wallet) => wallet.normalized),
          snapshot_id: resolvedSnapshot.snapshotId,
          snapshot_source: resolvedSnapshot.source,
          hidden_asset_ids: hiddenAssetIds,
          featured_asset_ids: featuredAssetIds,
          featured_collection_ids: featuredCollectionIds,
          warnings: resolvedSnapshot.warnings,
        } as NonNullable<CmsPackageV1["payload"]["source_packets"]>[number],
      ],
      build_manifest: {
        renderer: "6529-cms-gallery-builder-mvp",
        renderer_version: "0.1.0",
        route_count: routes.length,
        asset_count: assets.length,
        warnings: [...resolvedSnapshot.warnings],
      },
    },
    integrity: {
      canonicalization: CMS_CANONICALIZATION,
      hash_algorithm: CMS_HASH_ALGORITHM,
      payload_hash: FIXTURE_ZERO_HASH,
      package_hash: FIXTURE_ZERO_HASH,
      note: "Draft gallery candidate; final publish must be signed and stored by backend.",
    },
    signatures: [
      {
        type: "fixture",
        signer: `fixture:${normalizedHandle}`,
        signature: "gallery-builder-mvp-draft-signature-placeholder",
        signed_at: createdAt,
      },
    ],
    storage: [
      {
        provider: "fixture",
        uri: `ipfs://gallery-builder-mvp-${normalizedHandle}`,
        content_hash: FIXTURE_ZERO_HASH,
        provider_content_id: `gallery-builder-mvp-${normalizedHandle}`,
        pinned: false,
        canonical: false,
        recorded_at: createdAt,
      },
    ],
    provenance: {
      builder: "6529-cms-gallery-builder-mvp",
      builder_version: "0.1.0",
      created_at: createdAt,
      notes: "Generated by the frontend wallet gallery builder MVP.",
    },
  };

  return withComputedCmsHashes(packageWithoutHashes);
}

function buildGalleryHomeBlocks({
  galleryAssetIds,
  featuredPageIds,
  snapshot,
  visibleAssets,
}: {
  readonly galleryAssetIds: readonly string[];
  readonly featuredPageIds: readonly string[];
  readonly snapshot: WalletGallerySnapshot;
  readonly visibleAssets: readonly WalletGallerySnapshotAsset[];
}): CmsBlockV1[] {
  const blocks: CmsBlockV1[] = [
    {
      id: "block-gallery-heading",
      block_type: "heading",
      level: 1,
      text: "Gallery",
    } as CmsBlockV1,
    {
      id: "block-wallet-gallery",
      block_type: "generated_wallet_gallery",
      wallets: snapshot.wallets.map((wallet) => wallet.normalized),
      snapshot: {
        ...(snapshot.blockNumber ? { block_number: snapshot.blockNumber } : {}),
        captured_at: snapshot.capturedAt,
      },
      featured_page_ids: featuredPageIds,
    } as CmsBlockV1,
  ];

  if (galleryAssetIds.length) {
    blocks.push({
      id: "block-gallery-grid",
      block_type: "gallery",
      asset_ids: galleryAssetIds,
    } as CmsBlockV1);
  } else {
    blocks.push({
      id: "block-gallery-empty",
      block_type: "callout",
      tone: "Review",
      title: "No visible media",
      content:
        visibleAssets.length > 0
          ? "Visible works are missing media previews."
          : "No visible works are selected for this gallery.",
    } as CmsBlockV1);
  }

  return blocks;
}

function buildCollectionPage({
  collection,
  handle,
  visibleAssets,
  now,
}: {
  readonly collection: WalletGallerySnapshotCollection;
  readonly handle: string;
  readonly visibleAssets: readonly WalletGallerySnapshotAsset[];
  readonly now: string;
}): CmsPackageV1["payload"]["pages"][number] | null {
  const collectionAssets = visibleAssets.filter(
    (asset) => asset.collectionId === collection.id
  );
  if (!collectionAssets.length) {
    return null;
  }

  const pagePath = `/${handle}/collections/${collection.slug}/index.html`;
  const mediaAssetIds = collectionAssets
    .filter((asset) => !!asset.imageUri)
    .map((asset) => getAssetId(asset));
  const blocks: CmsBlockV1[] = [
    {
      id: `block-${collection.slug}-reference`,
      block_type: "collection_reference",
      chain_id: collection.chainId,
      contract: collection.contract,
      title: collection.name,
    } as CmsBlockV1,
  ];

  if (mediaAssetIds.length) {
    blocks.push({
      id: `block-${collection.slug}-gallery`,
      block_type: "gallery",
      asset_ids: mediaAssetIds,
    } as CmsBlockV1);
  }

  return {
    id: getCollectionPageId(collection.id),
    type: "collection",
    path: pagePath,
    metadata: {
      title: collection.name,
      description: "Collection page generated from a wallet gallery snapshot.",
      locale: "en",
      canonical_url: `https://6529.io${pagePath}`,
      ...(mediaAssetIds[0] ? { social_image_asset_id: mediaAssetIds[0] } : {}),
      navigation_label: collection.name,
      search: "include",
      robots: "index",
      last_updated: now,
    },
    blocks,
  };
}

function buildNftPage({
  asset,
  handle,
  index,
  now,
}: {
  readonly asset: WalletGallerySnapshotAsset;
  readonly handle: string;
  readonly index: number;
  readonly now: string;
}): CmsPackageV1["payload"]["pages"][number] {
  const contractSlug = asset.contract.toLowerCase();
  const pagePath = `/${handle}/nfts/ethereum/${contractSlug}/${slugify(
    asset.tokenId
  )}/index.html`;
  const assetId = asset.imageUri ? getAssetId(asset) : undefined;
  return {
    id: getNftPageId(asset.id, index),
    type: "nft_detail",
    path: pagePath,
    metadata: {
      title: asset.title,
      description: "NFT detail page generated from a wallet gallery snapshot.",
      locale: "en",
      canonical_url: `https://6529.io${pagePath}`,
      ...(assetId ? { social_image_asset_id: assetId } : {}),
      navigation_label: asset.title,
      search: "include",
      robots: "index",
      last_updated: now,
    },
    blocks: [
      {
        id: `block-${slugify(asset.id)}-nft-reference`,
        block_type: "nft_reference",
        nft_media_profile_id: getNftMediaProfileId(asset),
      } as CmsBlockV1,
    ],
  };
}

function getFeaturedPageIds({
  collectionPages,
  featuredAssetIds,
  featuredCollectionIds,
  nftPages,
  visibleAssets,
}: {
  readonly collectionPages: readonly CmsPackageV1["payload"]["pages"][number][];
  readonly featuredAssetIds: readonly string[];
  readonly featuredCollectionIds: readonly string[];
  readonly nftPages: readonly CmsPackageV1["payload"]["pages"][number][];
  readonly visibleAssets: readonly WalletGallerySnapshotAsset[];
}): string[] {
  const pageIds = new Set<string>();
  const nftPageIdsByAssetId = new Map(
    visibleAssets.flatMap((asset, index) => {
      const pageId = nftPages[index]?.id;
      return pageId ? [[asset.id, pageId] as const] : [];
    })
  );

  featuredCollectionIds.forEach((collectionId) =>
    pageIds.add(getCollectionPageId(collectionId))
  );
  featuredAssetIds.forEach((assetId) => {
    const pageId = nftPageIdsByAssetId.get(assetId);
    if (pageId) {
      pageIds.add(pageId);
    }
  });
  const available = new Set([
    ...collectionPages.map((page) => page.id),
    ...nftPages.map((page) => page.id),
  ]);
  const featured = [...pageIds].filter((pageId) => available.has(pageId));

  if (featured.length) {
    return featured;
  }

  return [collectionPages[0]?.id, nftPages[0]?.id].filter(
    (pageId): pageId is string => !!pageId
  );
}

function orderAssets(
  assets: readonly WalletGallerySnapshotAsset[],
  orderedAssetIds: readonly string[]
): WalletGallerySnapshotAsset[] {
  const position = new Map(orderedAssetIds.map((id, index) => [id, index]));
  return [...assets].sort((left, right) => {
    const leftPosition = position.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = position.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }
    return assets.indexOf(left) - assets.indexOf(right);
  });
}

function getPrimaryAddress(
  wallets: readonly WalletGallerySource[]
): string | undefined {
  return wallets.find((wallet) => wallet.kind === "address")?.normalized;
}

function getAssetId(asset: WalletGallerySnapshotAsset): string {
  return `asset-${slugify(asset.id)}`;
}

function getNftMediaProfileId(asset: WalletGallerySnapshotAsset): string {
  return `nft-${slugify(asset.id)}`;
}

function getCollectionPageId(collectionId: string): string {
  return `page-${slugify(collectionId)}`;
}

function getNftPageId(assetId: string, index: number): string {
  return `page-nft-${slugify(assetId) || index + 1}`;
}

function slugify(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return trimHyphenEdges(normalized).slice(0, 80) || "item";
}

function trimHyphenEdges(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && value[start] === "-") {
    start += 1;
  }

  while (end > start && value[end - 1] === "-") {
    end -= 1;
  }

  return value.slice(start, end);
}

function normalizeHandle(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return normalized || "punk6529";
}

function normalizeAccent(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : "#00a86b";
}
