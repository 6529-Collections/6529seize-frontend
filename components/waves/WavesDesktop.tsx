"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import WebBrainLeftSidebar from "../brain/left-sidebar/web/WebBrainLeftSidebar";
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
            {/* Only show WebBrainLeftSidebar when right sidebar is closed */}
            {!isRightSidebarOpen && <WebBrainLeftSidebar activeWaveId={waveId} />}
            
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
      {isRightSidebarOpen && waveId && (
        <div
          className="tw-fixed tw-inset-y-0 tw-right-0 tw-w-80 tw-z-30
            tw-transform-gpu tw-will-change-transform
            tw-transition-transform tw-duration-300 tw-ease-out
            motion-reduce:tw-transition-none tw-translate-x-0
            tw-bg-iron-950 tw-border-l tw-border-iron-800 tw-border-solid"
        >
          <div className="tw-p-4 tw-text-white tw-h-full tw-overflow-y-auto">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Wave Information</h2>
            <p className="tw-text-iron-300 tw-mb-2">Wave ID: {waveId}</p>
            <p className="tw-text-iron-300">Right sidebar content for wave information will go here.</p>
          </div>
        </div>
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