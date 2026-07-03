"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import DropForgeIcon from "@/components/common/icons/DropForgeIcon";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import {
  DROP_FORGE_PATH,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import type { SidebarSection } from "@/components/navigation/navTypes";
import useCapacitor from "@/hooks/useCapacitor";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { useSectionMap, useSidebarSections } from "@/hooks/useSidebarSections";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import WebSidebarExpandable from "./nav/WebSidebarExpandable";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";
import WebSidebarSubmenu from "./nav/WebSidebarSubmenu";
import { isSidebarNavItemActive } from "./nav/sidebarActive";

interface WebSidebarNavProps {
  readonly isCollapsed: boolean;
}

type BrowserGlobal = typeof globalThis & {
  readonly window?: Window;
};

const getBrowserWindow = (): Window | undefined =>
  (globalThis as BrowserGlobal).window;

const getSafePathname = (pathname: string | null): string => pathname ?? "";

const WebSidebarNav = React.forwardRef<
  { closeSubmenu: () => void },
  WebSidebarNavProps
>(({ isCollapsed = false }, ref) => {
  const pathname = usePathname();
  const safePathname = getSafePathname(pathname);
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { connectedProfile } = useAuth();
  const { appWalletsSupported } = useAppWallets();
  const { canAccessLanding: showDropForge } = useDropForgePermissions();
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  const [manualExpandedKeys, setManualExpandedKeys] = useState<string[]>([]);
  const [manualCollapsedKeys, setManualCollapsedKeys] = useState<string[]>([]);
  const [openSubmenuKey, setOpenSubmenuKey] = useState<string | null>(null);
  const [submenuAnchor, setSubmenuAnchor] = useState<{
    left: number;
    top: number;
    height: number;
  } | null>(null);
  const [submenuTrigger, setSubmenuTrigger] = useState<HTMLElement | null>(
    null
  );

  const sections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    country
  );
  const sectionMap = useSectionMap(sections);
  const nftsSection = sectionMap.get("nfts");
  const wavesSection = sectionMap.get("waves");
  const toolsSection = sectionMap.get("tools");
  const aboutSection = sectionMap.get("about");

  const closeSubmenu = useCallback(() => {
    setOpenSubmenuKey(null);
    setSubmenuAnchor(null);
    setSubmenuTrigger(null);
  }, []);

  useImperativeHandle(ref, () => ({ closeSubmenu }), [closeSubmenu]);

  const activeSectionKey = useMemo(() => {
    if (!pathname) return null;
    for (const section of sections) {
      const inItems = section.items.some((item) =>
        isSidebarNavItemActive(item, pathname)
      );
      const inSubsections =
        section.subsections?.some((sub) =>
          sub.items.some((item) => isSidebarNavItemActive(item, pathname))
        ) ?? false;
      if (inItems || inSubsections) return section.key;
    }
    return null;
  }, [pathname, sections]);

  const expandedKeys = useMemo(() => {
    const keys = new Set(manualExpandedKeys);
    if (activeSectionKey && !manualCollapsedKeys.includes(activeSectionKey)) {
      keys.add(activeSectionKey);
    }
    return Array.from(keys);
  }, [activeSectionKey, manualCollapsedKeys, manualExpandedKeys]);

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

      const isExpanded = expandedKeys.includes(sectionKey);
      if (isExpanded) {
        setManualExpandedKeys((prev) =>
          prev.filter((key) => key !== sectionKey)
        );
        setManualCollapsedKeys((prev) =>
          prev.includes(sectionKey) ? prev : [...prev, sectionKey]
        );
        return;
      }

      setManualCollapsedKeys((prev) =>
        prev.filter((key) => key !== sectionKey)
      );
      setManualExpandedKeys((prev) =>
        prev.includes(sectionKey) ? prev : [...prev, sectionKey]
      );
    },
    [expandedKeys, isCollapsed, openSubmenuKey]
  );

  useEffect(() => {
    if (isCollapsed && submenuTrigger) {
      const updateAnchor = () => {
        const rect = submenuTrigger.getBoundingClientRect();
        const nextAnchor = {
          left: rect.right + 12,
          top: rect.top,
          height: rect.height,
        };
        setSubmenuAnchor((previous) =>
          previous?.left === nextAnchor.left &&
          previous.top === nextAnchor.top &&
          previous.height === nextAnchor.height
            ? previous
            : nextAnchor
        );
      };

      const browserWindow = getBrowserWindow();
      if (browserWindow === undefined) {
        return undefined;
      }

      const scrollContainer = submenuTrigger.closest(
        "[data-sidebar-scroll='true']"
      );

      browserWindow.addEventListener("resize", updateAnchor);
      scrollContainer?.addEventListener("scroll", updateAnchor, {
        passive: true,
      });

      return () => {
        browserWindow.removeEventListener("resize", updateAnchor);
        scrollContainer?.removeEventListener("scroll", updateAnchor);
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

  const renderExpandableSection = (section: SidebarSection) => (
    <li className={isCollapsed ? "tw-relative" : undefined} key={section.key}>
      <WebSidebarExpandable
        section={section}
        expanded={expandedKeys.includes(section.key)}
        onToggle={(event) => handleSectionToggle(section.key, event)}
        collapsed={isCollapsed}
        pathname={pathname}
        data-section={section.key}
      />
      {renderCollapsedSubmenu(section.key)}
    </li>
  );

  const renderDirectSectionLink = (section: SidebarSection) => {
    const primaryItem = section.items[0];

    if (primaryItem === undefined) {
      return null;
    }

    const isPrimaryItemActive = isSidebarNavItemActive(primaryItem, pathname);
    const hasActiveSectionItem = section.items.some((item) =>
      isSidebarNavItemActive(item, pathname)
    );

    return (
      <li key={section.key}>
        <WebSidebarNavItem
          href={primaryItem.href}
          icon={section.icon}
          active={hasActiveSectionItem}
          ariaCurrent={isPrimaryItemActive ? "page" : "location"}
          collapsed={isCollapsed}
          label={section.name}
          data-section={section.key}
        />
      </li>
    );
  };

  return (
    <nav
      className="tw-mt-4 tw-flex tw-h-full tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-px-3 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
      aria-label="Desktop navigation"
    >
      <ul className="tw-m-0 tw-list-none tw-p-0">
        {nftsSection && renderExpandableSection(nftsSection)}

        {wavesSection && renderDirectSectionLink(wavesSection)}

        <li>
          <WebSidebarNavItem
            href="/messages"
            icon={ChatBubbleIcon}
            active={safePathname.startsWith("/messages")}
            collapsed={isCollapsed}
            label={t(DEFAULT_LOCALE, "navigation.primary.dms")}
            hasIndicator={hasUnreadMessages}
          />
        </li>

        <li>
          <WebSidebarNavItem
            href="/join"
            icon={UserPlusIcon}
            active={
              safePathname === "/join" || safePathname.startsWith("/join/")
            }
            collapsed={isCollapsed}
            label={t(DEFAULT_LOCALE, "navigation.primary.join6529")}
          />
        </li>

        {toolsSection && renderExpandableSection(toolsSection)}

        {aboutSection && renderExpandableSection(aboutSection)}

        {showDropForge && (
          <li>
            <WebSidebarNavItem
              href={DROP_FORGE_PATH}
              icon={DropForgeIcon}
              active={
                safePathname === DROP_FORGE_PATH ||
                safePathname.startsWith(`${DROP_FORGE_PATH}/`)
              }
              collapsed={isCollapsed}
              label={DROP_FORGE_TITLE}
            />
          </li>
        )}
      </ul>
    </nav>
  );
});

WebSidebarNav.displayName = "WebSidebarNav";

export default WebSidebarNav;
