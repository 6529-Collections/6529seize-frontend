"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FADE = 36;

function maskFor(start: boolean, end: boolean): string {
  if (!start && !end) {
    return "";
  }
  const left = start ? `transparent, #000 ${FADE}px` : "#000, #000";
  const right = end ? `#000 calc(100% - ${FADE}px), transparent` : "#000, #000";
  return `linear-gradient(to right, ${left}, ${right})`;
}

/** Fade an edge only while there is more to scroll that way. */
function updateFades(container: HTMLElement) {
  const start = container.scrollLeft > 1;
  const end =
    container.scrollLeft + container.clientWidth < container.scrollWidth - 1;
  const mask = maskFor(start, end);
  container.style.maskImage = mask;
  container.style.setProperty("-webkit-mask-image", mask);
}

/**
 * A sideways-scrolling row (the TDH section navigation, the verification
 * calendar): one row at every width. An edge fades only while there is more
 * to scroll that way, and on load the item matching `focusSelector` starts
 * the visible row, without scrolling the page itself.
 */
export default function TdhSubnavScroll({
  className,
  children,
  focusSelector = '[aria-current="page"]',
}: {
  readonly className: string;
  readonly children: ReactNode;
  /** The element to bring into view on load. */
  readonly focusSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) {
      return undefined;
    }
    const active = container.querySelector<HTMLElement>(focusSelector);
    if (active && container.scrollWidth > container.clientWidth) {
      const offset =
        active.getBoundingClientRect().left -
        container.getBoundingClientRect().left +
        container.scrollLeft;
      // The active item starts the visible row, so no label is cut at the
      // left edge; whatever is cut is at the right, under the fade.
      const start = Number.parseFloat(getComputedStyle(container).paddingLeft);
      container.scrollLeft = Math.max(offset - (start || 0), 0);
    }
    const update = () => updateFades(container);
    update();
    container.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(container);
    return () => {
      container.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [focusSelector]);

  return (
    <div ref={ref} data-tdh-scroll="" className={className}>
      {children}
    </div>
  );
}
