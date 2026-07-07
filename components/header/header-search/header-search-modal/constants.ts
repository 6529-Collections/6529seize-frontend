import UserPlusIcon from "@heroicons/react/24/outline/UserPlusIcon";

import BellIcon from "@/components/common/icons/BellIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import HomeIcon from "@/components/common/icons/HomeIcon";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { SidebarPageEntry } from "@/hooks/useSidebarSections";

import type { NFTSearchResult } from "../HeaderSearchModalItem";

export enum STATE {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  ERROR = "ERROR",
  NO_RESULTS = "NO_RESULTS",
  SUCCESS = "SUCCESS",
}

export enum SEARCH_MODE {
  WAVE = "WAVE",
  SITE = "SITE",
}

export enum CATEGORY {
  ALL = "ALL",
  PROFILES = "PROFILES",
  NFTS = "NFTS",
  WAVES = "WAVES",
  PAGES = "PAGES",
}

export type FilterableCategory = Exclude<CATEGORY, CATEGORY.ALL>;

export const FILTERABLE_CATEGORIES: FilterableCategory[] = [
  CATEGORY.PAGES,
  CATEGORY.NFTS,
  CATEGORY.PROFILES,
  CATEGORY.WAVES,
];

export const isFilterableCategory = (
  category: CATEGORY
): category is FilterableCategory => category !== CATEGORY.ALL;

export const HEADER_SEARCH_LABELS = {
  about: t(DEFAULT_LOCALE, "navigation.primary.about"),
  account: t(DEFAULT_LOCALE, "navigation.section.account"),
  developerOpenData: t(
    DEFAULT_LOCALE,
    "navigation.subsection.developerOpenData"
  ),
  dms: t(DEFAULT_LOCALE, "navigation.primary.dms"),
  home: t(DEFAULT_LOCALE, "navigation.primary.home"),
  join6529: t(DEFAULT_LOCALE, "navigation.primary.join6529"),
  main: t(DEFAULT_LOCALE, "navigation.section.main"),
  networkData: t(DEFAULT_LOCALE, "navigation.subsection.networkData"),
  nfts: t(DEFAULT_LOCALE, "navigation.primary.nfts"),
  notifications: t(DEFAULT_LOCALE, "navigation.account.notifications"),
  utility: t(DEFAULT_LOCALE, "navigation.section.utility"),
  waves: t(DEFAULT_LOCALE, "navigation.primary.waves"),
} as const;

export const CATEGORY_LABELS: Record<FilterableCategory, string> = {
  [CATEGORY.PAGES]: "Pages",
  [CATEGORY.PROFILES]: "Profiles",
  [CATEGORY.NFTS]: HEADER_SEARCH_LABELS.nfts,
  [CATEGORY.WAVES]: HEADER_SEARCH_LABELS.waves,
};

export const CATEGORY_PREVIEW_LIMIT = 3;

export const DIRECT_NAVIGATION_PAGES: SidebarPageEntry[] = [
  {
    name: HEADER_SEARCH_LABELS.dms,
    href: "/messages",
    section: HEADER_SEARCH_LABELS.main,
    icon: ChatBubbleIcon,
  },
  {
    name: HEADER_SEARCH_LABELS.join6529,
    href: "/join",
    section: HEADER_SEARCH_LABELS.main,
    icon: UserPlusIcon,
  },
];

export const SEARCH_ONLY_PAGES: SidebarPageEntry[] = [
  {
    name: HEADER_SEARCH_LABELS.home,
    href: "/",
    section: HEADER_SEARCH_LABELS.utility,
    icon: HomeIcon,
  },
  {
    name: HEADER_SEARCH_LABELS.notifications,
    href: "/notifications",
    section: HEADER_SEARCH_LABELS.account,
    icon: BellIcon,
  },
];

export const MIN_SEARCH_LENGTH = 3;
export const NFT_SEARCH_MIN_LENGTH = 3;
export const HEADER_SEARCH_RESULTS_PANEL_ID = "header-search-results-panel";
export const EMPTY_PROFILE_RESULTS: CommunityMemberMinimal[] = [];
export const EMPTY_NFT_RESULTS: NFTSearchResult[] = [];
