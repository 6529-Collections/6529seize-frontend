"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import NetworkPageLayoutApp from "./NetworkPageLayoutApp";
import {
  NETWORK_PAGE_HORIZONTAL_GUTTERS,
  NETWORK_PAGE_SURFACE_CLASSES,
} from "./networkPageLayoutClasses";

export default function NetworkPageLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const { activeGroupId, setActiveGroupId } = useActiveGroup();
  const { isApp } = useDeviceInfo();

  const initRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      const group = searchParams.get("group");
      if (group && group !== activeGroupId) {
        setActiveGroupId(group);
      }
      setIsReady(true);
    }
  }, [searchParams, activeGroupId, setActiveGroupId]);

  if (isApp) {
    return <NetworkPageLayoutApp>{children}</NetworkPageLayoutApp>;
  }

  return (
    <main className={`${NETWORK_PAGE_SURFACE_CLASSES} tw-overflow-x-hidden`}>
      <div className="tw-mx-auto tw-min-h-dvh tw-bg-[#0D0D0F] tw-pb-6">
        <div className="tw-w-full">
          <div
            className={`${NETWORK_PAGE_HORIZONTAL_GUTTERS} tw-pt-6 lg:tw-pt-8`}
          >
            {isReady && children}
          </div>
        </div>
      </div>
    </main>
  );
}
