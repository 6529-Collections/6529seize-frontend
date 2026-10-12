"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getDropContentPreview } from "@/helpers/waves/dropContentPreview";
import { t } from "@/i18n/messages";
import type { MouseEvent, ReactNode } from "react";
import { useId, useLayoutEffect, useMemo, useRef } from "react";
import { useWaveDropContentExpansion } from "./WaveDropContentExpansionContext";

const BOTTOM_SCROLL_THRESHOLD_PX = 50;

interface PendingAnchor {
  readonly buttonTop: number;
  readonly scrollContainer: HTMLDivElement;
  readonly scrollTop: number;
  readonly wasAtBottom: boolean;
}

interface WaveDropLongContentProps {
  readonly children: ReactNode;
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
  const pendingAnchorRef = useRef<PendingAnchor | null>(null);
  const preview = useMemo(() => getDropContentPreview(content), [content]);
  const { enabled, isExpanded, scrollContainerRef, setExpanded } =
    useWaveDropContentExpansion(expansionKey);

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

    if (pendingAnchor.wasAtBottom) {
      pendingAnchor.scrollContainer.scrollTop = 0;
      return;
    }

    const buttonTopDelta =
      button.getBoundingClientRect().top - pendingAnchor.buttonTop;
    const minimumScrollTop = Math.min(
      0,
      pendingAnchor.scrollContainer.clientHeight -
        pendingAnchor.scrollContainer.scrollHeight
    );
    pendingAnchor.scrollContainer.scrollTop = Math.max(
      minimumScrollTop,
      Math.min(0, pendingAnchor.scrollTop + buttonTopDelta)
    );
  }, [isExpanded, scrollContainerRef]);

  if (!enabled || !preview.isLong) {
    return children;
  }

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const scrollContainer = scrollContainerRef.current;
    const button = buttonRef.current;
    if (scrollContainer && button) {
      pendingAnchorRef.current = {
        buttonTop: button.getBoundingClientRect().top,
        scrollContainer,
        scrollTop: scrollContainer.scrollTop,
        wasAtBottom:
          Math.abs(scrollContainer.scrollTop) <= BOTTOM_SCROLL_THRESHOLD_PX,
      };
    }
    setExpanded(expansionKey, !isExpanded);
  };

  return (
    <div>
      <div id={contentId}>
        {isExpanded ? (
          children
        ) : (
          <p className="sm:tw-line-clamp-8 tw-m-0 tw-line-clamp-6 tw-whitespace-pre-wrap tw-break-words tw-text-md tw-font-normal tw-leading-6 tw-text-iron-200">
            {preview.text}
          </p>
        )}
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="desktop-hover:hover:tw-text-primary-200 tw-mt-1 tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
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
