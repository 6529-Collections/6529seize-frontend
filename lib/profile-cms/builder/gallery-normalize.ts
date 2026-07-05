// Maps the real backend wallet-gallery snapshot response
// (POST profile-cms/wallet-gallery/snapshot, snake_case, see
// D:\repos\6529seize-backend
// src/api-serverless/src/profile-cms/wallet-gallery.api.service.ts and the
// generated ApiProfileCmsWalletGallery* models) into the frontend builder's
// existing camelCase WalletGallerySnapshot review model. The wallet parser
// and curation UI (gallery.ts / ProfileCmsBuilder.tsx) are unchanged; only
// this response-mapping layer is new.
import type { ApiProfileCmsWalletGalleryAsset } from "@/generated/models/ApiProfileCmsWalletGalleryAsset";
import type { ApiProfileCmsWalletGalleryExcludedAsset } from "@/generated/models/ApiProfileCmsWalletGalleryExcludedAsset";
import type { ApiProfileCmsWalletGallerySnapshot } from "@/generated/models/ApiProfileCmsWalletGallerySnapshot";
import type { ApiProfileCmsWalletGalleryWallet } from "@/generated/models/ApiProfileCmsWalletGalleryWallet";
import {
  WALLET_GALLERY_BACKEND_WARNING_CODES,
  type WalletGallerySnapshot,
  type WalletGallerySnapshotAsset,
  type WalletGallerySnapshotCollection,
  type WalletGallerySnapshotExcludedAsset,
  type WalletGallerySnapshotTotals,
  type WalletGallerySource,
} from "@/lib/profile-cms/builder/gallery";
import { slugifyBuilderId, toNullableString } from "./normalize";

const DEFAULT_CHAIN_ID = 1;

export function normalizeWalletGallerySnapshotResponse(
  response: ApiProfileCmsWalletGallerySnapshot,
  requestedSources: readonly WalletGallerySource[]
): WalletGallerySnapshot {
  const wallets = normalizeWallets(response.wallets, requestedSources);
  const assets = normalizeAssets(response.assets);
  const collections = deriveCollectionsFromAssets(assets);
  const excludedAssets = normalizeExcludedAssets(response.excluded_assets);
  const totals = normalizeTotals(response);

  return {
    snapshotId: `backend-${response.generated_at}`,
    source: "backend",
    wallets,
    capturedAt: new Date(response.generated_at).toISOString(),
    ...(response.block_reference
      ? { blockNumber: response.block_reference }
      : {}),
    assets,
    collections,
    excludedAssets,
    totals,
    warnings: getWarnings(totals),
  };
}

function getWarnings(
  totals: WalletGallerySnapshotTotals | undefined
): string[] {
  if (!totals) {
    return [];
  }
  const warnings: string[] = [];
  if (totals.unresolvedWallets > 0) {
    warnings.push(WALLET_GALLERY_BACKEND_WARNING_CODES.unresolvedWallets);
  }
  if (totals.truncated) {
    warnings.push(WALLET_GALLERY_BACKEND_WARNING_CODES.truncated);
  }
  return warnings;
}

function normalizeWallets(
  wallets: readonly ApiProfileCmsWalletGalleryWallet[] | undefined,
  fallback: readonly WalletGallerySource[]
): readonly WalletGallerySource[] {
  const normalized = (wallets ?? [])
    .map((wallet): WalletGallerySource | null => {
      const normalizedValue = wallet.address ?? wallet.ens;
      if (!normalizedValue) {
        return null;
      }
      return {
        kind: wallet.ens && !wallet.address ? "ens" : "address",
        input: wallet.input,
        normalized: normalizedValue,
      };
    })
    .filter((wallet): wallet is WalletGallerySource => !!wallet);

  return normalized.length ? normalized : fallback;
}

function normalizeAssets(
  assets: readonly ApiProfileCmsWalletGalleryAsset[] | undefined
): readonly WalletGallerySnapshotAsset[] {
  return (assets ?? []).map(toSnapshotAsset);
}

