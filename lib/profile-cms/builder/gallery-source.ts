import { detectEnsTarget } from "@/lib/ens/detect";
import { slugifyBuilderId as slugify } from "./normalize";

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

type WalletGallerySnapshotAssetFlags = {
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

type WalletGallerySnapshotSource = "backend" | "fixture";

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

const WALLET_GALLERY_FIXTURE_WARNING_CODES = {
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

const DEFAULT_COLLECTION_CONTRACT =
  "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const DEFAULT_PRIMARY_OWNER = "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0";
const DEFAULT_SECONDARY_OWNER = "0xfDF8bcf56aF0584026f9DB963381db72C5cc8e3b";
const FIXTURE_COLLECTION_ID = "collection-the-memes";
const FIXTURE_COLLECTION_NAME = "The Memes by 6529";

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
      collectionId: FIXTURE_COLLECTION_ID,
      collectionName: FIXTURE_COLLECTION_NAME,
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
      collectionId: FIXTURE_COLLECTION_ID,
      collectionName: FIXTURE_COLLECTION_NAME,
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
      collectionId: FIXTURE_COLLECTION_ID,
      collectionName: FIXTURE_COLLECTION_NAME,
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
        id: FIXTURE_COLLECTION_ID,
        name: FIXTURE_COLLECTION_NAME,
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
