import React, { ReactNode, useCallback } from "react";
import dynamic from "next/dynamic";
import { useHeaderContext } from "../../contexts/HeaderContext";

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
      <main>{children}</main>
    </div>
  );
};

export default MobileLayout;
