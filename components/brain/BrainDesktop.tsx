import React, { ReactNode, useEffect, useState } from "react";
import BrainLeftSidebar from "./left-sidebar/BrainLeftSidebar";
import BrainRightSidebar from "./right-sidebar/BrainRightSidebar";
import { useRouter } from "next/router";
import BrainDesktopDrop from "./BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { ApiWave } from "../../generated/models/ObjectSerializer";

interface Props {
  children: ReactNode;
}

const BrainDesktop: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: router.query.drop as string }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${router.query.drop}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!router.query.drop,
  });

  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: drop?.wave.id }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${drop?.wave.id}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!drop?.wave.id,
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

  const contentClasses = showRightSidebar
    ? isCollapsed
      ?
        " tailwind-scope tw-relative tw-flex tw-flex-grow tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto"
      : "tw-px-6 min-[1980px]:tw-mx-auto min-[1980px]:tw-max-w-[1280px] min-[1980px]:tw-px-3"
    : "tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto";

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div
        className={`tailwind-scope tw-relative tw-flex tw-flex-grow ${contentClasses}`}
      >
        <div
          className={`tw-h-screen lg:tw-h-[calc(100vh-6.25rem)] tw-flex-grow tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-6 tw-gap-y-4 tw-transition-all tw-duration-300 ${
            showRightSidebar && !isCollapsed
              ? "tw-mr-[20.5rem] min-[1980px]:tw-mr-0"
              : ""
          }`}
        >
          <BrainLeftSidebar activeWaveId={router.query.wave as string} />
          {children}
          {drop && wave && drop.wave.id === wave.id && router.query.drop && (
            <BrainDesktopDrop
              drop={{
                ...drop,
                stableKey: drop.id,
                stableHash: drop.id,
              }}
              wave={wave}
              onClose={onDropClose}
            />
          )}
        </div>

        {showRightSidebar && (
          <BrainRightSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            waveId={router.query.wave as string}
          />
        )}
      </div>
    </div>
  );
};

export default BrainDesktop;
