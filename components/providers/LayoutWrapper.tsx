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
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT;
  });
  const pathname = usePathname();

  useEffect(() => {
    if (!hasTouchScreen) {
      setIsTouchTabletViewport(false);
      return;
    }

    const mediaQuery = window.matchMedia(
      `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px)`
    );

    setIsTouchTabletViewport(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => {
      setIsTouchTabletViewport(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
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
