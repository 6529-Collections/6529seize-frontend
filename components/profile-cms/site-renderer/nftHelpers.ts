import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsAssetV1,
  CmsBlockV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { getCmsPagePath } from "@/lib/profile-cms/runtime/routes";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import type { CmsArtInspectionMetadata } from "@/components/profile-cms/CmsArtLightbox";
import {
  formatSourceSnapshot,
  getAsset,
  getString,
  getStringArray,
  isRecord,
  resolveAssetUrl,
} from "@/components/profile-cms/site-renderer/data";
import {
  compactMetadataEntries,
  createArtInspectionItem,
} from "@/components/profile-cms/site-renderer/media";
import type {
  CmsDisplayVariantV1,
  CmsNftMediaProfileV1,
  CmsSourcePacketV1,
  NftTrait,
  PagePreviewCard,
  RendererContext,
} from "@/components/profile-cms/site-renderer/types";

export function getPrimaryNftProfileForPage(
  page: CmsPageV1,
  context: RendererContext
): CmsNftMediaProfileV1 | undefined {
  const blockProfile = page.blocks
    .map((block) =>
      context.nftProfileMap.get(getString(block, "nft_media_profile_id") ?? "")
    )
    .find((profile): profile is CmsNftMediaProfileV1 => !!profile);

  if (blockProfile) {
    return blockProfile;
  }

  if (page.type === "nft_detail" || page.type === "card_detail") {
    const profiles = Array.from(context.nftProfileMap.values());
    return (
      getNftProfileForPageRoute(page, profiles) ??
      (profiles.length === 1 ? profiles[0] : undefined)
    );
  }

  return undefined;
}

function getNftProfileForPageRoute(
  page: CmsPageV1,
  profiles: readonly CmsNftMediaProfileV1[]
): CmsNftMediaProfileV1 | undefined {
  const routeCandidates = [page.path, page.metadata.canonical_url].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  return profiles.find((profile) =>
    routeCandidates.some((route) => routeMatchesNftProfile(route, profile))
  );
}

