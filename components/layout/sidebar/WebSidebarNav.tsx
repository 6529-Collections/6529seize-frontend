"use client";

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import BellIcon from "@/components/common/icons/BellIcon";
import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";
import { useSidebarSections, useSectionMap } from "@/hooks/useSidebarSections";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";
import WebSidebarExpandable from "./nav/WebSidebarExpandable";
import WebSidebarSubmenu from "./nav/WebSidebarSubmenu";
import { useKey } from "react-use";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";

interface WebSidebarNavProps {
  isCollapsed: boolean;
}

export default function WebSidebarNav({
  isCollapsed = false,
}: WebSidebarNavProps) {
  const pathname = usePathname();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { address } = useSeizeConnectContext();
  const { connectedProfile } = useAuth();
  const { appWalletsSupported } = useAppWallets();
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

  // Profile path computation
  const profilePath = connectedProfile?.handle
    ? `/${connectedProfile.handle}`
    : address
    ? `/${address}`
    : null;

  // Use custom hook for sections
  const sections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    country
  );

  // Create section map for efficient lookups
  const sectionMap = useSectionMap(sections);

  // Get specific sections from map
  const networkSection = sectionMap.get("network");
  const collectionsSection = sectionMap.get("collections");

  // Click-based submenu state for collapsed sidebar
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuAnchor, setSubmenuAnchor] = useState<HTMLElement | null>(null);

  // Handle click on collapsed sidebar section
  const handleCollapsedClick = useCallback(
    (sectionKey: string, event: React.MouseEvent) => {
      if (!isCollapsed) return;

      const target = event.currentTarget as HTMLElement;

      // Toggle submenu
      if (activeSubmenu === sectionKey) {
        setActiveSubmenu(null);
        setSubmenuAnchor(null);
      } else {
        setActiveSubmenu(sectionKey);
        setSubmenuAnchor(target);
      }
    },
    [isCollapsed, activeSubmenu]
  );

  const closeSubmenu = useCallback(() => {
    setActiveSubmenu(null);
    setSubmenuAnchor(null);
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) =>
      prev.includes(key)
        ? prev.filter((section) => section !== key)
        : [...prev, key]
    );
  }, []);

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

  // Get the section for the active submenu
  const activeSection = sections.find(s => s.key === activeSubmenu);

  // Close submenu when sidebar expands or pathname changes
  useEffect(() => {
    if (!isCollapsed) {
      closeSubmenu();
    }
  }, [isCollapsed, closeSubmenu]);

  useEffect(() => {
    closeSubmenu();
  }, [pathname, closeSubmenu]);

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
          {networkSection && (
            <li>
              <WebSidebarExpandable
                section={networkSection}
                expanded={expandedSections.includes("network")}
                onToggle={(e?: React.MouseEvent) => {
                  if (isCollapsed && e) {
                    handleCollapsedClick("network", e);
                  } else if (!isCollapsed) {
                    toggleSection("network");
                  }
                }}
                collapsed={isCollapsed}
                pathname={pathname}
                data-section="network"
              />
            </li>
          )}

          {/* Collections */}
          {collectionsSection && (
            <li>
              <WebSidebarExpandable
                section={collectionsSection}
                expanded={expandedSections.includes("collections")}
                onToggle={(e?: React.MouseEvent) => {
                  if (isCollapsed && e) {
                    handleCollapsedClick("collections", e);
                  } else if (!isCollapsed) {
                    toggleSection("collections");
                  }
                }}
                collapsed={isCollapsed}
                pathname={pathname}
                data-section="collections"
              />
            </li>
          )}

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
            .filter((section) => section.key !== "network" && section.key !== "collections")
            .map((section) => (
              <li key={section.key}>
                <WebSidebarExpandable
                  section={section}
                  expanded={expandedSections.includes(section.key)}
                  onToggle={(e?: React.MouseEvent) => {
                    if (isCollapsed && e) {
                      handleCollapsedClick(section.key, e);
                    } else if (!isCollapsed) {
                      toggleSection(section.key);
                    }
                  }}
                  collapsed={isCollapsed}
                  pathname={pathname}
                  data-section={section.key}
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
      <CommonAnimationWrapper mode="sync" initial={true}>
        {activeSubmenu && activeSection && submenuAnchor && (
          <CommonAnimationOpacity
            key={`submenu-${activeSubmenu}`}
            elementClasses=""
          >
            <WebSidebarSubmenu
              section={activeSection}
              anchor={submenuAnchor}
              pathname={pathname}
              onClose={closeSubmenu}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
