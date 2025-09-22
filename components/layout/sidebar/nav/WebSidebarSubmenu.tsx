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

// No offset needed - submenu should be flush with sidebar

function WebSidebarSubmenu({
  section,
  anchor,
  pathname,
  onClose,
}: WebSidebarSubmenuProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position submenu at fixed position - right after collapsed sidebar
  const position = useMemo(() => {
    return {
      top: 0, // Always start from top for full-height submenu
      left: 64 // Fixed 4rem (64px) - collapsed sidebar width
    };
  }, []);

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

  const isActive = (href: string) => pathname === href;

  // Combine all items from section and subsections
  const combinedItems = useMemo(() => {
    const items = [...section.items];
    if (section.subsections) {
      section.subsections.forEach(sub => {
        items.push(...sub.items);
      });
    }
    return items;
  }, [section.items, section.subsections]);

  // SSR check - early return for server-side rendering
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="tw-fixed tw-z-[95] tw-bg-iron-950"
      style={{ top: position.top, left: position.left }}
      role="presentation"
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

        <div className="tw-p-3 tw-overflow-y-auto tw-h-[calc(100vh-56px)] tw-scrollbar-thin tw-scrollbar-thumb-iron-800 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-iron-700">
          {combinedItems.map((item) => {
            const baseClass = "tw-group tw-flex tw-items-center tw-no-underline tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition-all tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-600 focus-visible:tw-ring-offset-1 tw-ring-offset-iron-950 tw-mb-1";

            const stateClass = isActive(item.href)
              ? "tw-text-white tw-bg-iron-800/80"
              : "tw-text-iron-400 desktop-hover:hover:tw-bg-iron-850/50 desktop-hover:hover:tw-text-iron-200";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseClass} ${stateClass}`}
                aria-current={isActive(item.href) ? "page" : undefined}
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
    document.body
  );
}

export default WebSidebarSubmenu;
