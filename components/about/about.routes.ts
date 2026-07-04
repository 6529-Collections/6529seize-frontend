import { type MessageKey, t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { AboutSection } from "@/types/enums";

type AboutContentsGroupId =
  | "about6529"
  | "collectionsMinting"
  | "networkReputation"
  | "delegationWallets"
  | "dataDeveloperTools"
  | "legal";

type AboutContentsAboutNavItem = {
  readonly section: AboutSection;
  readonly labelKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly requiresVisibleSubscriptions?: true | undefined;
  readonly requiresAppWalletsSupported?: never;
};

type AboutContentsExternalNavItem = {
  readonly id: string;
  readonly href: string;
  readonly labelKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly activePathPrefixes?: readonly string[] | undefined;
  readonly requiresVisibleSubscriptions?: true | undefined;
  readonly requiresAppWalletsSupported?: true | undefined;
};

type AboutContentsNavItem =
  | AboutContentsAboutNavItem
  | AboutContentsExternalNavItem;

type AboutContentsNavGroup = {
  readonly id: AboutContentsGroupId;
  readonly labelKey: MessageKey;
  readonly items: readonly AboutContentsNavItem[];
};

type AboutNavVisibilityOptions = {
  readonly hideSubscriptions: boolean;
  readonly appWalletsSupported?: boolean | undefined;
};

type AboutSectionItemOptions = {
  readonly descriptionId?: string | undefined;
  readonly requiresVisibleSubscriptions?: true | undefined;
};

type AboutRouteItemOptions = AboutSectionItemOptions & {
  readonly activePathPrefixes?: readonly string[] | undefined;
  readonly requiresAppWalletsSupported?: true | undefined;
};

function aboutGroup(
  id: AboutContentsGroupId,
  items: readonly AboutContentsNavItem[]
): AboutContentsNavGroup {
  return {
    id,
    labelKey: `about.contents.groups.${id}` as MessageKey,
    items,
  };
}

function aboutPageKey(pageId: string): MessageKey {
  return `about.contents.pages.${pageId}` as MessageKey;
}

function aboutDescriptionKey(descriptionId: string): MessageKey {
  return `about.contents.descriptions.${descriptionId}` as MessageKey;
}

function aboutSectionItem(
  section: AboutSection,
  pageId: string,
  options: AboutSectionItemOptions = {}
): AboutContentsAboutNavItem {
  return {
    section,
    labelKey: aboutPageKey(pageId),
    descriptionKey: aboutDescriptionKey(options.descriptionId ?? pageId),
    requiresVisibleSubscriptions: options.requiresVisibleSubscriptions,
  };
}

function aboutRouteItem(
  id: string,
  href: string,
  pageId: string,
  options: AboutRouteItemOptions = {}
): AboutContentsExternalNavItem {
  return {
    id,
    href,
    labelKey: aboutPageKey(pageId),
    descriptionKey: aboutDescriptionKey(options.descriptionId ?? pageId),
    activePathPrefixes: options.activePathPrefixes,
    requiresVisibleSubscriptions: options.requiresVisibleSubscriptions,
    requiresAppWalletsSupported: options.requiresAppWalletsSupported,
  };
}

const ABOUT_CONTENTS_NAV_GROUPS: readonly AboutContentsNavGroup[] = [
  aboutGroup("about6529", [
    aboutSectionItem(AboutSection.FAQ, "faq"),
    aboutSectionItem(AboutSection.ENS, "ens"),
    aboutSectionItem(AboutSection.NAKAMOTO_THRESHOLD, "nakamotoThreshold"),
    aboutSectionItem(AboutSection.APPLY, "apply"),
    aboutSectionItem(AboutSection.CONTACT_US, "contactUs"),
  ]),
  aboutGroup("collectionsMinting", [
    aboutSectionItem(AboutSection.MEMES, "aboutTheMemes"),
    aboutSectionItem(AboutSection.SUBSCRIPTIONS, "subscriptions", {
      requiresVisibleSubscriptions: true,
    }),
    aboutSectionItem(AboutSection.MEME_LAB, "memeLab"),
    aboutSectionItem(AboutSection.GRADIENTS, "gradient"),
    aboutSectionItem(AboutSection.MINTING, "minting"),
  ]),
  aboutGroup("networkReputation", [
    aboutRouteItem("network-identities", "/network", "networkIdentities"),
    aboutRouteItem("network-activity", "/network/activity", "networkActivity"),
    aboutRouteItem("network-groups", "/network/groups", "networkGroups"),
    aboutRouteItem("network-tdh", "/network/tdh", "tdh"),
    aboutRouteItem("network-xtdh", "/network/xtdh", "xtdhOverview", {
      descriptionId: "xtdh",
    }),
    aboutRouteItem("xtdh-allocations", "/xtdh", "xtdhAllocations"),
    aboutRouteItem("network-wave-score", "/network/wave-score", "waveScore"),
    aboutRouteItem("rep-categories", "/rep/categories", "repCategories", {
      activePathPrefixes: ["/rep/categories/"],
    }),
    aboutRouteItem("network-health", "/network/health", "networkHealth"),
    aboutRouteItem(
      "network-definitions",
      "/network/definitions",
      "networkDefinitions"
    ),
    aboutRouteItem("network-levels", "/network/levels", "networkLevels"),
    aboutRouteItem(
      "network-tdh-stats",
      "/network/health/network-tdh",
      "networkTdhStats"
    ),
    aboutRouteItem("network-nerd", "/network/nerd", "networkNerd", {
      activePathPrefixes: ["/network/nerd/"],
    }),
    aboutRouteItem("network-prenodes", "/network/prenodes", "prenodes"),
    aboutRouteItem(
      "network-tdh-historic-boosts",
      "/network/tdh/historic-boosts",
      "tdhHistoricBoosts"
    ),
  ]),
  aboutGroup("delegationWallets", [
    aboutSectionItem(AboutSection.GDRC1, "gdrc"),
    aboutSectionItem(AboutSection.NFT_DELEGATION, "nftDelegation"),
    aboutSectionItem(AboutSection.PRIMARY_ADDRESS, "primaryAddress"),
    aboutRouteItem(
      "delegation-center",
      "/delegation/delegation-center",
      "delegationCenter"
    ),
    aboutRouteItem(
      "wallet-architecture",
      "/delegation/wallet-architecture",
      "walletArchitecture"
    ),
    aboutRouteItem(
      "delegation-faq",
      "/delegation/delegation-faq",
      "delegationFaq"
    ),
    aboutRouteItem(
      "consolidation-use-cases",
      "/delegation/consolidation-use-cases",
      "consolidationUseCases"
    ),
    aboutRouteItem(
      "wallet-checker",
      "/delegation/wallet-checker",
      "walletChecker"
    ),
    aboutRouteItem("app-wallets", "/tools/app-wallets", "appWallets", {
      activePathPrefixes: ["/tools/app-wallets/"],
      requiresAppWalletsSupported: true,
    }),
  ]),
  aboutGroup("dataDeveloperTools", [
    aboutSectionItem(AboutSection.TECH, "tech"),
    aboutSectionItem(AboutSection.DATA_DECENTR, "dataDecentralization"),
    aboutRouteItem(
      "subscriptions-report",
      "/tools/subscriptions-report",
      "subscriptionsReport",
      { requiresVisibleSubscriptions: true }
    ),
    aboutRouteItem("memes-accounting", "/meme-accounting", "memesAccounting"),
    aboutRouteItem("memes-gas", "/meme-gas", "memesGas"),
    aboutRouteItem("api", "/tools/api", "api"),
    aboutRouteItem("emma", "/emma", "emma"),
    aboutRouteItem("block-finder", "/tools/block-finder", "blockFinder"),
    aboutRouteItem("open-data", "/open-data", "openData"),
    aboutRouteItem("6529bot-data", "/open-data/6529bot", "6529botData"),
    aboutRouteItem(
      "network-metrics",
      "/open-data/network-metrics",
      "networkMetrics"
    ),
    aboutRouteItem(
      "meme-subscriptions-data",
      "/open-data/meme-subscriptions",
      "memeSubscriptionsData",
      { requiresVisibleSubscriptions: true }
    ),
    aboutRouteItem("rememes-data", "/open-data/rememes", "rememesData"),
    aboutRouteItem("team-data", "/open-data/team", "teamData"),
    aboutRouteItem("royalties", "/open-data/royalties", "royalties"),
  ]),
  aboutGroup("legal", [
    aboutSectionItem(AboutSection.LICENSE, "license"),
    aboutSectionItem(AboutSection.TERMS_OF_SERVICE, "termsOfService"),
    aboutSectionItem(AboutSection.PRIVACY_POLICY, "privacyPolicy"),
    aboutSectionItem(AboutSection.COOKIE_POLICY, "cookiePolicy"),
    aboutSectionItem(AboutSection.COPYRIGHT, "copyright"),
  ]),
] as const;

const ABOUT_CONTENTS_NAV_ITEMS = ABOUT_CONTENTS_NAV_GROUPS.flatMap(
  (group) => group.items
);

const ABOUT_SECTION_LABEL_KEYS = new Map<AboutSection, MessageKey>(
  ABOUT_CONTENTS_NAV_ITEMS.flatMap((item) =>
    "section" in item ? [[item.section, item.labelKey] as const] : []
  )
);

const ABOUT_SECTION_DOCUMENT_TITLE_KEYS = new Map<AboutSection, MessageKey>([
  [AboutSection.GRADIENTS, "about.contents.documentTitles.gradient"],
]);

function normalizeVisibilityOptions(
  options: AboutNavVisibilityOptions | boolean
): Required<AboutNavVisibilityOptions> {
  if (typeof options === "boolean") {
    return {
      hideSubscriptions: options,
      appWalletsSupported: false,
    };
  }

  return {
    hideSubscriptions: options.hideSubscriptions,
    appWalletsSupported: options.appWalletsSupported ?? false,
  };
}

function isAboutNavItemVisible(
  item: AboutContentsNavItem,
  options: Required<AboutNavVisibilityOptions>
): boolean {
  if (item.requiresVisibleSubscriptions === true && options.hideSubscriptions) {
    return false;
  }

  if (
    item.requiresAppWalletsSupported === true &&
    !options.appWalletsSupported
  ) {
    return false;
  }

  return true;
}

export function getAboutSectionLabel(
  section: AboutSection | undefined,
  locale: SupportedLocale
): string {
  if (section === undefined) {
    return t(locale, "about.contents.aboutFallback");
  }

  const labelKey = ABOUT_SECTION_LABEL_KEYS.get(section);

  if (labelKey !== undefined) {
    return t(locale, labelKey);
  }

  return t(locale, "about.contents.aboutFallback");
}

export function getAboutSectionDocumentTitle(
  section: AboutSection | undefined,
  locale: SupportedLocale
): string {
  if (section === undefined) {
    return getAboutSectionLabel(section, locale);
  }

  const titleKey = ABOUT_SECTION_DOCUMENT_TITLE_KEYS.get(section);

  if (titleKey !== undefined) {
    return t(locale, titleKey);
  }

  return getAboutSectionLabel(section, locale);
}

export function getAboutNavItemLabel(
  item: AboutContentsNavItem,
  locale: SupportedLocale
): string {
  return t(locale, item.labelKey);
}

export function getVisibleAboutNavGroups(
  options: AboutNavVisibilityOptions | boolean
): AboutContentsNavGroup[] {
  const visibilityOptions = normalizeVisibilityOptions(options);

  return ABOUT_CONTENTS_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      isAboutNavItemVisible(item, visibilityOptions)
    ),
  })).filter((group) => group.items.length > 0);
}

export function getAboutNavItemHref(item: AboutContentsNavItem): string {
  return "href" in item ? item.href : `/about/${item.section}`;
}

export function getAboutNavItemActivePathPrefixes(
  item: AboutContentsNavItem
): readonly string[] | undefined {
  return "href" in item ? item.activePathPrefixes : undefined;
}

export function getAboutNavItemId(item: AboutContentsNavItem): string {
  return isAboutSectionNavItem(item) ? item.section : item.id;
}

export function isAboutSectionNavItem(
  item: AboutContentsNavItem
): item is AboutContentsAboutNavItem {
  return "section" in item;
}
