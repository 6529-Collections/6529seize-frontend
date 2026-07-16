"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import ChatBubbleIcon from "@/components/common/icons/ChatBubbleIcon";
import DropForgeIcon from "@/components/common/icons/DropForgeIcon";
import Join6529Icon from "@/components/common/icons/Join6529Icon";
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
import { usePathname } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
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

const HOVER_OPEN_DELAY_MS = 100;
const HOVER_CLOSE_DELAY_MS = 200;

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
  const [submenuFocusRequest, setSubmenuFocusRequest] = useState(0);
  const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const sections = useSidebarSections(
    appWalletsSupported,
    capacitor.isIos,
    country
  );
  const sectionMap = useSectionMap(sections);
  const nftsSection = sectionMap.get("nfts");
  const wavesSection = sectionMap.get("waves");
  const aboutSection = sectionMap.get("about");

  const clearHoverOpenTimer = useCallback(() => {
    if (hoverOpenTimerRef.current !== undefined) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = undefined;
    }
  }, []);

  const clearHoverCloseTimer = useCallback(() => {
    if (hoverCloseTimerRef.current !== undefined) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = undefined;
    }
  }, []);

  const closeSubmenu = useCallback(() => {
    clearHoverOpenTimer();
    clearHoverCloseTimer();
    setOpenSubmenuKey(null);
    setSubmenuAnchor(null);
    setSubmenuTrigger(null);
    setSubmenuFocusRequest(0);
  }, [clearHoverCloseTimer, clearHoverOpenTimer]);

  const openCollapsedSubmenu = useCallback(
    (sectionKey: string, trigger: HTMLElement, focusFirstItem = false) => {
      clearHoverOpenTimer();
      clearHoverCloseTimer();

      const rect = trigger.getBoundingClientRect();
      setOpenSubmenuKey(sectionKey);
      setSubmenuAnchor({
        left: rect.right + 12,
        top: rect.top,
        height: rect.height,
      });
      setSubmenuTrigger(trigger);
      setSubmenuFocusRequest((previous) => (focusFirstItem ? previous + 1 : 0));
    },
    [clearHoverCloseTimer, clearHoverOpenTimer]
  );

  const scheduleSubmenuClose = useCallback(() => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      hoverCloseTimerRef.current = undefined;
      closeSubmenu();
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearHoverCloseTimer, closeSubmenu]);

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
        if (openSubmenuKey === sectionKey) {
          closeSubmenu();
        } else if (target) {
          openCollapsedSubmenu(sectionKey, target);
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
    [
      closeSubmenu,
      expandedKeys,
      isCollapsed,
      openCollapsedSubmenu,
      openSubmenuKey,
    ]
  );

  const handleSectionPointerEnter = useCallback(
    (sectionKey: string, event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isCollapsed || event.pointerType !== "mouse") {
        return;
      }

      clearHoverOpenTimer();
      clearHoverCloseTimer();

      if (openSubmenuKey === sectionKey) {
        return;
      }

      const trigger = event.currentTarget;
      hoverOpenTimerRef.current = setTimeout(() => {
        hoverOpenTimerRef.current = undefined;
        openCollapsedSubmenu(sectionKey, trigger);
      }, HOVER_OPEN_DELAY_MS);
    },
    [
      clearHoverCloseTimer,
      clearHoverOpenTimer,
      isCollapsed,
      openCollapsedSubmenu,
      openSubmenuKey,
    ]
  );

  const handleSectionPointerLeave = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isCollapsed || event.pointerType !== "mouse") {
        return;
      }

      clearHoverOpenTimer();
      if (openSubmenuKey !== null) {
        scheduleSubmenuClose();
      }
    },
    [clearHoverOpenTimer, isCollapsed, openSubmenuKey, scheduleSubmenuClose]
  );

  const handleSectionKeyDown = useCallback(
    (sectionKey: string, event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isCollapsed || !["Enter", " "].includes(event.key)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (openSubmenuKey === sectionKey) {
        setSubmenuFocusRequest((previous) => previous + 1);
        return;
      }

      openCollapsedSubmenu(sectionKey, event.currentTarget, true);
    },
    [isCollapsed, openCollapsedSubmenu, openSubmenuKey]
  );

  useEffect(
    () => () => {
      clearHoverOpenTimer();
      clearHoverCloseTimer();
    },
    [clearHoverCloseTimer, clearHoverOpenTimer]
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
            focusRequest={submenuFocusRequest}
            onPointerEnter={clearHoverCloseTimer}
            onPointerLeave={scheduleSubmenuClose}
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
      submenuFocusRequest,
      clearHoverCloseTimer,
      scheduleSubmenuClose,
    ]
  );

  const renderExpandableSection = (section: SidebarSection) => (
    <li className={isCollapsed ? "tw-relative" : undefined} key={section.key}>
      <WebSidebarExpandable
        section={section}
        expanded={
          isCollapsed
            ? openSubmenuKey === section.key
            : expandedKeys.includes(section.key)
        }
        onToggle={(event) => handleSectionToggle(section.key, event)}
        onPointerEnter={(event) =>
          handleSectionPointerEnter(section.key, event)
        }
        onPointerLeave={handleSectionPointerLeave}
        onKeyDown={(event) => handleSectionKeyDown(section.key, event)}
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
            href="/join-6529"
            icon={Join6529Icon}
            active={
              safePathname === "/join-6529" ||
              safePathname.startsWith("/join-6529/")
            }
            collapsed={isCollapsed}
            label={t(DEFAULT_LOCALE, "navigation.primary.join6529")}
          />
        </li>

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
