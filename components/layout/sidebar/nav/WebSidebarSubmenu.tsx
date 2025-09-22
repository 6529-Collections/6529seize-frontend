"use client";

import Link from "next/link";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { SidebarSection } from "@/components/navigation/navTypes";

interface WebSidebarSubmenuProps {
  readonly section: SidebarSection;
  readonly anchor: HTMLElement;
  readonly pathname: string | null;
  readonly onClose: () => void;
}

const FLYOUT_OFFSET = 12;

function WebSidebarSubmenu({
  section,
  anchor,
  pathname,
  onClose,
}: WebSidebarSubmenuProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Simple position calculation - full height from top, positioned to the right of anchor
  const position = useMemo(() => {
    const rect = anchor.getBoundingClientRect();
    return {
      top: 0, // Always start from top for full-height submenu
      left: rect.right + FLYOUT_OFFSET
    };
  }, [anchor]);

  // Memoize event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (
      popoverRef.current &&
      !popoverRef.current.contains(target) &&
      !anchor.contains(target)
    ) {
      onClose();
    }
  }, [onClose, anchor, popoverRef]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleKeyDown, handleClickOutside]);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  // Memoize combined items to prevent recalculation
  const combinedItems = useMemo(() => [
    ...section.items,
    ...(section.subsections?.flatMap((sub) => sub.items) ?? []),
  ], [section.items, section.subsections]);

  // SSR check - early return for server-side rendering
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="tw-fixed tw-z-[95]"
      style={{ top: position.top, left: position.left }}
      role="presentation"
    >
      <div
        className="tailwind-scope tw-w-64 tw-border tw-border-r tw-border-solid tw-border-y-0 tw-border-l-0 tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_20px_45px_rgba(0,0,0,0.7)] tw-overflow-hidden tw-h-screen"
        role="menu"
        aria-label={`${section.name} sub-navigation`}
      >
        <div className="tw-px-2 tw-py-3 tw-overflow-y-auto tw-h-full tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-800">
          {combinedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`tw-flex tw-items-center tw-no-underline tw-rounded-lg tw-px-3 tw-h-10 tw-text-sm tw-font-medium tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-400 focus-visible:tw-ring-offset-2 tw-ring-offset-black ${
                isActive(item.href)
                  ? "tw-text-white tw-bg-iron-800/70"
                  : "tw-text-iron-300 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
              role="menuitem"
              onClick={onClose}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default WebSidebarSubmenu;
