import React, { ReactNode, useEffect, useState } from "react";
import BrainLeftSidebar from "./left-sidebar/BrainLeftSidebar";
import BrainRightSidebar, { SidebarTab } from "./right-sidebar/BrainRightSidebar";
import { useRouter } from "next/router";
import BrainDesktopDrop from "./BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";

interface Props {
  children: ReactNode;
}

export const BrainDesktop: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.ABOUT);
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
    setShowRightSidebar(!!router.query.wave);
  }, [router.query.wave]);

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

  const contentClasses = showRightSidebar
    ? "tailwind-scope tw-relative tw-flex tw-flex-grow tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto"
    : "tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto";

  const isDropOpen =
   drop && drop?.id?.toLowerCase() === (router.query.drop as string)?.toLowerCase();

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div className={`tailwind-scope tw-relative tw-flex tw-flex-grow ${
        isDropOpen ? 'tw-w-full xl:tw-pl-6' : contentClasses
      }`}>
        <div className={`tw-h-screen lg:tw-h-[calc(100vh-6.25rem)] tw-flex-grow tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-6 tw-gap-y-4 tw-transition-all tw-duration-300`}>
          <BrainLeftSidebar 
            activeWaveId={router.query.wave as string}
          />
          <div className="tw-flex-grow xl:tw-relative">
            {children}
            {isDropOpen && (
              <div className="tw-absolute tw-inset-0 tw-z-[1000]">
                <BrainDesktopDrop
                  drop={{
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

        {showRightSidebar && !isDropOpen && (
          <BrainRightSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            waveId={router.query.wave as string}
            onDropClick={onDropClick}
            activeTab={sidebarTab}
            setActiveTab={setSidebarTab}
          />
        )}
      </div>
    </div>
  );
};

export default BrainDesktop;
