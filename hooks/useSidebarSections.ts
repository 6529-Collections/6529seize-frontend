import CollectionsMenuIcon from "@/components/common/icons/CollectionsMenuIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import {
  getAboutNavItemHref,
  getAboutNavItemLabel,
  getVisibleAboutNavGroups,
} from "@/components/about/about.routes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useMemo, type ComponentType } from "react";

type SidebarSubsection = NonNullable<SidebarSection["subsections"]>[number];

function mapAboutNavGroupToSubsection(
  group: ReturnType<typeof getVisibleAboutNavGroups>[number]
): SidebarSubsection {
  return {
    name: t(DEFAULT_LOCALE, group.labelKey),
    items: group.items.map((item) => ({
      name: getAboutNavItemLabel(item, DEFAULT_LOCALE),
      href: getAboutNavItemHref(item),
    })),
  };
}

function getWavesSection(): SidebarSection {
  return {
    key: "waves",
    name: t(DEFAULT_LOCALE, "navigation.primary.waves"),
    icon: WavesIcon,
    items: [
      {
        name: t(DEFAULT_LOCALE, "navigation.primary.waves"),
        href: "/waves",
        activePathPrefixes: ["/waves/"],
      },
      {
        name: t(DEFAULT_LOCALE, "navigation.waves.discover"),
        href: "/discover",
      },
    ],
    subsections: [],
  };
}

function getNftsSection(): SidebarSection {
  return {
    key: "nfts",
    name: t(DEFAULT_LOCALE, "navigation.primary.nfts"),
    icon: CollectionsMenuIcon,
    items: [
      {
        name: "The Memes",
        href: "/the-memes",
        activePathPrefixes: ["/the-memes/"],
      },
      {
        name: "6529 Gradient",
        href: "/6529-gradient",
        activePathPrefixes: ["/6529-gradient/"],
      },
      {
        name: "NextGen",
        href: "/nextgen",
        activePathPrefixes: ["/nextgen/"],
      },
      {
        name: "Meme Lab",
        href: "/meme-lab",
        activePathPrefixes: ["/meme-lab/"],
      },
      {
        name: "ReMemes",
        href: "/rememes",
        activePathPrefixes: ["/rememes/"],
      },
      { name: "NFT Activity", href: "/nft-activity" },
      { name: "Memes Calendar", href: "/meme-calendar" },
    ],
    subsections: [],
  };
}

