import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import WaveHeader, {
  WaveHeaderPinnedSide,
} from "../../waves/detailed/header/WaveHeader";
import BrainRightSidebarContent from "./BrainRightSidebarContent";
import BrainRightSidebarFollowers from "./BrainRightSidebarFollowers";

interface BrainRightSidebarProps {
  readonly isCollapsed: boolean;
  readonly setIsCollapsed: (isCollapsed: boolean) => void;
  readonly waveId: string;
}

enum Mode {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

const BrainRightSidebar: React.FC<BrainRightSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  waveId,
}) => {
  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      }),
    enabled: !!waveId,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const [mode, setMode] = useState<Mode>(Mode.CONTENT);

  const onFollowersClick = () => {
    if (mode === Mode.FOLLOWERS) {
      setMode(Mode.CONTENT);
    } else {
      setMode(Mode.FOLLOWERS);
    }
  };

  return (
    <div
      className={`tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-transition-transform tw-duration-300 tw-ease-in-out tw-z-40
        ${isCollapsed ? "tw-translate-x-full" : "tw-translate-x-0"}
        tw-bg-iron-950 tw-border-l tw-border-iron-800 tw-border-solid tw-border-y-0 tw-border-r-0 tw-flex tw-flex-col
        tw-w-full lg:tw-w-[20.5rem]`}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        className="tw-border-0 tw-absolute tw-left-2 lg:-tw-left-7 tw-z-50 tw-top-28 tw-text-iron-500 hover:tw-text-primary-400
          tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-800 tw-rounded-r-lg lg:tw-rounded-r-none tw-rounded-l-lg tw-size-7
          tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          aria-hidden="true"
          stroke="currentColor"
          className={`tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-ease-in-out ${
            isCollapsed ? "tw-rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </button>
      <div className="tw-pt-[5rem] xl:tw-pt-[6rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto horizontal-menu-hide-scrollbar tw-h-full">
        <div className="tw-h-full tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
          {wave && (
            <>
              <WaveHeader
                wave={wave}
                onFollowersClick={onFollowersClick}
                useRing={false}
                useRounded={false}
                pinnedSide={WaveHeaderPinnedSide.LEFT}
              />
              {mode === Mode.CONTENT && (
                <BrainRightSidebarContent wave={wave} />
              )}
              {mode === Mode.FOLLOWERS && (
                <BrainRightSidebarFollowers
                  wave={wave}
                  closeFollowers={() => setMode(Mode.CONTENT)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrainRightSidebar;
