import { type MessageKey, t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { AboutSection } from "@/types/enums";

export type AboutContentsGroupId =
  | "collections"
  | "delegation"
  | "network"
  | "resources"
  | "community"
  | "legal";

type AboutContentsAboutNavItem = {
  readonly section: AboutSection;
  readonly labelKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

type AboutContentsExternalNavItem = {
  readonly id: string;
  readonly href: string;
  readonly labelKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

type AboutContentsNavItem =
  | AboutContentsAboutNavItem
  | AboutContentsExternalNavItem;

type AboutContentsNavGroup = {
  readonly id: AboutContentsGroupId;
  readonly labelKey: MessageKey;
  readonly items: readonly AboutContentsNavItem[];
};

const ABOUT_CONTENTS_NAV_GROUPS: readonly AboutContentsNavGroup[] = [
  {
    id: "collections",
    labelKey: "about.contents.groups.collections",
    items: [
      {
        section: AboutSection.MEMES,
        labelKey: "about.contents.pages.theMemes",
        descriptionKey: "about.contents.descriptions.theMemes",
      },
      {
        section: AboutSection.SUBSCRIPTIONS,
        labelKey: "about.contents.pages.subscriptions",
        descriptionKey: "about.contents.descriptions.subscriptions",
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
    ],
  },
  {
    id: "delegation",
    labelKey: "about.contents.groups.delegation",
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
    ],
  },
  {
    id: "network",
    labelKey: "about.contents.groups.network",
    items: [
      {
        id: "network-tdh",
        href: "/network/tdh",
        labelKey: "about.contents.pages.tdh",
        descriptionKey: "about.contents.descriptions.tdh",
      },
      {
        id: "network-xtdh",
        href: "/network/xtdh",
        labelKey: "about.contents.pages.xtdh",
        descriptionKey: "about.contents.descriptions.xtdh",
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
    ],
  },
  {
    id: "resources",
    labelKey: "about.contents.groups.resources",
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
        section: AboutSection.MINTING,
        labelKey: "about.contents.pages.minting",
        descriptionKey: "about.contents.descriptions.minting",
      },
      {
        section: AboutSection.NAKAMOTO_THRESHOLD,
        labelKey: "about.contents.pages.nakamotoThreshold",
        descriptionKey: "about.contents.descriptions.nakamotoThreshold",
      },
      {
        section: AboutSection.LICENSE,
        labelKey: "about.contents.pages.license",
        descriptionKey: "about.contents.descriptions.license",
      },
    ],
  },
  {
    id: "community",
    labelKey: "about.contents.groups.community",
    items: [
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
    ],
  },
  {
    id: "legal",
    labelKey: "about.contents.groups.legal",
    items: [
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

const ABOUT_SECTION_LABEL_KEYS = new Map<AboutSection, MessageKey>([
  ...ABOUT_CONTENTS_NAV_ITEMS.map((item) =>
    "section" in item ? ([item.section, item.labelKey] as const) : undefined
  ).filter((item): item is readonly [AboutSection, MessageKey] => !!item),
]);

const ABOUT_SECTION_DOCUMENT_TITLE_KEYS = new Map<AboutSection, MessageKey>([
  [AboutSection.GRADIENTS, "about.contents.documentTitles.gradient"],
]);

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

export function getAboutNavGroupItems(
  groupId: AboutContentsGroupId
): readonly AboutContentsNavItem[] {
  return (
    ABOUT_CONTENTS_NAV_GROUPS.find((group) => group.id === groupId)?.items ?? []
  );
}

export function getAboutNavItemLabel(
  item: AboutContentsNavItem,
  locale: SupportedLocale
): string {
  return t(locale, item.labelKey);
}

export function getVisibleAboutNavGroups(
  hideSubscriptions: boolean
): AboutContentsNavGroup[] {
  return ABOUT_CONTENTS_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        !("section" in item) ||
        item.section !== AboutSection.SUBSCRIPTIONS ||
        !hideSubscriptions
    ),
  })).filter((group) => group.items.length > 0);
}

export function getAboutNavItemHref(item: AboutContentsNavItem): string {
  return "href" in item ? item.href : `/about/${item.section}`;
}

export function getAboutNavItemId(item: AboutContentsNavItem): string {
  return isAboutSectionNavItem(item) ? item.section : item.id;
}

export function isAboutSectionNavItem(
  item: AboutContentsNavItem
): item is AboutContentsAboutNavItem {
  return "section" in item;
}
