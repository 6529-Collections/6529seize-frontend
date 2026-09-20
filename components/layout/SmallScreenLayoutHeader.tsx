"use client";

import { useCallback, useEffect } from "react";
import { useHeaderContext } from "@/contexts/HeaderContext";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import MobileAppBanner from "@/components/mobile-app/MobileAppBanner";
import SmallScreenHeader from "./SmallScreenHeader";

export default function SmallScreenLayoutHeader({
  onMenuToggle,
  isMenuOpen,
}: {
  readonly onMenuToggle: () => void;
  readonly isMenuOpen: boolean;
}) {
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerRef("header", node);
      setHeaderRef(node);
    },
    [registerRef, setHeaderRef]
  );

  useEffect(
    () => () => {
      registerRef("header", null);
      setHeaderRef(null);
    },
    [registerRef, setHeaderRef]
  );

  return (
    <div ref={headerWrapperRef}>
      <MobileAppBanner />
      <SmallScreenHeader onMenuToggle={onMenuToggle} isMenuOpen={isMenuOpen} />
    </div>
  );
}
