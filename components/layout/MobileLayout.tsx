import type { ReactNode } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import AppLayout from "./AppLayout";
import SmallScreenLayout from "./SmallScreenLayout";

interface MobileLayoutProps {
  readonly children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  const { isApp } = useDeviceInfo();
  const isSmallScreen = useIsMobileScreen();

  if (isApp) {
    return <AppLayout>{children}</AppLayout>;
  }

  // Fallback to small-screen layout when not a mobile device but screen is narrow
  if (isSmallScreen) {
    return <SmallScreenLayout>{children}</SmallScreenLayout>;
  }

  // Edge case: render children directly
  return <>{children}</>;
};

export default MobileLayout;
