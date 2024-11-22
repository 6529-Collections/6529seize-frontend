import React, { useEffect, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { WaveDropVotes } from "./WaveDropVotes";
import { WaveDropAuthor } from "./WaveDropAuthor";
import { WaveDetailedLeaderboardItemOutcomes } from "../small-leaderboard/WaveDetailedLeaderboardItemOutcomes";
import { WaveDropChat } from "./WaveDropChat";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import { WaveDropClose } from "./WaveDropClose";
import { useAuth } from "../../../auth/Auth";
import { motion } from "framer-motion";
import { WaveDropVoters } from "./WaveDropVoters";
import { WaveDropLogs } from "./WaveDropLogs";
import { WaveDropTabs } from "./WaveDropTabs";

interface WaveDropProps {
  readonly wave: ApiWave;
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export enum WaveDropTab {
  INFO = "INFO",
  CHAT = "CHAT",
}

export const WaveDrop: React.FC<WaveDropProps> = ({
  wave,
  drop: initialDrop,
  onClose,
}) => {
  const { connectedProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<WaveDropTab>(WaveDropTab.INFO);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: initialDrop.id }],
    queryFn: () =>
      commonApiFetch<ApiDrop>({
        endpoint: `drops/${initialDrop.id}`,
      }),
    initialData: initialDrop,
  });

  return (
    <div className="tw-w-full tw-overflow-y-auto">
      <div className="lg:tw-hidden tw-inline-flex tw-w-full tw-justify-between">
        <WaveDropTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <WaveDropClose onClose={onClose} />
      </div>

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`${
            activeTab === WaveDropTab.INFO ? "tw-block" : "tw-hidden"
          } lg:tw-block lg:tw-w-[28rem] 2xl:tw-max-w-2xl 2xl:tw-w-full tw-py-4 lg:tw-py-6 lg:tw-border lg:tw-border-r-[3px] lg:tw-border-solid tw-border-iron-800 tw-border-y-0 tw-bg-iron-950 tw-overflow-y-auto tw-h-[calc(100vh-140px)] lg:tw-h-[calc(100vh-90px)] no-scrollbar tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300`}
        >
          <div className="tw-h-full tw-relative tw-bg-iron-950">
            <div className="tw-hidden lg:tw-block">
            <WaveDropClose onClose={onClose} />
            </div>
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
                    {wave.voting.authenticated_user_eligible &&
                      drop.author.handle !==
                        connectedProfile?.profile?.handle && (
                        <WaveDropVote wave={wave} drop={drop} />
                      )}
                    <WaveDropVotes drop={drop} />
                  </div>

                  <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-gap-x-4 tw-justify-between tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4 tw-mt-4 tw-px-6">
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <WaveDropAuthor drop={drop} />
                      <div className="tw-flex tw-gap-x-2 tw-items-center">
                        <div className="tw-w-[3px] tw-h-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
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

                  <div className="tw-px-6 tw-mt-6 tw-space-y-4">
                    <WaveDropVoters drop={drop} />
                    <WaveDropLogs drop={drop} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`${
            activeTab === WaveDropTab.CHAT ? "tw-flex" : "tw-hidden"
          } lg:tw-flex lg:tw-flex-1 tw-min-h-screen`}
        >
          <WaveDropChat wave={wave} drop={drop} />
        </motion.div>
      </div>
    </div>
  );
};
