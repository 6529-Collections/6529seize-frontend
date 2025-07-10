"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import BrainLeftSidebar from "./left-sidebar/BrainLeftSidebar";
import BrainRightSidebar, {
  SidebarTab,
} from "./right-sidebar/BrainRightSidebar";
import { ContentTabProvider } from "./ContentTabContext";
import { useRouter } from "next/router";
import BrainDesktopDrop from "./BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { commonApiFetch } from "../../services/api/common-api";
import { DropSize, ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useLayout } from "./my-stream/layout/LayoutContext";
import Cookies from "js-cookie";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";

interface Props {
  readonly children: ReactNode;
}

const SIDEBAR_COLLAPSED_COOKIE = "brain-right-sidebar-collapsed";

const BrainDesktop: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const cookie = Cookies.get(SIDEBAR_COLLAPSED_COOKIE);
    return cookie ? JSON.parse(cookie) : false;
  });
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.ABOUT);

  // Access layout context for pre-calculated styles
  const { contentContainerStyle } = useLayout();

  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: router.query.drop as string }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${router.query.drop}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!router.query.drop,
  });

  useEffect(() => {
    if (router.query.wave) {
      setShowRightSidebar(true);
    } else {
      setShowRightSidebar(false);
    }
  }, [router.query.wave]);

  useEffect(() => {
    Cookies.set(SIDEBAR_COLLAPSED_COOKIE, isCollapsed, {
      expires: 365,
    });
  }, [isCollapsed]);

  const onDropClose = () => {
    const currentQuery = { ...router.query };
    delete currentQuery.drop;
    router.push({ pathname: router.pathname, query: currentQuery }, undefined, {
      shallow: true,
    });
  };

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const isDropOpen =
    drop &&
    drop?.id?.toLowerCase() === (router.query.drop as string)?.toLowerCase();

  const contentClasses = `tw-relative tw-flex tw-flex-grow tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto
    ${
      showRightSidebar && !isCollapsed && !isDropOpen
        ? "xl:tw-mr-[21rem] xl:tw-ml-3 min-[1600px]:tw-max-w-full min-[1920px]:tw-mx-auto min-[1920px]:tw-max-w-[1280px]"
        : ""
    }`;

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
            <BrainLeftSidebar activeWaveId={router.query.wave as string} />
            <div className="tw-flex-grow tw-flex tw-flex-col tw-h-full">
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

      {showRightSidebar && !isDropOpen && router.query.wave && (
        <BrainRightSidebar
          key="right-sidebar"
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          waveId={router.query.wave as string}
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
