import dynamic from "next/dynamic";
import React, { ReactNode, useCallback } from "react";
import { useRouter } from "next/router";
import BottomNavigation from "../navigation/BottomNavigation";
import { useViewContext } from "../navigation/ViewContext";
import BrainMobileWaves from "../brain/mobile/BrainMobileWaves";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import HeaderPlaceholder from "../header/HeaderPlaceholder";
import { useHeaderContext } from "../../contexts/HeaderContext";
import { useDeepLinkNavigation } from "../../hooks/useDeepLinkNavigation";
import BrainMobileMessages from "../brain/mobile/BrainMobileMessages";

const TouchDeviceHeader = dynamic(() => import("../header/AppHeader"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface Props {
  readonly children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  useDeepLinkNavigation();
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const { activeView } = useViewContext();
  const router = useRouter();
  const isSingleDropOpen = typeof router.query.drop === "string";
  const isStreamRoute = router.pathname.startsWith("/my-stream");

  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerRef("header", node);
      setHeaderRef(node);
    },
    [registerRef, setHeaderRef]
  );

  return (
    <div>
      <div ref={headerWrapperRef}>
        <TouchDeviceHeader />
      </div>
      {activeView === "messages" ? (
        <BrainMobileMessages />
      ) : activeView === "waves" ? (
        <BrainMobileWaves />
      ) : (
        <main>{children}</main>
      )}
      {!isSingleDropOpen && !isStreamRoute && (
        <div className="tw-h-16 tw-w-full" />
      )}
      {!isSingleDropOpen && <BottomNavigation />}
    </div>
  );
}