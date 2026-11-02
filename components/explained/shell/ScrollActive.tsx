"use client";

import { useEffect, useRef } from "react";

/**
 * Brings the chapter bar's current page into view when the bar scrolls
 * sideways (a phone, a long translation), so a reader on page 5 sees page 5
 * underlined, not pages 1 and 2. Renders an empty marker inside the bar.
 */
export default function ScrollActive() {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const frame = marker.current
      ?.closest("nav")
      ?.querySelector<HTMLElement>("[data-chapter-scroll]");
    if (!frame) return;
    // The left edge fades once the bar is scrolled from its start.
    const mark = () => {
      frame.dataset["scrolled"] = frame.scrollLeft > 4 ? "1" : "0";
    };
    frame.addEventListener("scroll", mark, { passive: true });
    const current = frame.querySelector<HTMLElement>('[aria-current="page"]');
    if (current && frame.scrollWidth > frame.clientWidth) {
      const start = (element: HTMLElement) =>
        element.offsetLeft - frame.offsetLeft;
      const left = start(current);
      const right = left + current.offsetWidth;
      // The bar fades its last 40 px, so the page must end before the fade.
      if (
        left < frame.scrollLeft ||
        right > frame.scrollLeft + frame.clientWidth - 48
      ) {
        // Start at the page before it when both fit, else at this page:
        // whole pages only, never a fragment of one at the left edge.
        const previous = current.previousElementSibling;
        const before =
          previous instanceof HTMLElement && previous.tagName === "A"
            ? start(previous)
            : null;
        frame.scrollLeft =
          before !== null && right - before <= frame.clientWidth - 48
            ? Math.max(0, before - 12)
            : Math.max(0, left - 12);
      }
    }
    mark();
    return () => frame.removeEventListener("scroll", mark);
  }, []);
  return <span ref={marker} hidden />;
}
