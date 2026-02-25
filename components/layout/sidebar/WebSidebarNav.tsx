"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import BellIcon from "@/components/common/icons/BellIcon";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import DiscoverIcon from "@/components/common/icons/DiscoverIcon";
import DropForgeIcon from "@/components/common/icons/DropForgeIcon";
import HomeIcon from "@/components/common/icons/HomeIcon";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { DROP_FORGE_TITLE } from "@/components/drop-forge/drop-forge.constants";
import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import useCapacitor from "@/hooks/useCapacitor";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { useSectionMap, useSidebarSections } from "@/hooks/useSidebarSections";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
  readonly isMobile?: boolean;
}

const WebSidebarNav = React.forwardRef<
  { closeSubmenu: () => void },
  WebSidebarNavProps
>(({ isCollapsed = false, isMobile: _isMobile = false }, ref) => {
  const pathname = usePathname();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { connectedProfile } = useAuth();
  const { appWalletsSupported } = useAppWallets();
  const { canAccessLanding: showDropForge } = useDropForgePermissions();
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
  const [submenuAnchor, setSubmenuAnchor] = useState<{
    left: number;
    top: number;
    height: number;
  } | null>(null);
  const [submenuTrigger, setSubmenuTrigger] = useState<HTMLElement | null>(
    null
  );

  useKey(
    (event) => event.metaKey && event.key === "k",
    () => setIsSearchOpen(true),
    { event: "keydown" }
  );

  const allSections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    country
  );
  const sections = useMemo(() => allSections, [allSections]);
  const sectionMap = useSectionMap(sections);
  const networkSection = sectionMap.get("network");
  const collectionsSection = sectionMap.get("collections");

  const closeSubmenu = useCallback(() => {
    setOpenSubmenuKey(null);
    setSubmenuAnchor(null);
    setSubmenuTrigger(null);
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
    (sectionKey: string, event?: React.MouseEvent) => {
      event?.stopPropagation();

      if (isCollapsed) {
        const target = event?.currentTarget as HTMLElement | undefined;
        const nextKey = openSubmenuKey === sectionKey ? null : sectionKey;
        setOpenSubmenuKey(nextKey);

        if (nextKey && target) {
          const rect = target.getBoundingClientRect();
          setSubmenuAnchor({
            left: rect.right + 12,
            top: rect.top,
            height: rect.height,
          });
          setSubmenuTrigger(target);
        } else {
          setSubmenuAnchor(null);
          setSubmenuTrigger(null);
        }

        return;
      }

      setExpandedKeys((prev) =>
        prev.includes(sectionKey)
          ? prev.filter((key) => key !== sectionKey)
          : [...prev, sectionKey]
      );
    },
    [isCollapsed, openSubmenuKey]
  );

  useEffect(() => {
    if (isCollapsed && submenuTrigger) {
      const updateAnchor = () => {
        const rect = submenuTrigger.getBoundingClientRect();
        setSubmenuAnchor({
          left: rect.right + 12,
          top: rect.top,
          height: rect.height,
        });
      };

      const browserWindow = globalThis.window ?? undefined;
      const scrollContainer = submenuTrigger.closest(
        "[data-sidebar-scroll='true']"
      ) as HTMLElement | null;
      const canObserve = typeof ResizeObserver === "function";
      const resizeObserver = canObserve
        ? new ResizeObserver(updateAnchor)
        : null;

      updateAnchor();
      browserWindow?.addEventListener("resize", updateAnchor);
      scrollContainer?.addEventListener("scroll", updateAnchor, {
        passive: true,
      });
      resizeObserver?.observe(submenuTrigger);

      return () => {
        browserWindow?.removeEventListener("resize", updateAnchor);
        scrollContainer?.removeEventListener("scroll", updateAnchor);
        resizeObserver?.disconnect();
      };
    }

    return undefined;
  }, [isCollapsed, submenuTrigger]);

  const renderCollapsedSubmenu = useCallback(
    (sectionKey: string) => {
      if (isCollapsed && openSubmenuKey === sectionKey && submenuAnchor) {
        const openSection = sections.find(
          (section) => section.key === sectionKey
        );
        if (!openSection) {
          return null;
        }

        return (
          <WebSidebarSubmenu
            key={`sidebar-submenu-${sectionKey}`}
            section={openSection}
            pathname={pathname}
            onClose={closeSubmenu}
            leftOffset={submenuAnchor.left}
            anchorTop={submenuAnchor.top}
            anchorHeight={submenuAnchor.height}
            triggerElement={submenuTrigger}
          />
        );
      }

      return null;
    },
    [
      isCollapsed,
      openSubmenuKey,
      sections,
      pathname,
      closeSubmenu,
      submenuAnchor,
      submenuTrigger,
    ]
  );

  return (
    <>
      <nav
        className="tw-mt-4 tw-flex tw-h-full tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-px-3 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
        aria-label="Desktop navigation"
      >
        <ul className="tw-m-0 tw-list-none tw-p-0">
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
              href="/messages"
              icon={ChatBubbleIcon}
              active={pathname?.startsWith("/messages") || false}
              collapsed={isCollapsed}
              label="Messages"
              hasIndicator={hasUnreadMessages}
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

          {networkSection && (
            <li className={isCollapsed ? "tw-relative" : undefined}>
              <WebSidebarExpandable
                section={networkSection}
                expanded={expandedKeys.includes("network")}
                onToggle={(event) => handleSectionToggle("network", event)}
                collapsed={isCollapsed}
                pathname={pathname}
                data-section="network"
              />
              {renderCollapsedSubmenu("network")}
            </li>
          )}

          {collectionsSection && (
            <li className={isCollapsed ? "tw-relative" : undefined}>
              <WebSidebarExpandable
                section={collectionsSection}
                expanded={expandedKeys.includes("collections")}
                onToggle={(event) => handleSectionToggle("collections", event)}
                collapsed={isCollapsed}
                pathname={pathname}
                data-section="collections"
              />
              {renderCollapsedSubmenu("collections")}
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
              <React.Fragment key={section.key}>
                <li className={isCollapsed ? "tw-relative" : undefined}>
                  <WebSidebarExpandable
                    section={section}
                    expanded={expandedKeys.includes(section.key)}
                    onToggle={(event) =>
                      handleSectionToggle(section.key, event)
                    }
                    collapsed={isCollapsed}
                    pathname={pathname}
                    data-section={section.key}
                  />
                  {renderCollapsedSubmenu(section.key)}
                </li>
                {section.key === "about" && showDropForge && (
                  <li>
                    <WebSidebarNavItem
                      href="/drop-forge"
                      icon={DropForgeIcon}
                      active={
                        pathname === "/drop-forge" ||
                        pathname?.startsWith("/drop-forge/")
                      }
                      collapsed={isCollapsed}
                      label={DROP_FORGE_TITLE}
                    />
                  </li>
                )}
              </React.Fragment>
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
            <HeaderSearchModal
              onClose={() => setIsSearchOpen(false)}
              wave={null}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
});

WebSidebarNav.displayName = "WebSidebarNav";

export default WebSidebarNav;
