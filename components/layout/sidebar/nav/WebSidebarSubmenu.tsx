"use client";

import Link from "next/link";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { SIDEBAR_DIMENSIONS } from "@/constants/sidebar";

interface WebSidebarSubmenuProps {
  readonly section: SidebarSection;
  readonly anchor: HTMLElement;
  readonly pathname: string | null;
  readonly onClose: () => void;
}

function WebSidebarSubmenu({
  section,
  anchor,
  pathname,
  onClose,
}: WebSidebarSubmenuProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const browserWindow =
    typeof globalThis.window === "undefined" ? undefined : globalThis.window;
  const browserDocument =
    typeof globalThis.document === "undefined" ? undefined : globalThis.document;

  // Position submenu at fixed position - right after collapsed sidebar
  const submenuPosition = {
    top: 0,
    left: `${SIDEBAR_DIMENSIONS.COLLAPSED_WIDTH_REM}rem`,
  };

  // Memoize event handlers
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !anchor.contains(target)
      ) {
        onClose();
      }
    },
    [onClose, anchor]
  );

  useEffect(() => {
    if (!browserWindow || !browserDocument) {
      return;
    }

    browserWindow.addEventListener("keydown", handleKeyDown);
    browserDocument.addEventListener("mousedown", handleClickOutside);
    browserDocument.addEventListener("touchstart", handleClickOutside);

    return () => {
      browserWindow.removeEventListener("keydown", handleKeyDown);
      browserDocument.removeEventListener("mousedown", handleClickOutside);
      browserDocument.removeEventListener("touchstart", handleClickOutside);
    };
  }, [browserWindow, browserDocument, handleKeyDown, handleClickOutside]);

  const isActive = (href: string) => pathname === href;

  // Combine all items from section and subsections
  const combinedItems = useMemo(() => {
    return [
      ...section.items,
      ...(section.subsections?.flatMap(sub => sub.items) ?? [])
    ];
  }, [section.items, section.subsections]);

  // SSR check - early return for server-side rendering
  if (!browserDocument) {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="tw-fixed tw-z-[95] tw-bg-iron-950"
      style={{ top: submenuPosition.top, left: submenuPosition.left }}
    >
      <div
        className="tailwind-scope tw-w-56 tw-bg-iron-950 tw-backdrop-blur-xl tw-border-r tw-border-solid tw-border-y-0 tw-border-l-0 tw-border-iron-800/50 tw-shadow-2xl tw-shadow-black/80 tw-overflow-hidden tw-h-screen"
        role="menu"
        aria-label={`${section.name} sub-navigation`}
      >
        {/* Header with section name */}
        <div className="tw-px-6 tw-py-4 tw-border-b tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-t-0">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-50">
            {section.name}
          </h3>
        </div>

        <div
          className="tw-p-3 tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
          style={{
            height: `calc(100vh - ${SIDEBAR_DIMENSIONS.SUBMENU_HEADER_HEIGHT_REM}rem)`,
          }}
        >
          {combinedItems.map((item) => {
            const isItemActive = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tw-group tw-flex tw-items-center tw-no-underline tw-rounded-lg tw-px-3 tw-py-2 tw-mb-1 tw-text-sm tw-transition-all tw-duration-150 tw-touch-action-manipulation focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-600 focus-visible:tw-ring-offset-1 tw-ring-offset-iron-950 ${
                  isItemActive
                    ? "tw-text-white tw-bg-iron-800/80 tw-font-semibold"
                    : "tw-text-iron-400 desktop-hover:hover:tw-bg-iron-850/50 desktop-hover:hover:tw-text-iron-200 tw-font-medium"
                }`}
                aria-current={isItemActive ? "page" : undefined}
                role="menuitem"
                onClick={onClose}
              >
                <span className="tw-truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>,
    browserDocument.body
  );
}

export default WebSidebarSubmenu;
