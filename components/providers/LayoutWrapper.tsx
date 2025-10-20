"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import WebLayout from "@/components/layout/WebLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import SmallScreenLayout from "@/components/layout/SmallScreenLayout";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";
import FooterWrapper from "@/FooterWrapper";

export default function LayoutWrapper({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const isSmallScreen = useIsMobileScreen();
  const [isTouchTabletViewport, setIsTouchTabletViewport] = useState(() => {
    if (globalThis.window === undefined) {
      return false;
    }
    return globalThis.window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT;
  });
  const pathname = usePathname();

  useEffect(() => {
    if (!hasTouchScreen) {
      setIsTouchTabletViewport(false);
      return;
    }

    const browserWindow = globalThis.window;
    if (browserWindow === undefined) {
      setIsTouchTabletViewport(false);
      return;
    }

    const mediaQuery = browserWindow.matchMedia(
      `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px)`
    );

    setIsTouchTabletViewport(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => {
      setIsTouchTabletViewport(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => {
        mediaQuery.removeEventListener?.("change", listener);
      };
    }

    const previousOnChange = mediaQuery.onchange;
    mediaQuery.onchange = listener;
    return () => {
      if (mediaQuery.onchange === listener) {
        mediaQuery.onchange = previousOnChange ?? null;
      }
    };
  }, [hasTouchScreen]);

  const isAccessOrRestricted =
    pathname?.startsWith("/access") || pathname?.startsWith("/restricted");

  let LayoutComponent: ComponentType<{ readonly children: ReactNode }> = WebLayout;

  const shouldUseSmallScreenLayout =
    hasTouchScreen && (isSmallScreen || isTouchTabletViewport);

  if (isApp) {
    LayoutComponent = MobileLayout;
  } else if (shouldUseSmallScreenLayout) {
    LayoutComponent = SmallScreenLayout;
  }

  if (isAccessOrRestricted) {
    return <>{children}</>;
  }

  return (
    <>
      <LayoutComponent>{children}</LayoutComponent>
      <FooterWrapper />
    </>
  );
}
