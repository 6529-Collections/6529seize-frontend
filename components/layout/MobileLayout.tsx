import React, { ReactNode, useCallback } from "react";
import dynamic from "next/dynamic";
import BottomNavigation from "../navigation/BottomNavigation";
import { useViewContext } from "../navigation/ViewContext";
import BrainMobileWaves from "../brain/mobile/BrainMobileWaves";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import HeaderPlaceholder from "../header/HeaderPlaceholder";
import Breadcrumb from "../breadcrumb/Breadcrumb";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useRouter } from "next/router";

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
  const breadcrumbs = useBreadcrumbs();
  const router = useRouter();
  const isHomePage = router.pathname === "/";
  const isSingleDropOpen = typeof router.query.drop === "string";
  const isStreamRoute = router.pathname.startsWith("/my-stream");

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
        {!isMobileDevice && !isHomePage && (
          <Breadcrumb breadcrumbs={breadcrumbs} />
        )}
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
      {isMobileDevice && !isSingleDropOpen && !isStreamRoute && (
        <div className="tw-py-6 tw-inline-block" />
      )}
      {isMobileDevice && !isSingleDropOpen && <BottomNavigation />}
    </div>
  );
};

export default MobileLayout;
