"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { type UseSidebarStateReturn } from "@/hooks/useSidebarState";
import {
  type NavItem,
  type SidebarSection,
} from "@/components/navigation/navTypes";
import { AboutSection } from "@/enums";
import CollectionsSubmenu from "./CollectionsSubmenu";
// Import the same icons used in BottomNavigation
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import Squares2X2Icon from "@/components/common/icons/Squares2X2Icon";
import BellIcon from "@/components/common/icons/BellIcon";
import UsersIcon from "@/components/common/icons/UsersIcon";
import {
  UserIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import DesktopSidebarNavItem from "./nav/DesktopSidebarNavItem";
import DesktopSidebarExpandableItem from "./nav/DesktopSidebarExpandableItem";

//

interface DesktopSidebarNavProps {
  sidebarState: UseSidebarStateReturn;
}

function DesktopSidebarNav({ sidebarState }: DesktopSidebarNavProps) {
  const pathname = usePathname();
  const { showWaves } = useAuth();
  const { address } = useSeizeConnectContext();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  }, []);

  // Auto-open collections submenu when on a collections page
  useEffect(() => {
    const collectionsPages = [
      "/the-memes",
      "/meme-lab",
      "/gradients",
      "/6529-gradient",
      "/nextgen",
    ];
    if (collectionsPages.some((page) => pathname?.startsWith(page))) {
      sidebarState.openCollectionsSubmenu();
    }
  }, [pathname, sidebarState]);

  const navigation: NavItem[] = useMemo(
    () => [
      {
        kind: "route",
        name: "Home",
        href: "/",
        icon: "home",
        iconComponent: HomeIcon,
      },
      ...(showWaves
        ? [
            {
              kind: "view" as const,
              name: "Waves",
              viewKey: "waves" as const,
              icon: "waves",
              iconComponent: WavesIcon,
              iconSizeClass: "tw-size-6",
            },
          ]
        : []),
      {
        kind: "route",
        name: "Messages",
        href: "/messages",
        icon: "messages",
        iconComponent: ChatBubbleIcon,
      },
      {
        kind: "route",
        name: "Notifications",
        href: "/notifications",
        icon: "notifications",
        iconComponent: BellIcon,
      },
      {
        kind: "action" as const,
        name: "Collections",
        action: sidebarState.handleCollectionsClick,
        icon: "collections",
        iconComponent: Squares2X2Icon,
      },
      {
        kind: "route",
        name: "Community",
        href: "/network",
        icon: "network",
        iconComponent: UsersIcon,
      },
      ...(address
        ? [
            {
              kind: "route" as const,
              name: "Profile",
              href: `/${address}`,
              icon: "profile",
              iconComponent: UserIcon,
            },
          ]
        : []),
    ],
    [showWaves, address, sidebarState.handleCollectionsClick]
  );

  // Sidebar expandable sections
  const expandableSections: SidebarSection[] = useMemo(
    () => [
      {
        key: "tools",
        name: "Tools",
        icon: WrenchScrewdriverIcon,
        items: [
          { name: "API", href: "/tools/api" },
          { name: "EMMA", href: "/emma" },
          { name: "Block Finder", href: "/meme-blocks" },
          { name: "Open Data", href: "/open-data" },
        ],
        subsections: [
          {
            name: "NFT Delegation",
            items: [
              {
                name: "Delegation Center",
                href: "/delegation/delegation-center",
              },
              {
                name: "Wallet Architecture",
                href: "/delegation/wallet-architecture",
              },
              { name: "Delegation FAQs", href: "/delegation/delegation-faq" },
              {
                name: "Consolidation Use Cases",
                href: "/delegation/consolidation-use-cases",
              },
              { name: "Wallet Checker", href: "/delegation/wallet-checker" },
            ],
          },
          {
            name: "The Memes Tools",
            items: [
              ...(!capacitor.isIos || country === "US"
                ? [
                    {
                      name: "Memes Subscriptions",
                      href: "/tools/subscriptions-report",
                    },
                  ]
                : []),
              { name: "Memes Accounting", href: "/meme-accounting" },
              { name: "Memes Gas", href: "/meme-gas" },
            ],
          },
        ],
      },
      {
        key: "about",
        name: "About",
        icon: InformationCircleIcon,
        items: [{ name: "GDRC1", href: `/about/${AboutSection.GDRC1}` }],
        subsections: [
          {
            name: "NFTs",
            items: [
              { name: "The Memes", href: `/about/${AboutSection.MEMES}` },
              ...(!capacitor.isIos || country === "US"
                ? [
                    {
                      name: "Subscriptions",
                      href: `/about/${AboutSection.SUBSCRIPTIONS}`,
                    },
                  ]
                : []),
              {
                name: "Memes Calendar",
                href: `/about/${AboutSection.MEMES_CALENDAR}`,
              },
              { name: "Minting", href: `/about/${AboutSection.MINTING}` },
              {
                name: "Nakamoto Threshold",
                href: `/about/${AboutSection.NAKAMOTO_THRESHOLD}`,
              },
              { name: "Meme Lab", href: `/about/${AboutSection.MEME_LAB}` },
              { name: "Gradients", href: `/about/${AboutSection.GRADIENTS}` },
            ],
          },
          {
            name: "NFT Delegation",
            items: [
              {
                name: "About NFTD",
                href: `/about/${AboutSection.NFT_DELEGATION}`,
              },
              {
                name: "Primary Address",
                href: `/about/${AboutSection.PRIMARY_ADDRESS}`,
              },
            ],
          },
          {
            name: "6529 Capital",
            items: [
              { name: "About 6529 Capital", href: "/capital" },
              { name: "Company Portfolio", href: "/capital/company-portfolio" },
              { name: "NFT Fund", href: "/capital/fund" },
            ],
          },
          {
            name: "Support",
            items: [
              { name: "FAQ", href: `/about/${AboutSection.FAQ}` },
              { name: "Apply", href: `/about/${AboutSection.APPLY}` },
              { name: "Contact Us", href: `/about/${AboutSection.CONTACT_US}` },
            ],
          },
          {
            name: "Resources",
            items: [
              {
                name: "Data Decentralization",
                href: `/about/${AboutSection.DATA_DECENTR}`,
              },
              { name: "ENS", href: `/about/${AboutSection.ENS}` },
              { name: "License", href: `/about/${AboutSection.LICENSE}` },
              {
                name: "Release Notes",
                href: `/about/${AboutSection.RELEASE_NOTES}`,
              },
            ],
          },
        ],
      },
    ],
    [capacitor.isIos, country]
  );

  // Helper function to determine if nav item is active
  const isNavItemActive = useCallback(
    (item: NavItem): boolean => {
      if (item.kind === "route") {
        return pathname === item.href;
      }
      if (item.name === "Messages") {
        return pathname?.startsWith("/messages") || false;
      }
      if (item.name === "Waves") {
        return pathname?.startsWith("/waves") || false;
      }
      return false;
    },
    [pathname]
  );

  const baseItemTransition = "tw-transition-all tw-duration-300";

  return (
    <>
      <nav className="tw-flex tw-flex-1 tw-flex-col">
        <ul
          role="list"
          className="tw-flex tw-flex-1 tw-flex-col tw-space-y-2 tw-list-none tw-pl-0"
        >
          {/* Main Navigation */}
          {navigation.map((item) => {
            const IconComponent = item.iconComponent;
            const isActive =
              item.kind === "action"
                ? sidebarState.isCollectionsSubmenuOpen
                : isNavItemActive(item);

            const href =
              item.kind === "route"
                ? item.href
                : item.name === "Waves"
                ? "/waves"
                : "/my-stream";

            return (
              <li key={item.name}>
                {item.kind === "action" ? (
                  <DesktopSidebarNavItem
                    onClick={item.action}
                    icon={IconComponent}
                    iconSizeClass={item.iconSizeClass}
                    label={item.name}
                    active={isActive}
                    collapsed={sidebarState.isMainSidebarCollapsed}
                    title={item.name}
                    ariaExpanded={isActive}
                    ariaControls="collections-submenu"
                  />
                ) : (
                  <DesktopSidebarNavItem
                    href={href}
                    icon={IconComponent}
                    iconSizeClass={item.iconSizeClass}
                    label={item.name}
                    active={isActive}
                    collapsed={sidebarState.isMainSidebarCollapsed}
                    title={item.name}
                  />
                )}
              </li>
            );
          })}

          {/* Sections - single component for both states */}
          {expandableSections.map((section) => (
            <DesktopSidebarExpandableItem
              key={section.key}
              section={section}
              expanded={expandedSections.includes(section.key)}
              onToggle={() => toggleSection(section.key)}
              collapsed={sidebarState.isMainSidebarCollapsed}
              pathname={pathname || null}
            />
          ))}
        </ul>
      </nav>
      <CollectionsSubmenu
        isOpen={sidebarState.isCollectionsSubmenuOpen}
        onExpandSidebar={sidebarState.handleChevronLeftClick}
        sidebarCollapsed={sidebarState.isMainSidebarCollapsed}
      />
    </>
  );
}

// Memoized export for performance optimization
export default memo(DesktopSidebarNav);
