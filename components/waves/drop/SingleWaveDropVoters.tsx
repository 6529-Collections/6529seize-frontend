"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveTopVoters } from "@/hooks/useWaveTopVoters";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { SingleWaveDropVoter } from "./SingleWaveDropVoter";

interface SingleWaveDropVotersProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropVoters: React.FC<SingleWaveDropVotersProps> = ({
  drop,
}) => {
  const { connectedProfile } = useAuth();
  const { voters, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useWaveTopVoters({
      waveId: drop.wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? undefined,
      reverse: false,
      dropId: drop.id,
      sortDirection: "DESC",
      sort: "ABSOLUTE",
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  const [isVotersOpen, setIsVotersOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsVotersOpen(!isVotersOpen)}
        className={`tw-w-full tw-px-4 tw-py-4 tw-flex tw-items-center tw-justify-between tw-text-left desktop-hover:hover:tw-bg-iron-900 tw-transition-colors tw-duration-300 tw-ease-out tw-border-0 ${
          isVotersOpen ? "tw-bg-iron-800" : "tw-bg-iron-950"
        }`}
      >
        <span className={`tw-text-sm tw-font-medium ${isVotersOpen ? "tw-text-iron-300" : "tw-text-iron-400"}`}>
          Top voters
        </span>
        <motion.div
          animate={{ rotate: isVotersOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDownIcon className={`tw-w-4 tw-h-4 tw-flex-shrink-0 ${isVotersOpen ? "tw-text-iron-400" : "tw-text-iron-600"}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isVotersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-overflow-hidden">
            <div className="tw-max-h-[19.75rem] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
              {voters.length > 0 || isLoading ? (
                <>
                  <div className="tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
                    {voters.map((voter, index) => (
                      <SingleWaveDropVoter
                        voter={voter}
                        key={voter.voter.id}
                        position={index + 1}
                        creditType={drop.wave.voting_credit_type}
                      />
                    ))}
                  </div>
                  {(isFetchingNextPage || isLoading) && (
                    <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
                      <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
                    </div>
                  )}
                  <div ref={intersectionElementRef}></div>
                </>
              ) : (
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-6 tw-space-y-4 tw-text-iron-400">
                  <div className="tw-relative tw-group">
                    <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-primary-400/20 tw-via-indigo-500/10 tw-to-iron-800/10 tw-rounded-full tw-animate-[spin_4s_linear_infinite] group-hover:tw-from-primary-400/30"></div>
                    <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-iron-800/10 tw-via-indigo-500/10 tw-to-primary-400/20 tw-rounded-full tw-animate-[spin_5s_linear_infinite] group-hover:tw-to-primary-400/30"></div>
                    <div className="tw-absolute tw-inset-0 tw-bg-gradient-radial tw-from-primary-300/5 tw-to-transparent tw-animate-pulse"></div>
                    <svg
                      className="tw-size-8 tw-flex-shrink-0 tw-relative tw-text-white/60"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1"
                      stroke="currentColor"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M22.7 13.5L20.7005 11.5L18.7 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909M12 7V12L15 14"
                      />
                    </svg>
                  </div>
                  <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2">
                    <span className="tw-tracking-tight tw-text-base tw-font-semibold tw-bg-gradient-to-br tw-from-iron-200 tw-via-iron-300 tw-to-iron-400 tw-bg-clip-text tw-text-transparent">
                      Be the First to Make a Vote
                    </span>
                    <p className="tw-text-sm tw-text-iron-500 tw-text-center tw-mb-0 tw-max-w-64">
                      Vote on this drop to see voter rankings appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
