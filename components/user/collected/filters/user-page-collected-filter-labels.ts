import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate, type MessageKey } from "@/i18n/messages";

const COLLECTION_LABEL_KEYS: Record<CollectedCollectionType, MessageKey> = {
  [CollectedCollectionType.MEMES]: "user.collected.filters.collection.memes",
  [CollectedCollectionType.NEXTGEN]:
    "user.collected.filters.collection.nextgen",
  [CollectedCollectionType.GRADIENTS]:
    "user.collected.filters.collection.gradients",
  [CollectedCollectionType.MEMELAB]:
    "user.collected.filters.collection.memeLab",
  [CollectedCollectionType.NETWORK]:
    "user.collected.filters.collection.network",
};

const SORT_LABEL_KEYS: Record<CollectionSort, MessageKey> = {
  [CollectionSort.TOKEN_ID]: "user.collected.filters.sort.tokenId",
  [CollectionSort.TDH]: "user.collected.filters.sort.tdh",
  [CollectionSort.RANK]: "user.collected.filters.sort.rank",
  [CollectionSort.XTDH]: "user.collected.filters.sort.xtdh",
  [CollectionSort.XTDH_DAY]: "user.collected.filters.sort.xtdhDay",
};

const SEIZED_LABEL_KEYS: Record<CollectionSeized, MessageKey> = {
  [CollectionSeized.SEIZED]: "user.collected.filters.seized.seized",
  [CollectionSeized.NOT_SEIZED]: "user.collected.filters.seized.notSeized",
};

export const getCollectedFilterMessage = (
  key: MessageKey,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => translate(locale, key);

export const getCollectedCollectionLabel = (
  collection: CollectedCollectionType,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => translate(locale, COLLECTION_LABEL_KEYS[collection]);

export const getCollectedSortLabel = (
  sort: CollectionSort,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => translate(locale, SORT_LABEL_KEYS[sort]);

export const getCollectedSeizedLabel = (
  seized: CollectionSeized,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => translate(locale, SEIZED_LABEL_KEYS[seized]);
