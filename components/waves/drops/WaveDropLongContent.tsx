"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getDropContentPreview } from "@/helpers/waves/dropContentPreview";
import { t } from "@/i18n/messages";
import type { MouseEvent, ReactNode } from "react";
import { useId, useLayoutEffect, useMemo, useRef } from "react";
import { useWaveDropContentExpansion } from "./WaveDropContentExpansionContext";

const BOTTOM_SCROLL_THRESHOLD_PX = 50;

interface PendingAnchor {
  readonly top: number;
  readonly expandedTopPadding: string | undefined;
  readonly pinToBottom: boolean;
  readonly scrollContainer: HTMLDivElement;
}

const getMinimumScrollTop = (container: HTMLDivElement) =>
  Math.min(0, container.clientHeight - container.scrollHeight);

function getExpandedTopPadding(container: HTMLDivElement): string | undefined {
  // The top sentinel is the final child in the reverse-scrolling list.
  const topSentinel = container.lastElementChild;
  if (!topSentinel || getMinimumScrollTop(container) < 0) return;

  const viewportTop =
    container.getBoundingClientRect().top + container.clientTop;
  const spaceAboveHistory =
    topSentinel.getBoundingClientRect().top - viewportTop;
  const existingPadding =
    Number.parseFloat(getComputedStyle(container).paddingTop) || 0;
  if (spaceAboveHistory - existingPadding >= 1) {
    return `${Math.ceil(spaceAboveHistory)}px`;
  }
}

function preserveEmptyTopSpace(
  container: HTMLDivElement,
  expandedPadding: string | undefined
) {
  if (expandedPadding === undefined) return;

  // Short chats are bottom-aligned. Preserve their existing blank space above
  // the history so scrolling can reach the old reading position after growth.
  const originalPadding = container.style.paddingTop;
  container.style.paddingTop = expandedPadding;
  return () => {
    if (container.style.paddingTop === expandedPadding) {
      container.style.paddingTop = originalPadding;
    }
  };
}

function keepFocusVisible(
  button: HTMLButtonElement,
  content: HTMLDivElement,
  container: HTMLDivElement
) {
  if (button.ownerDocument.activeElement !== button) return;

  const toggleBounds = button.getBoundingClientRect();
  const viewport = container.getBoundingClientRect();
  if (viewport.bottom <= viewport.top) return;
  if (
    toggleBounds.top >= viewport.bottom ||
    toggleBounds.bottom <= viewport.top
  ) {
    content.focus({ preventScroll: true });
  }
}

interface WaveDropLongContentProps {
  readonly children: (collapsed: boolean) => ReactNode;
  readonly content: string;
  readonly expansionKey: string;
}

export default function WaveDropLongContent({
  children,
  content,
  expansionKey,
}: WaveDropLongContentProps) {
  const locale = useBrowserLocale();
  const contentId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingAnchorRef = useRef<PendingAnchor | null>(null);
  const { enabled, isExpanded, scrollContainerRef, setExpanded } =
    useWaveDropContentExpansion(expansionKey);
  const preview = useMemo(
    () => (enabled ? getDropContentPreview(content) : null),
    [content, enabled]
  );

  useLayoutEffect(() => {
    const pendingAnchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    if (!pendingAnchor) {
      return;
    }

    const button = buttonRef.current;
    const contentElement = contentRef.current;
    if (
      !button ||
      !contentElement ||
      scrollContainerRef.current !== pendingAnchor.scrollContainer
    ) {
      // The drop may have been virtualized before this layout effect. Its
      // measured placeholder already preserves the occupied scroll space.
      return;
    }

    const container = pendingAnchor.scrollContainer;
    const anchor = isExpanded ? contentElement : button;
    let releaseEmptyTopSpace = preserveEmptyTopSpace(
      container,
      pendingAnchor.expandedTopPadding
    );
    const correctPosition = () => {
      if (pendingAnchor.pinToBottom) {
        container.scrollTop = 0;
        return;
      }
      const topDelta = anchor.getBoundingClientRect().top - pendingAnchor.top;
      // Layout may already have anchored or clamped the browser's position.
      container.scrollTop = Math.max(
        getMinimumScrollTop(container),
        Math.min(0, container.scrollTop + topDelta)
      );
      if (isExpanded) keepFocusVisible(button, contentElement, container);
    };
    correctPosition();

    // A newly revealed image/card can resize after the toggle. Keep this
    // anchor only until the next reader interaction; never fight scrolling.
    let expectedScrollTop = container.scrollTop;
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            correctPosition();
            expectedScrollTop = container.scrollTop;
          });
    const stopAnchoring = () => observer?.disconnect();
    const handleScroll = () => {
      if (Math.abs(container.scrollTop - expectedScrollTop) <= 2) return;
      stopAnchoring();
      if (container.scrollTop < 0) return;
      releaseEmptyTopSpace?.();
      releaseEmptyTopSpace = undefined;
    };
    observer?.observe(contentElement);
    const intentEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
    for (const event of intentEvents)
      container.addEventListener(event, stopAnchoring, { passive: true });
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      stopAnchoring();
      releaseEmptyTopSpace?.();
      for (const event of intentEvents)
        container.removeEventListener(event, stopAnchoring);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isExpanded, scrollContainerRef]);

  if (!preview?.isLong) {
    return children(false);
  }

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const scrollContainer = scrollContainerRef.current;
    const anchor = isExpanded ? buttonRef.current : contentRef.current;
    if (scrollContainer && anchor) {
      pendingAnchorRef.current = {
        top: anchor.getBoundingClientRect().top,
        expandedTopPadding: isExpanded
          ? undefined
          : getExpandedTopPadding(scrollContainer),
        pinToBottom:
          isExpanded &&
          Math.abs(scrollContainer.scrollTop) <= BOTTOM_SCROLL_THRESHOLD_PX,
        scrollContainer,
      };
    }
    setExpanded(expansionKey, !isExpanded);
  };

  return (
    <div>
      <div
        id={contentId}
        ref={contentRef}
        tabIndex={-1}
        className="focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw--outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {children(!isExpanded)}
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="desktop-hover:hover:tw-text-primary-200 tw-mt-1 tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-xs tw-font-medium tw-text-primary-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        onPointerDown={(event) => {
          // WebKit can scroll a focused touch target again after layout settles.
          // Keep keyboard/mouse focus, but avoid that extra focus scroll on taps.
          if (event.pointerType === "touch") event.preventDefault();
        }}
        onClick={handleToggle}
      >
        {t(
          locale,
          isExpanded
            ? "waves.drop.actions.showLess"
            : "waves.drop.actions.showMore"
        )}
      </button>
    </div>
  );
}
