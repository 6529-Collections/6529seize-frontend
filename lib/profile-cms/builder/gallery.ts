import { detectEnsTarget } from "@/lib/ens/detect";
import { slugifyBuilderId } from "@/lib/profile-cms/builder/normalize";
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

type WalletGalleryInputResult =
  | {
      readonly ok: true;
      readonly sources: readonly WalletGallerySource[];
    }
  | {
      readonly ok: false;
      readonly sources: readonly WalletGallerySource[];
      readonly errors: readonly string[];
    };

export type WalletGallerySnapshotAssetFlags = {
  readonly spam: boolean;
  readonly excluded: boolean;
  readonly reason?: string | undefined;
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
  /**
   * Curation flags. Mirrors the backend's per-asset `flags` (spam/excluded
   * with an optional reason) so the review UI can eventually surface backend
   * exclusions, even though the wallet-gallery snapshot endpoint already
   * removes excluded assets into `excludedAssets` before this array is built.
   */
  readonly flags: WalletGallerySnapshotAssetFlags;
};

export type WalletGallerySnapshotCollection = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly contract: string;
  readonly chainId: number;
  readonly assetIds: readonly string[];
};

export type WalletGallerySnapshotExcludedAsset = {
  readonly contract: string;
  readonly tokenId: string;
  readonly owner: string;
  readonly reason: string;
};

