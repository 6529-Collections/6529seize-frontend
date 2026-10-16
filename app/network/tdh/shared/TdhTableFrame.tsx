"use client";

import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { TDH_TABLE_FRAME } from "./tdhStyles";

/**
 * The frame of a TDH data table. Its cells wrap to fit, so on any ordinary
 * screen it never scrolls; in a very narrow window (a 320 px window beside
 * the site's navigation, or 400% zoom) a table that still does not fit
 * scrolls sideways inside the frame rather than the page (WCAG 1.4.10 allows
 * it for data tables). Below 17.5rem a table keeps that width and scrolls,
 * instead of squeezing its columns to a word per line. Only then does the
 * frame become a focusable, labelled region, so keyboard users can scroll it
 * and nobody gets an extra tab stop otherwise.
 */
export default function TdhTableFrame({
  label,
  className = "",
  children,
}: {
  /** The table's name, for the region when it scrolls. */
  readonly label: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Whether the table is wider than its frame, kept in step with the
  // frame's size; never on the server.
  const subscribe = useCallback((onChange: () => void) => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return () => {};
    }
    const observer = new ResizeObserver(onChange);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scrolls = useSyncExternalStore(
    subscribe,
    () => {
      const element = ref.current;
      return element !== null && element.scrollWidth > element.clientWidth + 1;
    },
    () => false
  );

  return (
    <div
      ref={ref}
      data-tdh-scroll=""
      className={`${TDH_TABLE_FRAME} tw-overflow-x-auto [&>table]:tw-min-w-[17.5rem] ${className}`}
      {...(scrolls ? { tabIndex: 0, role: "region", "aria-label": label } : {})}
    >
      {children}
    </div>
  );
}
