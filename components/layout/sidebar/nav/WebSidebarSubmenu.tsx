"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import type {
  SidebarNavItem,
  SidebarSection,
} from "@/components/navigation/navTypes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSidebarNavItemActive } from "./sidebarActive";

const FOCUSABLE_ELEMENT_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

interface WebSidebarSubmenuProps {
  readonly section: SidebarSection;
  readonly pathname: string | null;
  readonly onClose: () => void;
  readonly onPointerEnter?: (() => void) | undefined;
  readonly onPointerLeave?: (() => void) | undefined;
  readonly focusRequest?: number | undefined;
  readonly leftOffset?: number | undefined;
  readonly anchorTop?: number | undefined;
  readonly anchorHeight?: number | undefined;
  readonly triggerElement?: HTMLElement | null | undefined;
}

function WebSidebarSubmenu({
  section,
  pathname,
  onClose,
  onPointerEnter,
  onPointerLeave,
  focusRequest = 0,
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

  const handleEscapeKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      triggerElement?.focus();
      onClose();
    },
    [onClose, triggerElement]
  );

  const handleTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Tab") {
        return;
      }

      const container = containerRef.current;
      const links = Array.from(
        container?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []
      );
      const activeElement = browserDocument?.activeElement;
      const isLeavingBackwards =
        event.shiftKey && activeElement === links.at(0);
      const isLeavingForwards =
        !event.shiftKey && activeElement === links.at(-1);

      if (!isLeavingBackwards && !isLeavingForwards) {
        return;
      }

      event.preventDefault();

      if (isLeavingBackwards) {
        triggerElement?.focus();
        onClose();
        return;
      }

      const sidebarFocusScope = triggerElement?.closest(
        "[data-sidebar-scroll='true']"
      );
      const focusableElements = Array.from(
        sidebarFocusScope?.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENT_SELECTOR
        ) ?? []
      ).filter(
        (element) =>
          !element.closest("[hidden], [inert]") &&
          element.getAttribute("aria-hidden") !== "true"
      );
      const triggerIndex = triggerElement
        ? focusableElements.indexOf(triggerElement)
        : -1;
      const nextFocusable =
        triggerIndex >= 0 ? focusableElements.at(triggerIndex + 1) : null;

      if (nextFocusable) {
        nextFocusable.focus();
        return;
      }

      triggerElement?.focus();
      onClose();
    },
    [browserDocument, onClose, triggerElement]
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      const activeElement = browserDocument?.activeElement;
      if (activeElement && containerRef.current?.contains(activeElement)) {
        return;
      }

      onPointerLeave?.();
    },
    [browserDocument, onPointerLeave]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof Node &&
        (containerRef.current?.contains(nextTarget) ||
          triggerElement?.contains(nextTarget))
      ) {
        return;
      }

      onClose();
    },
    [onClose, triggerElement]
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

    browserWindow.addEventListener("keydown", handleEscapeKeyDown);
    browserDocument.addEventListener("mousedown", handleClickOutside);
    browserDocument.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });

    return () => {
      browserWindow.removeEventListener("keydown", handleEscapeKeyDown);
      browserDocument.removeEventListener("mousedown", handleClickOutside);
      browserDocument.removeEventListener("touchstart", handleClickOutside);
    };
  }, [browserWindow, browserDocument, handleEscapeKeyDown, handleClickOutside]);

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

  useEffect(() => {
    if (focusRequest === 0) {
      return;
    }

    containerRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
  }, [focusRequest, section.key]);

  if (browserDocument === undefined) {
    return null;
  }

  const portalTarget = browserDocument.body;

  const leftStyle =
    leftOffset === undefined
      ? "calc(var(--layout-margin, 0px) + 80px)"
      : `${leftOffset}px`;

  const topStyle = Number.isFinite(computedTop) ? `${computedTop}px` : "16px";
  const renderLink = (item: SidebarNavItem, nested: boolean = false) => {
    const active = isSidebarNavItemActive(item, pathname);

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
        onClick={onClose}
      >
        <span className="tw-truncate">{item.name}</span>
      </Link>
    );
  };

  return createPortal(
    <div
      ref={containerRef}
      id={`sidebar-flyout-${section.key}`}
      className="tailwind-scope tw-fixed tw-z-[95] tw-flex tw-max-h-[65vh] tw-w-64 tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_20px_45px_rgba(7,7,11,0.7)] motion-safe:tw-animate-sidebar-flyout-in motion-reduce:tw-animate-none"
      style={{
        left: leftStyle,
        top: topStyle,
      }}
      role="navigation"
      aria-label={t(DEFAULT_LOCALE, "navigation.sidebar.submenuLabel", {
        section: section.name,
      })}
      onPointerEnter={onPointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleTabKeyDown}
      onBlur={handleBlur}
    >
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700 tw-px-6 tw-pb-2 tw-pt-4">
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
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
              <div className="tw-px-3 tw-pb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-400">
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
