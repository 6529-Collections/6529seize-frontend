import CollectionsMenuIcon from "@/components/common/icons/CollectionsMenuIcon";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import {
  getAboutNavItemHref,
  getAboutNavItemLabel,
  getVisibleAboutNavGroups,
  isAboutSectionNavItem,
} from "@/components/about/about.routes";
import {
  getToolsNavItemHref,
  getToolsNavItemLabel,
  getVisibleToolsNavGroups,
} from "@/components/tools/tools.routes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  DocumentTextIcon,
  UsersIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { useMemo, type ComponentType } from "react";

function getNetworkSection(): SidebarSection {
  return {
    key: "network",
    name: "Network",
    icon: UsersIcon,
    items: [
      { name: "Identities", href: "/network" },
      { name: "Activity", href: "/network/activity" },
      { name: "Groups", href: "/network/groups" },
      { name: "NFT Activity", href: "/nft-activity" },
      { name: "Memes Calendar", href: "/meme-calendar" },
      { name: "TDH", href: "/network/tdh" },
      { name: "xTDH", href: "/xtdh" },
      { name: "Wave Score", href: "/network/wave-score" },
      { name: "REP Categories", href: "/rep/categories" },
    ],
    subsections: [
      {
        name: "Metrics",
        items: [
          { name: "Health", href: "/network/health" },
          { name: "Definitions", href: "/network/definitions" },
          { name: "Levels", href: "/network/levels" },
          { name: "Network Stats", href: "/network/health/network-tdh" },
        ],
      },
    ],
  };
}

function getCollectionsSection(): SidebarSection {
  return {
    key: "collections",
    name: "Collections",
    icon: CollectionsMenuIcon,
    items: [
      { name: "The Memes", href: "/the-memes" },
      { name: "6529 Gradient", href: "/6529-gradient" },
      { name: "NextGen", href: "/nextgen" },
      { name: "Meme Lab", href: "/meme-lab" },
      { name: "ReMemes", href: "/rememes" },
    ],
    subsections: [],
  };
}

function getToolsSection(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSection {
  const visibleToolsGroups = getVisibleToolsNavGroups({
    appWalletsSupported,
    hideSubscriptions,
  });

  return {
    key: "tools",
    name: "Tools",
    icon: WrenchIcon,
    items: [
      { name: t(DEFAULT_LOCALE, "tools.contents.pages.tools"), href: "/tools" },
    ],
    subsections: visibleToolsGroups.map((group) => ({
      name: t(DEFAULT_LOCALE, group.labelKey),
      items: group.items.map((item) => ({
        name: getToolsNavItemLabel(item, DEFAULT_LOCALE),
        href: getToolsNavItemHref(item),
      })),
    })),
  };
}

function getAboutSection(hideSubscriptions: boolean): SidebarSection {
  return {
    key: "about",
    name: "About",
    icon: DocumentTextIcon,
    items: [{ name: "About", href: "/about" }],
    subsections: getVisibleAboutNavGroups(hideSubscriptions).map((group) => ({
      name: t(DEFAULT_LOCALE, group.labelKey),
      items: group.items.map((item) => {
        const href = getAboutNavItemHref(item);

        return {
          name: getAboutNavItemLabel(item, DEFAULT_LOCALE),
          href,
          ...(isAboutSectionNavItem(item) ? {} : { activatesSection: false }),
        };
      }),
    })),
  };
}

function buildSidebarSections(
  appWalletsSupported: boolean,
  hideSubscriptions: boolean
): SidebarSection[] {
  return [
    getNetworkSection(),
    getCollectionsSection(),
    getToolsSection(appWalletsSupported, hideSubscriptions),
    getAboutSection(hideSubscriptions),
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
