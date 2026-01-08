"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectActiveGroupId, setActiveGroupId } from "@/store/groupSlice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import SidebarLayoutApp from "./SidebarLayoutApp";

export default function SidebarLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const activeGroupId = useSelector(selectActiveGroupId);
  const dispatch = useDispatch();
  const { isApp } = useDeviceInfo();

  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!init) {
      const group = searchParams?.get("group");
      if (group && group !== activeGroupId) {
        dispatch(setActiveGroupId(group));
      }
      setInit(true);
    }
  }, []);

  if (isApp) {
    return <SidebarLayoutApp>{children}</SidebarLayoutApp>;
  }

  return (
    <main className="tailwind-scope tw-bg-black tw-overflow-x-hidden">
      <div className="tailwind-scope tw-bg-black tw-min-h-dvh tw-mt-6 lg:tw-mt-8 tw-pb-6 tw-mx-auto">
        <div className="tw-w-full">
          <div className="tw-mt-4 tw-px-3 lg:tw-px-6 xl:tw-px-8">
            {init && children}
          </div>
        </div>
      </div>
    </main>
  );
}
