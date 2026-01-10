"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectActiveGroupId, setActiveGroupId } from "@/store/groupSlice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import NetworkPageLayoutApp from "./NetworkPageLayoutApp";

export default function NetworkPageLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const activeGroupId = useSelector(selectActiveGroupId);
  const dispatch = useDispatch();
  const { isApp } = useDeviceInfo();

  const initRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      const group = searchParams?.get("group");
      if (group && group !== activeGroupId) {
        dispatch(setActiveGroupId(group));
      }
      setIsReady(true);
    }
  }, [searchParams, activeGroupId, dispatch]);

  if (isApp) {
    return <NetworkPageLayoutApp>{children}</NetworkPageLayoutApp>;
  }

  return (
    <main className="tailwind-scope tw-bg-black tw-overflow-x-hidden">
      <div className="tailwind-scope tw-bg-black tw-min-h-dvh tw-mt-6 lg:tw-mt-8 tw-pb-6 tw-mx-auto">
        <div className="tw-w-full">
          <div className="tw-mt-4 tw-px-3 lg:tw-px-6 xl:tw-px-8">
            {isReady && children}
          </div>
        </div>
      </div>
    </main>
  );
}
