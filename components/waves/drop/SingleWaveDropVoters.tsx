"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveTopVoters } from "@/hooks/useWaveTopVoters";
import { t } from "@/i18n/messages";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "framer-motion";
import React, { useId, useState } from "react";
import { SingleWaveDropEmptyState } from "./SingleWaveDropEmptyState";
import { SingleWaveDropVoter } from "./SingleWaveDropVoter";
import { SingleWaveDropVotersDownload } from "./SingleWaveDropVotersDownload";

interface SingleWaveDropVotersProps {
  readonly drop: ApiDrop;
  readonly summary?: React.ReactNode;
}

export const SingleWaveDropVoters: React.FC<SingleWaveDropVotersProps> = ({
  drop,
  summary,
}) => {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const [isVotersOpen, setIsVotersOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const panelId = useId();
  const headingId = `${panelId}-heading`;
  const indicatorId = `${panelId}-indicator`;
  const { voters, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useWaveTopVoters({
      waveId: drop.wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? undefined,
      reverse: false,
      dropId: drop.id,
      sortDirection: "DESC",
      sort: "ABSOLUTE",
      enabled: isVotersOpen,
    });

  const toggleVoters = () => setIsVotersOpen((current) => !current);

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <LazyMotion features={domAnimation}>
      <div>
        {/* Only a rendered vote summary uses the compact header spacing. */}
        <div className="tw-group tw-relative tw-isolate tw-flex tw-min-h-[3.25rem] tw-items-center tw-gap-3 tw-bg-iron-950 tw-px-4 tw-py-2.5 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-900 motion-reduce:tw-transition-none [&:has(+[data-vote-summary])]:tw-min-h-11 [&:has(+[data-vote-summary])]:tw-pb-1">
          {/* The full-row toggle and download remain separate native buttons. */}
          <button
            type="button"
            aria-expanded={isVotersOpen}
            aria-controls={panelId}
            aria-labelledby={`${headingId} ${indicatorId}`}
            onClick={toggleVoters}
            className="tw-absolute tw-inset-0 tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400"
          />
          <span
            id={headingId}
            className="tw-pointer-events-none tw-relative tw-min-w-12 tw-flex-1 tw-text-sm tw-font-medium tw-text-iron-400"
          >
            {t(locale, "waves.voteInsights.topVoters")}
          </span>
          <SingleWaveDropVotersDownload dropId={drop.id} />
          <span
            id={indicatorId}
            className="tw-pointer-events-none tw-relative tw-ml-1 tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:group-hover:tw-text-iron-200 motion-reduce:tw-transition-none"
          >
            {t(
              locale,
              isVotersOpen
                ? "waves.voteInsights.hideVoters"
                : "waves.voteInsights.viewVoters"
            )}
            <m.span
              aria-hidden="true"
              className="tw-flex"
              animate={{ rotate: isVotersOpen ? 180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              <ChevronDownIcon className="tw-size-4 tw-flex-shrink-0 tw-text-iron-400" />
            </m.span>
          </span>
        </div>

        {summary}

        <AnimatePresence>
          {isVotersOpen && (
            <m.div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              className="tw-overflow-hidden tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10"
            >
              <div className="tw-max-h-[19.75rem] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
                {voters.length > 0 || isLoading ? (
                  <>
                    <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
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
                      <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
                        <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400 motion-reduce:tw-animate-none"></div>
                      </div>
                    )}
                    <div ref={intersectionElementRef}></div>
                  </>
                ) : (
                  <SingleWaveDropEmptyState
                    icon={<UserGroupIcon className="tw-size-6" />}
                    title={t(locale, "waves.voteInsights.emptyVotersTitle")}
                    description={t(
                      locale,
                      "waves.voteInsights.emptyVotersDescription"
                    )}
                  />
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
