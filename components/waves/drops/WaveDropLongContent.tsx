"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getDropContentPreview } from "@/helpers/waves/dropContentPreview";
import { t } from "@/i18n/messages";
import type { MouseEvent, ReactNode } from "react";
import { useId, useLayoutEffect, useMemo, useRef } from "react";
import { useWaveDropContentExpansion } from "./WaveDropContentExpansionContext";
import {
  WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER,
  WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
} from "@/helpers/waves/wave-visible-serial.helpers";

const BOTTOM_SCROLL_THRESHOLD_PX = 50;

// The windowed chat scrolls in normal order: its newest message is at the
// largest scrollTop. The reversed chat's newest message is at scrollTop 0.
const isEndAnchored = (container: HTMLElement) =>
  container.getAttribute(WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE) ===
  WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER;

const getMaxScrollTop = (container: HTMLElement) =>
  Math.max(0, container.scrollHeight - container.clientHeight);

const isAtNewest = (container: HTMLElement) =>
  isEndAnchored(container)
    ? getMaxScrollTop(container) - container.scrollTop <=
      BOTTOM_SCROLL_THRESHOLD_PX
    : Math.abs(container.scrollTop) <= BOTTOM_SCROLL_THRESHOLD_PX;

interface PendingAnchor {
  readonly buttonTop: number;
  readonly scrollContainer: HTMLDivElement;
  readonly wasAtBottom: boolean;
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
    if (
      !button ||
      scrollContainerRef.current !== pendingAnchor.scrollContainer
    ) {
      // The drop may have been virtualized before this layout effect. Its
      // measured placeholder already preserves the occupied scroll space.
      return;
    }

    const container = pendingAnchor.scrollContainer;
    const endAnchored = isEndAnchored(container);
    const correctPosition = () => {
      if (pendingAnchor.wasAtBottom) {
        container.scrollTop = endAnchored ? getMaxScrollTop(container) : 0;
        return;
      }
      const buttonTopDelta =
        button.getBoundingClientRect().top - pendingAnchor.buttonTop;
      if (endAnchored) {
        container.scrollTop = Math.min(
          getMaxScrollTop(container),
          Math.max(0, container.scrollTop + buttonTopDelta)
        );
        return;
      }
      const minimumScrollTop = Math.min(
        0,
        container.clientHeight - container.scrollHeight
      );
      // Layout may already have anchored or clamped the browser's position.
      container.scrollTop = Math.max(
        minimumScrollTop,
        Math.min(0, container.scrollTop + buttonTopDelta)
      );
    };
    correctPosition();

    const contentElement = contentRef.current;
    if (!contentElement || typeof ResizeObserver === "undefined") return;

    // A newly revealed image/card can resize after the toggle. Keep this
    // anchor only until the next reader interaction; never fight scrolling.
    let expectedScrollTop = container.scrollTop;
    const observer = new ResizeObserver(() => {
      correctPosition();
      expectedScrollTop = container.scrollTop;
    });
    const stopAnchoring = () => observer.disconnect();
    const handleScroll = () => {
      if (Math.abs(container.scrollTop - expectedScrollTop) > 2)
        stopAnchoring();
    };
    observer.observe(contentElement);
    const intentEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
    for (const event of intentEvents)
      container.addEventListener(event, stopAnchoring, { passive: true });
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
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
    const button = buttonRef.current;
    if (scrollContainer && button) {
      pendingAnchorRef.current = {
        buttonTop: button.getBoundingClientRect().top,
        scrollContainer,
        wasAtBottom: isAtNewest(scrollContainer),
      };
    }
    setExpanded(expansionKey, !isExpanded);
  };

  return (
    <div>
      <div id={contentId} ref={contentRef}>
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
