"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { finishVersionReloadWhenReady } from "@/components/version-update/versionReload";
import FooterWrapper from "@/components/footer/FooterWrapper";
import MobileLayout from "@/components/layout/MobileLayout";
import NativeStartupBoundary from "@/components/layout/NativeStartupBoundary";
import WebLayout from "@/components/layout/WebLayout";
import LayoutErrorFallback from "@/components/providers/LayoutErrorFallback";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";
import { useGlobalRefresh } from "@/contexts/RefreshContext";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  markMobileLaunchStep,
  scheduleMobileLaunchFlush,
} from "@/utils/monitoring/mobileLaunchTiming";
import type { ComponentType, ReactNode } from "react";

const getTouchTabletViewportSnapshot = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT;
};

const getTouchTabletViewportServerSnapshot = (): boolean => false;

const subscribeTouchTabletViewport = (
  onStoreChange: () => void
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(
    `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 0.02}px)`
  );

  mediaQuery.addEventListener("change", onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
};

export default function LayoutWrapper({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { isApp, hasTouchScreen, isMobileDevice } = useDeviceInfo();
  const { refreshKey } = useGlobalRefresh();
  const isSmallScreen = useIsMobileScreen();
  const isTouchTabletViewport = useSyncExternalStore(
    subscribeTouchTabletViewport,
    getTouchTabletViewportSnapshot,
    getTouchTabletViewportServerSnapshot
  );
  const pathname = usePathname();

  const isAccessOrRestricted =
    pathname.startsWith("/access") || pathname.startsWith("/restricted");

  useEffect(() => {
    const flushAfterPaint = () => {
      void finishVersionReloadWhenReady();
      markMobileLaunchStep("first_useful_app_shell");
      scheduleMobileLaunchFlush("shell_paint", 5000);
    };

    if (typeof globalThis.requestAnimationFrame === "function") {
      const frameId = globalThis.requestAnimationFrame(flushAfterPaint);
      return () => {
        globalThis.cancelAnimationFrame(frameId);
      };
    }

    const timeoutId = globalThis.setTimeout(flushAfterPaint, 0);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [pathname]);

  const LayoutComponent: ComponentType<{
    readonly children: ReactNode;
    readonly isSmall?: boolean;
  }> = isApp ? MobileLayout : WebLayout;

  // hasTouchScreen covers touch-first hardware; isMobileDevice (UA-based)
  // keeps phones on the small layout even when a mouse or trackpad is
  // attached. Hybrid touch laptops match neither, so they stay on WebLayout.
  const isSmallLayout =
    (hasTouchScreen || isMobileDevice) &&
    (isSmallScreen || isTouchTabletViewport);

  if (isAccessOrRestricted) {
    // These standalone pages never mount web/native chrome. Keep their content
    // immediately available instead of hiding it behind native layout startup.
    return <>{children}</>;
  }

  return (
    <NativeStartupBoundary isNativeLayout={isApp}>
      <LayoutComponent isSmall={isSmallLayout}>
        <ErrorBoundary
          key={refreshKey}
          FallbackComponent={LayoutErrorFallback}
          resetKeys={[pathname, refreshKey]}
        >
          {children}
          <FooterWrapper />
        </ErrorBoundary>
      </LayoutComponent>
    </NativeStartupBoundary>
  );
}
