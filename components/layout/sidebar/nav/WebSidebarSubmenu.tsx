"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { SIDEBAR_WIDTHS } from "@/constants/sidebar";

interface WebSidebarSubmenuProps {
  readonly section: SidebarSection;
  readonly pathname: string | null;
  readonly onClose: () => void;
  readonly leftOffset?: number;
}

function WebSidebarSubmenu({
  section,
  pathname,
  onClose,
  leftOffset,
}: WebSidebarSubmenuProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const globalScope = globalThis as typeof globalThis & {
    window?: Window;
    document?: Document;
  };
  const browserWindow = globalScope.window;
  const browserDocument = globalScope.document;
  const [mounted, setMounted] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!browserWindow || !browserDocument) return;
    setMounted(true);
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

  const combinedItems = useMemo(
    () => [...section.items, ...(section.subsections?.flatMap((s) => s.items) ?? [])],
    [section.items, section.subsections]
  );

  if (!browserDocument) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`tw-fixed tw-top-0 tw-z-[95] tw-transition-opacity tw-duration-150 tw-ease-out ${
        mounted ? "tw-opacity-100" : "tw-opacity-0"
      }`}
      style={{
        left:
          leftOffset !== undefined
            ? `${leftOffset}px`
            : `calc(var(--layout-margin, 0px) + ${SIDEBAR_WIDTHS.COLLAPSED} + 0.75rem)`,
      }}
    >
      <div
        className="tailwind-scope tw-ml-2.5 tw-w-56 tw-h-screen tw-bg-iron-900 tw-border-solid tw-border-y-0 tw-border-l-0 tw-border-r tw-border-iron-800 tw-rounded-r-xl tw-shadow-[8px_0_40px_rgba(0,0,0,0.55)] tw-overflow-hidden tw-flex tw-flex-col"
        role="menu"
        aria-label={`${section.name} sub-navigation`}
      >
        <div className="tw-px-6 tw-py-4 tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-50">
            {section.name}
          </h3>
        </div>

        <div className="tw-flex-1 tw-p-3 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          {combinedItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tw-group tw-flex tw-items-center tw-no-underline tw-rounded-lg tw-px-3 tw-py-2 tw-mb-1 tw-text-md tw-transition-all tw-duration-150 tw-touch-action-manipulation focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-600 focus-visible:tw-ring-offset-1 tw-ring-offset-iron-950 ${
                  active
                    ? "tw-text-white tw-bg-iron-800 tw-font-semibold desktop-hover:hover:tw-text-white"
                    : "tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50 tw-font-medium"
                }`}
                aria-current={active ? "page" : undefined}
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
