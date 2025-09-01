"use client";

import { usePathname } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useMemo } from "react";
import FooterWrapper from "@/FooterWrapper";

export default function LayoutWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();

  const isAccessOrRestricted =
    pathname?.startsWith("/access") || pathname?.startsWith("/restricted");

  const content = useMemo(() => {
    return isApp ? (
      <MobileLayout>
        {children}
        <FooterWrapper />
      </MobileLayout>
    ) : (
      <DesktopLayout>
        {children}
        <FooterWrapper />
      </DesktopLayout>
    );
  }, [isApp, children]);

  if (isAccessOrRestricted) {
    return <>{children}</>;
  }

  return content;
}