function toSnapshotAsset(
  asset: ApiProfileCmsWalletGalleryAsset
): WalletGallerySnapshotAsset {
  const tokenId = String(asset.token_id);
  const fullImage = toNullableString(asset.media.image ?? undefined);
  const imageUri =
    fullImage ??
    toNullableString(
      asset.media.image_preview ?? asset.media.thumbnail ?? undefined
    );
  const mimeType = toNullableString(asset.media.mime_type ?? undefined);
  const title =
    toNullableString(asset.name) ?? `${asset.collection} #${tokenId}`;

  return {
    // Owner-scoped key: the same ERC1155 token can be indexed once per owned
    // wallet, and curation ids must stay unique within the snapshot.
    id: getAssetKey(asset.contract, tokenId, asset.owner_wallet),
    title,
    collectionId: asset.collection_key,
    collectionName: asset.collection,
    contract: asset.contract,
    tokenId,
    chainId: DEFAULT_CHAIN_ID,
    owner: asset.owner_wallet,
    ...(imageUri ? { imageUri } : {}),
    ...(mimeType ? { mimeType } : {}),
    mediaState: getMediaState(asset, fullImage, imageUri),
    altText: title,
    flags: {
      spam: asset.flags.spam,
      excluded: asset.flags.excluded,
      ...(asset.flags.exclusion_reason
        ? { reason: asset.flags.exclusion_reason }
        : {}),
    },
  };
}

function getMediaState(
  asset: ApiProfileCmsWalletGalleryAsset,
  fullImage: string | undefined,
  imageUri: string | undefined
): WalletGallerySnapshotAsset["mediaState"] {
  if (fullImage) {
    return "ready";
  }
  const hasOtherMedia =
    !!imageUri ||
    !!toNullableString(
      asset.media.animation ?? asset.media.animation_preview ?? undefined
    );
  return hasOtherMedia ? "partial" : "missing";
}

function deriveCollectionsFromAssets(
  assets: readonly WalletGallerySnapshotAsset[]
): readonly WalletGallerySnapshotCollection[] {
  const byCollection = new Map<string, WalletGallerySnapshotAsset[]>();
  assets.forEach((asset) => {
    const current = byCollection.get(asset.collectionId) ?? [];
    byCollection.set(asset.collectionId, [...current, asset]);
  });

  return [...byCollection.entries()].map(([collectionId, collectionAssets]) => {
    const firstAsset = collectionAssets[0];
    return {
      id: collectionId,
      name: firstAsset?.collectionName ?? collectionId,
      slug: slugifyBuilderId(collectionId),
      contract:
        firstAsset?.contract ?? "0x0000000000000000000000000000000000000000",
      chainId: firstAsset?.chainId ?? DEFAULT_CHAIN_ID,
      assetIds: collectionAssets.map((asset) => asset.id),
    };
  });
}

function normalizeExcludedAssets(
  excludedAssets: readonly ApiProfileCmsWalletGalleryExcludedAsset[] | undefined
): readonly WalletGallerySnapshotExcludedAsset[] {
  return (excludedAssets ?? []).map((excluded) => ({
    contract: excluded.contract,
    tokenId: String(excluded.token_id),
    owner: excluded.owner_wallet,
    reason: excluded.reason,
  }));
}

function normalizeTotals(
  response: ApiProfileCmsWalletGallerySnapshot
): WalletGallerySnapshotTotals | undefined {
  const totals = response.totals;
  if (!totals) {
    return undefined;
  }
  return {
    requestedWallets: totals.requested_wallets,
    resolvedWallets: totals.resolved_wallets,
    unresolvedWallets: totals.unresolved_wallets,
    indexedAssets: totals.indexed_assets,
    visibleAssets: totals.visible_assets,
    excludedAssets: totals.excluded_assets,
    spamAssets: totals.spam_assets,
    truncated: totals.truncated,
  };
}

function getAssetKey(
  contract: string,
  tokenId: string,
  ownerWallet: string
): string {
  return `${contract.toLowerCase()}:${tokenId}:${ownerWallet.toLowerCase()}`;
}
