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
    const current = frame?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!frame || !current || frame.scrollWidth <= frame.clientWidth) return;
    const left = current.offsetLeft - frame.offsetLeft;
    const right = left + current.offsetWidth;
    // The bar fades its last 40 px, so the page must end before the fade.
    if (
      left < frame.scrollLeft ||
      right > frame.scrollLeft + frame.clientWidth - 48
    ) {
      frame.scrollLeft = Math.max(0, left - 24);
    }
  }, []);
  return <span ref={marker} hidden />;
}
