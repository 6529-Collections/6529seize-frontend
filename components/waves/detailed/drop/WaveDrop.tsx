import React, { useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

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
  const { connectedProfile } = useAuth();
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: initialDrop.id }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${initialDrop.id}`,
      }),
    placeholderData: keepPreviousData,
    initialData: initialDrop,
  });

  const [isVotersOpen, setIsVotersOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  return (
    <div className="tw-w-full">
      <div className="tw-flex">
        <div className="tw-w-[28rem] 2xl:tw-max-w-2xl 2xl:tw-w-full tw-py-6 tw-border tw-border-r-[3px] tw-border-solid tw-border-iron-800 tw-border-y-0 tw-bg-iron-950 tw-overflow-y-auto tw-h-[calc(100vh-102px)] tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 ">
          <div className="tw-h-full tw-relative tw-bg-iron-950">
            <WaveDropClose onClose={onClose} />
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
                      drop?.author.handle !==
                        connectedProfile?.profile?.handle && (
                        <WaveDropVote wave={wave} drop={drop} />
                      )}
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

                  <div className="tw-px-6 tw-mt-6 tw-space-y-4">
                    <div>
                      <button
                        onClick={() => setIsVotersOpen(!isVotersOpen)}
                        className="tw-w-full tw-group tw-ring-1 tw-ring-iron-700 tw-ring-inset desktop-hover:hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-3 tw-px-5 tw-rounded-xl sm:tw-text-sm tw-bg-iron-950 tw-transition-all tw-duration-300 tw-border-0"
                      >
                        <span
                          className={
                            isVotersOpen
                              ? "tw-text-primary-300"
                              : "tw-text-iron-300 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
                          }
                        >
                          Top Voters
                        </span>
                        <motion.svg
                          animate={{ rotate: isVotersOpen ? 0 : 180 }}
                          transition={{ duration: 0.3 }}
                          className={`tw-w-4 tw-h-4 ${
                            isVotersOpen
                              ? "tw-text-primary-300"
                              : "tw-text-iron-400 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                      </button>

                      <AnimatePresence>
                        {isVotersOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="tw-overflow-hidden"
                          >
                            <div className="tw-pt-4 tw-px-2">top voters</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="tw-space-y-4">
                      <button
                        onClick={() => setIsActivityOpen(!isActivityOpen)}
                        className="tw-w-full tw-group tw-ring-1 tw-ring-iron-700 tw-ring-inset desktop-hover:hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-3 tw-px-5 sm:tw-text-sm tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-300 tw-border-0"
                      >
                        <span
                          className={
                            isActivityOpen
                              ? "tw-text-primary-300"
                              : "tw-text-iron-300 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
                          }
                        >
                          Activity Log
                        </span>
                        <motion.svg
                          animate={{ rotate: isActivityOpen ? 0 : 180 }}
                          className={`tw-w-4 tw-h-4 ${
                            isActivityOpen
                              ? "tw-text-primary-300"
                              : "tw-text-iron-400 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                      </button>

                      <div className="tw-space-y-3">
                        <AnimatePresence>
                          {isActivityOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="tw-overflow-hidden"
                            >
                              <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
                                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                                  <a
                                    href=""
                                    className="tw-group tw-flex tw-items-center tw-gap-2 tw-no-underline tw-transition-all tw-duration-300 hover:tw-opacity-80 tw-whitespace-nowrap"
                                  >
                                    <img
                                      src=""
                                      alt=""
                                      className="tw-size-6 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-object-cover"
                                    />

                                    <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 group-hover:tw-text-iron-300">
                                     Lorem
                                    </span>
                                  </a>

                                  <span className="tw-text-sm tw-text-iron-400">
                                    voted
                                  </span>
                                  <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
                                    <svg
                                      className="tw-w-3.5 tw-h-3.5 tw-text-emerald-400"
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                      fill="none"
                                    >
                                      <path
                                        d="M12 4v16m0-16l4 4m-4-4l-4 4"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>

                                    <span className="tw-text-xs tw-font-medium tw-text-emerald-400">
                                      +12 TDH
                                    </span>
                                  </div>
                                  <a
                                    href=""
                                    className="tw-group tw-flex tw-items-center tw-gap-2 tw-no-underline tw-transition-all tw-duration-300 hover:tw-opacity-80 tw-whitespace-nowrap"
                                  >
                                    <img
                                      src=""
                                      alt=""
                                      className="tw-size-6 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-object-cover"
                                    />
                                    <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 group-hover:tw-text-iron-300">
                                      handle
                                    </span>
                                  </a>
                                </div>

                                <div className="tw-mt-1 tw-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
                                  <svg
                                    className="tw-w-3.5 tw-h-3.5 tw-text-iron-400 tw-flex-shrink-0"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    fill="none"
                                  >
                                    <path
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                                    12 min
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
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
