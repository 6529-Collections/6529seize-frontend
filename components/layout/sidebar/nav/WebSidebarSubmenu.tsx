"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { SidebarSection } from "@/components/navigation/navTypes";

interface WebSidebarSubmenuProps {
  readonly section: SidebarSection;
  readonly pathname: string | null;
  readonly onClose: () => void;
  readonly leftOffset?: number;
  readonly anchorTop?: number;
  readonly anchorHeight?: number;
}

function WebSidebarSubmenu({
  section,
  pathname,
  onClose,
  leftOffset,
  anchorTop,
  anchorHeight,
}: WebSidebarSubmenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const globalScope = globalThis as typeof globalThis & {
    window?: Window;
    document?: Document;
  };
  const browserWindow = globalScope.window;
  const browserDocument = globalScope.document;

  const [computedTop, setComputedTop] = useState<number>(() => anchorTop ?? 16);

  const combinedItems = useMemo(
    () => [
      ...section.items,
      ...(section.subsections?.flatMap((sub) => sub.items) ?? []),
    ],
    [section.items, section.subsections]
  );

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
      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!browserWindow || !browserDocument) return;

    browserWindow.addEventListener("keydown", handleKeyDown);
    browserDocument.addEventListener("mousedown", handleClickOutside);
    browserDocument.addEventListener("touchstart", handleClickOutside);
    return () => {
      browserWindow.removeEventListener("keydown", handleKeyDown);
      browserDocument.removeEventListener("mousedown", handleClickOutside);
      browserDocument.removeEventListener("touchstart", handleClickOutside);
    };
  }, [browserWindow, browserDocument, handleKeyDown, handleClickOutside]);

  useLayoutEffect(() => {
    if (browserWindow && containerRef.current) {
      const menuRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = browserWindow.innerHeight || 0;
      const padding = 16;

      const anchorCenter =
        anchorTop !== undefined && anchorHeight !== undefined
          ? anchorTop + anchorHeight / 2
          : (anchorTop ?? padding) + menuRect.height / 2;

      let top = anchorCenter - menuRect.height / 2;
      top = Math.max(
        padding,
        Math.min(top, viewportHeight - menuRect.height - padding)
      );

      setComputedTop(top);
    }
  }, [browserWindow, anchorTop, anchorHeight, section.key, combinedItems.length]);

  const isActive = useCallback(
    (href: string) => pathname === href,
    [pathname]
  );

  if (browserDocument) {
    const leftStyle =
      leftOffset === undefined
        ? "calc(var(--layout-margin, 0px) + 80px)"
        : `${leftOffset}px`;

    const topStyle = Number.isFinite(computedTop)
      ? `${computedTop}px`
      : "16px";

    return createPortal(
      <div
        ref={containerRef}
        className="tailwind-scope tw-fixed tw-z-[95] tw-ml-2 tw-w-64 tw-max-h-[65vh] tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-shadow-[0_20px_45px_rgba(7,7,11,0.7)] tw-overflow-hidden tw-flex tw-flex-col"
        style={{
          left: leftStyle,
          top: topStyle,
        }}
        role="menu"
        aria-label={`${section.name} sub-navigation`}
      >
        <div className="tw-px-6 tw-pt-4 tw-pb-2 tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
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
                className={`tw-group tw-flex tw-items-center tw-no-underline tw-rounded-lg tw-px-3 tw-py-2 tw-mb-1 tw-text-md tw-transition-all tw-duration-300 tw-touch-action-manipulation focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-600 focus-visible:tw-ring-offset-1 tw-ring-offset-iron-950 ${
                  active
                    ? "tw-text-white tw-bg-iron-700 tw-font-semibold desktop-hover:hover:tw-text-white"
                    : "tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700/50 desktop-hover:hover:tw-text-iron-50 tw-font-medium"
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
      </div>,
      browserDocument.body
    );
  }

  return null;
}

export default WebSidebarSubmenu;