export type WalletGallerySnapshotTotals = {
  readonly requestedWallets: number;
  readonly resolvedWallets: number;
  readonly unresolvedWallets: number;
  readonly indexedAssets: number;
  readonly visibleAssets: number;
  readonly excludedAssets: number;
  readonly spamAssets: number;
  readonly truncated: boolean;
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
  readonly excludedAssets: readonly WalletGallerySnapshotExcludedAsset[];
  readonly totals?: WalletGallerySnapshotTotals | undefined;
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

type WalletGalleryPackageOptions = {
  readonly handle: string;
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly themeAccent: string;
  readonly walletInput: string;
  readonly snapshot: WalletGallerySnapshot | undefined;
  readonly hiddenAssetIds: readonly string[];
  readonly featuredAssetIds: readonly string[];
  readonly featuredCollectionIds: readonly string[];
  readonly orderedAssetIds: readonly string[];
  readonly now?: Date | undefined;
};

// Renderer identity recorded in `build_manifest.renderer` for every package
// this module generates. isWalletGalleryGeneratedPackage() (exported below)
// checks this value so createBuilderStateFromPackage (lib/profile-cms
// /builder/package.ts) can detect a gallery-generated package on load and
// restore wallet-gallery editor state instead of re-importing it as a
// homepage template. Kept module-private -- callers use the exported
// detector/restorer functions instead of comparing this value themselves.
const WALLET_GALLERY_GENERATOR_NAME = "6529-cms-gallery-builder-mvp";
const WALLET_GALLERY_GENERATOR_VERSION = "0.2.0";
// Namespaced key on the wallet source packet that carries the full reviewed
// snapshot plus curation choices, so a saved gallery draft can be reloaded
// without re-querying the (possibly since-changed) wallet snapshot endpoint.
const WALLET_GALLERY_SOURCE_PACKET_STATE_KEY = "6529_gallery_builder_state_v1";

export const WALLET_GALLERY_FIXTURE_WARNING_CODES = {
  backendDisabled: "fixture_snapshot_backend_disabled",
  partialMedia: "fixture_snapshot_partial_media",
} as const;

// Frontend-authored warning codes derived from the real backend
// wallet-gallery snapshot totals (unresolved wallet inputs, truncated asset
// list). Rendered through profileCms.builder.gallery.snapshot.warning.* keys.
export const WALLET_GALLERY_BACKEND_WARNING_CODES = {
  unresolvedWallets: "backend_snapshot_unresolved_wallets",
  truncated: "backend_snapshot_truncated",
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
      flags: { spam: false, excluded: false },
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
      flags: { spam: false, excluded: false },
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
      flags: { spam: false, excluded: false },
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
    excludedAssets: [],
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

// Frontend mirror of the backend deterministic generator
// (D:\repos\6529seize-backend
// src/profile-cms/profile-cms-gallery-package-generator.ts). That module is
// the durable source of truth for page/block structure, asset naming, and
// collection grouping/ordering, but it is not exposed through any backend API
// route yet (only invoked from its own unit test) -- see
// builder-mvp-integration-assumptions.md "Wallet Gallery Snapshot And
// Generator Contract". Until it is wired behind an endpoint, this function
// reproduces its deterministic shape from the existing frontend snapshot
// review model: group-then-sort collections, one collections-index page, one
// lightbox page per collection, one detail page per NFT. Curation and the
// full reviewed snapshot are embedded in the source packet so a saved draft
// can round-trip back into gallery editor state (see
// restoreWalletGalleryStateFromPackage below).
export function buildWalletGalleryCmsPackage({
  handle,
  siteTitle,
  siteDescription,
  themeAccent,
  walletInput,
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
  const createdAt = now.toISOString();
  const homePagePath = `/${normalizedHandle}/index.html`;
  const mediaAssets = visibleAssets.filter((asset) => !!asset.imageUri);
  const galleryAssetIds = mediaAssets.map((asset) => getAssetId(asset));
  const groupedCollections = groupCollectionsForPackage({
    collections: resolvedSnapshot.collections,
    featuredCollectionIds,
    visibleAssets,
  });
  const collectionPages = groupedCollections.map((collection) =>
    buildCollectionPage({
      collection,
      handle: normalizedHandle,
      now: createdAt,
    })
  );
  const collectionsIndexPage = buildCollectionsIndexPage({
    collections: groupedCollections,
    handle: normalizedHandle,
    now: createdAt,
    socialImageAssetId: galleryAssetIds[0],
  });
  // NFT detail pages follow grouped-collection order (mirrors the backend
  // generator's `prepareGallery`, which flattens `sortedCollections` back
  // into `sortedNfts`) rather than raw snapshot order, so featured/alphabetic
  // collection precedence is reflected in route and page ordering too. Assets
  // whose collection id has no matching snapshot collection entry keep their
  // original relative order at the end instead of silently dropping out.
  const groupedAssetAndCollectionOrder = groupedCollections.flatMap(
    (collection) => collection.assets
  );
  const ungroupedAssets = visibleAssets.filter(
    (asset) =>
      !groupedAssetAndCollectionOrder.some((grouped) => grouped.id === asset.id)
  );
  const nftOrderedAssets = [
    ...groupedAssetAndCollectionOrder,
    ...ungroupedAssets,
  ];
  const nftPages = nftOrderedAssets.map((asset, index) =>
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
    visibleAssets: nftOrderedAssets,
  });
  const allNftPageIds = nftPages.map((page) => page.id);
  const pages: CmsPackageV1["payload"]["pages"] = [
    {
      id: "page-gallery",
      type: "gallery",
      path: homePagePath,
      metadata: buildGalleryPageMetadata({
        title: siteTitle.trim() || `${normalizedHandle} Gallery`,
        description:
          siteDescription.trim() ||
          "Generated gallery from reviewed wallet snapshot.",
        path: homePagePath,
        navigationLabel: "Gallery",
        socialImageAssetId: galleryAssetIds[0],
        now: createdAt,
      }),
      source: {
        source_packet_id: "source-wallets",
      },
      blocks: buildGalleryHomeBlocks({
        allNftPageIds,
        galleryAssetIds,
        featuredPageIds,
        groupedCollectionCount: groupedCollections.length,
        snapshot: resolvedSnapshot,
        visibleAssets,
      }),
    },
    collectionsIndexPage,
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
      base_path: homePagePath,
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
            { label: "Collections", page_id: collectionsIndexPage.id },
          ],
        },
      ],
      source_packets: [
        buildWalletSourcePacket({
          featuredAssetIds,
          featuredCollectionIds,
          hiddenAssetIds,
          orderedAssetIds,
          snapshot: resolvedSnapshot,
          walletInput,
        }),
      ],
      build_manifest: {
        renderer: WALLET_GALLERY_GENERATOR_NAME,
        renderer_version: WALLET_GALLERY_GENERATOR_VERSION,
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
  allNftPageIds,
  galleryAssetIds,
  featuredPageIds,
  groupedCollectionCount,
  snapshot,
  visibleAssets,
}: {
  readonly allNftPageIds: readonly string[];
  readonly galleryAssetIds: readonly string[];
  readonly featuredPageIds: readonly string[];
  readonly groupedCollectionCount: number;
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
      collection_count: groupedCollectionCount,
      page_ids: allNftPageIds,
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

// Shared page metadata shape for every generated gallery page (home,
// collections index, per-collection, per-NFT). All four pages share the same
// locale/search/robots conventions and only differ in title, description,
// canonical path, navigation label, and optional social image -- factored out
// so those fields cannot drift between page builders (Sonar duplication
// budget is tight for this lane).
function buildGalleryPageMetadata({
  title,
  description,
  path,
  navigationLabel,
  socialImageAssetId,
  now,
}: {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly navigationLabel: string;
  readonly socialImageAssetId: string | undefined;
  readonly now: string;
}): CmsPackageV1["payload"]["pages"][number]["metadata"] {
  return {
    title,
    description,
    locale: "en",
    canonical_url: `https://6529.io${path}`,
    ...(socialImageAssetId
      ? { social_image_asset_id: socialImageAssetId }
      : {}),
    navigation_label: navigationLabel,
    search: "include",
    robots: "index",
    last_updated: now,
  };
}

type GroupedGalleryCollection = WalletGallerySnapshotCollection & {
  readonly assets: readonly WalletGallerySnapshotAsset[];
};

// Mirrors the backend generator's `prepareGallery`: group visible assets by
// collection id, drop empty collections, and sort deterministically
// (featured collections first, then alphabetically by id) so FE and BE agree
// on collection page order for equivalent input.
function groupCollectionsForPackage({
  collections,
  featuredCollectionIds,
  visibleAssets,
}: {
  readonly collections: readonly WalletGallerySnapshotCollection[];
  readonly featuredCollectionIds: readonly string[];
  readonly visibleAssets: readonly WalletGallerySnapshotAsset[];
}): readonly GroupedGalleryCollection[] {
  const featured = new Set(featuredCollectionIds);
  const grouped = collections
    .map((collection) => ({
      ...collection,
      assets: visibleAssets.filter(
        (asset) => asset.collectionId === collection.id
      ),
    }))
    .filter((collection) => collection.assets.length > 0);

  return [...grouped].sort((left, right) => {
    const featuredCompare =
      Number(featured.has(right.id)) - Number(featured.has(left.id));
    if (featuredCompare !== 0) {
      return featuredCompare;
    }
    return left.id.localeCompare(right.id);
  });
}

function buildCollectionsIndexPage({
  collections,
  handle,
  now,
  socialImageAssetId,
}: {
  readonly collections: readonly GroupedGalleryCollection[];
  readonly handle: string;
  readonly now: string;
  readonly socialImageAssetId: string | undefined;
}): CmsPackageV1["payload"]["pages"][number] {
  const pagePath = `/${handle}/collections/index.html`;
  return {
    id: "page-collections",
    type: "collection",
    path: pagePath,
    metadata: buildGalleryPageMetadata({
      title: "Collections",
      description: "Collections in this wallet gallery.",
      path: pagePath,
      navigationLabel: "Collections",
      socialImageAssetId,
      now,
    }),
    blocks: [
      {
        id: "block-collections-heading",
        block_type: "heading",
        level: 1,
        text: "Collections",
      } as CmsBlockV1,
      {
        id: "block-collections-list",
        block_type: "collection_reference",
        collection_count: collections.length,
        page_ids: collections.map((collection) =>
          getCollectionPageId(collection.id)
        ),
      } as CmsBlockV1,
    ],
  };
}

function buildCollectionPage({
  collection,
  handle,
  now,
}: {
  readonly collection: GroupedGalleryCollection;
  readonly handle: string;
  readonly now: string;
}): CmsPackageV1["payload"]["pages"][number] {
  const pagePath = `/${handle}/collections/${collection.slug}/index.html`;
  const mediaAssetIds = collection.assets
    .filter((asset) => !!asset.imageUri)
    .map((asset) => getAssetId(asset));

  return {
    id: getCollectionPageId(collection.id),
    type: "collection",
    path: pagePath,
    metadata: buildGalleryPageMetadata({
      title: collection.name,
      description: "Collection page generated from a wallet gallery snapshot.",
      path: pagePath,
      navigationLabel: collection.name,
      socialImageAssetId: mediaAssetIds[0],
      now,
    }),
    blocks: [
      {
        id: `block-${collection.slug}-reference`,
        block_type: "collection_reference",
        chain_id: collection.chainId,
        contract: collection.contract,
        title: collection.name,
      } as CmsBlockV1,
      {
        id: `block-${collection.slug}-gallery`,
        block_type: "lightbox_gallery",
        asset_ids: mediaAssetIds,
        collection_key: collection.id,
      } as CmsBlockV1,
    ],
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
    metadata: buildGalleryPageMetadata({
      title: asset.title,
      description: "NFT detail page generated from a wallet gallery snapshot.",
      path: pagePath,
      navigationLabel: asset.title,
      socialImageAssetId: assetId,
      now,
    }),
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

// Curation choices embedded alongside the reviewed snapshot in the wallet
// source packet, keyed under WALLET_GALLERY_SOURCE_PACKET_STATE_KEY. This is
// the frontend's own recoverable-state contract (not a backend field); it
// only has to round-trip through this module's own JSON serialization.
type WalletGallerySourcePacketState = {
  readonly walletInput: string;
  readonly snapshot: WalletGallerySnapshot;
  readonly hiddenAssetIds: readonly string[];
  readonly featuredAssetIds: readonly string[];
  readonly featuredCollectionIds: readonly string[];
  readonly orderedAssetIds: readonly string[];
};

function buildWalletSourcePacket({
  featuredAssetIds,
  featuredCollectionIds,
  hiddenAssetIds,
  orderedAssetIds,
  snapshot,
  walletInput,
}: {
  readonly featuredAssetIds: readonly string[];
  readonly featuredCollectionIds: readonly string[];
  readonly hiddenAssetIds: readonly string[];
  readonly orderedAssetIds: readonly string[];
  readonly snapshot: WalletGallerySnapshot;
  readonly walletInput: string;
}): NonNullable<CmsPackageV1["payload"]["source_packets"]>[number] {
  const roundTripState: WalletGallerySourcePacketState = {
    walletInput,
    snapshot,
    hiddenAssetIds,
    featuredAssetIds,
    featuredCollectionIds,
    orderedAssetIds,
  };
  // The canonical JSON hasher rejects literal `undefined` values, which the
  // WalletGallerySnapshot* types allow on optional fields. Round-tripping
  // through JSON drops those keys the same way `JSON.stringify` does anywhere
  // else this package is serialized (e.g. JSON export/import), keeping the
  // embedded state hashable and identical to what a reload would parse back.
  const jsonSafeRoundTripState = JSON.parse(
    JSON.stringify(roundTripState)
  ) as Record<string, unknown>;

  return {
    id: "source-wallets",
    source_type: "wallet",
    captured_at: snapshot.capturedAt,
    content_hash: FIXTURE_ZERO_HASH,
    wallets: snapshot.wallets.map((wallet) => wallet.normalized),
    snapshot_id: snapshot.snapshotId,
    snapshot_source: snapshot.source,
    hidden_asset_ids: hiddenAssetIds,
    featured_asset_ids: featuredAssetIds,
    featured_collection_ids: featuredCollectionIds,
    warnings: snapshot.warnings,
    [WALLET_GALLERY_SOURCE_PACKET_STATE_KEY]: jsonSafeRoundTripState,
  } as NonNullable<CmsPackageV1["payload"]["source_packets"]>[number];
}

/**
 * Detects a wallet-gallery package generated by this module (or the future
 * backend generator sharing the same `build_manifest.renderer` identity) so
 * the builder can load a saved draft back into the gallery editor instead of
 * re-importing it as a homepage template.
 */
export function isWalletGalleryGeneratedPackage(
  cmsPackage: CmsPackageV1
): boolean {
  return (
    cmsPackage.payload.build_manifest?.renderer ===
    WALLET_GALLERY_GENERATOR_NAME
  );
}

/**
 * Recovers wallet-gallery editor state (wallet input, reviewed snapshot, and
 * hidden/featured/order curation) from a package this module generated. Falls
 * back to a fresh gallery state keyed off the profile handle when the source
 * packet is missing the embedded round-trip payload (e.g. a hand-authored or
 * older package that only matches on renderer name).
 */
export function restoreWalletGalleryStateFromPackage(
  cmsPackage: CmsPackageV1
): WalletGalleryBuilderState {
  const handle = cmsPackage.profile.handle;
  const packet = cmsPackage.payload.source_packets?.find(
    (candidate) => candidate.source_type === "wallet"
  ) as Record<string, unknown> | undefined;
  const roundTripState = packet
    ? (packet[WALLET_GALLERY_SOURCE_PACKET_STATE_KEY] as
        | WalletGallerySourcePacketState
        | undefined)
    : undefined;

  if (!roundTripState) {
    return createDefaultWalletGalleryBuilderState(handle);
  }

  return {
    walletInput: roundTripState.walletInput || `${handle}.eth`,
    snapshot: roundTripState.snapshot,
    hiddenAssetIds: roundTripState.hiddenAssetIds,
    featuredAssetIds: roundTripState.featuredAssetIds,
    featuredCollectionIds: roundTripState.featuredCollectionIds,
    orderedAssetIds: roundTripState.orderedAssetIds,
  };
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

const slugify = slugifyBuilderId;

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
