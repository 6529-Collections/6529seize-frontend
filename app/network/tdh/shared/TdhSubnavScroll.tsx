"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The section navigation's sideways-scrolling region. On phones it brings the
 * current page's tab into view on load, without scrolling the page itself.
 */
export default function TdhSubnavScroll({
  className,
  children,
}: {
  readonly className: string;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    const active = container?.querySelector<HTMLElement>(
      '[aria-current="page"]'
    );
    if (!container || !active) {
      return;
    }
    if (container.scrollWidth <= container.clientWidth) {
      return;
    }
    const offset =
      active.getBoundingClientRect().left -
      container.getBoundingClientRect().left +
      container.scrollLeft;
    container.scrollLeft = Math.max(
      offset - (container.clientWidth - active.offsetWidth) / 2,
      0
    );
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
