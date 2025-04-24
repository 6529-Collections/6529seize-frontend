import React, { ReactNode, useCallback } from "react";
import dynamic from "next/dynamic";
import { useHeaderContext } from "../../contexts/HeaderContext";
import BottomNavigation from "../navigation/BottomNavigation";
import { useViewContext } from "../navigation/ViewContext";
import BrainMobileWaves from "../brain/mobile/BrainMobileWaves";

// Simple placeholder for the header while it loads client-side
const HeaderPlaceholder = () => {
  // Style to roughly match header height
  return (
    <div style={{ height: "56px" /* Adjust height as needed for mobile */ }}>
      Loading Header...
    </div>
  );
};

// Dynamically import Header, disable SSR, and use the placeholder
const Header = dynamic(() => import("../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface MobileLayoutProps {
  readonly children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  const { setHeaderRef } = useHeaderContext();
  const { activeView } = useViewContext();

  // Use a callback ref to get the DOM node
  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      setHeaderRef(node);
    },
    [setHeaderRef]
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
      <BottomNavigation />
    </div>
  );
};

export default MobileLayout;
