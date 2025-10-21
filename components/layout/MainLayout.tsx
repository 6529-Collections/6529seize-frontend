"use client";

import React, { type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import MobileLayout from "./MobileLayout";
import WebLayout from "./WebLayout";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ViewProvider } from "@/components/navigation/ViewContext";
import { NavigationHistoryProvider } from "@/contexts/NavigationHistoryContext";
import { MyStreamProvider } from "@/contexts/wave/MyStreamContext";
import { LayoutProvider } from "@/components/brain/my-stream/layout/LayoutContext";
import { ScrollPositionProvider } from "@/contexts/ScrollPositionContext";

interface MainLayoutMetadata {
  readonly title: string;
  readonly description?: string;
  readonly ogImage?: string;
  readonly twitterCard?: string;
}

interface MainLayoutProps {
  readonly metadata: MainLayoutMetadata;
  readonly children: ReactNode;
}

const shouldBypassLayout = (pathname: string | null | undefined): boolean => {
  if (!pathname) return false;
  return pathname.startsWith("/access") || pathname.startsWith("/restricted");
};

export default function MainLayout({ metadata: _metadata, children }: MainLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isApp, isMobileDevice } = useDeviceInfo();

  if (shouldBypassLayout(pathname)) {
    return <>{children}</>;
  }

  const renderMobileLayout = isApp || isMobileDevice;

  const waveParam = searchParams?.get("wave");
  const viewParam = searchParams?.get("view");
  const tabParam = searchParams?.get("tab");

  const hasWaveParam = Boolean(waveParam);
  const isViewingWavesOrMessages =
    viewParam === "waves" || viewParam === "messages";
  const isHomeFeedView =
    pathname === "/" && (tabParam === "feed" || hasWaveParam);
  const isStreamRoute =
    pathname === "/waves" ||
    pathname === "/messages" ||
    pathname === "/notifications" ||
    (pathname === "/" && (hasWaveParam || isViewingWavesOrMessages));

  const isSmallDesktopLayout = isHomeFeedView || isStreamRoute;

  const content = renderMobileLayout ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <WebLayout isSmall={isSmallDesktopLayout}>{children}</WebLayout>
  );

  return (
    <NavigationHistoryProvider>
      <ViewProvider>
        <MyStreamProvider>
          <LayoutProvider>
            <ScrollPositionProvider>{content}</ScrollPositionProvider>
          </LayoutProvider>
        </MyStreamProvider>
      </ViewProvider>
    </NavigationHistoryProvider>
  );
}