function getAboutMovedSubsections(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSubsection[] {
  return [
    {
      name: t(DEFAULT_LOCALE, "navigation.subsection.networkPeople"),
      items: [
        { name: "Identities", href: "/network" },
        { name: "Activity", href: "/network/activity" },
        { name: "Groups", href: "/network/groups" },
      ],
    },
    {
      name: t(DEFAULT_LOCALE, "navigation.subsection.networkData"),
      items: [
        {
          name: "TDH",
          href: "/network/tdh",
          activePathPrefixes: ["/network/tdh/"],
        },
        { name: "xTDH", href: "/xtdh" },
        { name: "Wave Score", href: "/network/wave-score" },
        {
          name: "REP Categories",
          href: "/rep/categories",
          activePathPrefixes: ["/rep/categories/"],
        },
        { name: "Health", href: "/network/health" },
        { name: "Definitions", href: "/network/definitions" },
        { name: "Levels", href: "/network/levels" },
        { name: "Network Stats", href: "/network/health/network-tdh" },
      ],
    },
    {
      name: t(DEFAULT_LOCALE, "navigation.subsection.nftReportingTools"),
      items: [
        ...(hideSubscriptions
          ? []
          : [
              {
                name: "Subscriptions Report",
                href: "/tools/subscriptions-report",
              },
            ]),
        { name: "Memes Accounting", href: "/meme-accounting" },
        { name: "Memes Gas", href: "/meme-gas" },
        ...(appWalletsSupported
          ? [
              {
                name: "App Wallets",
                href: "/tools/app-wallets",
                activePathPrefixes: ["/tools/app-wallets/"],
              },
            ]
          : []),
      ],
    },
    {
      name: t(DEFAULT_LOCALE, "navigation.subsection.developerOpenData"),
      items: [
        { name: "API", href: "/tools/api" },
        { name: "EMMA", href: "/emma" },
        { name: "Block Finder", href: "/tools/block-finder" },
        { name: "Open Data", href: "/open-data" },
        { name: "6529bot Data", href: "/open-data/6529bot" },
        { name: "Network Metrics", href: "/open-data/network-metrics" },
        ...(hideSubscriptions
          ? []
          : [
              {
                name: "Meme Subscriptions",
                href: "/open-data/meme-subscriptions",
              },
            ]),
        { name: "Rememes", href: "/open-data/rememes" },
        { name: "Team", href: "/open-data/team" },
        { name: "Royalties", href: "/open-data/royalties" },
      ],
    },
  ];
}

function getAboutSection(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSection {
  const aboutGroups = getVisibleAboutNavGroups(hideSubscriptions);
  const aboutGroupById = new Map(aboutGroups.map((group) => [group.id, group]));
  const collectionsGroup = aboutGroupById.get("collections");
  const delegationGroup = aboutGroupById.get("delegation");
  const resourcesGroup = aboutGroupById.get("resources");
  const communityGroup = aboutGroupById.get("community");
  const legalGroup = aboutGroupById.get("legal");
  const movedSubsections = getAboutMovedSubsections(
    appWalletsSupported,
    hideSubscriptions
  );

  return {
    key: "about",
    name: t(DEFAULT_LOCALE, "navigation.primary.about"),
    icon: DocumentTextIcon,
    items: [
      {
        name: t(DEFAULT_LOCALE, "navigation.primary.about"),
        href: "/about",
        activePathPrefixes: ["/about/"],
      },
    ],
    subsections: [
      ...(collectionsGroup
        ? [mapAboutNavGroupToSubsection(collectionsGroup)]
        : []),
      ...movedSubsections.slice(0, 2),
      ...(delegationGroup
        ? [
            {
              name: t(DEFAULT_LOCALE, delegationGroup.labelKey),
              items: [
                ...delegationGroup.items.map((item) => ({
                  name: getAboutNavItemLabel(item, DEFAULT_LOCALE),
                  href: getAboutNavItemHref(item),
                })),
                {
                  name: "Delegation Center",
                  href: "/delegation/delegation-center",
                },
                {
                  name: "Wallet Architecture",
                  href: "/delegation/wallet-architecture",
                },
                { name: "Delegation FAQ", href: "/delegation/delegation-faq" },
                {
                  name: "Consolidation Use Cases",
                  href: "/delegation/consolidation-use-cases",
                },
                { name: "Wallet Checker", href: "/delegation/wallet-checker" },
              ],
            },
          ]
        : []),
      ...movedSubsections.slice(2),
      ...(resourcesGroup ? [mapAboutNavGroupToSubsection(resourcesGroup)] : []),
      ...(communityGroup ? [mapAboutNavGroupToSubsection(communityGroup)] : []),
      ...(legalGroup ? [mapAboutNavGroupToSubsection(legalGroup)] : []),
    ],
  };
}

function buildSidebarSections(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSection[] {
  return [
    getNftsSection(),
    getWavesSection(),
    getAboutSection(appWalletsSupported, hideSubscriptions),
  ];
}

export function useSidebarSections(
  appWalletsSupported: boolean,
  isIos: boolean,
  country: string | null
): SidebarSection[] {
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });

  return useMemo(
    () => buildSidebarSections(appWalletsSupported, hideSubscriptions),
    [appWalletsSupported, hideSubscriptions]
  );
}

export function useSectionMap(sections: SidebarSection[]) {
  return useMemo(
    () => new Map(sections.map((section) => [section.key, section])),
    [sections]
  );
}

export interface SidebarPageEntry {
  name: string;
  href: string;
  section: string;
  subsection?: string | undefined;
  icon?: ComponentType<{ className?: string | undefined }> | undefined;
}

export function mapSidebarSectionsToPages(
  sections: SidebarSection[]
): SidebarPageEntry[] {
  return sections.flatMap((section) => {
    const sectionIcon = section.icon;
    const sectionItems: SidebarPageEntry[] = section.items.map((item) => ({
      name: item.name,
      href: item.href,
      section: section.name,
      icon: sectionIcon,
    }));

    const subsectionItems =
      section.subsections?.flatMap((subsection) =>
        subsection.items.map((item) => ({
          name: item.name,
          href: item.href,
          section: section.name,
          subsection: subsection.name,
          icon: sectionIcon,
        }))
      ) ?? [];

    return [...sectionItems, ...subsectionItems];
  });
}
