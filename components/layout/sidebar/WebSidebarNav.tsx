"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { AboutSection } from "@/enums";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useCollectionsNavigation } from "@/hooks/useCollectionsNavigation";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import Squares2X2Icon from "@/components/common/icons/Squares2X2Icon";
import BellIcon from "@/components/common/icons/BellIcon";
import UsersIcon from "@/components/common/icons/UsersIcon";
import {
  WrenchIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/outline";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";
import WebSidebarExpandable from "./nav/WebSidebarExpandable";
import { SidebarSection } from "@/components/navigation/navTypes";
import { COLLECTIONS_ROUTES } from "@/constants/sidebar";
import { useKey } from "react-use";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";

interface WebSidebarNavProps {
  isCollapsed: boolean;
  isCollectionsOpen?: boolean;
  onCollectionsClick?: () => void;
}

export default function WebSidebarNav({
  isCollapsed = false,
  isCollectionsOpen = false,
  onCollectionsClick,
}: WebSidebarNavProps) {
  const pathname = usePathname();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { address } = useSeizeConnectContext();
  const { connectedProfile } = useAuth();
  const { appWalletsSupported } = useAppWallets();
  const { handleCollectionsClick } = useCollectionsNavigation();

  // Notification indicators
  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.handle ?? null
  );
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  // Local state for expandable sections
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // State for search modal
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Keyboard shortcut for search
  useKey(
    (event) => event.metaKey && event.key === "k",
    () => setIsSearchOpen(true),
    { event: "keydown" }
  );

  // Simple profile path computation (no need for memoization)
  const profilePath = connectedProfile?.handle
    ? `/${connectedProfile.handle}`
    : address
    ? `/${address}`
    : null;

  // Expandable sections (memoized as it has conditional logic)
  const sections = useMemo<SidebarSection[]>(
    () => [
      {
        key: "network",
        name: "Network",
        icon: UsersIcon,
        items: [
          { name: "Identities", href: "/network" },
          { name: "Activity", href: "/network/activity" },
          { name: "Groups", href: "/network/groups" },
          { name: "NFT Activity", href: "/nft-activity" },
          { name: "Memes Calendar", href: "/meme-calendar" },
        ],
        subsections: [
          {
            name: "Metrics",
            items: [
              { name: "Definitions", href: "/network/metrics" },
              { name: "Network Stats", href: "/network/stats" },
              { name: "Levels", href: "/network/levels" },
            ],
          },
        ],
      },
      {
        key: "tools",
        name: "Tools",
        icon: WrenchIcon,
        items: [],
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
          {
            name: "Other Tools",
            items: [
              ...(appWalletsSupported
                ? [{ name: "App Wallets", href: "/tools/app-wallets" }]
                : []),
              { name: "API", href: "/tools/api" },
              { name: "EMMA", href: "/emma" },
              { name: "Block Finder", href: "/meme-blocks" },
              { name: "Open Data", href: "/open-data" },
            ],
          },
        ],
      },
      {
        key: "about",
        name: "About",
        icon: DocumentTextIcon,
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
                href: `/about/data-decentralization`,
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
    [appWalletsSupported, capacitor.isIos, country]
  );

  // Toggle section expansion
  const toggleSection = (key: string) => {
    setExpandedSections((prev) =>
      prev.includes(key)
        ? prev.filter((section) => section !== key)
        : [...prev, key]
    );
  };

  // Auto-manage expanded sections based on current route
  useEffect(() => {
    if (!pathname) return;

    // Find which section contains the current route
    let activeSection: string | null = null;
    for (const section of sections) {
      const hasActiveItem =
        section.items.some(item => pathname === item.href) ||
        section.subsections?.some(sub =>
          sub.items.some(item => pathname === item.href)
        );

      if (hasActiveItem) {
        activeSection = section.key;
        break;
      }
    }

    // Set expanded sections based on active route
    if (activeSection) {
      setExpandedSections([activeSection]);
    } else {
      setExpandedSections([]);
    }
  }, [pathname, sections]); // Run when pathname changes

  return (
    <>
      <nav
        className={`tw-flex tw-flex-1 tw-flex-col tw-mt-4 tw-h-full tw-overflow-y-auto tw-overflow-x-hidden custom-scrollbar ${
          isCollapsed ? "tw-px-2" : "tw-px-4"
        }`}
        aria-label="Desktop navigation"
      >
        <ul className="tw-list-none tw-m-0 tw-p-0">
          {/* Home */}
          <li>
            <WebSidebarNavItem
              href="/"
              icon={HomeIcon}
              active={pathname === "/"}
              collapsed={isCollapsed}
              label="Home"
            />
          </li>

          {/* Waves */}
          <li>
            <WebSidebarNavItem
              href="/waves"
              icon={WavesIcon}
              active={pathname?.startsWith("/waves") || false}
              collapsed={isCollapsed}
              label="Waves"
            />
          </li>

          {/* Messages */}
          <li>
            <WebSidebarNavItem
              href="/messages"
              icon={ChatBubbleIcon}
              active={pathname?.startsWith("/messages") || false}
              collapsed={isCollapsed}
              label="Messages"
              hasIndicator={hasUnreadMessages}
            />
          </li>

          {/* Network */}
          <li>
            <WebSidebarExpandable
              section={sections.find((s) => s.key === "network")!}
              expanded={expandedSections.includes("network")}
              onToggle={() => toggleSection("network")}
              collapsed={isCollapsed}
              pathname={pathname}
            />
          </li>

          {/* Collections */}
          <li>
            <WebSidebarNavItem
              onClick={() => handleCollectionsClick(onCollectionsClick)}
              icon={Squares2X2Icon}
              active={
                isCollectionsOpen ||
                COLLECTIONS_ROUTES.some((route) => pathname?.startsWith(route))
              }
              collapsed={isCollapsed}
              label="Collections"
            />
          </li>

          {/* Notifications */}
          <li>
            <WebSidebarNavItem
              href="/notifications"
              icon={BellIcon}
              active={pathname?.startsWith("/notifications") || false}
              collapsed={isCollapsed}
              label="Notifications"
              hasIndicator={haveUnreadNotifications}
            />
          </li>

          {/* Profile */}
          {profilePath && (
            <li>
              <WebSidebarNavItem
                href={profilePath}
                icon={UserIcon}
                iconSizeClass="tw-h-6 tw-w-6"
                active={pathname === profilePath}
                collapsed={isCollapsed}
                label="Profile"
              />
            </li>
          )}

          {/* Search */}
          <li>
            <WebSidebarNavItem
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setIsSearchOpen(true);
              }}
              icon={MagnifyingGlassIcon}
              active={false}
              collapsed={isCollapsed}
              label="Search"
            />
          </li>

          {/* Tools and About - Expandable */}
          {sections
            .filter((section) => section.key !== "network")
            .map((section) => (
              <li key={section.key}>
                <WebSidebarExpandable
                  section={section}
                  expanded={expandedSections.includes(section.key)}
                  onToggle={() => toggleSection(section.key)}
                  collapsed={isCollapsed}
                  pathname={pathname}
                />
              </li>
            ))}
        </ul>
      </nav>

      {/* Search Modal */}
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isSearchOpen && (
          <CommonAnimationOpacity
            key="search-modal"
            elementClasses="tw-fixed tw-inset-0 tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <HeaderSearchModal onClose={() => setIsSearchOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
