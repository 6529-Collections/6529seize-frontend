import React from "react";
import {
  ApiDrop,
  ApiWave,
} from "../../../../generated/models/ObjectSerializer";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveDropPosition } from "./WaveDropPosition";
import { WaveDropContent } from "./WaveDropContent";
import { WaveDropTime } from "./WaveDropTime";
import { WaveDropVote } from "./WaveDropVote";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { WaveDropVotes } from "./WaveDropVotes";
import { WaveDropAuthor } from "./WaveDropAuthor";
import { WaveDetailedLeaderboardItemOutcomes } from "../small-leaderboard/WaveDetailedLeaderboardItemOutcomes";
import Tippy from "@tippyjs/react";

interface WaveDropProps {
  readonly wave: ApiWave;
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const WaveDrop: React.FC<WaveDropProps> = ({
  wave,
  drop: initialDrop,
  onClose,
}) => {
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: initialDrop.id }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${initialDrop.id}`,
      }),
    placeholderData: keepPreviousData,
    initialData: initialDrop,
  });

  return (
    <div className="tw-ml-[21.5rem] tw-w-full">
      <div className="tw-flex tw-gap-x-4">
        <div className="tw-w-[28rem] tw-overflow-y-auto tw-h-[calc(100vh-102px)] tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 ">
          <div className="tw-rounded-xl tw-bg-gradient-to-b tw-from-iron-900 tw-to-iron-900 tw-p-[1px] tw-transition tw-duration-300 tw-ease-out">
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950/95 tw-backdrop-blur-xl tw-py-6">
              <button
                type="button"
                className="tw-absolute tw-z-1000 tw-top-4 tw-right-4 tw-text-iron-300 desktop-hover:hover:tw-text-iron-100 tw-bg-transparent tw-border-0 tw-transition tw-duration-300 tw-ease-out"
                onClick={onClose}
              >
                <svg
                  className="tw-h-6 tw-w-6"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2">
                <div className="tw-px-6">
                  {drop.rank && <WaveDropPosition rank={drop.rank} />}
                </div>

                <div className="tw-flex-1 tw-w-full">
                  <div className="tw-px-6">
                    <WaveDropContent drop={drop} />
                  </div>

                  <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-iron-800 tw-pt-3 tw-px-6 tw-border-solid tw-border-x-0 tw-border-b-0">
                    <WaveDropTime wave={wave} />
                    <WaveDropVote wave={wave} drop={drop} />
                    <WaveDropVotes drop={drop} />

                    <div className="tw-flex tw-items-center tw-gap-x-4 tw-justify-between tw-mt-1">
                      <div className="tw-flex tw-items-center tw-gap-x-2">
                        <WaveDropAuthor drop={drop} />
                        <div className="tw-flex tw-gap-x-2 tw-items-center">
                          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                          <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                            15min
                          </p>
                        </div>
                      </div>
                      <WaveDetailedLeaderboardItemOutcomes
                        drop={drop}
                        wave={wave}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tw-flex-1">
          <div className="tw-rounded-xl tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-relative">
            chat
          </div>
        </div>
      </div>
    </div>
  );
};
