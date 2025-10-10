"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import BellIcon from "@/components/common/icons/BellIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import DiscoverIcon from "@/components/common/icons/DiscoverIcon";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import useCapacitor from "@/hooks/useCapacitor";
import { useSectionMap, useSidebarSections } from "@/hooks/useSidebarSections";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useKey } from "react-use";
import WebSidebarExpandable from "./nav/WebSidebarExpandable";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";
import WebSidebarSubmenu from "./nav/WebSidebarSubmenu";

interface WebSidebarNavProps {
  readonly isCollapsed: boolean;
}

const WebSidebarNav = React.forwardRef<
  { closeSubmenu: () => void },
  WebSidebarNavProps
>(({ isCollapsed = false }, ref) => {
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
  let profilePath: string | null = null;
  if (connectedProfile?.handle) {
    profilePath = `/${connectedProfile.handle}`;
  } else if (address) {
    profilePath = `/${address}`;
  }

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
    [activeSubmenu]
  );

  const closeSubmenu = useCallback(() => {
    setActiveSubmenu(null);
    setSubmenuAnchor(null);
  }, []);

  // Expose closeSubmenu to parent
  useImperativeHandle(
    ref,
    () => ({
      closeSubmenu,
    }),
    [closeSubmenu]
  );

  // Toggle section expansion
  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) =>
      prev.includes(key)
        ? prev.filter((section) => section !== key)
        : [...prev, key]
    );
  }, []);

  const collapsedSectionToggle = useCallback(
    (sectionKey: string) =>
      (event?: React.MouseEvent) => {
        if (event) {
          handleCollapsedClick(sectionKey, event);
        }
      },
    [handleCollapsedClick]
  );

  const expandedSectionToggle = useCallback(
    (sectionKey: string) => () => {
      toggleSection(sectionKey);
    },
    [toggleSection]
  );

  // Auto-manage expanded sections based on current route
  useEffect(() => {
    if (!pathname) return;

    // Find which section contains the current route
    let activeSection: string | null = null;
    for (const section of sections) {
      const hasActiveItem =
        section.items.some((item) => pathname === item.href) ||
        section.subsections?.some((sub) =>
          sub.items.some((item) => pathname === item.href)
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
  const activeSection = sections.find((s) => s.key === activeSubmenu);

  // Close submenu immediately when sidebar expands or pathname changes
  useEffect(() => {
    if (!isCollapsed && activeSubmenu) {
      closeSubmenu();
    }
  }, [isCollapsed, activeSubmenu, closeSubmenu]);

  useEffect(() => {
    closeSubmenu();
  }, [pathname, closeSubmenu]);

  return (
    <>
      <nav
        className="tw-flex tw-flex-col tw-mt-4 tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-pr-2 tw-pl-1"
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

          {/* Discover */}
          <li>
            <WebSidebarNavItem
              href="/discover"
              icon={DiscoverIcon}
              active={pathname?.startsWith("/discover") || false}
              collapsed={isCollapsed}
              label="Discover"
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
                onToggle={
                  isCollapsed
                    ? collapsedSectionToggle("network")
                    : expandedSectionToggle("network")
                }
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
                onToggle={
                  isCollapsed
                    ? collapsedSectionToggle("collections")
                    : expandedSectionToggle("collections")
                }
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
            .filter(
              (section) =>
                section.key !== "network" && section.key !== "collections"
            )
            .map((section) => (
              <li key={section.key}>
                <WebSidebarExpandable
                  section={section}
                  expanded={expandedSections.includes(section.key)}
                  onToggle={
                    isCollapsed
                      ? collapsedSectionToggle(section.key)
                      : expandedSectionToggle(section.key)
                  }
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
      {activeSubmenu && activeSection && submenuAnchor && (
        <>
          {/* Overlay for main content */}
          <button
            type="button"
            className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-z-[70] focus:tw-outline-none tw-border-0"
            style={{ left: "18rem" }} // 4rem sidebar + 14rem submenu
            onClick={closeSubmenu}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                closeSubmenu();
              }
            }}
            aria-label="Close submenu"
          />
          <CommonAnimationWrapper mode="sync" initial={false}>
            <CommonAnimationOpacity
              key={`sidebar-submenu-${activeSection.key}`}
              elementClasses="tw-contents"
              elementRole="presentation"
            >
              <WebSidebarSubmenu
                section={activeSection}
                anchor={submenuAnchor}
                pathname={pathname}
                onClose={closeSubmenu}
              />
            </CommonAnimationOpacity>
          </CommonAnimationWrapper>
        </>
      )}
    </>
  );
});

WebSidebarNav.displayName = "WebSidebarNav";

export default WebSidebarNav;
