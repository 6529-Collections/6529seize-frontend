"use client";

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
  readonly children: React.ReactNode;
}) {
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const isSmallScreen = useIsMobileScreen();
  const pathname = usePathname();

  const isAccessOrRestricted =
    pathname?.startsWith("/access") || pathname?.startsWith("/restricted");

  const LayoutComponent = isApp
    ? MobileLayout
    : isSmallScreen && hasTouchScreen
    ? SmallScreenLayout
    : WebLayout;

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
