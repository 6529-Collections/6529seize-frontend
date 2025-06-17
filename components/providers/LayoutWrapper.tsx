"use client";

import { usePathname } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();

  const isSmall = pathname?.startsWith("/my-stream");
  const isAccess = pathname?.startsWith("/access");

  if (isAccess) {
    return <>{children}</>;
  }

  return isApp ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout isSmall={isSmall}>{children}</DesktopLayout>
  );
}
