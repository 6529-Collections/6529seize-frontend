import React, { useEffect, useState } from "react";
import useCapacitor from "../../../../hooks/useCapacitor";
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
import { WaveDropChat } from "./WaveDropChat";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import { WaveDropClose } from "./WaveDropClose";
import { useAuth } from "../../../auth/Auth";
import { WaveDropVoters } from "./WaveDropVoters";
import { WaveDropLogs } from "./WaveDropLogs";
import { WaveDropTabs } from "./WaveDropTabs";
import { useDrop } from "../../../../hooks/useDrop";
import { useWaveData } from "../../../../hooks/useWaveData";

interface WaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export enum WaveDropTab {
  INFO = "INFO",
  CHAT = "CHAT",
}

export const WaveDrop: React.FC<WaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const { connectedProfile } = useAuth();
  const capacitor = useCapacitor();
  const [activeTab, setActiveTab] = useState<WaveDropTab>(WaveDropTab.INFO);
  const { drop } = useDrop({ dropId: initialDrop.id });
  const { data: wave } = useWaveData(drop?.wave.id ?? null);

  return (
    <div className="tw-w-full">
      <div className="lg:tw-hidden tw-inline-flex tw-w-full tw-justify-between">
        <WaveDropTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <WaveDropClose onClose={onClose} />
      </div>

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1">
        <div
          className={`${
            activeTab === WaveDropTab.INFO ? "tw-block" : "tw-hidden"
          } lg:tw-block lg:tw-w-[28rem] 2xl:tw-max-w-2xl 2xl:tw-w-full tw-py-4 lg:tw-py-6 lg:tw-border lg:tw-border-r-[3px] lg:tw-border-solid tw-border-iron-800 tw-border-y-0 tw-bg-iron-950 tw-overflow-y-auto ${
            capacitor.isCapacitor
              ? "tw-h-[calc(100vh-14.7rem)] tw-pb-[calc(4rem+0.9375rem)]"
              : "tw-h-[calc(100vh-8.5rem)] lg:tw-h-[calc(100vh-5.625rem)]"
          } no-scrollbar tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300`}
        >
          <div className="tw-h-full tw-relative tw-bg-iron-950">
            <div className="tw-hidden lg:tw-block">
              <WaveDropClose onClose={onClose} />
            </div>
            <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2 tw-pb-6">
              <div className="tw-px-6">
                {drop?.drop_type === ApiDropType.Participatory && (
                  <WaveDropPosition rank={drop.rank} />
                )}
              </div>

              <div className="tw-flex-1 tw-w-full">
                <div className="tw-px-6">
                  {drop && <WaveDropContent drop={drop} />}
                </div>

                <div className="tw-border-t tw-border-iron-800 tw-pt-3 tw-border-solid tw-border-x-0 tw-border-b-0">
                  <div className="tw-px-6 tw-flex tw-flex-col tw-gap-y-3">
                    {wave && <WaveDropTime wave={wave} />}
                    {wave &&
                      drop &&
                      wave.voting.authenticated_user_eligible &&
                      drop?.author.handle !==
                        connectedProfile?.profile?.handle && (
                        <WaveDropVote drop={drop} />
                      )}
                    {drop && <WaveDropVotes drop={drop} />}
                  </div>

                  <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-gap-x-4 tw-justify-between tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4 tw-mt-4 tw-px-6">
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      {drop && <WaveDropAuthor drop={drop} />}
                      <div className="tw-flex tw-gap-x-2 tw-items-center">
                        <div className="tw-w-[3px] tw-h-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                        <p className="tw-text-sm tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                          {drop && getTimeAgoShort(drop.created_at)}
                        </p>
                      </div>
                    </div>
                    {wave && drop && (
                      <WaveDetailedLeaderboardItemOutcomes
                        drop={drop}
                        wave={wave}
                      />
                    )}
                  </div>

                  <div className="tw-px-6 tw-mt-6 tw-space-y-4">
                    {drop && <WaveDropVoters drop={drop} />}
                    {drop && <WaveDropLogs drop={drop} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${
            activeTab === WaveDropTab.CHAT ? "tw-flex" : "tw-hidden"
          } lg:tw-flex lg:tw-flex-1 `}
        >
          {wave && drop && <WaveDropChat wave={wave} drop={drop} />}
        </div>
      </div>
    </div>
  );
};
