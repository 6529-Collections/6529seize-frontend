"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import SmallScreenLayout from "@/components/layout/SmallScreenLayout";
import WebLayout from "@/components/layout/WebLayout";
import FooterWrapper from "@/FooterWrapper";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";

type LayoutMode = "web" | "small" | "app";

interface LayoutWrapperClientProps {
  readonly children: ReactNode;
  readonly initialLayout: LayoutMode;
  readonly hasTouchHint: boolean;
  readonly isSmallViewportHint: boolean;
}

const LAYOUT_QUERY = `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px)`;

function useSmallViewport(initialMatch: boolean): boolean {
  const [isSmallViewport, setIsSmallViewport] = useState(initialMatch);

  useEffect(() => {
    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window;
    };
    if (!browserWindow?.matchMedia) {
      setIsSmallViewport(initialMatch);
      return;
    }

    const mediaQuery = browserWindow.matchMedia(LAYOUT_QUERY);
    const updateViewport = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSmallViewport(event.matches);
    };

    updateViewport(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    const previousChangeHandler = mediaQuery.onchange;
    mediaQuery.onchange = updateViewport;
    return () => {
      if (mediaQuery.onchange === updateViewport) {
        mediaQuery.onchange = previousChangeHandler ?? null;
      }
    };
  }, [initialMatch]);

  return isSmallViewport;
}

function useLayoutMode({
  initialLayout,
  hasTouchHint,
  isSmallViewportHint,
}: {
  readonly initialLayout: LayoutMode;
  readonly hasTouchHint: boolean;
  readonly isSmallViewportHint: boolean;
}): LayoutMode {
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const isSmallViewport = useSmallViewport(
    initialLayout === "small" ? true : isSmallViewportHint
  );
  const hasTouch = hasTouchScreen || hasTouchHint;
  if (isApp) return "app";
  if (hasTouch && isSmallViewport) return "small";
  return "web";
}

export default function LayoutWrapperClient({
  children,
  initialLayout,
  hasTouchHint,
  isSmallViewportHint,
}: LayoutWrapperClientProps) {
  const pathname = usePathname();
  const layoutMode = useLayoutMode({
    initialLayout,
    hasTouchHint,
    isSmallViewportHint,
  });

  const shouldBypassLayout =
    pathname?.startsWith("/access") || pathname?.startsWith("/restricted");

  if (shouldBypassLayout) {
    return <>{children}</>;
  }

  const LayoutComponent = useMemo(() => {
    switch (layoutMode) {
      case "app":
        return AppLayout;
      case "small":
        return SmallScreenLayout;
      default:
        return WebLayout;
    }
  }, [layoutMode]);

  return (
    <>
      <LayoutComponent>{children}</LayoutComponent>
      <FooterWrapper />
    </>
  );
}
