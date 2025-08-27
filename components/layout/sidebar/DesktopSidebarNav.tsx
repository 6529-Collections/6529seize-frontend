"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import {
  type NavItem,
  type SidebarSection,
} from "@/components/navigation/navTypes";
import { AboutSection } from "@/enums";
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

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function DesktopSidebarNav() {
  const pathname = usePathname();
  const { showWaves } = useAuth();
  const { address } = useSeizeConnectContext();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const navigation: NavItem[] = [
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
      kind: "view" as const,
      name: "Messages",
      viewKey: "messages" as const,
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
      kind: "route",
      name: "Collections",
      href: "/the-memes",
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
  ];

  // Sidebar expandable sections
  const expandableSections: SidebarSection[] = [
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
            { name: "Delegation Center", href: "/delegation/delegation-center" },
            { name: "Wallet Architecture", href: "/delegation/wallet-architecture" },
            { name: "Delegation FAQs", href: "/delegation/delegation-faq" },
            { name: "Consolidation Use Cases", href: "/delegation/consolidation-use-cases" },
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

  // Helper function to determine if nav item is active
  const isNavItemActive = (item: NavItem): boolean => {
    if (item.kind === "route") {
      return pathname === item.href;
    }
    // For view items, we'd need ViewContext, but for now use simple pathname matching
    if (item.name === "Messages") {
      return pathname === "/my-stream";
    }
    if (item.name === "Waves") {
      return pathname === "/waves";
    }
    return false;
  };

  return (
    <nav className="tw-flex tw-flex-1 tw-flex-col">
      <ul
        role="list"
        className="tw-flex tw-flex-1 tw-flex-col tw-space-y-2 tw-list-none tw-pl-0"
      >
        {/* Main Navigation */}
        {navigation.map((item) => {
          const IconComponent = item.iconComponent;
          const isActive = isNavItemActive(item);

          return (
            <li key={item.name}>
              <Link
                href={item.kind === "route" ? item.href : "/my-stream"}
                className={classNames(
                  isActive
                    ? "tw-bg-iron-800 tw-text-white desktop-hover:hover:tw-text-white"
                    : "tw-text-iron-300 hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white",
                  "tw-w-full tw-text-lg tw-no-underline tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-transition-all tw-duration-200 tw-group tw-justify-center lg:tw-justify-start",
                  "tw-px-3 tw-py-2.5"
                )}
                title={item.name}
              >
                {IconComponent && (
                  <IconComponent
                    className={`tw-h-6 tw-w-6 tw-shrink-0 ${
                      item.iconSizeClass || ""
                    }`}
                  />
                )}
                <span className="tw-hidden lg:tw-block">{item.name}</span>
              </Link>
            </li>
          );
        })}

        {/* Expandable sections - only show on large screens */}
        {expandableSections.map((section) => (
          <div key={section.key} className="tw-hidden lg:tw-block">
            <button
              onClick={() => toggleSection(section.key)}
              className={classNames(
                "tw-text-iron-300 hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white",
                "tw-w-full tw-text-lg tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-transition-all tw-duration-200 tw-group tw-justify-center lg:tw-justify-between",
                "tw-px-3 tw-py-2.5"
              )}
            >
              <div className="tw-flex tw-gap-4 tw-items-center tw-justify-center lg:tw-justify-start">
                <section.icon
                  aria-hidden="true"
                  className="tw-h-6 tw-w-6 tw-shrink-0"
                />
                <span className="tw-hidden lg:tw-block">{section.name}</span>
              </div>
              <ChevronRightIcon
                className={classNames(
                  "tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform tw-duration-200 tw-hidden lg:tw-block",
                  expandedSections.includes(section.key) ? "tw-rotate-90" : ""
                )}
              />
            </button>
            {expandedSections.includes(section.key) && (
              <ul role="list" className="tw-mt-1 tw-space-y-1">
                {section.items.map((item) => (
                  <li key={item.name} className="tw-ml-6">
                    <Link
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? "tw-bg-iron-800 tw-text-white"
                          : "tw-text-[#E5E5E5] hover:tw-bg-[#1A1A1A] hover:tw-text-white",
                        "tw-group tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-transition-all tw-duration-200 tw-px-3 tw-py-2.5"
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                {section.subsections?.map((subsection) => (
                  <li key={subsection.name} className="tw-ml-6">
                    <div className="tw-text-xs tw-font-semibold tw-text-[#E5E5E5] tw-px-2 tw-py-1 tw-mt-4">
                      {subsection.name}
                    </div>
                    <ul role="list" className="tw-space-y-1">
                      {subsection.items.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={classNames(
                              pathname === item.href
                                ? "tw-bg-iron-800 tw-text-white"
                                : "tw-text-[#E5E5E5] hover:tw-bg-[#1A1A1A] hover:tw-text-white",
                              "tw-group tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-transition-all tw-duration-200 tw-px-3 tw-py-2.5"
                            )}
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Collapsed expandable sections - show only icons on small screens */}
        {expandableSections.map((section) => (
          <li key={`${section.key}-collapsed`} className="lg:tw-hidden">
            <Link
              href={section.items[0]?.href || "#"}
              className={classNames(
                pathname?.startsWith(section.items[0]?.href || "") ||
                  (section.key === "tools" && pathname?.startsWith("/tools")) ||
                  (section.key === "about" && pathname?.startsWith("/about"))
                  ? "tw-bg-iron-800 tw-text-white desktop-hover:hover:tw-text-white"
                  : "tw-text-iron-300 hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white",
                "tw-w-full tw-text-lg tw-no-underline tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-transition-all tw-duration-200 tw-group tw-justify-center",
                "tw-px-3 tw-py-2.5"
              )}
              title={section.name}
            >
              <section.icon
                aria-hidden="true"
                className="tw-h-6 tw-w-6 tw-shrink-0"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
