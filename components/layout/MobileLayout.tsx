import React, { ReactNode, useCallback } from "react";
import dynamic from "next/dynamic";
import BottomNavigation from "../navigation/BottomNavigation";
import { useViewContext } from "../navigation/ViewContext";
import BrainMobileWaves from "../brain/mobile/BrainMobileWaves";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import HeaderPlaceholder from "../header/HeaderPlaceholder";

const Header = dynamic(() => import("../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface MobileLayoutProps {
  readonly children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  const { registerRef } = useLayout();
  const { activeView } = useViewContext();
  const { isMobileDevice } = useDeviceInfo();

  // Use a callback ref to get the DOM node
  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerRef("header", node);
    },
    [registerRef]
  );

  return (
    <div>
      <div ref={headerWrapperRef}>
        <Header />
      </div>
      {activeView === "messages" ? (
        <div className="tw-text-white tw-text-center tw-p-4">
          Messages view placeholder
        </div>
      ) : activeView === "waves" ? (
        <BrainMobileWaves />
      ) : (
        <main>{children}</main>
      )}
      {isMobileDevice && <BottomNavigation />}
    </div>
  );
};

export default MobileLayout;
