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

const ABOUT_CONTENTS_NAV_GROUPS: readonly AboutContentsNavGroup[] = [
  {
    id: "about6529",
    labelKey: "about.contents.groups.about6529",
    items: [
      {
        section: AboutSection.FAQ,
        labelKey: "about.contents.pages.faq",
        descriptionKey: "about.contents.descriptions.faq",
      },
      {
        section: AboutSection.ENS,
        labelKey: "about.contents.pages.ens",
        descriptionKey: "about.contents.descriptions.ens",
      },
      {
        section: AboutSection.NAKAMOTO_THRESHOLD,
        labelKey: "about.contents.pages.nakamotoThreshold",
        descriptionKey: "about.contents.descriptions.nakamotoThreshold",
      },
      {
        section: AboutSection.APPLY,
        labelKey: "about.contents.pages.apply",
        descriptionKey: "about.contents.descriptions.apply",
      },
      {
        section: AboutSection.CONTACT_US,
        labelKey: "about.contents.pages.contactUs",
        descriptionKey: "about.contents.descriptions.contactUs",
      },
    ],
  },
  {
    id: "collectionsMinting",
    labelKey: "about.contents.groups.collectionsMinting",
    items: [
      {
        section: AboutSection.MEMES,
        labelKey: "about.contents.pages.aboutTheMemes",
        descriptionKey: "about.contents.descriptions.aboutTheMemes",
      },
      {
        section: AboutSection.SUBSCRIPTIONS,
        labelKey: "about.contents.pages.subscriptions",
        descriptionKey: "about.contents.descriptions.subscriptions",
        requiresVisibleSubscriptions: true,
      },
      {
        section: AboutSection.MEME_LAB,
        labelKey: "about.contents.pages.memeLab",
        descriptionKey: "about.contents.descriptions.memeLab",
      },
      {
        section: AboutSection.GRADIENTS,
        labelKey: "about.contents.pages.gradient",
        descriptionKey: "about.contents.descriptions.gradient",
      },
      {
        section: AboutSection.MINTING,
        labelKey: "about.contents.pages.minting",
        descriptionKey: "about.contents.descriptions.minting",
      },
    ],
  },
  {
    id: "networkReputation",
    labelKey: "about.contents.groups.networkReputation",
    items: [
      {
        id: "network-identities",
        href: "/network",
        labelKey: "about.contents.pages.networkIdentities",
        descriptionKey: "about.contents.descriptions.networkIdentities",
      },
      {
        id: "network-activity",
        href: "/network/activity",
        labelKey: "about.contents.pages.networkActivity",
        descriptionKey: "about.contents.descriptions.networkActivity",
      },
      {
        id: "network-groups",
        href: "/network/groups",
        labelKey: "about.contents.pages.networkGroups",
        descriptionKey: "about.contents.descriptions.networkGroups",
      },
      {
        id: "network-tdh",
        href: "/network/tdh",
        labelKey: "about.contents.pages.tdh",
        descriptionKey: "about.contents.descriptions.tdh",
      },
      {
        id: "network-xtdh",
        href: "/network/xtdh",
        labelKey: "about.contents.pages.xtdhOverview",
        descriptionKey: "about.contents.descriptions.xtdh",
      },
      {
        id: "xtdh-allocations",
        href: "/xtdh",
        labelKey: "about.contents.pages.xtdhAllocations",
        descriptionKey: "about.contents.descriptions.xtdhAllocations",
      },
      {
        id: "network-wave-score",
        href: "/network/wave-score",
        labelKey: "about.contents.pages.waveScore",
        descriptionKey: "about.contents.descriptions.waveScore",
      },
      {
        id: "rep-categories",
        href: "/rep/categories",
        labelKey: "about.contents.pages.repCategories",
        descriptionKey: "about.contents.descriptions.repCategories",
        activePathPrefixes: ["/rep/categories/"],
      },
      {
        id: "network-health",
        href: "/network/health",
        labelKey: "about.contents.pages.networkHealth",
        descriptionKey: "about.contents.descriptions.networkHealth",
      },
      {
        id: "network-definitions",
        href: "/network/definitions",
        labelKey: "about.contents.pages.networkDefinitions",
        descriptionKey: "about.contents.descriptions.networkDefinitions",
      },
      {
        id: "network-levels",
        href: "/network/levels",
        labelKey: "about.contents.pages.networkLevels",
        descriptionKey: "about.contents.descriptions.networkLevels",
      },
      {
        id: "network-tdh-stats",
        href: "/network/health/network-tdh",
        labelKey: "about.contents.pages.networkTdhStats",
        descriptionKey: "about.contents.descriptions.networkTdhStats",
      },
      {
        id: "network-nerd",
        href: "/network/nerd",
        labelKey: "about.contents.pages.networkNerd",
        descriptionKey: "about.contents.descriptions.networkNerd",
        activePathPrefixes: ["/network/nerd/"],
      },
      {
        id: "network-prenodes",
        href: "/network/prenodes",
        labelKey: "about.contents.pages.prenodes",
        descriptionKey: "about.contents.descriptions.prenodes",
      },
      {
        id: "network-tdh-historic-boosts",
        href: "/network/tdh/historic-boosts",
        labelKey: "about.contents.pages.tdhHistoricBoosts",
        descriptionKey: "about.contents.descriptions.tdhHistoricBoosts",
      },
    ],
  },
  {
    id: "delegationWallets",
    labelKey: "about.contents.groups.delegationWallets",
    items: [
      {
        section: AboutSection.GDRC1,
        labelKey: "about.contents.pages.gdrc",
        descriptionKey: "about.contents.descriptions.gdrc",
      },
      {
        section: AboutSection.NFT_DELEGATION,
        labelKey: "about.contents.pages.nftDelegation",
        descriptionKey: "about.contents.descriptions.nftDelegation",
      },
      {
        section: AboutSection.PRIMARY_ADDRESS,
        labelKey: "about.contents.pages.primaryAddress",
        descriptionKey: "about.contents.descriptions.primaryAddress",
      },
      {
        id: "delegation-center",
        href: "/delegation/delegation-center",
        labelKey: "about.contents.pages.delegationCenter",
        descriptionKey: "about.contents.descriptions.delegationCenter",
      },
      {
        id: "wallet-architecture",
        href: "/delegation/wallet-architecture",
        labelKey: "about.contents.pages.walletArchitecture",
        descriptionKey: "about.contents.descriptions.walletArchitecture",
      },
      {
        id: "delegation-faq",
        href: "/delegation/delegation-faq",
        labelKey: "about.contents.pages.delegationFaq",
        descriptionKey: "about.contents.descriptions.delegationFaq",
      },
      {
        id: "consolidation-use-cases",
        href: "/delegation/consolidation-use-cases",
        labelKey: "about.contents.pages.consolidationUseCases",
        descriptionKey: "about.contents.descriptions.consolidationUseCases",
      },
      {
        id: "wallet-checker",
        href: "/delegation/wallet-checker",
        labelKey: "about.contents.pages.walletChecker",
        descriptionKey: "about.contents.descriptions.walletChecker",
      },
      {
        id: "app-wallets",
        href: "/tools/app-wallets",
        labelKey: "about.contents.pages.appWallets",
        descriptionKey: "about.contents.descriptions.appWallets",
        activePathPrefixes: ["/tools/app-wallets/"],
        requiresAppWalletsSupported: true,
      },
    ],
  },
  {
    id: "dataDeveloperTools",
    labelKey: "about.contents.groups.dataDeveloperTools",
    items: [
      {
        section: AboutSection.TECH,
        labelKey: "about.contents.pages.tech",
        descriptionKey: "about.contents.descriptions.tech",
      },
      {
        section: AboutSection.DATA_DECENTR,
        labelKey: "about.contents.pages.dataDecentralization",
        descriptionKey: "about.contents.descriptions.dataDecentralization",
      },
      {
        id: "subscriptions-report",
        href: "/tools/subscriptions-report",
        labelKey: "about.contents.pages.subscriptionsReport",
        descriptionKey: "about.contents.descriptions.subscriptionsReport",
        requiresVisibleSubscriptions: true,
      },
      {
        id: "memes-accounting",
        href: "/meme-accounting",
        labelKey: "about.contents.pages.memesAccounting",
        descriptionKey: "about.contents.descriptions.memesAccounting",
      },
      {
        id: "memes-gas",
        href: "/meme-gas",
        labelKey: "about.contents.pages.memesGas",
        descriptionKey: "about.contents.descriptions.memesGas",
      },
      {
        id: "api",
        href: "/tools/api",
        labelKey: "about.contents.pages.api",
        descriptionKey: "about.contents.descriptions.api",
      },
      {
        id: "emma",
        href: "/emma",
        labelKey: "about.contents.pages.emma",
        descriptionKey: "about.contents.descriptions.emma",
      },
      {
        id: "block-finder",
        href: "/tools/block-finder",
        labelKey: "about.contents.pages.blockFinder",
        descriptionKey: "about.contents.descriptions.blockFinder",
      },
      {
        id: "open-data",
        href: "/open-data",
        labelKey: "about.contents.pages.openData",
        descriptionKey: "about.contents.descriptions.openData",
      },
      {
        id: "6529bot-data",
        href: "/open-data/6529bot",
        labelKey: "about.contents.pages.6529botData",
        descriptionKey: "about.contents.descriptions.6529botData",
      },
      {
        id: "network-metrics",
        href: "/open-data/network-metrics",
        labelKey: "about.contents.pages.networkMetrics",
        descriptionKey: "about.contents.descriptions.networkMetrics",
      },
      {
        id: "meme-subscriptions-data",
        href: "/open-data/meme-subscriptions",
        labelKey: "about.contents.pages.memeSubscriptionsData",
        descriptionKey: "about.contents.descriptions.memeSubscriptionsData",
        requiresVisibleSubscriptions: true,
      },
      {
        id: "rememes-data",
        href: "/open-data/rememes",
        labelKey: "about.contents.pages.rememesData",
        descriptionKey: "about.contents.descriptions.rememesData",
      },
      {
        id: "team-data",
        href: "/open-data/team",
        labelKey: "about.contents.pages.teamData",
        descriptionKey: "about.contents.descriptions.teamData",
      },
      {
        id: "royalties",
        href: "/open-data/royalties",
        labelKey: "about.contents.pages.royalties",
        descriptionKey: "about.contents.descriptions.royalties",
      },
    ],
  },
  {
    id: "legal",
    labelKey: "about.contents.groups.legal",
    items: [
      {
        section: AboutSection.LICENSE,
        labelKey: "about.contents.pages.license",
        descriptionKey: "about.contents.descriptions.license",
      },
      {
        section: AboutSection.TERMS_OF_SERVICE,
        labelKey: "about.contents.pages.termsOfService",
        descriptionKey: "about.contents.descriptions.termsOfService",
      },
      {
        section: AboutSection.PRIVACY_POLICY,
        labelKey: "about.contents.pages.privacyPolicy",
        descriptionKey: "about.contents.descriptions.privacyPolicy",
      },
      {
        section: AboutSection.COOKIE_POLICY,
        labelKey: "about.contents.pages.cookiePolicy",
        descriptionKey: "about.contents.descriptions.cookiePolicy",
      },
      {
        section: AboutSection.COPYRIGHT,
        labelKey: "about.contents.pages.copyright",
        descriptionKey: "about.contents.descriptions.copyright",
      },
    ],
  },
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
    "requiresAppWalletsSupported" in item &&
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
