"use client";

import { useCallback, useRef } from "react";

// Wave and competition pages can remount this row during a section change.
let lastWaveTabScroll: {
  waveId: string;
  left: number;
  atEnd: boolean;
} | null = null;

export function useBrainMobileTabScroll(
  waveId: string | undefined,
  waveActive: boolean
) {
  const tabsScrollerRef = useRef<HTMLDivElement | null>(null);
  const restoreTabRowScroll = useCallback(
    (element: HTMLDivElement | null) => {
      tabsScrollerRef.current = element;
      if (!element || !waveActive || !waveId) return;
      if (lastWaveTabScroll?.waveId === waveId) {
        element.scrollTo({
          left: lastWaveTabScroll.atEnd
            ? element.scrollWidth
            : lastWaveTabScroll.left,
          behavior: "instant",
        });
      }
      element
        .querySelector<HTMLElement>('[aria-current="true"]')
        ?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
      let previousEnd = element.scrollWidth - element.clientWidth;
      // A child can add a tab after its own data arrives (for example Winners).
      const observer = new MutationObserver(() => {
        const scrollEnd = element.scrollWidth - element.clientWidth;
        if (
          previousEnd > 0 &&
          scrollEnd !== previousEnd &&
          Math.abs(element.scrollLeft - previousEnd) <= 1
        ) {
          element.scrollLeft = scrollEnd;
          // Newly available sections can move the end past the selected tab.
          // Preserve the end position only while the selected section stays visible.
          element
            .querySelector<HTMLElement>('[aria-current="true"]')
            ?.scrollIntoView({
              block: "nearest",
              inline: "nearest",
              behavior: "instant",
            });
        }
        previousEnd = scrollEnd;
      });
      observer.observe(element, { childList: true });
      return () => {
        observer.disconnect();
        tabsScrollerRef.current = null;
        // A short loading row must not replace the previous scroll position.
        if (
          element.clientWidth === 0 ||
          element.scrollWidth <= element.clientWidth
        )
          return;
        lastWaveTabScroll = {
          waveId,
          left: element.scrollLeft,
          atEnd:
            element.scrollLeft > 0 &&
            element.scrollWidth - element.clientWidth - element.scrollLeft <= 1,
        };
      };
    },
    [waveActive, waveId]
  );

  return { tabsScrollerRef, restoreTabRowScroll };
}
