"use client";

import type { ComponentType, ReactNode } from "react";
import { usePathname } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import WebLayout from "@/components/layout/WebLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import SmallScreenLayout from "@/components/layout/SmallScreenLayout";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import FooterWrapper from "@/FooterWrapper";

export default function LayoutWrapper({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const isSmallScreen = useIsMobileScreen();
  const pathname = usePathname();

  const isAccessOrRestricted =
    pathname?.startsWith("/access") || pathname?.startsWith("/restricted");

  let LayoutComponent: ComponentType<{ readonly children: ReactNode }> = WebLayout;

  if (isApp) {
    LayoutComponent = MobileLayout;
  } else if (isSmallScreen && hasTouchScreen) {
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
