"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BrainLeftSidebar from "./left-sidebar/BrainLeftSidebar";
import BrainRightSidebar, {
  SidebarTab,
} from "./right-sidebar/BrainRightSidebar";
import { ContentTabProvider } from "./ContentTabContext";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import BrainDesktopDrop from "./BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useLayout } from "./my-stream/layout/LayoutContext";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { useSidebarState } from "@/hooks/useSidebarState";

interface Props {
  readonly children: ReactNode;
}

const BrainDesktop: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.ABOUT);

  // Access layout context for pre-calculated styles
  const { contentContainerStyle } = useLayout();
  const { isRightSidebarOpen, closeRightSidebar } = useSidebarState();

  const dropId = searchParams?.get("drop") ?? undefined;
  const waveId = searchParams?.get("wave") ?? undefined;

  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!dropId,
  });

  useEffect(() => {
    if (!waveId && isRightSidebarOpen) {
      closeRightSidebar();
    }
  }, [waveId, isRightSidebarOpen, closeRightSidebar]);

  const onDropClose = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("drop");
    const basePath =
      pathname ??
      getWaveHomeRoute({ isDirectMessage: false, isApp: false });
    const newUrl = params.toString()
      ? `${basePath}?${params.toString()}`
      : basePath;
    router.push(newUrl, { scroll: false });
  };

  const onDropClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("drop", drop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isDropOpen = useMemo(() => {
    if (!drop || !dropId) {
      return false;
    }
    return drop.id?.toLowerCase() === dropId.toLowerCase();
  }, [drop, dropId]);

  const enhancedDrop = useMemo(() => {
    if (!drop || typeof drop.id !== "string") {
      return null;
    }
    return {
      type: DropSize.FULL,
      ...drop,
      stableKey: drop.id,
      stableHash: drop.id,
    } as ExtendedDrop;
  }, [drop]);

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div className="tw-relative tw-flex tw-flex-grow">
        <motion.div
          layout={!isDropOpen}
          className={
            isDropOpen
              ? "tw-w-full xl:tw-pl-6"
              : "tw-relative tw-flex tw-flex-grow tw-w-full tw-px-3 min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto"
          }
          transition={{ duration: 0.3 }}
          style={{ transition: "none" }}
        >
          <div
            className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-6 tw-gap-y-4 tw-w-full tw-overflow-hidden"
            style={contentContainerStyle}
          >
            <BrainLeftSidebar activeWaveId={waveId} />
            <div className="tw-flex-grow tw-flex tw-flex-col tw-h-full">
              {children}
              {isDropOpen && enhancedDrop && (
                <div
                  className="tw-absolute tw-inset-0 tw-z-[49]"
                  style={{ transition: "none" }}
                >
                  <BrainDesktopDrop
                    drop={enhancedDrop}
                    onClose={onDropClose}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {isRightSidebarOpen && !isDropOpen && waveId && (
        <BrainRightSidebar
          key="right-sidebar"
          waveId={waveId}
          onDropClick={onDropClick}
          activeTab={sidebarTab}
          setActiveTab={setSidebarTab}
        />
      )}
    </div>
  );
};

const BrainDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <BrainDesktop {...props} />
  </ContentTabProvider>
);

export default BrainDesktopWithProvider;
