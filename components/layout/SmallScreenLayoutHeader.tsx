"use client";

import { useCallback, useEffect } from "react";
import { useHeaderContext } from "@/contexts/HeaderContext";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import MobileAppBanner from "@/components/mobile-app/MobileAppBanner";
import SmallScreenHeader from "./SmallScreenHeader";

export default function SmallScreenLayoutHeader({
  active = true,
  onMenuToggle,
  isMenuOpen,
}: {
  readonly active?: boolean;
  readonly onMenuToggle: () => void;
  readonly isMenuOpen: boolean;
}) {
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!active) return;
      registerRef("header", node);
      setHeaderRef(node);
    },
    [active, registerRef, setHeaderRef]
  );

  useEffect(
    () => () => {
      if (!active) return;
      registerRef("header", null);
      setHeaderRef(null);
    },
    [active, registerRef, setHeaderRef]
  );

  return (
    <div ref={headerWrapperRef} hidden={!active} data-web-small-header="true">
      {active && <MobileAppBanner />}
      <SmallScreenHeader
        interactive={active}
        onMenuToggle={onMenuToggle}
        isMenuOpen={isMenuOpen}
      />
    </div>
  );
}
