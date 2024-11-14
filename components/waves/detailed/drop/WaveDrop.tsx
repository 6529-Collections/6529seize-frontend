import React from "react";
import {
  ApiDrop,
  ApiDropType,
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
import { WaveDropChat } from "./WaveDropChat";
import { getTimeAgoShort } from "../../../../helpers/Helpers";

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
      <div className="tw-flex">
        <div className="tw-w-[28rem] 2xl:tw-max-w-2xl 2xl:tw-w-full tw-py-6 tw-border tw-border-r-[3px] tw-border-solid tw-border-iron-800 tw-border-y-0 tw-bg-iron-950 tw-overflow-y-auto tw-h-[calc(100vh-102px)] tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 ">
          <div className="tw-h-full tw-relative tw-bg-iron-950">
            <button
              type="button"
              className="tw-absolute tw-z-1000 tw-top-0 tw-right-4 tw-text-iron-300 desktop-hover:hover:tw-text-iron-50 tw-bg-transparent tw-border-0 tw-transition tw-duration-300 tw-ease-out"
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
            <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2 tw-pb-6">
              <div className="tw-px-6">
                {drop.drop_type === ApiDropType.Participatory && (
                  <WaveDropPosition rank={drop.rank} />
                )}
              </div>

              <div className="tw-flex-1 tw-w-full">
                <div className="tw-px-6">
                  <WaveDropContent drop={drop} />
                </div>

                <div className="tw-border-t tw-border-iron-800 tw-pt-3 tw-border-solid tw-border-x-0 tw-border-b-0">
                  <div className="tw-px-6 tw-flex tw-flex-col tw-gap-y-3">
                    <WaveDropTime wave={wave} />
                    <WaveDropVote wave={wave} drop={drop} />
                    <WaveDropVotes drop={drop} />
                  </div>

                  <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-gap-x-4 tw-justify-between tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4 tw-mt-4 tw-px-6">
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <WaveDropAuthor drop={drop} />
                      <div className="tw-flex tw-gap-x-2 tw-items-center">
                        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                        <p className="tw-text-sm tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                          {getTimeAgoShort(drop.created_at)}
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
        <WaveDropChat wave={wave} drop={drop} />
      </div>
    </div>
  );
};