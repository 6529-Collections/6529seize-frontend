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
  readonly leftOffset?: number | undefined;
  readonly anchorTop?: number | undefined;
  readonly anchorHeight?: number | undefined;
  readonly triggerElement?: HTMLElement | null | undefined;
}

function WebSidebarSubmenu({
  section,
  pathname,
  onClose,
  leftOffset,
  anchorTop,
  anchorHeight,
  triggerElement,
}: WebSidebarSubmenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasGlobalContext = typeof globalThis !== "undefined";
  const browserWindow = hasGlobalContext
    ? (globalThis.window as Window | undefined)
    : undefined;
  const browserDocument = hasGlobalContext
    ? (globalThis.document as Document | undefined)
    : undefined;

  const [computedTop, setComputedTop] = useState<number>(() => anchorTop ?? 16);
  const totalItemCount = useMemo(
    () =>
      section.items.length +
      (section.subsections?.reduce(
        (count, subsection) => count + subsection.items.length + 1,
        0
      ) ?? 0),
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
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const container = containerRef.current;
      if (container?.contains(target)) {
        return;
      }

      if (triggerElement?.contains(target)) {
        return;
      }

      onClose();
    },
    [onClose, triggerElement]
  );

  useEffect(() => {
    if (browserWindow === undefined || browserDocument === undefined) {
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

      setComputedTop((previous) => (previous === top ? previous : top));
    }
  }, [browserWindow, anchorTop, anchorHeight, section.key, totalItemCount]);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  if (browserDocument === undefined) {
    return null;
  }

  const portalTarget = browserDocument.body;
  if (!portalTarget) {
    return null;
  }

  const leftStyle =
    leftOffset === undefined
      ? "calc(var(--layout-margin, 0px) + 80px)"
      : `${leftOffset}px`;

  const topStyle = Number.isFinite(computedTop) ? `${computedTop}px` : "16px";
  const renderLink = (
    item: { name: string; href: string },
    nested: boolean = false
  ) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`tw-touch-action-manipulation tw-group tw-flex tw-items-center tw-rounded-lg tw-no-underline tw-ring-offset-iron-950 tw-transition-all tw-duration-300 focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-600 focus-visible:tw-ring-offset-1 ${
          nested
            ? "tw-min-h-10 tw-px-3 tw-py-2 tw-text-sm"
            : "tw-mb-1 tw-px-3 tw-py-2 tw-text-md"
        } ${
          active
            ? "tw-bg-iron-700 tw-font-semibold tw-text-white desktop-hover:hover:tw-text-white"
            : "tw-font-medium tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700/50 desktop-hover:hover:tw-text-iron-50"
        }`}
        aria-current={active ? "page" : undefined}
        role="menuitem"
        onClick={onClose}
      >
        <span className="tw-truncate">{item.name}</span>
      </Link>
    );
  };

  return createPortal(
    <div
      ref={containerRef}
      className="tailwind-scope tw-fixed tw-z-[95] tw-flex tw-max-h-[65vh] tw-w-64 tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_20px_45px_rgba(7,7,11,0.7)]"
      style={{
        left: leftStyle,
        top: topStyle,
      }}
      role="menu"
      aria-label={`${section.name} sub-navigation`}
    >
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700 tw-px-6 tw-pb-2 tw-pt-4">
        <h3 className="tw-text-base tw-font-semibold tw-text-iron-50">
          {section.name}
        </h3>
      </div>

      <div className="tw-flex-1 tw-overflow-y-auto tw-p-3 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        {section.items.map((item) => renderLink(item))}

        {section.subsections?.map((subsection) => {
          return (
            <div
              key={subsection.name}
              className={
                section.items.length > 0 ? "tw-mt-3" : "tw-mt-3 first:tw-mt-0"
              }
            >
              <div className="tw-px-3 tw-pb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
                {subsection.name}
              </div>

              <div className="tw-ml-3 tw-border-0 tw-border-l tw-border-solid tw-border-iron-700 tw-pl-2">
                {subsection.items.map((item) => renderLink(item, true))}
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    portalTarget
  );
}

export default WebSidebarSubmenu;
