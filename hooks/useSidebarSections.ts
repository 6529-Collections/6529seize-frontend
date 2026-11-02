import CollectionsMenuIcon from "@/components/common/icons/CollectionsMenuIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { explainedNavItem } from "@/components/navigation/explainedNavEntry";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import {
  getAboutNavItemActivePathPrefixes,
  getAboutNavItemHref,
  getAboutNavItemLabel,
  getVisibleAboutNavGroups,
} from "@/components/about/about.routes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  BuildingLibraryIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useMemo, type ComponentType } from "react";

type SidebarSubsection = NonNullable<SidebarSection["subsections"]>[number];
type SidebarNavItem = SidebarSubsection["items"][number];

function mapAboutNavItemToSidebarItem(
  item: ReturnType<typeof getVisibleAboutNavGroups>[number]["items"][number]
): SidebarNavItem {
  const activePathPrefixes = getAboutNavItemActivePathPrefixes(item);
  const sidebarItem = {
    name: getAboutNavItemLabel(item, DEFAULT_LOCALE),
    href: getAboutNavItemHref(item),
  };

  return activePathPrefixes === undefined
    ? sidebarItem
    : { ...sidebarItem, activePathPrefixes };
}

function mapAboutNavGroupToSubsection(
  group: ReturnType<typeof getVisibleAboutNavGroups>[number]
): SidebarSubsection {
  return {
    name: t(DEFAULT_LOCALE, group.labelKey),
    items: group.items.map(mapAboutNavItemToSidebarItem),
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

function getMuseumSection(): SidebarSection {
  return {
    key: "museum",
    name: t(DEFAULT_LOCALE, "navigation.primary.museum"),
    icon: BuildingLibraryIcon,
    items: [
      {
        name: t(DEFAULT_LOCALE, "navigation.primary.museum"),
        href: "/museum/network",
        activePathPrefixes: ["/museum/network/"],
      },
    ],
    subsections: [],
  };
}

// NFTs rows that also stay active on their nested pages, in menu order.
const NFT_SECTION_ROUTES: ReadonlyArray<readonly [MessageKey, string]> = [
  ["collect.menuLabel", "/collect"],
  ["navigation.nfts.theMemes", "/the-memes"],
  ["navigation.nfts.gradient", "/6529-gradient"],
  ["navigation.nfts.nextGen", "/nextgen"],
  ["navigation.nfts.memeLab", "/meme-lab"],
  ["navigation.nfts.rememes", "/rememes"],
  ["navigation.nfts.stream", "/stream"],
];

function getNftsSection(): SidebarSection {
  return {
    key: "nfts",
    name: t(DEFAULT_LOCALE, "navigation.primary.nfts"),
    icon: CollectionsMenuIcon,
    items: [
      ...NFT_SECTION_ROUTES.map(([nameKey, href]) => ({
        name: t(DEFAULT_LOCALE, nameKey),
        href,
        activePathPrefixes: [`${href}/`],
      })),
      {
        name: t(DEFAULT_LOCALE, "navigation.nfts.activity"),
        href: "/nft-activity",
      },
      {
        name: t(DEFAULT_LOCALE, "navigation.nfts.memesCalendar"),
        href: "/meme-calendar",
      },
    ],
    subsections: [],
  };
}

function getAboutSection(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSection {
  const aboutGroups = getVisibleAboutNavGroups({
    hideSubscriptions,
    appWalletsSupported,
  });

  return {
    key: "about",
    name: t(DEFAULT_LOCALE, "navigation.primary.about"),
    icon: DocumentTextIcon,
    items: [
      explainedNavItem(),
      {
        name: t(DEFAULT_LOCALE, "navigation.about.overview"),
        href: "/about",
        activePathPrefixes: ["/about/"],
      },
    ],
    subsections: aboutGroups.map(mapAboutNavGroupToSubsection),
  };
}

function buildSidebarSections(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSection[] {
  return [
    getNftsSection(),
    getMuseumSection(),
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
    () =>
      buildSidebarSections(appWalletsSupported, hideSubscriptions),
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
