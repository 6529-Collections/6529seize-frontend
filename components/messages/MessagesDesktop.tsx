"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import WebBrainLeftSidebar from "../brain/left-sidebar/web/WebLeftSidebar";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { commonApiFetch } from "../../services/api/common-api";
import { DropSize, ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";

interface Props {
  readonly children: ReactNode;
}

const MessagesDesktop: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Access layout context for pre-calculated styles
  const { contentContainerStyle } = useLayout();

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
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '/messages');
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

  const contentClasses = `tw-relative tw-flex tw-flex-grow tw-w-full tw-px-3 tw-max-w-full tw-mx-auto`;

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div className="tw-relative tw-flex tw-flex-grow">
        <motion.div
          layout={!isDropOpen}
          className={isDropOpen ? "tw-w-full xl:tw-pl-6" : contentClasses}
          transition={{ duration: 0.3 }}
          style={{ transition: "none" }}>
          <div
            className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-6 tw-gap-y-4 tw-w-full tw-overflow-hidden"
            style={contentContainerStyle}>
            <WebBrainLeftSidebar activeWaveId={waveId} />
            <div className="tw-flex-grow tw-flex tw-flex-col tw-h-full tw-max-w-4xl tw-mx-auto">
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
    </div>
  );
};

const MessagesDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <MessagesDesktop {...props} />
  </ContentTabProvider>
);

export default MessagesDesktopWithProvider;