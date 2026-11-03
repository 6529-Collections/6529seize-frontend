"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { finishVersionReloadWhenReady } from "@/components/version-update/versionReload";
import FooterWrapper from "@/components/footer/FooterWrapper";
import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";
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

type LayoutProps = {
  readonly children: ReactNode;
  readonly isSmall?: boolean;
};
type LayoutComponentType = ComponentType<LayoutProps>;

// Only the Capacitor app uses the native layout (bottom navigation and the
// mobile waves/messages shell), so web visitors never download it. The loaded
// component receives the same props as WebLayout, `isSmall` included;
// MobileLayout ignores it, as it did when it was imported statically.
const nativeLayoutLoader = createLazyComponentLoader<LayoutProps>(
  () => import("@/components/layout/MobileLayout")
);
const LoadedNativeLayout = nativeLayoutLoader.Loaded;

// NATIVE_STARTUP_SCRIPT marks the document while the head is parsed, before
// any app JavaScript runs. Start the native layout download right away so it
// arrives with hydration instead of after it.
if (
  typeof document !== "undefined" &&
  document.documentElement.dataset["nativeRuntime"] !== undefined
) {
  nativeLayoutLoader.preload();
}

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
  const [nativeLayoutFailed, setNativeLayoutFailed] = useState(false);
  const isNativeLayoutLoaded = nativeLayoutLoader.useIsReady({
    enabled: isApp && !nativeLayoutFailed,
    onError: () => {
      // The loader logs the error itself; this names the failed surface so a
      // broken app launch is easy to find in logs and Sentry.
      console.error("Failed to load the native layout");
      setNativeLayoutFailed(true);
    },
  });

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

  // Until the native layout arrives, keep the web tree mounted behind the
  // native startup placeholder, exactly as before isApp resolves. If it cannot
  // load, show the web layout rather than leave the app on the placeholder.
  const isNativeLayoutReady = isApp && isNativeLayoutLoaded;
  const LayoutComponent: LayoutComponentType = isNativeLayoutReady
    ? LoadedNativeLayout
    : WebLayout;

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
    <NativeStartupBoundary
      isNativeLayout={isNativeLayoutReady || (isApp && nativeLayoutFailed)}
    >
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
