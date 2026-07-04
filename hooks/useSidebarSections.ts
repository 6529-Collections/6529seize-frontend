import CollectionsMenuIcon from "@/components/common/icons/CollectionsMenuIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import {
  getAboutNavItemActivePathPrefixes,
  getAboutNavItemHref,
  getAboutNavItemLabel,
  getVisibleAboutNavGroups,
} from "@/components/about/about.routes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
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
      {
        name: t(DEFAULT_LOCALE, "navigation.primary.about"),
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
