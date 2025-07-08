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

  const isSmall = pathname?.startsWith("/my-stream");
  const isAccess = pathname?.startsWith("/access");

  const content = useMemo(() => {
    return isApp ? (
      <MobileLayout>{children}</MobileLayout>
    ) : (
      <DesktopLayout isSmall={isSmall}>{children}</DesktopLayout>
    );
  }, [isApp, isSmall, children]);

  if (isAccess) {
    return <>{children}</>;
  }

  return (
    <>
      {content}
      <FooterWrapper />
    </>
  );
}