function routeMatchesNftProfile(
  route: string,
  profile: CmsNftMediaProfileV1
): boolean {
  const normalizedRoute = route.toLowerCase();
  if (!normalizedRoute.includes(profile.contract.toLowerCase())) {
    return false;
  }

  const routeParts = new Set(normalizedRoute.split(/[/?#&=]+/).filter(Boolean));
  return getNftRouteTokenCandidates(profile.token_id).some((candidate) =>
    routeParts.has(candidate)
  );
}

function getNftRouteTokenCandidates(tokenId: string): readonly string[] {
  const normalizedTokenId = tokenId.trim().toLowerCase();
  if (!normalizedTokenId) {
    return [];
  }

  const encodedTokenId = encodeURIComponent(normalizedTokenId).toLowerCase();
  return encodedTokenId === normalizedTokenId
    ? [normalizedTokenId]
    : [normalizedTokenId, encodedTokenId];
}

export function getNftReferenceBlock(
  page: CmsPageV1,
  profileId: string
): CmsBlockV1 | undefined {
  return page.blocks.find(
    (block) => getString(block, "nft_media_profile_id") === profileId
  );
}

export function getPreferredNftDisplayVariant(
  profile: CmsNftMediaProfileV1,
  roles: readonly CmsDisplayVariantV1["role"][]
): CmsDisplayVariantV1 | undefined {
  for (const role of roles) {
    const variant = profile.display_variants.find((item) => item.role === role);
    if (variant) {
      return variant;
    }
  }

  return profile.display_variants[0];
}

export function getOriginalNftAsset(
  context: RendererContext,
  profile: CmsNftMediaProfileV1
): CmsAssetV1 | undefined {
  const originalAsset = profile.original_asset_ids
    ?.map((assetId) => getAsset(context, assetId))
    .find((asset): asset is CmsAssetV1 => !!asset);

  if (originalAsset) {
    return originalAsset;
  }

  return profile.display_variants
    .map((variant) =>
      getAsset(context, variant.source_asset_id ?? variant.asset_id)
    )
    .find((asset): asset is CmsAssetV1 => !!asset);
}

export function getNftAssetMetadataEntries(
  context: RendererContext,
  profile: CmsNftMediaProfileV1,
  originalAsset: CmsAssetV1 | undefined,
  sourcePacket: CmsSourcePacketV1 | undefined
): readonly CmsArtInspectionMetadata[] {
  return compactMetadataEntries([
    {
      label: t(context.locale, "profileCms.provenance.chain"),
      value: formatInteger(context.locale, profile.chain_id),
    },
    {
      label: t(context.locale, "profileCms.provenance.contract"),
      value: profile.contract,
    },
    {
      label: t(context.locale, "profileCms.provenance.tokenId"),
      value: profile.token_id,
    },
    {
      href: resolveCmsUri(profile.metadata_uri) ?? undefined,
      label: t(context.locale, "profileCms.provenance.metadataUri"),
      value: profile.metadata_uri ?? "",
    },
    {
      label: t(context.locale, "profileCms.provenance.ownerSnapshot"),
      value: profile.snapshot?.owner ?? "",
    },
    {
      label: t(context.locale, "profileCms.provenance.sourceSnapshot"),
      value: formatSourceSnapshot(context.locale, sourcePacket) ?? "",
    },
    {
      href: resolveAssetUrl(originalAsset) ?? undefined,
      label: t(context.locale, "profileCms.provenance.originalMedia"),
      value: originalAsset?.uri ?? "",
    },
  ]);
}

export function getNftTraits(
  nftBlock: CmsBlockV1 | undefined,
  sourcePacket: CmsSourcePacketV1 | undefined
): NftTrait[] {
  return [
    ...parseNftTraits(getExtensionField(nftBlock, "traits")),
    ...parseNftTraits(getExtensionField(nftBlock, "attributes")),
    ...parseNftTraits(getExtensionField(sourcePacket, "traits")),
    ...parseNftTraits(getExtensionField(sourcePacket, "attributes")),
  ];
}

function getExtensionField(record: unknown, key: string): unknown {
  return isRecord(record) ? record[key] : undefined;
}

function parseNftTraits(value: unknown): NftTrait[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const label =
        getString(item, "trait_type") ??
        getString(item, "trait") ??
        getString(item, "name");
      const rawValue = item["value"];
      if (!label || rawValue === undefined || rawValue === null) {
        return null;
      }

      return {
        label,
        value:
          typeof rawValue === "string" || typeof rawValue === "number"
            ? String(rawValue)
            : JSON.stringify(rawValue),
      };
    })
    .filter((trait): trait is NftTrait => !!trait);
}

export function getNftCollectionContext(
  context: RendererContext,
  page: CmsPageV1,
  nftBlock: CmsBlockV1 | undefined
): { readonly title: string; readonly href?: string | undefined } | null {
  const collectionPage =
    context.pageMap.get(getString(nftBlock, "collection_page_id") ?? "") ??
    context.cmsPackage.payload.pages.find(
      (candidate) => candidate.type === "collection" && candidate.id !== page.id
    );
  const title =
    getString(nftBlock, "collection_title") ??
    getString(nftBlock, "collection_name") ??
    collectionPage?.metadata.title;

  if (!title) {
    return null;
  }

  const href = collectionPage
    ? getCmsPagePath(context.cmsPackage, collectionPage.id)
    : null;

  return {
    title,
    ...(href ? { href } : {}),
  };
}

export function getPageSourcePacket(
  context: RendererContext,
  page: CmsPageV1
): CmsSourcePacketV1 | undefined {
  return context.sourcePacketMap.get(page.source?.source_packet_id ?? "");
}

export function findNftDetailPage(
  context: RendererContext,
  profileId: string
): CmsPageV1 | undefined {
  return context.cmsPackage.payload.pages.find((page) =>
    page.blocks.some(
      (block) => getString(block, "nft_media_profile_id") === profileId
    )
  );
}

export function createPagePreviewCard(
  context: RendererContext,
  pageId: string
): PagePreviewCard | null {
  const page = context.pageMap.get(pageId);
  const href = getCmsPagePath(context.cmsPackage, pageId);
  if (!page || !href) {
    return null;
  }

  const asset = getPagePreviewAsset(context, page);
  const nftProfile = getPrimaryNftProfileForPage(page, context);
  const item = asset
    ? createArtInspectionItem({
        asset,
        caption: page.metadata.description,
        context,
        originalAsset: nftProfile
          ? getOriginalNftAsset(context, nftProfile)
          : undefined,
        title: page.metadata.title,
      })
    : null;

  return {
    page,
    href,
    ...(item ? { item } : {}),
  };
}

function getPagePreviewAsset(
  context: RendererContext,
  page: CmsPageV1
): CmsAssetV1 | undefined {
  const nftProfile = getPrimaryNftProfileForPage(page, context);
  if (nftProfile) {
    const gridVariant = getPreferredNftDisplayVariant(nftProfile, [
      "grid",
      "poster",
      "detail",
    ]);
    const asset =
      getAsset(context, gridVariant?.asset_id) ??
      getAsset(context, nftProfile.poster_asset_id) ??
      getOriginalNftAsset(context, nftProfile);
    if (asset) {
      return asset;
    }
  }

  const imageBlockAssetId = page.blocks
    .map(
      (block) =>
        getString(block, "asset_id") ??
        getStringArray(block, "asset_ids")[0] ??
        getStringArray(block, "featured_asset_ids")[0]
    )
    .find((assetId): assetId is string => !!assetId);

  return (
    getAsset(context, imageBlockAssetId) ??
    getAsset(context, page.metadata.social_image_asset_id)
  );
}

export function getPageTypeLabel(
  locale: SupportedLocale,
  pageType: CmsPageV1["type"]
): string {
  switch (pageType) {
    case "gallery":
      return t(locale, "profileCms.pageType.gallery");
    case "collection":
      return t(locale, "profileCms.pageType.collection");
    case "nft_detail":
      return t(locale, "profileCms.pageType.nftDetail");
    case "card_detail":
      return t(locale, "profileCms.pageType.cardDetail");
    case "room":
      return t(locale, "profileCms.pageType.room");
    case "transaction":
      return t(locale, "profileCms.pageType.transaction");
    case "post":
      return t(locale, "profileCms.pageType.post");
    case "page":
      return t(locale, "profileCms.pageType.page");
    default:
      return (pageType as string).replaceAll("_", " ");
  }
}
