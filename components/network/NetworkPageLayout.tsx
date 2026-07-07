"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import NetworkPageLayoutApp from "./NetworkPageLayoutApp";

function NetworkPageSearchParamsSync({
  activeGroupId,
  setActiveGroupId,
  onReady,
}: {
  readonly activeGroupId: string | null;
  readonly setActiveGroupId: (groupId: string | null) => void;
  readonly onReady: () => void;
}) {
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by NetworkPageLayout Suspense wrapper
  const searchParams = useSearchParams();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) {
      return;
    }

    initRef.current = true;
    const group = searchParams.get("group");
    if (group && group !== activeGroupId) {
      setActiveGroupId(group);
    }
    onReady();
  }, [searchParams, activeGroupId, setActiveGroupId, onReady]);

  return null;
}

export default function NetworkPageLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { activeGroupId, setActiveGroupId } = useActiveGroup();
  const { isApp } = useDeviceInfo();
  const [isReady, setIsReady] = useState(false);

  if (isApp) {
    return <NetworkPageLayoutApp>{children}</NetworkPageLayoutApp>;
  }

  return (
    <main className="tailwind-scope tw-overflow-x-hidden tw-bg-black">
      <Suspense fallback={null}>
        <NetworkPageSearchParamsSync
          activeGroupId={activeGroupId}
          setActiveGroupId={setActiveGroupId}
          onReady={() => setIsReady(true)}
        />
      </Suspense>
      <div className="tailwind-scope tw-mx-auto tw-mt-6 tw-min-h-dvh tw-bg-black tw-pb-6 lg:tw-mt-8">
        <div className="tw-w-full">
          <div className="tw-mt-4 tw-px-3 lg:tw-px-6 xl:tw-px-8">
            {isReady && children}
          </div>
        </div>
      </div>
    </main>
  );
}
