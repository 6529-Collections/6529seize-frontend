"use client";

import React, { useEffect, useMemo } from "react";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";

interface LayoutDebugOverlayProps {
  readonly containerRef?: React.RefObject<HTMLElement | null>;
  readonly headerRef?: React.RefObject<HTMLElement | null>;
}

export default function LayoutDebugOverlay({
  containerRef,
  headerRef,
}: LayoutDebugOverlayProps) {
  const { spaces } = useLayout();

  const docHeights = useMemo(() => {
    const { window: browserWindow, document: browserDocument } =
      globalThis as typeof globalThis & {
        window?: Window;
        document?: Document;
      };
    return {
      innerHeight: browserWindow?.innerHeight ?? 0,
      clientHeight: browserDocument?.documentElement?.clientHeight ?? 0,
      scrollHeight: browserDocument?.documentElement?.scrollHeight ?? 0,
    };
  }, [spaces]);

  useEffect(() => {
    // Log to console on changes
    const c = containerRef?.current as HTMLElement | null;
    const h = headerRef?.current as HTMLElement | null;
    const { window: browserWindow, document: browserDocument } =
      globalThis as typeof globalThis & {
        window?: Window;
        document?: Document;
      };
    const windowInnerHeight = browserWindow?.innerHeight ?? 0;
    const documentClientHeight = browserDocument?.documentElement?.clientHeight ?? 0;
    const documentScrollHeight = browserDocument?.documentElement?.scrollHeight ?? 0;

    // Use collapsed group for readability
    // eslint-disable-next-line no-console
    console.groupCollapsed("[LayoutDebug] spaces + heights");
    // eslint-disable-next-line no-console
    console.log("spaces", spaces);
    // eslint-disable-next-line no-console
    console.log("window.innerHeight", windowInnerHeight);
    // eslint-disable-next-line no-console
    console.log("documentElement.clientHeight", documentClientHeight);
    // eslint-disable-next-line no-console
    console.log("documentElement.scrollHeight", documentScrollHeight);
    if (c) {
      // eslint-disable-next-line no-console
      console.log("container: clientHeight / offsetHeight / scrollHeight", c.clientHeight, c.offsetHeight, c.scrollHeight);
    }
    if (h) {
      // eslint-disable-next-line no-console
      console.log("header: clientHeight / offsetHeight", h.clientHeight, h.offsetHeight);
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }, [spaces, containerRef, headerRef]);

  return (
    <div className="tailwind-scope tw-fixed tw-bottom-2 tw-right-2 tw-z-[1000] tw-max-w-[90vw] tw-rounded-lg tw-bg-black/70 tw-text-iron-200 tw-text-[11px] tw-leading-tight tw-p-3 tw-space-y-1 tw-pointer-events-none">
      <div className="tw-font-semibold tw-text-iron-100">Layout Debug</div>
      <div>innerHeight: {docHeights.innerHeight}</div>
      <div>clientHeight: {docHeights.clientHeight}</div>
      <div>scrollHeight: {docHeights.scrollHeight}</div>
      <div className="tw-h-px tw-bg-iron-700 tw-my-1" />
      <div>headerSpace: {spaces.headerSpace}</div>
      <div>tabsSpace: {spaces.tabsSpace}</div>
      <div>pinnedSpace: {spaces.pinnedSpace}</div>
      <div>mobileTabsSpace: {spaces.mobileTabsSpace}</div>
      <div>mobileNavSpace: {spaces.mobileNavSpace}</div>
      <div>spacerSpace: {spaces.spacerSpace}</div>
      <div className="tw-h-px tw-bg-iron-700 tw-my-1" />
      <div>contentSpace: {spaces.contentSpace}</div>
    </div>
  );
}
