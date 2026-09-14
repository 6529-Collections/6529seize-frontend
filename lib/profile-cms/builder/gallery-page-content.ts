import type { CmsBlockV1, CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import type {
  WalletGallerySnapshot,
  WalletGallerySnapshotAsset,
} from "./gallery-source";

export function buildGalleryHomeBlocks({
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
        ...(snapshot.blockNumber === undefined
          ? {}
          : { block_number: snapshot.blockNumber }),
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
export function buildGalleryPageMetadata({
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
