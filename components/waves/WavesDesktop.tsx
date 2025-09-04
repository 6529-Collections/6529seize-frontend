"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import BrainRightSidebar, { SidebarTab } from "../brain/right-sidebar/BrainRightSidebar";
import WebLeftSidebar from "../brain/left-sidebar/web/WebLeftSidebar";
import BrainLeftSidebar from "../brain/left-sidebar/BrainLeftSidebar";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { commonApiFetch } from "../../services/api/common-api";
import { DropSize, ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { useSidebarState } from "../../hooks/useSidebarState";

interface Props {
  readonly children: ReactNode;
}

const WavesDesktop: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Access layout context for pre-calculated styles
  const { contentContainerStyle } = useLayout();
  
  // Get global sidebar state
  const { isRightSidebarOpen } = useSidebarState();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.ABOUT);

  const dropId = searchParams?.get('drop') ?? undefined;
  const waveId = searchParams?.get('wave') ?? undefined;

  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!dropId,
  });

  const onDropClose = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('drop');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '/waves');
    router.push(newUrl, { scroll: false });
  };

  const onDropClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('drop', drop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isDropOpen =
    drop &&
    drop?.id?.toLowerCase() === dropId?.toLowerCase();

  const contentClasses = `tw-relative tw-flex tw-flex-grow tw-w-full tw-max-w-full tw-mx-auto`;

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div className="tw-relative tw-flex tw-flex-grow">
        <motion.div
          layout={!isDropOpen}
          className={isDropOpen ? "tw-w-full xl:tw-pl-6" : contentClasses}
          transition={{ duration: 0.3 }}
          style={{ transition: "none" }}>
          <div
            className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-w-full tw-overflow-hidden"
            style={contentContainerStyle}>
            {/* Only show BrainLeftSidebar when right sidebar is closed */}
            {!isRightSidebarOpen && <BrainLeftSidebar activeWaveId={waveId} />}
            
            <div className={`tw-flex-grow tw-flex tw-flex-col tw-h-full ${
              isRightSidebarOpen ? "tw-pr-80" : ""
            }`}>
              {children}
              {isDropOpen && (
                <div
                  className="tw-absolute tw-inset-0 tw-z-[49]"
                  style={{ transition: "none" }}>
                  <BrainDesktopDrop
                    drop={{
                      type: DropSize.FULL,
                      ...drop,
                      stableKey: drop.id,
                      stableHash: drop.id,
                    }}
                    onClose={onDropClose}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Right sidebar */}
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

const WavesDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <WavesDesktop {...props} />
  </ContentTabProvider>
);

export default WavesDesktopWithProvider;