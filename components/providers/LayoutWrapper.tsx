"use client";

import { usePathname } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import WebLayout from "@/components/layout/WebLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useMemo } from "react";
// import FooterWrapper from "@/FooterWrapper";

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
      <MobileLayout>{children}</MobileLayout>
    ) : (
      <WebLayout>{children}</WebLayout>
    );
  }, [isApp, children]);

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
