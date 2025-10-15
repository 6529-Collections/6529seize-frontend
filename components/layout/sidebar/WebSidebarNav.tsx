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
  useMemo,
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
  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.handle ?? null
  );
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [openSubmenuKey, setOpenSubmenuKey] = useState<string | null>(null);
  const [submenuLeft, setSubmenuLeft] = useState<number | null>(null);

  useKey(
    (event) => event.metaKey && event.key === "k",
    () => setIsSearchOpen(true),
    { event: "keydown" }
  );

  const profilePath = useMemo(() => {
    if (connectedProfile?.handle) return `/${connectedProfile.handle}`;
    if (address) return `/${address}`;
    return null;
  }, [connectedProfile?.handle, address]);

  const sections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    country
  );
  const sectionMap = useSectionMap(sections);
  const networkSection = sectionMap.get("network");
  const collectionsSection = sectionMap.get("collections");

  const closeSubmenu = useCallback(() => {
    setOpenSubmenuKey(null);
    setSubmenuLeft(null);
  }, []);

  useImperativeHandle(ref, () => ({ closeSubmenu }), [closeSubmenu]);

  const activeSectionKey = useMemo(() => {
    if (!pathname) return null;
    for (const section of sections) {
      const inItems = section.items.some((item) => pathname === item.href);
      const inSubsections =
        section.subsections?.some((sub) =>
          sub.items.some((item) => pathname === item.href)
        ) ?? false;
      if (inItems || inSubsections) return section.key;
    }
    return null;
  }, [pathname, sections]);

  useEffect(() => {
    if (activeSectionKey) {
      setExpandedKeys([activeSectionKey]);
    } else {
      setExpandedKeys([]);
    }
    closeSubmenu();
  }, [activeSectionKey, closeSubmenu]);

  useEffect(() => {
    if (!isCollapsed) {
      closeSubmenu();
    }
  }, [isCollapsed, closeSubmenu]);

  const handleSectionToggle = useCallback(
    (sectionKey: string) =>
      (event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (isCollapsed) {
          const target = event?.currentTarget as HTMLElement | undefined;
          const nextKey = openSubmenuKey === sectionKey ? null : sectionKey;
          if (nextKey && target) {
            const rect = target.getBoundingClientRect();
            setSubmenuLeft(rect.right);
          } else {
            setSubmenuLeft(null);
          }
          setOpenSubmenuKey(nextKey);
        } else {
          setExpandedKeys((prev) =>
            prev.includes(sectionKey)
              ? prev.filter((key) => key !== sectionKey)
              : [...prev, sectionKey]
          );
        }
      },
    [isCollapsed, openSubmenuKey]
  );

  return (
    <>
      <nav
        className="tw-flex tw-flex-col tw-mt-4 tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-pr-2 tw-pl-3"
        aria-label="Desktop navigation"
      >
        <ul className="tw-list-none tw-m-0 tw-p-0">
          <li>
            <WebSidebarNavItem
              href="/"
              icon={HomeIcon}
              active={pathname === "/"}
              collapsed={isCollapsed}
              label="Home"
            />
          </li>

          <li>
            <WebSidebarNavItem
              href="/waves"
              icon={WavesIcon}
              active={pathname?.startsWith("/waves") || false}
              collapsed={isCollapsed}
              label="Waves"
            />
          </li>

          <li>
            <WebSidebarNavItem
              href="/discover"
              icon={DiscoverIcon}
              active={pathname?.startsWith("/discover") || false}
              collapsed={isCollapsed}
              label="Discover"
            />
          </li>

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

          {networkSection && (
            <li>
              <WebSidebarExpandable
                section={networkSection}
                expanded={expandedKeys.includes("network")}
                onToggle={handleSectionToggle("network")}
                collapsed={isCollapsed}
                pathname={pathname}
                data-section="network"
              />
            </li>
          )}

          {collectionsSection && (
            <li>
              <WebSidebarExpandable
                section={collectionsSection}
                expanded={expandedKeys.includes("collections")}
                onToggle={handleSectionToggle("collections")}
                collapsed={isCollapsed}
                pathname={pathname}
                data-section="collections"
              />
            </li>
          )}

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

          <li>
            <WebSidebarNavItem
              onClick={(event?: React.MouseEvent) => {
                event?.stopPropagation();
                setIsSearchOpen(true);
              }}
              icon={MagnifyingGlassIcon}
              active={false}
              collapsed={isCollapsed}
              label="Search"
            />
          </li>

          {sections
            .filter(
              (section) =>
                section.key !== "network" && section.key !== "collections"
            )
            .map((section) => (
              <li key={section.key}>
                <WebSidebarExpandable
                  section={section}
                  expanded={expandedKeys.includes(section.key)}
                  onToggle={handleSectionToggle(section.key)}
                  collapsed={isCollapsed}
                  pathname={pathname}
                  data-section={section.key}
                />
              </li>
            ))}
        </ul>
      </nav>

      <CommonAnimationWrapper mode="sync" initial>
        {isSearchOpen && (
          <CommonAnimationOpacity
            key="search-modal"
            elementClasses="tw-fixed tw-inset-0 tw-z-50"
            elementRole="dialog"
            onClicked={(event) => event.stopPropagation()}
          >
            <HeaderSearchModal onClose={() => setIsSearchOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>

      {isCollapsed && openSubmenuKey && (
        <CommonAnimationWrapper mode="sync" initial={false}>
          <CommonAnimationOpacity
            key={`sidebar-submenu-${openSubmenuKey}`}
            elementClasses="tw-contents"
            elementRole="presentation"
          >
            {(() => {
              const openSection = sections.find((section) => section.key === openSubmenuKey);
              return openSection ? (
                <WebSidebarSubmenu
                  section={openSection}
                  pathname={pathname}
                  onClose={closeSubmenu}
                  leftOffset={submenuLeft ?? undefined}
                />
              ) : null;
            })()}
          </CommonAnimationOpacity>
        </CommonAnimationWrapper>
      )}
    </>
  );
});

WebSidebarNav.displayName = "WebSidebarNav";

export default WebSidebarNav;
