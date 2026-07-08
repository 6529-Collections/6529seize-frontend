import { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
import {
  type ApiGroupOwnsNft,
  ApiGroupOwnsNftNameEnum,
} from "@/generated/models/ApiGroupOwnsNft";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE =
  ApiGroupNftOwnershipMatchMode.AllTokens;

export const getGroupNftOwnershipMatchMode = (
  nft: Pick<ApiGroupOwnsNft, "match_mode"> | null | undefined
): ApiGroupNftOwnershipMatchMode =>
  nft?.match_mode ?? DEFAULT_GROUP_NFT_OWNERSHIP_MATCH_MODE;

export const withDefaultGroupNftOwnershipMatchMode = (
  nft: ApiGroupOwnsNft
): ApiGroupOwnsNft => ({
  ...nft,
  match_mode: getGroupNftOwnershipMatchMode(nft),
});

export const normalizeGroupNftOwnerships = (
  nfts: ApiGroupOwnsNft[]
): ApiGroupOwnsNft[] => nfts.map(withDefaultGroupNftOwnershipMatchMode);

export const getGroupNftOwnershipCollectionLabel = (
  name: ApiGroupOwnsNftNameEnum,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => {
  switch (name) {
    case ApiGroupOwnsNftNameEnum.Gradients:
      return t(locale, "groups.nftOwnership.collection.gradients");
    case ApiGroupOwnsNftNameEnum.Memelab:
      return t(locale, "groups.nftOwnership.collection.memelab");
    case ApiGroupOwnsNftNameEnum.Memes:
      return t(locale, "groups.nftOwnership.collection.memes");
    case ApiGroupOwnsNftNameEnum.Nextgen:
      return t(locale, "groups.nftOwnership.collection.nextgen");
  }
};

export const getGroupNftOwnershipMatchModeLabel = (
  matchMode: ApiGroupNftOwnershipMatchMode,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => {
  switch (matchMode) {
    case ApiGroupNftOwnershipMatchMode.AnyToken:
      return t(locale, "groups.nftOwnership.matchMode.any");
    case ApiGroupNftOwnershipMatchMode.AllTokens:
      return t(locale, "groups.nftOwnership.matchMode.all");
  }
};

export const getGroupNftOwnershipCardSummary = (
  nft: ApiGroupOwnsNft,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => {
  const collection = getGroupNftOwnershipCollectionLabel(nft.name, locale);
  if (nft.tokens.length === 0) {
    return t(locale, "groups.nftOwnership.card.anyCollectionToken", {
      collection,
    });
  }

  const key =
    getGroupNftOwnershipMatchMode(nft) ===
    ApiGroupNftOwnershipMatchMode.AnyToken
      ? "groups.nftOwnership.card.anySelected"
      : "groups.nftOwnership.card.allSelected";

  return t(locale, key, {
    collection,
    count: formatInteger(locale, nft.tokens.length),
  });
};
