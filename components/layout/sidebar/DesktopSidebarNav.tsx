"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { AboutSection } from "@/enums";
import CollectionsSubmenu from "./CollectionsSubmenu";
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
import { SidebarSection } from "@/components/navigation/navTypes";

interface DesktopSidebarNavProps {
  isCollapsed: boolean;
}

type NavItem = {
  type: "route" | "action";
  name: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  iconSizeClass?: string;
};

function DesktopSidebarNav({ isCollapsed }: DesktopSidebarNavProps) {
  const pathname = usePathname();
  const { showWaves } = useAuth();
  const { address } = useSeizeConnectContext();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();

  // Local state for expandable sections and collections submenu
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  // Primary navigation items
  const navItems: NavItem[] = [
    {
      type: "route",
      name: "Home",
      href: "/",
      icon: HomeIcon,
    },
    ...(showWaves
      ? [
          {
            type: "route" as const,
            name: "Waves",
            href: "/waves",
            icon: WavesIcon,
            iconSizeClass: "tw-size-6",
          },
        ]
      : []),
    {
      type: "route",
      name: "Messages",
      href: "/messages",
      icon: ChatBubbleIcon,
    },
    {
      type: "route",
      name: "Notifications",
      href: "/notifications",
      icon: BellIcon,
    },
    {
      type: "action",
      name: "Collections",
      onClick: () => setIsCollectionsOpen((v) => !v),
      icon: Squares2X2Icon,
    },
    {
      type: "route",
      name: "Community",
      href: "/network",
      icon: UsersIcon,
    },
    ...(address
      ? [
          {
            type: "route" as const,
            name: "Profile",
            href: `/${address}`,
            icon: UserIcon,
          },
        ]
      : []),
  ];

  // Expandable sections
  const sections: SidebarSection[] = [
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
  ];

  // Active state logic
  const isActive = (item: NavItem): boolean => {
    if (item.type === "action") {
      return item.name === "Collections" && isCollectionsOpen;
    }
    if (item.href === "/") {
      return pathname === "/";
    }
    if (item.name === "Messages") {
      return pathname?.startsWith("/messages") || false;
    }
    if (item.name === "Waves") {
      return pathname?.startsWith("/waves") || false;
    }
    return pathname === item.href;
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((key) => key !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  // Auto-open collections submenu when on collections pages
  useEffect(() => {
    const collectionsPages = [
      "/the-memes",
      "/meme-lab",
      "/gradients",
      "/6529-gradient",
      "/nextgen",
    ];
    const shouldAutoOpenCollections = collectionsPages.some((page) =>
      pathname?.startsWith(page)
    );

    if (shouldAutoOpenCollections && !isCollectionsOpen) {
      setIsCollectionsOpen(true);
    }
  }, [pathname, isCollectionsOpen]);

  return (
    <nav
      className={`tw-flex tw-flex-1 tw-flex-col tw-mt-6 ${
        isCollapsed ? "tw-px-2" : "tw-px-4"
      }`}
      role="navigation"
      aria-label="Main"
    >
      <ul
        role="list"
        className="tw-flex tw-flex-1 tw-flex-col tw-list-none tw-pl-0"
      >
        {/* Primary navigation items */}
        {navItems.map((item) => {
          const active = isActive(item);

          return (
            <li key={item.name}>
              <DesktopSidebarNavItem
                href={item.href}
                onClick={item.onClick}
                icon={item.icon}
                iconSizeClass={item.iconSizeClass}
                label={item.name}
                active={active}
                collapsed={isCollapsed}
                ariaExpanded={item.name === "Collections" ? isCollectionsOpen : undefined}
                ariaControls={item.name === "Collections" ? "collections-submenu" : undefined}
              />

              {/* Collections submenu - only show in expanded mode */}
              {item.name === "Collections" &&
                isCollectionsOpen &&
                !isCollapsed && (
                  <div id="collections-submenu" className="tw-ml-6 tw-mt-1">
                    <CollectionsSubmenu
                      isOpen={isCollectionsOpen}
                      sidebarCollapsed={isCollapsed}
                    />
                  </div>
                )}
            </li>
          );
        })}

        {/* Expandable sections */}
        {sections.map((section) => (
          <li key={section.key}>
            <DesktopSidebarExpandableItem
              section={section}
              expanded={expandedSections.includes(section.key)}
              onToggle={() => toggleSection(section.key)}
              collapsed={isCollapsed}
              pathname={pathname || null}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default DesktopSidebarNav;
