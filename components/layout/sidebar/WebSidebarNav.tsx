"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { AboutSection } from "@/enums";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useCollectionsNavigation } from "@/hooks/useCollectionsNavigation";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import Squares2X2Icon from "@/components/common/icons/Squares2X2Icon";
import BellIcon from "@/components/common/icons/BellIcon";
import UsersIcon from "@/components/common/icons/UsersIcon";
import { WrenchIcon, DocumentTextIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/outline";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";
import WebSidebarExpandableItem from "./nav/WebSidebarExpandableItem";
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

type NavItem = {
  type: "route" | "action";
  name: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  iconSizeClass?: string;
};

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

  // Primary navigation items
  const navItems: NavItem[] = [
    {
      type: "route" as const,
      name: "Home",
      href: "/",
      icon: HomeIcon,
    },
    {
      type: "route" as const,
      name: "Waves",
      href: "/waves",
      icon: WavesIcon,
    },
    {
      type: "route" as const,
      name: "Messages",
      href: "/messages",
      icon: ChatBubbleIcon,
    },
    {
      type: "route" as const,
      name: "Network",
      href: "/network",
      icon: UsersIcon,
    },
    {
      type: "action" as const,
      name: "Collections",
      onClick: () => handleCollectionsClick(onCollectionsClick),
      icon: Squares2X2Icon,
    },
    {
      type: "route" as const,
      name: "Notifications",
      href: "/notifications",
      icon: BellIcon,
    },
    ...(profilePath
      ? [
          {
            type: "route" as const,
            name: "Profile",
            href: profilePath,
            icon: UserIcon,
            iconSizeClass: "tw-h-6 tw-w-6",
          },
        ]
      : []),
    {
      type: "action" as const,
      name: "Search",
      onClick: (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsSearchOpen(true);
      },
      icon: MagnifyingGlassIcon,
    },
  ];

  // Expandable sections (memoized as it has conditional logic)
  const sections = useMemo<SidebarSection[]>(
    () => [
      {
        key: "tools",
        name: "Tools",
        icon: WrenchIcon,
        items: [
          ...(appWalletsSupported
            ? [{ name: "App Wallets", href: "/tools/app-wallets" }]
            : []),
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

  // Simplified active state logic
  const isActive = useCallback(
    (item: NavItem): boolean => {
      // Special case for Collections
      if (item.name === "Collections") {
        return (
          isCollectionsOpen ||
          COLLECTIONS_ROUTES.some((route) => pathname?.startsWith(route))
        );
      }

      // Home page exact match
      if (item.href === "/") {
        return pathname === "/";
      }

      // Messages special case
      if (item.name === "Messages") {
        return pathname?.startsWith("/messages") || false;
      }

      // Default: check if path starts with href
      return pathname?.startsWith(item.href || "") || false;
    },
    [pathname, isCollectionsOpen]
  );

  // Toggle section expansion
  const toggleSection = (key: string) => {
    setExpandedSections((prev) =>
      prev.includes(key)
        ? prev.filter((section) => section !== key)
        : [...prev, key]
    );
  };

  // Auto-close expanded sections on route change
  useEffect(() => {
    setExpandedSections([]);
  }, [pathname]);

  return (
    <>
      <nav
        className={`tw-flex tw-flex-1 tw-flex-col tw-mt-4 tw-h-full tw-overflow-y-auto tw-overflow-x-hidden custom-scrollbar ${
          isCollapsed ? "tw-px-2" : "tw-px-4"
        }`}
        aria-label="Desktop navigation"
      >
        <ul className="tw-list-none tw-m-0 tw-p-0">
          {/* Primary navigation items */}
          {navItems.map((item) => {
            // Search should always appear inactive (gray)
            const active = item.name === "Search" ? false : isActive(item);
            return (
              <li key={item.name}>
                <WebSidebarNavItem
                  href={item.href}
                  onClick={item.onClick}
                  icon={item.icon}
                  iconSizeClass={item.iconSizeClass}
                  active={active}
                  collapsed={isCollapsed}
                  label={item.name}
                />
              </li>
            );
          })}

          {/* Expandable sections */}
          {sections.map((section) => (
            <li key={section.key}>
              <WebSidebarExpandableItem
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
            onClicked={(e) => e.stopPropagation()}>
            <HeaderSearchModal onClose={() => setIsSearchOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
