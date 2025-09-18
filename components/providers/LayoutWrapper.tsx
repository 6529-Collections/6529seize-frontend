"use client";

import { usePathname } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import WebLayout from "@/components/layout/WebLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import SmallScreenLayout from "@/components/layout/SmallScreenLayout";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useMemo } from "react";
// import FooterWrapper from "@/FooterWrapper";

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

  const content = useMemo(() => {
    if (isApp) {
      return <MobileLayout>{children}</MobileLayout>;
    }

    // Mobile browsers: small screen + touch
    if (isSmallScreen && hasTouchScreen) {
      return <SmallScreenLayout>{children}</SmallScreenLayout>;
    }

    // Desktop or non-touch small screens
    return <WebLayout>{children}</WebLayout>;
  }, [isApp, isSmallScreen, hasTouchScreen, children]);

  if (isAccessOrRestricted) {
    return <>{children}</>;
  }

  return (
    <>
      {content}
      {/* <FooterWrapper /> */}
    </>
  );
}
